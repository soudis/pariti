"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	removeMemberInputSchema,
	removeMemberReturnSchema,
} from "@/lib/schemas";

async function removeMember(memberId: string) {
	const member = await db.member.findUnique({
		where: { id: memberId },
		include: { group: true },
	});

	if (!member) throw new Error("Member not found");

	await db.member.delete({ where: { id: memberId } });

	revalidatePath(`/group/${member.groupId}`);
	return { success: true };
}

export const removeMemberAction = actionClient
	.inputSchema(removeMemberInputSchema)
	.outputSchema(removeMemberReturnSchema)
	.action(async ({ parsedInput }) => removeMember(parsedInput.memberId));
