"use server";

import { db } from "@/lib/db";
import { redistributeAmounts } from "@/lib/redistribution";
import { getActiveMembersForDate } from "./get-active-members-for-date";

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

		// Convert expenseMembers to MemberAmount format for redistribution
		const memberAmounts = effectiveMembers.map((member) => {
			const existingMember = expense.expenseMembers.find(
				(em) => em.memberId === member.id,
			);
			return {
				memberId: member.id,
				amount: existingMember ? Number(existingMember.amount) : 0,
				weight: existingMember ? Number(existingMember.weight) : 1,
				isManuallyEdited: existingMember
					? existingMember.isManuallyEdited
					: false,
			};
		});

		// Convert effectiveMembers to the format expected by redistributeAmounts
		const membersForRedistribution = effectiveMembers.map((member) => ({
			id: member.id,
			weight: Number(member.weight),
		}));

		// Use the proper redistribution function with stored weights
		const redistributedAmounts = redistributeAmounts(
			membersForRedistribution,
			memberAmounts,
			Number(expense.amount),
			group?.weightsEnabled || false,
			(expense.sharingMethod as "equal" | "weights") || "equal",
		);

		return [
			{
				...expense,
				effectiveMembers: effectiveMembers.map((member) => {
					const redistributedAmount = redistributedAmounts.find(
						(ra) => ra.memberId === member.id,
					);
					return {
						id: member.id,
						name: member.name,
						amount: redistributedAmount?.amount || 0,
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

			// Convert expenseMembers to MemberAmount format for redistribution
			const memberAmounts = effectiveMembers.map((member) => {
				const existingMember = expense.expenseMembers.find(
					(em) => em.memberId === member.id,
				);
				return {
					memberId: member.id,
					amount: existingMember ? Number(existingMember.amount) : 0,
					weight: existingMember ? Number(existingMember.weight) : 1,
					isManuallyEdited: existingMember
						? existingMember.isManuallyEdited
						: false,
				};
			});

			// Convert effectiveMembers to the format expected by redistributeAmounts
			const membersForRedistribution = effectiveMembers.map((member) => ({
				id: member.id,
				weight: Number(member.weight),
			}));

			// Use the proper redistribution function with stored weights
			const redistributedAmounts = redistributeAmounts(
				membersForRedistribution,
				memberAmounts,
				Number(expense.amount),
				group?.weightsEnabled || false,
				(expense.sharingMethod as "equal" | "weights") || "equal",
			);

			instances.push({
				...expense,
				id: expense.id,
				date: new Date(currentInstanceDate),
				effectiveMembers: effectiveMembers.map((member) => {
					const redistributedAmount = redistributedAmounts.find(
						(ra) => ra.memberId === member.id,
					);
					return {
						id: member.id,
						name: member.name,
						amount: redistributedAmount?.amount || 0,
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
