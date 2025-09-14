"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function removeSettlement(id: string) {
	const settlement = await db.settlement.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!settlement) return null;

	await db.settlement.delete({ where: { id } });

	revalidatePath(`/group/${settlement.groupId}`);
	return { success: true };
}
