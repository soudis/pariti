"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseSamlGroups, groupsIntersect } from "@/lib/user-groups";

export async function getAccessibleGroups() {
	const user = await getCurrentUser();
	if (!user) return [];

	const userGroups = parseSamlGroups(
		(user as Record<string, unknown>).samlGroups as string,
	);

	const groups = await db.group.findMany({
		where: {
			OR: [
				{ createdByUserId: user.id },
				...(userGroups.length > 0 ? [{ allowedSamlGroups: { not: null as unknown as undefined } }] : []),
			],
		},
		select: {
			id: true,
			name: true,
			description: true,
			currency: true,
			allowedSamlGroups: true,
			createdByUserId: true,
			createdAt: true,
			_count: { select: { members: true } },
		},
		orderBy: { updatedAt: "desc" },
	});

	const filtered = groups.filter((group) => {
		if (group.createdByUserId === user.id) return true;
		const allowed = Array.isArray(group.allowedSamlGroups)
			? (group.allowedSamlGroups as string[])
			: [];
		return groupsIntersect(userGroups, allowed);
	});

	return filtered.map((group) => ({
		id: group.id,
		name: group.name,
		description: group.description,
		currency: group.currency,
		createdAt: group.createdAt,
		memberCount: group._count.members,
	}));
}
