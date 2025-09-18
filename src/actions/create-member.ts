"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	addMemberInputSchema,
	addMemberReturnSchema,
	type MemberFormData,
} from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

async function createMember(groupId: string, data: MemberFormData) {
	const member = await db.member.create({
		data: {
			name: data.name,
			email: data.email,
			iban: data.iban,
			weights: data.weights || {}, // New multiple weights field
			groupId: groupId,
			activeFrom: data.activeFrom || new Date(),
			activeTo: data.activeTo,
		},
	});

	revalidatePath(`/group/${groupId}`);
	return { member: convertToPlainObject(member) };
}

export const createMemberAction = actionClient
	.inputSchema(addMemberInputSchema)
	.outputSchema(addMemberReturnSchema)
	.action(async ({ parsedInput }) =>
		createMember(parsedInput.groupId, parsedInput.member),
	);
