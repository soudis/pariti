"use server";

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
	addMemberInputSchema,
	addMemberReturnSchema,
	type MemberFormData,
} from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";
import { getActiveMembersForDate } from "./get-active-members-for-date";

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
				group.weightsEnabled,
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
		}
	}

	revalidatePath(`/group/${groupId}`);
	return { member: convertToPlainObject(member) };
}

export const createMemberAction = actionClient
	.inputSchema(addMemberInputSchema)
	.outputSchema(addMemberReturnSchema)
	.action(async ({ parsedInput }) =>
		createMember(parsedInput.groupId, parsedInput.member),
	);
