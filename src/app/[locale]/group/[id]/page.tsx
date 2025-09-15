import { notFound } from "next/navigation";
import {
	generateRecurringExpenseInstances,
	getGroup,
	getSettlementCutoffDate,
} from "@/actions";
import { GroupHeader } from "@/components/group-header";
import { GroupTabs } from "@/components/group-tabs";
import { GroupVisitTracker } from "@/components/group-visit-tracker";

interface GroupPageProps {
	params: {
		id: string;
	};
}

export default async function GroupPage({ params }: GroupPageProps) {
	const { id } = await params;
	const group = await getGroup(id);

	if (!group) {
		notFound();
	}

	// Generate recurring expense instances and convert Decimal to numbers
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

	// Collect all consumptions from resources
	const allConsumptions = group.resources.flatMap(
		(resource) => resource.consumptions,
	);

	// Get the settlement cutoff date for filtering
	const cutoffDate = await getSettlementCutoffDate(group.id);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<GroupVisitTracker groupId={group.id} groupName={group.name} />
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto space-y-4">
					<GroupHeader group={group} />

					<GroupTabs
						group={group}
						expenses={allExpenses}
						cutoffDate={cutoffDate}
						consumptions={allConsumptions}
					/>
				</div>
			</div>
		</div>
	);
}
