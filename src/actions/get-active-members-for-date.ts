"use server";

import { db } from "@/lib/db";

export async function getActiveMembersForDate(groupId: string, date: Date) {
	return await db.member.findMany({
		where: {
			groupId,
			activeFrom: { lte: date },
			OR: [{ activeTo: null }, { activeTo: { gte: date } }],
		},
		orderBy: { name: "asc" },
	});
}
