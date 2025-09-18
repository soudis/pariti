"use server";

import type { Member } from "@prisma/client";
import Decimal from "decimal.js";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
	convertDecimalAmounts,
	convertToDecimalAmounts,
	type Member as RedistributionMember,
	redistributeAmounts,
} from "@/lib/redistribution";
import { actionClient } from "@/lib/safe-action";
import {
	type MemberFormData,
	updateMemberInputSchema,
	updateMemberReturnSchema,
} from "@/lib/schemas";
import { getActiveMembersForDate } from "./get-active-members-for-date";

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
			weight: data.weight, // Legacy field
			weights: data.weights, // New multiple weights field
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
									member.activeTo?.getTime() ?? 9999999999999,
									updatedMember.activeTo?.getTime() ?? 9999999999999,
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

				// Get existing expense members to preserve manually edited amounts
				const existingExpenseMembers = await db.expenseMember.findMany({
					where: { expenseId: expense.id },
				});

				// Convert to redistribution format
				const existingAmounts = convertDecimalAmounts(existingExpenseMembers);
				const membersForRedistribution: RedistributionMember[] =
					activeMembers.map((member) => ({
						id: member.id,
						weight: Number(member.weight),
					}));

				// Use redistribution logic to preserve manually edited amounts
				const redistributedAmounts = redistributeAmounts(
					membersForRedistribution,
					existingAmounts,
					Number(expense.amount),
					member.group.weightsEnabled,
				);

				// Delete all existing expense members for this expense
				await db.expenseMember.deleteMany({
					where: { expenseId: expense.id },
				});

				// Create new expense members with redistributed amounts
				await db.expenseMember.createMany({
					data: convertToDecimalAmounts(redistributedAmounts).map((ma) => ({
						expenseId: expense.id,
						memberId: ma.memberId,
						amount: ma.amount,
						isManuallyEdited: ma.isManuallyEdited,
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
							// Get current expense members
							const currentExpenseMembers = await db.expenseMember.findMany({
								where: { expenseId: expense.id },
							});

							// Convert to redistribution format
							const existingAmounts = convertDecimalAmounts(
								currentExpenseMembers,
							);
							const membersForRedistribution: RedistributionMember[] =
								expense.expenseMembers.map((em) => ({
									id: em.member.id,
									weight:
										em.memberId === memberId
											? Number(data.weight || 1)
											: Number(em.member.weight),
								}));

							// Use redistribution logic to preserve manually edited amounts
							const redistributedAmounts = redistributeAmounts(
								membersForRedistribution,
								existingAmounts,
								Number(expense.amount),
								member.group.weightsEnabled,
							);

							// Update all expense members with redistributed amounts
							for (const redistributedAmount of redistributedAmounts) {
								await db.expenseMember.update({
									where: {
										expenseId_memberId: {
											expenseId: expense.id,
											memberId: redistributedAmount.memberId,
										},
									},
									data: {
										amount: new Decimal(redistributedAmount.amount),
										isManuallyEdited: redistributedAmount.isManuallyEdited,
									},
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
