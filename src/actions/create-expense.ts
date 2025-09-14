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

	// Prepare expense members data
	let expenseMembersData: Array<{
		memberId: string;
		amount: number;
		isManuallyEdited: boolean;
	}>;

	if (data.memberAmounts && data.memberAmounts.length > 0) {
		// Use manually specified amounts
		expenseMembersData = data.memberAmounts.map((ma) => ({
			memberId: ma.memberId,
			amount: ma.amount,
			isManuallyEdited: ma.isManuallyEdited,
		}));
	} else {
		// Calculate weighted amounts automatically
		const members = await db.member.findMany({
			where: { id: { in: data.selectedMembers } },
			select: { id: true, weight: true },
		});

		const weightedAmounts = calculateWeightedAmounts(
			Number(data.amount),
			members,
			group.weightsEnabled,
		);

		expenseMembersData = weightedAmounts.map((wa) => ({
			memberId: wa.memberId,
			amount: wa.amount,
			isManuallyEdited: false,
		}));
	}

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
				create: expenseMembersData,
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
