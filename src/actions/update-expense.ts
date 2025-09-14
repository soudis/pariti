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

	// Get existing expense members to preserve manually edited amounts
	const existingExpenseMembers = await db.expenseMember.findMany({
		where: { expenseId },
	});

	// Update expense members
	await db.expenseMember.deleteMany({
		where: { expenseId },
	});

	if (!data.splitAll && data.selectedMembers.length > 0) {
		// Prepare expense members data
		let expenseMembersData: Array<{
			expenseId: string;
			memberId: string;
			amount: number;
			isManuallyEdited: boolean;
		}>;

		if (data.memberAmounts && data.memberAmounts.length > 0) {
			// Use manually specified amounts
			expenseMembersData = data.memberAmounts.map((ma) => ({
				expenseId,
				memberId: ma.memberId,
				amount: ma.amount,
				isManuallyEdited: ma.isManuallyEdited,
			}));
		} else {
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

			// Preserve manually edited amounts from existing expense members
			expenseMembersData = weightedAmounts.map((wa) => {
				const existing = existingExpenseMembers.find(
					(em) => em.memberId === wa.memberId,
				);
				return {
					expenseId,
					memberId: wa.memberId,
					amount: existing?.isManuallyEdited
						? Number(existing.amount)
						: wa.amount,
					isManuallyEdited: existing?.isManuallyEdited || false,
				};
			});
		}

		await db.expenseMember.createMany({
			data: expenseMembersData,
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
