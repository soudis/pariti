"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type ExpenseFormData,
	editExpenseInputSchema,
	editExpenseReturnSchema,
} from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

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
			sharingMethod: data.sharingMethod || "equal",
			isRecurring: data.isRecurring,
			recurringType: data.recurringType,
			recurringStartDate: data.recurringStartDate,
		},
	});

	if (data.memberAmounts !== undefined) {
		// Update expense members
		await db.expenseMember.deleteMany({
			where: { expenseId },
		});
	}

	if (data.memberAmounts && data.memberAmounts.length > 0) {
		await db.expenseMember.createMany({
			data: data.memberAmounts.map((ma) => ({
				expenseId,
				memberId: ma.memberId,
				amount: ma.amount,
				weight: ma.weight,
			})),
		});
	}

	revalidatePath(`/group/${expense.groupId}`);
	return { expense: convertToPlainObject(expense) };
}

export const updateExpenseAction = actionClient
	.inputSchema(editExpenseInputSchema)
	.outputSchema(editExpenseReturnSchema)
	.action(async ({ parsedInput }) =>
		updateExpense(parsedInput.expenseId, parsedInput.expense),
	);
