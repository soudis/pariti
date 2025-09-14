"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	removeExpenseInputSchema,
	removeExpenseReturnSchema,
} from "@/lib/schemas";

async function removeExpense(expenseId: string) {
	const expense = await db.expense.findUnique({
		where: { id: expenseId },
		include: { group: true },
	});

	if (!expense) throw new Error("Expense not found");

	await db.expense.delete({ where: { id: expenseId } });

	revalidatePath(`/group/${expense.groupId}`);
	return { success: true };
}

export const removeExpenseAction = actionClient
	.inputSchema(removeExpenseInputSchema)
	.outputSchema(removeExpenseReturnSchema)
	.action(async ({ parsedInput }) => removeExpense(parsedInput.expenseId));
