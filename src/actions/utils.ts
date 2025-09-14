import type {
	Consumption,
	ConsumptionMember,
	Expense,
	ExpenseMember,
	Group,
	Member,
	Resource,
	Settlement,
	SettlementMember,
} from "@prisma/client";

// Helper function to calculate weighted amounts for members
export function calculateWeightedAmounts(
	totalAmount: number,
	members: Pick<Member, "id" | "weight">[],
	weightsEnabled: boolean,
): Array<{ memberId: string; amount: number }> {
	if (!weightsEnabled) {
		// Equal split when weights are disabled
		const amountPerMember = totalAmount / members.length;
		return members.map((member) => ({
			memberId: member.id,
			amount: amountPerMember,
		}));
	}

	// Weighted split when weights are enabled
	const totalWeight = members.reduce(
		(sum, member) => sum + Number(member.weight),
		0,
	);
	return members.map((member) => ({
		memberId: member.id,
		amount: (totalAmount * Number(member.weight)) / totalWeight,
	}));
}

// Helper function to calculate balances
export function calculateBalances(
	group: Group & {
		expenses: (Expense & { expenseMembers: ExpenseMember[] })[];
		members: Member[];
		resources: (Resource & {
			consumptions: (Consumption & {
				consumptionMembers: ConsumptionMember[];
			})[];
		})[];
		settlements: (Settlement & { settlementMembers: SettlementMember[] })[];
	},
) {
	const balances = new Map<string, number>();

	// Initialize all members and resources with zero balance
	group.members.forEach((member: Member) => {
		balances.set(`member_${member.id}`, 0);
	});
	group.resources.forEach((resource: Resource) => {
		balances.set(`resource_${resource.id}`, 0);
	});

	// Process expenses
	group.expenses.forEach(
		(expense: Expense & { expenseMembers: ExpenseMember[] }) => {
			const paidByKey = `member_${expense.paidById}`;
			balances.set(
				paidByKey,
				(balances.get(paidByKey) || 0) + Number(expense.amount),
			);

			expense.expenseMembers.forEach((expenseMember: ExpenseMember) => {
				const memberKey = `member_${expenseMember.memberId}`;
				balances.set(
					memberKey,
					(balances.get(memberKey) || 0) - Number(expenseMember.amount),
				);
			});
		},
	);

	// Process consumptions
	group.resources.forEach(
		(
			resource: Resource & {
				consumptions: (Consumption & {
					consumptionMembers: ConsumptionMember[];
				})[];
			},
		) => {
			resource.consumptions.forEach(
				(
					consumption: Consumption & {
						consumptionMembers: ConsumptionMember[];
					},
				) => {
					const totalCost = consumption.isUnitAmount
						? Number(consumption.amount) * Number(resource.unitPrice || 0)
						: Number(consumption.amount);

					// Resources receive money (positive balance)
					const resourceKey = `resource_${resource.id}`;
					balances.set(
						resourceKey,
						(balances.get(resourceKey) || 0) + totalCost,
					);

					// Members pay money (negative balance)
					consumption.consumptionMembers.forEach(
						(consumptionMember: ConsumptionMember) => {
							const memberKey = `member_${consumptionMember.memberId}`;
							balances.set(
								memberKey,
								(balances.get(memberKey) || 0) -
									Number(consumptionMember.amount),
							);
						},
					);
				},
			);
		},
	);

	// Process completed settlements
	group.settlements.forEach(
		(settlement: Settlement & { settlementMembers: SettlementMember[] }) => {
			settlement.settlementMembers.forEach(
				(settlementMember: SettlementMember) => {
					// From member/resource pays (negative balance)
					if (settlementMember.fromMemberId) {
						const fromKey = `member_${settlementMember.fromMemberId}`;
						balances.set(
							fromKey,
							(balances.get(fromKey) || 0) - Number(settlementMember.amount),
						);
					}
					if (settlementMember.fromResourceId) {
						const fromKey = `resource_${settlementMember.fromResourceId}`;
						balances.set(
							fromKey,
							(balances.get(fromKey) || 0) - Number(settlementMember.amount),
						);
					}

					// To member/resource receives (positive balance)
					if (settlementMember.toMemberId) {
						const toKey = `member_${settlementMember.toMemberId}`;
						balances.set(
							toKey,
							(balances.get(toKey) || 0) + Number(settlementMember.amount),
						);
					}
					if (settlementMember.toResourceId) {
						const toKey = `resource_${settlementMember.toResourceId}`;
						balances.set(
							toKey,
							(balances.get(toKey) || 0) + Number(settlementMember.amount),
						);
					}
				},
			);
		},
	);

	return balances;
}
