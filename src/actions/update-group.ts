"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function updateGroup(
	id: string,
	data: {
		name: string;
		description?: string;
		currency: string;
		weightsEnabled: boolean;
	},
) {
	const group = await db.group.update({
		where: { id },
		data: {
			name: data.name,
			description: data.description,
			currency: data.currency,
			weightsEnabled: data.weightsEnabled,
		},
	});
	revalidatePath(`/group/${id}`);
	return group;
}
