"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function removeConsumption(id: string) {
	const consumption = await db.consumption.findUnique({
		where: { id },
		include: {
			resource: {
				include: { group: true },
			},
		},
	});

	if (!consumption) return null;

	await db.consumption.delete({ where: { id } });

	revalidatePath(`/group/${consumption.resource.groupId}`);
	return consumption;
}
