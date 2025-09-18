"use server";

import z from "zod";
import { generateRecurringExpenseInstances } from "@/actions/generate-recurring-expense-instances";
import { db } from "@/lib/db";
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

export async function getGroupWithRecurringExpenses(id: string) {
	const group = await getGroup(id);

	const allExpenses: Awaited<
		ReturnType<typeof generateRecurringExpenseInstances>
	> = [];
	for (const expense of group.expenses) {
		const instances = await generateRecurringExpenseInstances(expense);
		allExpenses.push(...instances);
	}

	// Sort expenses by date (newest first)
	allExpenses.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	return convertToPlainObject({
		...group,
		expenses: allExpenses,
	});
}
