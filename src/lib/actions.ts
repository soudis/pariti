"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

// Group actions
export async function createGroup(data: {
	name: string;
	description?: string;
}) {
	const group = await db.group.create({
		data: {
			name: data.name,
			description: data.description,
		},
	});
	revalidatePath("/");
	return group;
}

export async function getGroup(id: string) {
	const group = await db.group.findUnique({
		where: { id },
		include: {
			members: true,
			expenses: {
				include: {
					paidBy: true,
					expenseMembers: {
						include: {
							member: true,
						},
					},
				},
				orderBy: { date: "desc" },
			},
		},
	});

	if (!group) return null;

	// Convert all Decimal values to numbers
	return {
		...group,
		expenses: group.expenses.map((expense) => ({
			...expense,
			amount: Number(expense.amount),
			expenseMembers: expense.expenseMembers.map((em) => ({
				...em,
				amount: Number(em.amount),
			})),
		})),
	};
}

// Member actions
export async function addMember(data: {
	name: string;
	email?: string;
	iban?: string;
	groupId: string;
	activeFrom?: Date;
	activeTo?: Date;
}) {
	const member = await db.member.create({
		data: {
			name: data.name,
			email: data.email,
			iban: data.iban,
			groupId: data.groupId,
			activeFrom: data.activeFrom || new Date(),
			activeTo: data.activeTo,
		},
	});

	// Add this member to all "split all" expenses in the group
	const splitAllExpenses = await db.expense.findMany({
		where: {
			groupId: data.groupId,
			splitAll: true,
		},
		include: {
			expenseMembers: true,
		},
	});

	for (const expense of splitAllExpenses) {
		const currentMemberCount = expense.expenseMembers.length;
		const newAmount = Number(expense.amount) / (currentMemberCount + 1);

		// Update existing expense members to new amount
		await db.expenseMember.updateMany({
			where: { expenseId: expense.id },
			data: { amount: newAmount },
		});

		// Add new member to expense
		await db.expenseMember.create({
			data: {
				expenseId: expense.id,
				memberId: member.id,
				amount: newAmount,
			},
		});
	}

	revalidatePath(`/group/${data.groupId}`);
	return member;
}

export async function updateMember(
	id: string,
	data: {
		name: string;
		email?: string;
		iban?: string;
		activeFrom: Date;
		activeTo?: Date;
	},
) {
	const member = await db.member.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!member) return null;

	const updatedMember = await db.member.update({
		where: { id },
		data: {
			name: data.name,
			email: data.email,
			iban: data.iban,
			activeFrom: data.activeFrom,
			activeTo: data.activeTo,
		},
	});

	revalidatePath(`/group/${member.groupId}`);
	return updatedMember;
}

export async function removeMember(id: string) {
	const member = await db.member.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!member) return null;

	await db.member.delete({
		where: { id },
	});

	revalidatePath(`/group/${member.groupId}`);
	return member;
}

// Expense actions
export async function createExpense(data: {
	title: string;
	description?: string;
	amount: number;
	groupId: string;
	paidById: string;
	memberIds: string[];
	splitAll?: boolean;
	isRecurring?: boolean;
	recurringType?: "weekly" | "monthly" | "yearly";
	recurringStartDate?: Date;
	date?: Date;
}) {
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
				create: data.memberIds.map((memberId) => ({
					memberId,
					amount: data.amount / data.memberIds.length,
				})),
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
	return {
		...expense,
		amount: Number(expense.amount),
		expenseMembers: expense.expenseMembers.map((em) => ({
			...em,
			amount: Number(em.amount),
		})),
	};
}

export async function removeExpense(id: string) {
	const expense = await db.expense.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!expense) return null;

	await db.expense.delete({
		where: { id },
	});

	revalidatePath(`/group/${expense.groupId}`);
	return expense;
}

// Helper function to generate recurring expense instances
export async function generateRecurringExpenseInstances(
	expense: {
		id: string;
		title: string;
		description?: string | null;
		amount: number; // Now always a number from getGroup
		groupId: string;
		paidById: string;
		splitAll: boolean;
		isRecurring: boolean;
		recurringType?: string | null;
		recurringStartDate?: Date | null;
		date: Date;
		paidBy: any;
		expenseMembers: Array<{
			amount: number;
			member: any;
		}>;
	},
	currentDate: Date = new Date(),
) {
	if (
		!expense.isRecurring ||
		!expense.recurringType ||
		!expense.recurringStartDate
	) {
		// For non-recurring expenses, get active members at the expense date
		const activeMembers = await getActiveMembersForDate(
			expense.groupId,
			expense.date,
		);
		const effectiveMembers = expense.splitAll
			? activeMembers
			: expense.expenseMembers.map((em) => em.member);

		return [
			{
				...expense,
				effectiveMembers: effectiveMembers.map((member) => ({
					id: member.id,
					name: member.name,
					amount: expense.amount / effectiveMembers.length,
				})),
			},
		];
	}

	const instances = [];
	const startDate = new Date(expense.recurringStartDate);
	const currentInstanceDate = new Date(startDate);

	while (currentInstanceDate <= currentDate) {
		if (currentInstanceDate >= startDate) {
			// Get active members for this specific instance date
			const activeMembers = await getActiveMembersForDate(
				expense.groupId,
				currentInstanceDate,
			);
			const effectiveMembers = expense.splitAll
				? activeMembers
				: expense.expenseMembers.map((em) => em.member);

			instances.push({
				...expense,
				id: `${expense.id}-${currentInstanceDate.toISOString().split("T")[0]}`,
				date: new Date(currentInstanceDate),
				effectiveMembers: effectiveMembers.map((member) => ({
					id: member.id,
					name: member.name,
					amount: expense.amount / effectiveMembers.length,
				})),
			});
		}

		// Calculate next occurrence
		switch (expense.recurringType) {
			case "weekly":
				currentInstanceDate.setDate(currentInstanceDate.getDate() + 7);
				break;
			case "monthly":
				currentInstanceDate.setMonth(currentInstanceDate.getMonth() + 1);
				break;
			case "yearly":
				currentInstanceDate.setFullYear(currentInstanceDate.getFullYear() + 1);
				break;
		}
	}

	return instances;
}

// Get active members for a specific date
export async function getActiveMembersForDate(groupId: string, date: Date) {
	return await db.member.findMany({
		where: {
			groupId,
			activeFrom: {
				lte: date,
			},
			OR: [{ activeTo: null }, { activeTo: { gte: date } }],
		},
	});
}
