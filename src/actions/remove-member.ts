"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function removeMember(id: string) {
	const member = await db.member.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!member) return null;

	await db.member.delete({ where: { id } });

	revalidatePath(`/group/${member.groupId}`);
	return member;
}
