"use server";

import type { getGroup } from "@/actions/get-group";

// Helper function to generate recurring expense instances
export async function generateRecurringExpenseInstances(
	expense: Awaited<ReturnType<typeof getGroup>>["expenses"][number],
	currentDate: Date = new Date(),
	group?: Pick<
		Awaited<ReturnType<typeof getGroup>>,
		"recurringExpensesEnabled"
	>,
) {
	// If recurring expenses are disabled for the group, don't generate recurring instances
	if (group && !group.recurringExpensesEnabled) {
		return [expense];
	}

	if (expense.recurringStartDate && expense.isRecurring) {
		const instances = [];
		const startDate = new Date(expense.recurringStartDate);
		const currentInstanceDate = new Date(startDate);

		while (currentInstanceDate <= currentDate) {
			if (currentInstanceDate >= startDate) {
				instances.push({
					...expense,
					id: expense.id,
					date: new Date(currentInstanceDate),
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
					currentInstanceDate.setFullYear(
						currentInstanceDate.getFullYear() + 1,
					);
					break;
			}
		}
		return instances;
	}

	return [expense];
}
