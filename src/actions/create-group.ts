"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	createGroupInputSchema,
	createGroupReturnSchema,
	type GroupFormData,
} from "@/lib/schemas";

async function createGroup(data: GroupFormData) {
	const group = await db.group.create({
		data: {
			id: randomBytes(64).toString("base64url"), // make sure its long and hard to guess
			name: data.name,
			description: data.description,
			currency: data.currency,
			weightsEnabled: data.weightsEnabled,
		},
	});
	revalidatePath("/");
	return group;
}

export const createGroupAction = actionClient
	.inputSchema(createGroupInputSchema)
	.outputSchema(createGroupReturnSchema)
	.action(async ({ parsedInput }) => createGroup(parsedInput.group));
