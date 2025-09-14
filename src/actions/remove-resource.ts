"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function removeResource(id: string) {
	const resource = await db.resource.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!resource) return null;

	await db.resource.delete({ where: { id } });

	revalidatePath(`/group/${resource.groupId}`);
	return resource;
}
