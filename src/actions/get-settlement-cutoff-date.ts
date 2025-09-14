"use server";

import { db } from "@/lib/db";

export async function getSettlementCutoffDate(
	groupId: string,
): Promise<Date | null> {
	// Find the most recent completed settlement
	const mostRecentCompleted = await db.settlement.findFirst({
		where: {
			groupId,
			status: "completed",
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	if (!mostRecentCompleted) {
		return null;
	}

	// Check if there are any open settlements created BEFORE the most recent completed one
	const olderOpenSettlement = await db.settlement.findFirst({
		where: {
			groupId,
			status: "open",
			createdAt: {
				lt: mostRecentCompleted.createdAt,
			},
		},
	});

	// If there's an older open settlement, don't filter (return null)
	if (olderOpenSettlement) {
		return null;
	}

	// Otherwise, return the cutoff date
	return mostRecentCompleted.createdAt;
}
