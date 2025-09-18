import { notFound } from "next/navigation";
import { getCalculatedGroup } from "@/actions/get-group";
import { GroupHeader } from "@/components/group-header";
import { GroupTabs } from "@/components/group-tabs";
import { GroupVisitTracker } from "@/components/group-visit-tracker";
import { getSettlementCutoffDate } from "@/lib/get-settlement-cutoff-date";

interface GroupPageProps {
	params: {
		id: string;
	};
}

export default async function GroupPage({ params }: GroupPageProps) {
	const { id } = await params;
	const group = await getCalculatedGroup(id);

	if (!group) {
		notFound();
	}

	// Get the settlement cutoff date for filtering
	const cutoffDate = getSettlementCutoffDate(group);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<GroupVisitTracker groupId={group.id} groupName={group.name} />
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto space-y-4">
					<GroupHeader group={group} />

					<GroupTabs group={group} cutoffDate={cutoffDate} />
				</div>
			</div>
		</div>
	);
}
