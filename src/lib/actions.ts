"use server";

import type { Consumption, Expense, Member, Resource } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { convertToPlainObject } from "@/lib/utils";

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
			resources: {
				include: {
					consumptions: {
						include: {
							consumptionMembers: {
								include: {
									member: true,
								},
							},
						},
						orderBy: { date: "desc" },
					},
				},
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!group) throw new Error("Group not found");

	// Convert all Decimal values to numbers
	return convertToPlainObject(group);
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
	id: Member["id"],
	data: Pick<Member, "name" | "email" | "iban" | "activeFrom" | "activeTo">,
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
					amount: Number(data.amount) / data.memberIds.length,
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
	return convertToPlainObject(expense);
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
	expense: Awaited<ReturnType<typeof getGroup>>["expenses"][number],
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
					amount: Number(expense.amount) / effectiveMembers.length,
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
					amount: Number(expense.amount) / effectiveMembers.length,
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

// Resource actions
export async function createResource(
	data: Pick<
		Resource,
		"name" | "description" | "unit" | "unitPrice" | "groupId"
	>,
) {
	const resource = await db.resource.create({
		data: {
			name: data.name,
			description: data.description,
			unit: data.unit,
			unitPrice: data.unitPrice,
			groupId: data.groupId,
		},
	});

	revalidatePath(`/group/${data.groupId}`);

	// Convert Decimal values to numbers
	return convertToPlainObject(resource);
}

export async function updateResource(
	id: string,
	data: Pick<Resource, "name" | "description" | "unit" | "unitPrice">,
) {
	const resource = await db.resource.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!resource) return null;

	const updatedResource = await db.resource.update({
		where: { id },
		data: {
			name: data.name,
			description: data.description,
			unit: data.unit,
			unitPrice: data.unitPrice,
		},
	});

	revalidatePath(`/group/${resource.groupId}`);

	// Convert Decimal values to numbers
	return convertToPlainObject(updatedResource);
}

export async function removeResource(id: string) {
	const resource = await db.resource.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!resource) return null;

	await db.resource.delete({
		where: { id },
	});

	revalidatePath(`/group/${resource.groupId}`);
	return { success: true };
}

// Consumption actions
export async function createConsumption(
	data: Pick<
		Consumption,
		"resourceId" | "amount" | "isUnitAmount" | "date" | "description"
	> & {
		memberIds: Member["id"][];
	},
) {
	// Get the resource to calculate amounts
	const resource = await db.resource.findUnique({
		where: { id: data.resourceId },
		include: { group: true },
	});

	if (!resource) throw new Error("Resource not found");

	// Calculate the total cost
	let totalCost: number;
	if (data.isUnitAmount) {
		// Amount is in units, calculate cost using unit price
		if (!resource.unitPrice) throw new Error("Resource has no unit price");
		totalCost = Number(data.amount) * Number(resource.unitPrice);
	} else {
		// Amount is already in money
		totalCost = Number(data.amount);
	}

	// Calculate amount per member
	const amountPerMember = totalCost / data.memberIds.length;

	const consumption = await db.consumption.create({
		data: {
			resourceId: data.resourceId,
			amount: data.amount,
			isUnitAmount: data.isUnitAmount,
			date: data.date || new Date(),
			description: data.description,
			consumptionMembers: {
				create: data.memberIds.map((memberId) => ({
					memberId,
					amount: amountPerMember,
				})),
			},
		},
		include: {
			resource: true,
			consumptionMembers: {
				include: {
					member: true,
				},
			},
		},
	});

	revalidatePath(`/group/${resource.groupId}`);

	// Convert Decimal values to numbers
	return convertToPlainObject(consumption);
}

export async function removeConsumption(id: string) {
	const consumption = await db.consumption.findUnique({
		where: { id },
		include: { resource: { include: { group: true } } },
	});

	if (!consumption) return null;

	await db.consumption.delete({
		where: { id },
	});

	revalidatePath(`/group/${consumption.resource.groupId}`);
	return { success: true };
}
