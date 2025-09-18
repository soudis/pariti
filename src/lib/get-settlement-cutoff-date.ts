import type { getGroup } from "@/actions";

export function getSettlementCutoffDate(
	group: Awaited<ReturnType<typeof getGroup>>,
) {
	const mostRecentCompleted = group.settlements
		.filter((settlement) => settlement.status === "completed")
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)[0];
	return mostRecentCompleted?.createdAt || null;
}
