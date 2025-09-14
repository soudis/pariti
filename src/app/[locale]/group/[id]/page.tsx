import { notFound } from "next/navigation";
import {
	generateRecurringExpenseInstances,
	getGroup,
	getSettlementCutoffDate,
} from "@/actions";
import { GroupOverview } from "@/components/group-overview";
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
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<GroupVisitTracker groupId={group.id} groupName={group.name} />
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto space-y-8">
					<GroupOverview
						group={group}
						resources={group.resources}
						consumptions={allConsumptions}
						cutoffDate={cutoffDate}
					/>

					<GroupTabs
						group={group}
						expenses={allExpenses}
						cutoffDate={cutoffDate}
					/>
				</div>
			</div>
		</div>
	);
}
