"use server";

import { getGroupWithRecurringExpenses } from "@/actions/get-group";
import { getSettlementCutoffDate } from "./get-settlement-cutoff-date";

export async function calculateMemberBalances(groupId: string) {
	const group = await getGroupWithRecurringExpenses(groupId);

	if (!group) return [];

	const balances = new Map<string, number>();

	// Initialize all members with zero balance
	group.members.forEach((member) => {
		balances.set(member.id, 0);
	});

	// Get the settlement cutoff date for filtering
	const cutoffDate = await getSettlementCutoffDate(groupId);

	// Filter expenses based on cutoff date
	const filteredExpenses = cutoffDate
		? group.expenses.filter((expense) => new Date(expense.date) >= cutoffDate)
		: group.expenses;

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
		settlement.settlementMembers
			.filter(
				(settlementMember) =>
					settlementMember.status === "completed" &&
					(!cutoffDate || new Date(settlementMember.createdAt) > cutoffDate),
			)
			.forEach((settlementMember) => {
				// From member pays (negative balance)
				if (settlementMember.fromMemberId) {
					balances.set(
						settlementMember.fromMemberId,
						(balances.get(settlementMember.fromMemberId) || 0) +
							Number(settlementMember.amount),
					);
				}

				// To member receives (positive balance)
				if (settlementMember.toMemberId) {
					balances.set(
						settlementMember.toMemberId,
						(balances.get(settlementMember.toMemberId) || 0) -
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
