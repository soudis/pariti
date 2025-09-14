"use server";

import type { Member } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { MemberFormData } from "@/lib/schemas";

export async function updateMember(id: Member["id"], data: MemberFormData) {
	const member = await db.member.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!member) return null;

	const updatedMember = await db.member.update({
		where: { id },
		data: {
			name: data.name,
			email: data.email,
			iban: data.iban,
			weight: data.weight,
			activeFrom: data.activeFrom,
			activeTo: data.activeTo,
		},
	});

	revalidatePath(`/group/${member.groupId}`);
	return updatedMember;
}
