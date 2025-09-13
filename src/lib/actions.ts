"use server";

import type {
	Consumption,
	Expense,
	Member,
	Prisma,
	Resource,
	Settlement,
	SettlementMember,
} from "@prisma/client";
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
			settlements: {
				include: {
					settlementMembers: {
						include: {
							fromMember: true,
							toMember: true,
							fromResource: true,
							toResource: true,
						},
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
	data: Prisma.MemberUpdateInput,
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

// Settlement actions
export async function createSettlement(data: {
	groupId: string;
	title: string;
	description?: string;
	settlementType: "optimized" | "around_member" | "around_resource";
	centerId?: string; // member or resource ID for around_* types
}) {
	// Get group with all related data
	const group = await db.group.findUnique({
		where: { id: data.groupId },
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
					},
				},
			},
			settlements: {
				include: {
					settlementMembers: {
						include: {
							fromMember: true,
							toMember: true,
							fromResource: true,
							toResource: true,
						},
					},
				},
				where: {
					status: "completed",
				},
			},
		},
	});

	if (!group) throw new Error("Group not found");

	// Calculate balances for all members and resources
	const balances = calculateBalances(group);

	// Generate settlement transactions based on type
	const transactions = generateSettlementTransactions(
		balances,
		data.settlementType,
		data.centerId,
	);

	if (transactions.length === 0) {
		throw new Error("No settlements needed - all balances are zero");
	}

	// Create settlement record
	const settlement = await db.settlement.create({
		data: {
			groupId: data.groupId,
			title: data.title,
			description: data.description,
			settlementMembers: {
				create: transactions.map((transaction) => ({
					fromMemberId:
						transaction.fromType === "member" ? transaction.fromId : null,
					toMemberId: transaction.toType === "member" ? transaction.toId : null,
					fromResourceId:
						transaction.fromType === "resource" ? transaction.fromId : null,
					toResourceId:
						transaction.toType === "resource" ? transaction.toId : null,
					amount: transaction.amount,
				})),
			},
		},
		include: {
			settlementMembers: {
				include: {
					fromMember: true,
					toMember: true,
					fromResource: true,
					toResource: true,
				},
			},
		},
	});

	revalidatePath(`/group/${data.groupId}`);
	return convertToPlainObject(settlement);
}

export async function updateSettlementMemberStatus(
	settlementMemberId: string,
	status: "open" | "completed",
) {
	const settlementMember = await db.settlementMember.findUnique({
		where: { id: settlementMemberId },
		include: {
			settlement: {
				include: {
					group: true,
				},
			},
		},
	});

	if (!settlementMember) throw new Error("Settlement member not found");

	const updatedSettlementMember = await db.settlementMember.update({
		where: { id: settlementMemberId },
		data: { status },
	});

	// Check if all settlement members are completed
	const allSettlementMembers = await db.settlementMember.findMany({
		where: { settlementId: settlementMember.settlementId },
	});

	const allCompleted = allSettlementMembers.every(
		(sm) =>
			sm.status === "completed" ||
			(sm.id === settlementMemberId && status === "completed"),
	);

	if (allCompleted && status === "completed") {
		// Update settlement status to completed
		await db.settlement.update({
			where: { id: settlementMember.settlementId },
			data: { status: "completed" },
		});
	} else if (status === "open") {
		// Update settlement status to open
		await db.settlement.update({
			where: { id: settlementMember.settlementId },
			data: { status: "open" },
		});
	}

	revalidatePath(`/group/${settlementMember.settlement.groupId}`);
	return convertToPlainObject(updatedSettlementMember);
}

export async function removeSettlement(id: string) {
	const settlement = await db.settlement.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!settlement) throw new Error("Settlement not found");

	await db.settlement.delete({
		where: { id },
	});

	revalidatePath(`/group/${settlement.groupId}`);
	return { success: true };
}

// Helper function to calculate balances
function calculateBalances(group: any) {
	const balances = new Map<string, number>();

	// Initialize all members and resources with zero balance
	group.members.forEach((member: any) => {
		balances.set(`member_${member.id}`, 0);
	});
	group.resources.forEach((resource: any) => {
		balances.set(`resource_${resource.id}`, 0);
	});

	// Process expenses
	group.expenses.forEach((expense: any) => {
		const paidByKey = `member_${expense.paidById}`;
		balances.set(
			paidByKey,
			(balances.get(paidByKey) || 0) + Number(expense.amount),
		);

		expense.expenseMembers.forEach((expenseMember: any) => {
			const memberKey = `member_${expenseMember.memberId}`;
			balances.set(
				memberKey,
				(balances.get(memberKey) || 0) - Number(expenseMember.amount),
			);
		});
	});

	// Process consumptions
	group.resources.forEach((resource: any) => {
		resource.consumptions.forEach((consumption: any) => {
			const totalCost = consumption.isUnitAmount
				? Number(consumption.amount) * Number(resource.unitPrice || 0)
				: Number(consumption.amount);

			// Resources receive money (positive balance)
			const resourceKey = `resource_${resource.id}`;
			balances.set(resourceKey, (balances.get(resourceKey) || 0) + totalCost);

			// Members pay money (negative balance)
			consumption.consumptionMembers.forEach((consumptionMember: any) => {
				const memberKey = `member_${consumptionMember.memberId}`;
				balances.set(
					memberKey,
					(balances.get(memberKey) || 0) - Number(consumptionMember.amount),
				);
			});
		});
	});

	// Process completed settlements (adjust balances to reflect settled amounts)
	group.settlements.forEach((settlement: any) => {
		settlement.settlementMembers.forEach((settlementMember: any) => {
			// When a settlement is completed, the "from" entity has paid the "to" entity
			// So we need to reduce the debt of the "from" entity and reduce the credit of the "to" entity
			if (settlementMember.fromMemberId) {
				const fromKey = `member_${settlementMember.fromMemberId}`;
				// Reduce debt (increase balance) for the person who paid
				balances.set(
					fromKey,
					(balances.get(fromKey) || 0) + Number(settlementMember.amount),
				);
			}
			if (settlementMember.fromResourceId) {
				const fromKey = `resource_${settlementMember.fromResourceId}`;
				// Reduce debt (increase balance) for the resource that paid
				balances.set(
					fromKey,
					(balances.get(fromKey) || 0) + Number(settlementMember.amount),
				);
			}
			if (settlementMember.toMemberId) {
				const toKey = `member_${settlementMember.toMemberId}`;
				// Reduce credit (decrease balance) for the person who received payment
				balances.set(
					toKey,
					(balances.get(toKey) || 0) - Number(settlementMember.amount),
				);
			}
			if (settlementMember.toResourceId) {
				const toKey = `resource_${settlementMember.toResourceId}`;
				// Reduce credit (decrease balance) for the resource that received payment
				balances.set(
					toKey,
					(balances.get(toKey) || 0) - Number(settlementMember.amount),
				);
			}
		});
	});

	return balances;
}

// Helper function to generate settlement transactions
function generateSettlementTransactions(
	balances: Map<string, number>,
	settlementType: "optimized" | "around_member" | "around_resource",
	centerId?: string,
) {
	const transactions: Array<{
		fromId: string;
		fromType: "member" | "resource";
		toId: string;
		toType: "member" | "resource";
		amount: number;
	}> = [];

	// Convert balances to arrays
	const creditors: Array<{
		id: string;
		type: "member" | "resource";
		amount: number;
	}> = [];
	const debtors: Array<{
		id: string;
		type: "member" | "resource";
		amount: number;
	}> = [];

	balances.forEach((amount, key) => {
		if (Math.abs(amount) < 0.01) return; // Skip zero balances

		const [type, id] = key.split("_");
		const entityType = type as "member" | "resource";

		if (amount > 0) {
			creditors.push({ id, type: entityType, amount });
		} else {
			debtors.push({ id, type: entityType, amount: Math.abs(amount) });
		}
	});

	if (settlementType === "optimized") {
		// Minimize number of transactions
		creditors.sort((a, b) => b.amount - a.amount);
		debtors.sort((a, b) => b.amount - a.amount);

		let creditorIndex = 0;
		let debtorIndex = 0;

		while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
			const creditor = creditors[creditorIndex];
			const debtor = debtors[debtorIndex];

			const amount = Math.min(creditor.amount, debtor.amount);

			transactions.push({
				fromId: debtor.id,
				fromType: debtor.type,
				toId: creditor.id,
				toType: creditor.type,
				amount,
			});

			creditor.amount -= amount;
			debtor.amount -= amount;

			if (creditor.amount < 0.01) creditorIndex++;
			if (debtor.amount < 0.01) debtorIndex++;
		}
	} else if (settlementType === "around_member" && centerId) {
		// All payments go through one member
		const centerAmount = balances.get(`member_${centerId}`) || 0;

		// If center member is a creditor, others pay to them
		if (centerAmount > 0) {
			debtors.forEach((debtor) => {
				transactions.push({
					fromId: debtor.id,
					fromType: debtor.type,
					toId: centerId,
					toType: "member",
					amount: debtor.amount,
				});
			});
		} else {
			// If center member is a debtor, they pay to others
			creditors.forEach((creditor) => {
				transactions.push({
					fromId: centerId,
					fromType: "member",
					toId: creditor.id,
					toType: creditor.type,
					amount: creditor.amount,
				});
			});
		}
	} else if (settlementType === "around_resource" && centerId) {
		// All payments go through one resource
		const centerAmount = balances.get(`resource_${centerId}`) || 0;

		// If center resource is a creditor, others pay to them
		if (centerAmount > 0) {
			debtors.forEach((debtor) => {
				transactions.push({
					fromId: debtor.id,
					fromType: debtor.type,
					toId: centerId,
					toType: "resource",
					amount: debtor.amount,
				});
			});
		} else {
			// If center resource is a debtor, they pay to others
			creditors.forEach((creditor) => {
				transactions.push({
					fromId: centerId,
					fromType: "resource",
					toId: creditor.id,
					toType: creditor.type,
					amount: creditor.amount,
				});
			});
		}
	}

	return transactions;
}

// Helper function to calculate individual member balances
export async function calculateMemberBalances(groupId: string) {
	const group = await db.group.findUnique({
		where: { id: groupId },
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
					},
				},
			},
			settlements: {
				include: {
					settlementMembers: {
						include: {
							fromMember: true,
							toMember: true,
							fromResource: true,
							toResource: true,
						},
					},
				},
				where: {
					status: "completed",
				},
			},
		},
	});

	if (!group) throw new Error("Group not found");

	const balances = calculateBalances(group);
	const memberBalances: Array<{
		memberId: string;
		memberName: string;
		balance: number;
	}> = [];

	group.members.forEach((member) => {
		const balance = balances.get(`member_${member.id}`) || 0;
		memberBalances.push({
			memberId: member.id,
			memberName: member.name,
			balance: Number(balance),
		});
	});

	return memberBalances;
}

// Helper function to get the cutoff date for filtering expenses/consumptions
export async function getSettlementCutoffDate(
	groupId: string,
): Promise<Date | null> {
	const group = await db.group.findUnique({
		where: { id: groupId },
		include: {
			settlements: {
				orderBy: {
					createdAt: "desc",
				},
			},
		},
	});

	if (!group || group.settlements.length === 0) {
		return null;
	}

	// Find the most recent completed settlement
	const mostRecentCompleted = group.settlements.find(
		(settlement) => settlement.status === "completed",
	);

	if (!mostRecentCompleted) {
		return null;
	}

	// Check if there are any open settlements that were created BEFORE this completed settlement
	const openBeforeCompleted = await db.settlement.findFirst({
		where: {
			groupId,
			status: "open",
			createdAt: {
				lt: mostRecentCompleted.createdAt,
			},
		},
	});

	// If there are open settlements before the most recent completed one,
	// don't filter anything (return null) because we need to wait for those to be completed
	if (openBeforeCompleted) {
		return null;
	}

	// Return the creation date of the most recent completed settlement
	return mostRecentCompleted.createdAt;
}

// Edit expense action
export async function editExpense(
	expenseId: string,
	data: {
		title: string;
		amount: number;
		description?: string;
		paidById: string;
		date: Date;
		splitAll: boolean;
		expenseMembers: Array<{ memberId: string; amount: number }>;
		isRecurring: boolean;
		recurringType?: "weekly" | "monthly" | "yearly";
		recurringStartDate?: Date;
	},
) {
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

	if (!data.splitAll && data.expenseMembers.length > 0) {
		await db.expenseMember.createMany({
			data: data.expenseMembers.map((member) => ({
				expenseId,
				memberId: member.memberId,
				amount: member.amount,
			})),
		});
	}

	return convertToPlainObject(expense);
}

// Edit resource action
export async function editResource(
	resourceId: string,
	data: {
		name: string;
		description?: string;
		unit?: string;
		unitPrice?: number;
	},
) {
	const resource = await db.resource.update({
		where: { id: resourceId },
		data: {
			name: data.name,
			description: data.description,
			unit: data.unit,
			unitPrice: data.unitPrice,
		},
	});

	return convertToPlainObject(resource);
}

// Edit consumption action
export async function editConsumption(
	consumptionId: string,
	data: {
		amount: number;
		isUnitAmount: boolean;
		date: Date;
		description?: string;
		consumptionMembers: Array<{ memberId: string; amount: number }>;
	},
) {
	const consumption = await db.consumption.update({
		where: { id: consumptionId },
		data: {
			amount: data.amount,
			isUnitAmount: data.isUnitAmount,
			date: data.date,
			description: data.description,
		},
	});

	// Update consumption members
	await db.consumptionMember.deleteMany({
		where: { consumptionId },
	});

	if (data.consumptionMembers.length > 0) {
		await db.consumptionMember.createMany({
			data: data.consumptionMembers.map((member) => ({
				consumptionId,
				memberId: member.memberId,
				amount: member.amount,
			})),
		});
	}

	return convertToPlainObject(consumption);
}
