export function parseSamlGroups(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}

export function groupsIntersect(
	userGroups: string[],
	allowedGroups: string[],
): boolean {
	if (allowedGroups.length === 0) return false;
	return userGroups.some((g) => allowedGroups.includes(g));
}
