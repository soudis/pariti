import type { Group, Member } from "@prisma/client";
import { notFound } from "next/navigation";
import { ExpensesSection } from "@/components/expenses-section";
import { GroupHeader } from "@/components/group-header";
import { MembersSection } from "@/components/members-section";
import { ResourcesSection } from "@/components/resources-section";
import { generateRecurringExpenseInstances, getGroup } from "@/lib/actions";

// Type for expenses with converted Decimal to number amounts
type ConvertedExpense = {
	id: string;
	title: string;
	description?: string | null;
	amount: number;
	groupId: string;
	paidById: string;
	splitAll: boolean;
	isRecurring: boolean;
	recurringType?: string | null;
	recurringStartDate?: Date | null;
	date: Date;
	createdAt: Date;
	updatedAt: Date;
	paidBy: Member;
	expenseMembers: Array<{
		id: string;
		createdAt: Date;
		expenseId: string;
		memberId: string;
		amount: number;
		member: Member;
	}>;
	effectiveMembers?: Array<{
		id: string;
		name: string;
		amount: number;
	}>;
};

// Type for resources with converted Decimal to number amounts
type ConvertedResource = {
	id: string;
	name: string;
	description?: string | null;
	unit?: string | null;
	unitPrice?: number | null;
	createdAt: Date;
	updatedAt: Date;
	consumptions: Array<{
		id: string;
		amount: number;
		isUnitAmount: boolean;
		date: Date;
		description?: string | null;
		consumptionMembers: Array<{
			amount: number;
			member: Member;
		}>;
	}>;
};

// Type for group with converted Decimal to number amounts
type ConvertedGroup = Omit<Group, "expenses" | "resources"> & {
	members: Member[];
	expenses: ConvertedExpense[];
	resources: ConvertedResource[];
};

interface GroupPageProps {
	params: {
		id: string;
	};
}

export default async function GroupPage({ params }: GroupPageProps) {
	const group = (await getGroup(params.id)) as ConvertedGroup;

	if (!group) {
		notFound();
	}

	// Generate recurring expense instances and convert Decimal to numbers
	const allExpenses: ConvertedExpense[] = [];
	for (const expense of group.expenses) {
		const instances = await generateRecurringExpenseInstances(expense);
		allExpenses.push(...(instances as ConvertedExpense[]));
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
				</div>
			</div>
		</div>
	);
}
