"use server";

import type { Expense, Member } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { convertToPlainObject } from "@/lib/utils";
import { calculateWeightedAmounts } from "./utils";

export async function createExpense(
	data: Pick<
		Expense,
		| "title"
		| "description"
		| "amount"
		| "date"
		| "groupId"
		| "paidById"
		| "splitAll"
		| "isRecurring"
		| "recurringType"
		| "recurringStartDate"
	> & {
		memberIds: Member["id"][];
	},
) {
	// Get group to check if weights are enabled
	const group = await db.group.findUnique({
		where: { id: data.groupId },
		select: { weightsEnabled: true },
	});

	if (!group) throw new Error("Group not found");

	// Get member weights
	const members = await db.member.findMany({
		where: { id: { in: data.memberIds } },
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
			groupId: data.groupId,
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

	revalidatePath(`/group/${data.groupId}`);

	// Convert Decimal values to numbers
	return convertToPlainObject(expense);
}
