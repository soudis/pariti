"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	removeResourceInputSchema,
	removeResourceReturnSchema,
} from "@/lib/schemas";

async function removeResource(resourceId: string) {
	const resource = await db.resource.findUnique({
		where: { id: resourceId },
		include: { group: true },
	});

	if (!resource) throw new Error("Resource not found");

	await db.resource.delete({ where: { id: resourceId } });

	revalidatePath(`/group/${resource.groupId}`);
	return { success: true };
}

export const removeResourceAction = actionClient
	.inputSchema(removeResourceInputSchema)
	.outputSchema(removeResourceReturnSchema)
	.action(async ({ parsedInput }) => removeResource(parsedInput.resourceId));
