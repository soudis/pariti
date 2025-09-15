"use server";

import { db } from "@/lib/db";
import { generateRecurringExpenseInstances } from "./generate-recurring-expense-instances";
import { getSettlementCutoffDate } from "./get-settlement-cutoff-date";

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

	if (!group) return [];

	const balances = new Map<string, number>();

	// Initialize all members with zero balance
	group.members.forEach((member) => {
		balances.set(member.id, 0);
	});

	// Get the settlement cutoff date for filtering
	const cutoffDate = await getSettlementCutoffDate(groupId);

	// Generate all recurring expense instances (including virtual ones)
	const allExpenses = [];
	for (const expense of group.expenses) {
		try {
			const instances = await generateRecurringExpenseInstances(expense);
			allExpenses.push(...instances);
		} catch {
			// If recurring generation fails, use the original expense
			allExpenses.push(expense);
		}
	}

	// Filter expenses based on cutoff date
	const filteredExpenses = cutoffDate
		? allExpenses.filter((expense) => new Date(expense.date) >= cutoffDate)
		: allExpenses;

	// Process all expenses (including virtual/recurring ones)
	filteredExpenses.forEach((expense: any) => {
		// Member who paid gets positive balance
		balances.set(
			expense.paidById,
			(balances.get(expense.paidById) || 0) + Number(expense.amount),
		);

		// Handle both expenseMembers (from database) and effectiveMembers (from recurring instances)
		const members = expense.effectiveMembers || expense.expenseMembers || [];
		members.forEach((member: any) => {
			const memberId = member.memberId || member.id;
			const amount = member.amount || 0;
			if (memberId) {
				balances.set(memberId, (balances.get(memberId) || 0) - Number(amount));
			}
		});
	});

	// Process consumptions (filtered by cutoff date)
	group.resources.forEach((resource) => {
		const filteredConsumptions = cutoffDate
			? resource.consumptions.filter(
					(consumption) => new Date(consumption.date) >= cutoffDate,
				)
			: resource.consumptions;

		filteredConsumptions.forEach((consumption) => {
			// Members who consumed pay (negative balance)
			consumption.consumptionMembers.forEach((consumptionMember) => {
				balances.set(
					consumptionMember.memberId,
					(balances.get(consumptionMember.memberId) || 0) -
						Number(consumptionMember.amount),
				);
			});
		});
	});

	// Process completed settlements
	group.settlements.forEach((settlement) => {
		settlement.settlementMembers.forEach((settlementMember) => {
			// From member pays (negative balance)
			if (settlementMember.fromMemberId) {
				balances.set(
					settlementMember.fromMemberId,
					(balances.get(settlementMember.fromMemberId) || 0) -
						Number(settlementMember.amount),
				);
			}

			// To member receives (positive balance)
			if (settlementMember.toMemberId) {
				balances.set(
					settlementMember.toMemberId,
					(balances.get(settlementMember.toMemberId) || 0) +
						Number(settlementMember.amount),
				);
			}
		});
	});

	// Convert to array format
	return Array.from(balances.entries()).map(([memberId, balance]) => ({
		memberId,
		balance,
	}));
}
