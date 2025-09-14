"use server";

import { db } from "@/lib/db";
import { getActiveMembersForDate } from "./get-active-members-for-date";
import { calculateWeightedAmounts } from "./utils";

// Helper function to generate recurring expense instances
export async function generateRecurringExpenseInstances(
	expense: Awaited<
		ReturnType<typeof import("./get-group").getGroup>
	>["expenses"][number],
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

		// Get group to check if weights are enabled
		const group = await db.group.findUnique({
			where: { id: expense.groupId },
			select: { weightsEnabled: true },
		});

		const weightedAmounts = calculateWeightedAmounts(
			Number(expense.amount),
			effectiveMembers,
			group?.weightsEnabled || false,
		);

		return [
			{
				...expense,
				effectiveMembers: effectiveMembers.map((member) => {
					const weightedAmount = weightedAmounts.find(
						(wa) => wa.memberId === member.id,
					);
					return {
						id: member.id,
						name: member.name,
						amount: weightedAmount?.amount || 0,
					};
				}),
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

			// Get group to check if weights are enabled
			const group = await db.group.findUnique({
				where: { id: expense.groupId },
				select: { weightsEnabled: true },
			});

			const weightedAmounts = calculateWeightedAmounts(
				Number(expense.amount),
				effectiveMembers,
				group?.weightsEnabled || false,
			);

			instances.push({
				...expense,
				id: `${expense.id}-${currentInstanceDate.toISOString().split("T")[0]}`,
				date: new Date(currentInstanceDate),
				effectiveMembers: effectiveMembers.map((member) => {
					const weightedAmount = weightedAmounts.find(
						(wa) => wa.memberId === member.id,
					);
					return {
						id: member.id,
						name: member.name,
						amount: weightedAmount?.amount || 0,
					};
				}),
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
