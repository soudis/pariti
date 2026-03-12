"use server";

import { getCurrentUser } from "@/lib/auth";
import { parseSamlGroups } from "@/lib/user-groups";

export async function getCurrentUserSamlGroups(): Promise<string[]> {
	const user = await getCurrentUser();
	if (!user) return [];
	return parseSamlGroups(
		(user as Record<string, unknown>).samlGroups as string,
	);
}
