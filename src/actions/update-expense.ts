"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type ExpenseFormData,
	editExpenseInputSchema,
	editExpenseReturnSchema,
} from "@/lib/schemas";
import { calculateWeightedAmounts } from "./utils";

async function updateExpense(expenseId: string, data: ExpenseFormData) {
	const expense = await db.expense.update({
		where: { id: expenseId },
		data: {
			title: data.title,
			amount: data.amount,
			description: data.description,
			paidById: data.paidById,
			date: data.date,
			splitAll: data.splitAll,
			isRecurring: data.isRecurring,
			recurringType: data.recurringType,
			recurringStartDate: data.recurringStartDate,
		},
	});

	// Update expense members
	await db.expenseMember.deleteMany({
		where: { expenseId },
	});

	if (!data.splitAll && data.selectedMembers.length > 0) {
		// Get group to check if weights are enabled
		const group = await db.group.findUnique({
			where: { id: expense.groupId },
			select: { weightsEnabled: true },
		});

		// Get member weights
		const members = await db.member.findMany({
			where: { id: { in: data.selectedMembers } },
			select: { id: true, weight: true },
		});

		// Calculate weighted amounts
		const weightedAmounts = calculateWeightedAmounts(
			data.amount,
			members,
			group?.weightsEnabled || false,
		);

		await db.expenseMember.createMany({
			data: weightedAmounts.map((member) => ({
				expenseId,
				memberId: member.memberId,
				amount: member.amount,
			})),
		});
	}

	revalidatePath(`/group/${expense.groupId}`);
	return { expense };
}

export const updateExpenseAction = actionClient
	.inputSchema(editExpenseInputSchema)
	.outputSchema(editExpenseReturnSchema)
	.action(async ({ parsedInput }) =>
		updateExpense(parsedInput.expenseId, parsedInput.expense),
	);
