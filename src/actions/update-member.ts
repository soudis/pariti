"use server";

import type { Member } from "@prisma/client";
import Decimal from "decimal.js";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type MemberFormData,
	updateMemberInputSchema,
	updateMemberReturnSchema,
} from "@/lib/schemas";
import { getActiveMembersForDate } from "./get-active-members-for-date";
import { calculateWeightedAmounts } from "./utils";

async function updateMember(memberId: Member["id"], data: MemberFormData) {
	const member = await db.member.findUnique({
		where: { id: memberId },
		include: { group: true },
	});

	if (!member) throw new Error("Member not found");

	// Check if weight or active period has changed
	const weightChanged = Number(member.weight) !== (data.weight || 1);
	const activeFromChanged =
		member.activeFrom.getTime() !== data.activeFrom.getTime();
	const activeToChanged =
		(member.activeTo?.getTime() || null) !== (data.activeTo?.getTime() || null);

	const activePeriodChanged = activeFromChanged || activeToChanged;
	const needsRecalculation =
		(weightChanged && member.group.weightsEnabled) || activePeriodChanged;

	const updatedMember = await db.member.update({
		where: { id: memberId },
		data: {
			name: data.name,
			email: data.email,
			iban: data.iban,
			weight: data.weight,
			activeFrom: data.activeFrom,
			activeTo: data.activeTo,
		},
	});

	// If weight or active period changed, recalculate affected expenses
	if (needsRecalculation) {
		// Get all expenses where this member is involved
		const memberExpenses = await db.expense.findMany({
			where: {
				groupId: member.groupId,
				OR: [
					{
						splitAll: true,
						isRecurring: false,
						date: {
							gte: new Date(
								Math.min(
									member.activeFrom.getTime(),
									updatedMember.activeFrom.getTime(),
								),
							),
							lte: new Date(
								Math.max(
									member.activeTo?.getTime() ?? 999999999999999,
									updatedMember.activeTo?.getTime() ?? 999999999999999,
								),
							),
						},
					}, // All splitAll expenses
					{
						expenseMembers: {
							some: { memberId: memberId },
						},
					}, // All expenses where this member is explicitly included
				],
			},
			include: {
				expenseMembers: {
					include: {
						member: true,
					},
				},
			},
		});

		for (const expense of memberExpenses) {
			if (expense.splitAll) {
				// For splitAll expenses, recalculate based on active members for the expense date
				const activeMembers = await getActiveMembersForDate(
					member.groupId,
					expense.date,
				);

				const weightedAmounts = calculateWeightedAmounts(
					Number(expense.amount),
					activeMembers.map((member) => ({
						id: member.id,
						weight: new Decimal(member.weight),
					})),
					member.group.weightsEnabled,
				);

				// Delete all existing expense members for this expense
				await db.expenseMember.deleteMany({
					where: { expenseId: expense.id },
				});

				// Create new expense members with correct amounts
				await db.expenseMember.createMany({
					data: weightedAmounts.map((weightedAmount) => ({
						expenseId: expense.id,
						memberId: weightedAmount.memberId,
						amount: weightedAmount.amount,
					})),
				});
			} else {
				// For non-splitAll expenses, only recalculate if this member is still active
				// and the weight changed
				if (weightChanged) {
					const memberExpenseMember = expense.expenseMembers.find(
						(em) => em.memberId === memberId,
					);

					if (memberExpenseMember) {
						// Check if member is still active for this expense date
						const isActive =
							data.activeFrom <= expense.date &&
							(data.activeTo === null ||
								data.activeTo === undefined ||
								data.activeTo >= expense.date);

						if (isActive) {
							// Recalculate this member's share
							const allMembers = expense.expenseMembers.map((em) => ({
								id: em.member.id,
								weight:
									em.memberId === memberId
										? new Decimal(data.weight || 1)
										: new Decimal(em.member.weight),
							}));

							const weightedAmounts = calculateWeightedAmounts(
								Number(expense.amount),
								allMembers,
								member.group.weightsEnabled,
							);

							// Update all expense members with new amounts
							for (const weightedAmount of weightedAmounts) {
								await db.expenseMember.update({
									where: {
										expenseId_memberId: {
											expenseId: expense.id,
											memberId: weightedAmount.memberId,
										},
									},
									data: { amount: weightedAmount.amount },
								});
							}
						} else {
							// Member is no longer active, remove from expense
							await db.expenseMember.delete({
								where: {
									expenseId_memberId: {
										expenseId: expense.id,
										memberId: memberId,
									},
								},
							});
						}
					}
				}
			}
		}
	}

	revalidatePath(`/group/${member.groupId}`);
	return { member: { ...updatedMember, weight: Number(updatedMember.weight) } };
}

export const updateMemberAction = actionClient
	.inputSchema(updateMemberInputSchema)
	.outputSchema(updateMemberReturnSchema)
	.action(async ({ parsedInput }) =>
		updateMember(parsedInput.memberId, parsedInput.member),
	);
