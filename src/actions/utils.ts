import type {
	Consumption,
	ConsumptionMember,
	Member,
	Resource,
	Settlement,
	SettlementMember,
} from "@prisma/client";
import type { getGroupWithRecurringExpenses } from "@/actions/get-group";
import { getSettlementCutoffDate } from "./get-settlement-cutoff-date";

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
export async function calculateBalances(
	group: Awaited<ReturnType<typeof getGroupWithRecurringExpenses>>,
) {
	const balances = new Map<string, number>();

	// Initialize all members and resources with zero balance
	group.members.forEach((member: Member) => {
		balances.set(`member_${member.id}`, 0);
	});
	group.resources.forEach((resource: Resource) => {
		balances.set(`resource_${resource.id}`, 0);
	});

	// Get the settlement cutoff date for filtering
	const cutoffDate = await getSettlementCutoffDate(group.id);

	// Filter expenses based on cutoff date
	const filteredExpenses = cutoffDate
		? group.expenses.filter((expense) => new Date(expense.date) >= cutoffDate)
		: group.expenses;

	// Process all expenses (including virtual/recurring ones)
	filteredExpenses.forEach((expense: any) => {
		const paidByKey = `member_${expense.paidById}`;
		balances.set(
			paidByKey,
			(balances.get(paidByKey) || 0) + Number(expense.amount),
		);

		// Handle both expenseMembers (from database) and effectiveMembers (from recurring instances)
		const members = expense.effectiveMembers || expense.expenseMembers || [];
		members.forEach((member: any) => {
			const memberKey = `member_${member.memberId || member.id}`;
			const amount = member.amount || 0;
			balances.set(memberKey, (balances.get(memberKey) || 0) - Number(amount));
		});
	});

	// Process consumptions (filtered by cutoff date)
	group.resources.forEach(
		(
			resource: Resource & {
				consumptions: (Consumption & {
					consumptionMembers: ConsumptionMember[];
				})[];
			},
		) => {
			const filteredConsumptions = cutoffDate
				? resource.consumptions.filter(
						(consumption) => new Date(consumption.date) >= cutoffDate,
					)
				: resource.consumptions;

			filteredConsumptions.forEach(
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
