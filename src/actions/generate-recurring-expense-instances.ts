"use server";

import {
	eachMonthOfInterval,
	eachWeekOfInterval,
	eachYearOfInterval,
	isAfter,
} from "date-fns";
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
	if (
		(group && !group.recurringExpensesEnabled) ||
		isAfter(expense.date, currentDate)
	) {
		return [{ ...expense, originalDate: expense.date }];
	}

	if (expense.isRecurring) {
		const instances = [];
		switch (expense.recurringType) {
			case "weekly":
				instances.push(
					...eachWeekOfInterval({ start: expense.date, end: currentDate }),
				);
				break;
			case "monthly":
				instances.push(
					...eachMonthOfInterval({ start: expense.date, end: currentDate }),
				);
				break;
			case "yearly":
				instances.push(
					...eachYearOfInterval({ start: expense.date, end: currentDate }),
				);
				break;
		}
		return instances.map((date) => ({
			...expense,
			date: date,
			originalDate: expense.date,
		}));
	}

	return [{ ...expense, originalDate: expense.date }];
}
