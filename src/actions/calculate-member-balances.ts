"use server";

import { db } from "@/lib/db";

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

	// Process expenses
	group.expenses.forEach((expense) => {
		// Member who paid gets positive balance
		balances.set(
			expense.paidById,
			(balances.get(expense.paidById) || 0) + Number(expense.amount),
		);

		// Members who owe get negative balance
		expense.expenseMembers.forEach((expenseMember) => {
			balances.set(
				expenseMember.memberId,
				(balances.get(expenseMember.memberId) || 0) -
					Number(expenseMember.amount),
			);
		});
	});

	// Process consumptions
	group.resources.forEach((resource) => {
		resource.consumptions.forEach((consumption) => {
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
