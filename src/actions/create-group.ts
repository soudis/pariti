"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { GroupFormData } from "@/lib/schemas";

export async function createGroup(data: GroupFormData) {
	const group = await db.group.create({
		data: {
			name: data.name,
			description: data.description,
			currency: data.currency,
			weightsEnabled: data.weightsEnabled,
		},
	});
	revalidatePath("/");
	return group;
}
