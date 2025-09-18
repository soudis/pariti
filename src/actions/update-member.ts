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
import { convertToPlainObject } from "@/lib/utils";

async function updateMember(memberId: Member["id"], data: MemberFormData) {
	const updatedMember = await db.member.update({
		where: { id: memberId },
		data: {
			name: data.name,
			email: data.email,
			iban: data.iban,
			weights: data.weights, // New multiple weights field
			activeFrom: data.activeFrom,
			activeTo: data.activeTo,
		},
	});

	revalidatePath(`/group/${updatedMember.groupId}`);
	return { member: convertToPlainObject(updatedMember) };
}

export const updateMemberAction = actionClient
	.inputSchema(updateMemberInputSchema)
	.outputSchema(updateMemberReturnSchema)
	.action(async ({ parsedInput }) =>
		updateMember(parsedInput.memberId, parsedInput.member),
	);
