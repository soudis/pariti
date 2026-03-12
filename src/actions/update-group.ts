"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type GroupFormData,
	updateGroupInputSchema,
	updateGroupReturnSchema,
} from "@/lib/schemas";

async function updateGroup(groupId: string, data: GroupFormData) {
	const user = await requireUser();

	const existing = await db.group.findUnique({
		where: { id: groupId },
		select: { createdByUserId: true },
	});

	if (!existing || existing.createdByUserId !== user.id) {
		throw new Error("Only the group creator can update settings");
	}

	const group = await db.group.update({
		where: { id: groupId },
		data: {
			name: data.name,
			description: data.description,
			currency: data.currency,
			weightsEnabled: data.weightsEnabled,
			weightTypes: data.weightTypes || [],
			memberActiveDurationsEnabled: data.memberActiveDurationsEnabled,
			recurringExpensesEnabled: data.recurringExpensesEnabled,
			allowedSamlGroups: data.allowedSamlGroups ?? [],
		},
	});
	revalidatePath(`/group/${groupId}`);
	return group;
}

export const updateGroupAction = actionClient
	.inputSchema(updateGroupInputSchema)
	.outputSchema(updateGroupReturnSchema)
	.action(async ({ parsedInput }) =>
		updateGroup(parsedInput.groupId, parsedInput.group),
	);
