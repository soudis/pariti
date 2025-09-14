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
import { getActiveMembersForDate } from "./get-active-members-for-date";
import { calculateWeightedAmounts } from "./utils";

async function createMember(groupId: string, data: MemberFormData) {
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
			// Get all active members for this expense date (including the new member)
			const activeMembers = await getActiveMembersForDate(
				groupId,
				expense.date,
			);

			// Recalculate amounts with weights
			const weightedAmounts = calculateWeightedAmounts(
				Number(expense.amount),
				activeMembers.map((member) => ({
					id: member.id,
					weight: new Decimal(member.weight),
				})),
				group.weightsEnabled,
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
		}
	}

	revalidatePath(`/group/${groupId}`);
	return { member: { ...member, weight: Number(member.weight) } };
}

export const createMemberAction = actionClient
	.inputSchema(addMemberInputSchema)
	.outputSchema(addMemberReturnSchema)
	.action(async ({ parsedInput }) =>
		createMember(parsedInput.groupId, parsedInput.member),
	);
