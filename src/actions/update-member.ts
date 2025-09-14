"use server";

import type { Member } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type MemberFormData,
	updateMemberInputSchema,
	updateMemberReturnSchema,
} from "@/lib/schemas";

async function updateMember(memberId: Member["id"], data: MemberFormData) {
	const member = await db.member.findUnique({
		where: { id: memberId },
		include: { group: true },
	});

	if (!member) throw new Error("Member not found");

	const updatedMember = await db.member.update({
		where: { id: memberId },
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
	return { member: { ...updatedMember, weight: Number(updatedMember.weight) } };
}

export const updateMemberAction = actionClient
	.inputSchema(updateMemberInputSchema)
	.outputSchema(updateMemberReturnSchema)
	.action(async ({ parsedInput }) =>
		updateMember(parsedInput.memberId, parsedInput.member),
	);
