"use server";

import Decimal from "decimal.js";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	addMemberInputSchema,
	addMemberReturnSchema,
	type MemberFormData,
} from "@/lib/schemas";
import { calculateWeightedAmounts } from "./utils";

async function addMember(groupId: string, data: MemberFormData) {
	const member = await db.member.create({
		data: {
			name: data.name,
			email: data.email,
			iban: data.iban,
			weight: data.weight || 1,
			groupId: groupId,
			activeFrom: data.activeFrom || new Date(),
			activeTo: data.activeTo,
		},
	});

	// Add this member to all "split all" expenses in the group
	const group = await db.group.findUnique({
		where: { id: groupId },
		select: { weightsEnabled: true },
	});

	if (group) {
		const splitAllExpenses = await db.expense.findMany({
			where: {
				groupId: groupId,
				splitAll: true,
			},
			include: {
				expenseMembers: {
					include: {
						member: true,
					},
				},
			},
		});

		for (const expense of splitAllExpenses) {
			// Get all current members including the new one
			const allMembers = [
				...expense.expenseMembers.map((em) => ({
					id: em.member.id,
					weight: Number(em.member.weight),
				})),
				{ id: member.id, weight: Number(member.weight) },
			];

			// Recalculate amounts with weights
			const weightedAmounts = calculateWeightedAmounts(
				Number(expense.amount),
				allMembers.map((member) => ({
					id: member.id,
					weight: new Decimal(member.weight),
				})),
				group.weightsEnabled,
			);

			// Update all expense members with new amounts
			for (const weightedAmount of weightedAmounts) {
				await db.expenseMember.upsert({
					where: {
						expenseId_memberId: {
							expenseId: expense.id,
							memberId: weightedAmount.memberId,
						},
					},
					update: { amount: weightedAmount.amount },
					create: {
						expenseId: expense.id,
						memberId: weightedAmount.memberId,
						amount: weightedAmount.amount,
					},
				});
			}
		}
	}

	revalidatePath(`/group/${groupId}`);
	return { member: { ...member, weight: Number(member.weight) } };
}

export const addMemberAction = actionClient
	.inputSchema(addMemberInputSchema)
	.outputSchema(addMemberReturnSchema)
	.action(async ({ parsedInput }) =>
		addMember(parsedInput.groupId, parsedInput.member),
	);
