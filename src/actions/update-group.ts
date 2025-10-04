"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type GroupFormData,
	updateGroupInputSchema,
	updateGroupReturnSchema,
} from "@/lib/schemas";

async function updateGroup(groupId: string, data: GroupFormData) {
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
