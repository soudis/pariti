import { notFound } from "next/navigation";
import { GroupOverview } from "@/components/group-overview";
import { GroupTabs } from "@/components/group-tabs";
import { generateRecurringExpenseInstances, getGroup } from "@/lib/actions";

interface GroupPageProps {
	params: {
		id: string;
	};
}

export default async function GroupPage({ params }: GroupPageProps) {
	const group = await getGroup(params.id);

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

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto space-y-8">
					<GroupOverview group={group} resources={group.resources} />

					<GroupTabs
						group={group}
						expenses={allExpenses}
						resources={group.resources}
						settlements={group.settlements}
					/>
				</div>
			</div>
		</div>
	);
}
