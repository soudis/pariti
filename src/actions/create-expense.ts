"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	createExpenseInputSchema,
	createExpenseReturnSchema,
	type ExpenseFormData,
} from "@/lib/schemas";
import { calculateWeightedAmounts } from "./utils";

async function createExpense(groupId: string, data: ExpenseFormData) {
	// Get group to check if weights are enabled
	const group = await db.group.findUnique({
		where: { id: groupId },
		select: { weightsEnabled: true },
	});

	if (!group) throw new Error("Group not found");

	// Get member weights
	const members = await db.member.findMany({
		where: { id: { in: data.selectedMembers } },
		select: { id: true, weight: true },
	});

	// Calculate weighted amounts
	const weightedAmounts = calculateWeightedAmounts(
		Number(data.amount),
		members,
		group.weightsEnabled,
	);

	const expense = await db.expense.create({
		data: {
			title: data.title,
			description: data.description,
			amount: data.amount,
			date: data.date || new Date(),
			groupId: groupId,
			paidById: data.paidById,
			splitAll: data.splitAll || false,
			isRecurring: data.isRecurring || false,
			recurringType: data.recurringType,
			recurringStartDate: data.recurringStartDate,
			expenseMembers: {
				create: weightedAmounts,
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

	return { expense };
}

export const createExpenseAction = actionClient
	.inputSchema(createExpenseInputSchema)
	.outputSchema(createExpenseReturnSchema)
	.action(async ({ parsedInput }) =>
		createExpense(parsedInput.groupId, parsedInput.expense),
	);
