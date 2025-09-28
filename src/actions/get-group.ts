"use server";

import z from "zod";
import { generateRecurringExpenseInstances } from "@/actions/generate-recurring-expense-instances";
import { db } from "@/lib/db";
import { getCalculatedMemberAmounts } from "@/lib/get-calculated-member-amounts";
import { getSettlementCutoffDate } from "@/lib/get-settlement-cutoff-date";
import { weightTypeSchema } from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

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
	return convertToPlainObject({
		...group,
		weightTypes: z.array(weightTypeSchema).parse(group.weightTypes),
		members: group.members.map((member) => ({
			...member,
			weights: z.record(z.string(), z.number()).parse(member.weights),
		})),
	});
}

export async function getCalculatedGroup(id: string) {
	const group = await getGroup(id);

	const allExpenses: Awaited<
		ReturnType<typeof generateRecurringExpenseInstances>
	> = [];
	for (const expense of group.expenses) {
		allExpenses.push(...(await generateRecurringExpenseInstances(expense)));
	}

	// Sort expenses by date (newest first)
	allExpenses.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	const calculatedGroup = {
		...group,
		expenses: allExpenses.map((expense) => ({
			...expense,
			calculatedExpenseMembers: getCalculatedMemberAmounts(
				group,
				expense.expenseMembers.map((ma) => ({
					...ma,
					weight: ma.weight ? Number(ma.weight) : null,
					amount: ma.amount ? Number(ma.amount) : null,
				})),
				expense,
			),
		})),
		resources: group.resources.map((resource) => ({
			...resource,
			consumptions: resource.consumptions.map((consumption) => ({
				...consumption,
				calculatedConsumptionMembers: getCalculatedMemberAmounts(
					group,
					consumption.consumptionMembers.map((ma) => ({
						...ma,
						weight: ma.weight ? Number(ma.weight) : null,
						amount: ma.amount ? Number(ma.amount) : null,
					})),
					consumption,
					resource.unitPrice ? Number(resource.unitPrice) : undefined,
				),
			})),
		})),
	};

	const settlementCutoffDate = getSettlementCutoffDate(calculatedGroup);

	const balances = new Map<string, number>();

	// Initialize all members with zero balance
	calculatedGroup.members.forEach((member) => {
		balances.set(member.id, 0);
	});

	// Initialize all resources with zero balance
	calculatedGroup.resources.forEach((resource) => {
		balances.set(resource.id, 0);
	});

	// Filter expenses based on cutoff date
	const filteredExpenses = settlementCutoffDate
		? calculatedGroup.expenses.filter(
				(expense) => new Date(expense.date) >= settlementCutoffDate,
			)
		: calculatedGroup.expenses;

	// Process all expenses (including virtual/recurring ones)
	filteredExpenses.forEach((expense) => {
		// Member who paid gets positive balance
		balances.set(
			expense.paidById,
			(balances.get(expense.paidById) || 0) + Number(expense.amount),
		);
		expense.calculatedExpenseMembers.forEach((expenseMember) => {
			balances.set(
				expenseMember.memberId,
				(balances.get(expenseMember.memberId) || 0) -
					Number(expenseMember.amount),
			);
		});
	});

	// Process consumptions (filtered by cutoff date)
	calculatedGroup.resources.forEach((resource) => {
		const filteredConsumptions = settlementCutoffDate
			? resource.consumptions.filter(
					(consumption) => new Date(consumption.date) >= settlementCutoffDate,
				)
			: resource.consumptions;

		filteredConsumptions.forEach((consumption) => {
			// Members who consumed pay (negative balance)
			balances.set(
				resource.id,
				(balances.get(resource.id) || 0) +
					Number(consumption.amount) *
						(resource.unitPrice && resource.unit
							? Number(resource.unitPrice)
							: 1),
			);
			consumption.calculatedConsumptionMembers.forEach((consumptionMember) => {
				balances.set(
					consumptionMember.memberId,
					(balances.get(consumptionMember.memberId) || 0) -
						Number(consumptionMember.amount),
				);
			});
		});
	});

	// Process completed settlements
	calculatedGroup.settlements
		.filter((settlement) => settlement.status !== "completed")
		.forEach((settlement) => {
			settlement.settlementMembers
				.filter((settlementMember) => settlementMember.status === "completed")
				.forEach((settlementMember) => {
					// From member pays (negative balance)
					if (settlementMember.fromMemberId) {
						balances.set(
							settlementMember.fromMemberId,
							(balances.get(settlementMember.fromMemberId) || 0) +
								Number(settlementMember.amount),
						);
					}
					if (settlementMember.fromResourceId) {
						balances.set(
							settlementMember.fromResourceId,
							(balances.get(settlementMember.fromResourceId) || 0) +
								Number(settlementMember.amount),
						);
					}
					if (settlementMember.toMemberId) {
						balances.set(
							settlementMember.toMemberId,
							(balances.get(settlementMember.toMemberId) || 0) -
								Number(settlementMember.amount),
						);
					}
					if (settlementMember.toResourceId) {
						balances.set(
							settlementMember.toResourceId,
							(balances.get(settlementMember.toResourceId) || 0) +
								Number(settlementMember.amount),
						);
					}
				});
		});

	return convertToPlainObject({
		...calculatedGroup,
		members: calculatedGroup.members.map((member) => ({
			...member,
			balance: balances.get(member.id) || 0,
		})),
		resources: calculatedGroup.resources.map((resource) => ({
			...resource,
			balance: balances.get(resource.id) || 0,
		})),
	});
}
