import { notFound } from "next/navigation";
import { ExpensesSection } from "@/components/expenses-section";
import { GroupHeader } from "@/components/group-header";
import { MembersSection } from "@/components/members-section";
import { ResourcesSection } from "@/components/resources-section";
import { SettlementsSection } from "@/components/settlements-section";
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
					<GroupHeader group={group} />

					<div className="grid gap-8 lg:grid-cols-2">
						<MembersSection group={group} />
						<ExpensesSection group={group} expenses={allExpenses} />
					</div>

					<ResourcesSection
						groupId={group.id}
						resources={group.resources}
						members={group.members}
					/>

					<SettlementsSection
						groupId={group.id}
						settlements={group.settlements as any}
						members={group.members}
						resources={group.resources}
					/>
				</div>
			</div>
		</div>
	);
}
