"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	createExpenseInputSchema,
	createExpenseReturnSchema,
	type ExpenseFormData,
} from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

async function createExpense(groupId: string, data: ExpenseFormData) {
	// Get group to check if weights are enabled
	const group = await db.group.findUnique({
		where: { id: groupId },
		select: { weightsEnabled: true },
	});

	if (!group) throw new Error("Group not found");

	const expense = await db.expense.create({
		data: {
			title: data.title,
			description: data.description,
			amount: data.amount,
			date: data.date || new Date(),
			groupId: groupId,
			paidById: data.paidById,
			splitAll: data.splitAll,
			sharingMethod: data.sharingMethod || "equal",
			isRecurring: data.isRecurring || false,
			recurringType: data.recurringType,
			recurringStartDate: data.recurringStartDate,
			expenseMembers: {
				create: data.memberAmounts || [],
			},
		},
		include: {
			paidBy: true,
			expenseMembers: {
				include: {
					member: true,
				},
			},
		},
	});

	revalidatePath(`/group/${groupId}`);

	return { expense: convertToPlainObject(expense) };
}

export const createExpenseAction = actionClient
	.inputSchema(createExpenseInputSchema)
	.outputSchema(createExpenseReturnSchema)
	.action(async ({ parsedInput }) =>
		createExpense(parsedInput.groupId, parsedInput.expense),
	);
