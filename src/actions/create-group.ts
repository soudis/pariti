"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	createGroupInputSchema,
	createGroupReturnSchema,
	type GroupFormData,
	getDefaultWeightTypes,
} from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

async function createGroup(data: GroupFormData) {
	const group = await db.group.create({
		data: {
			id: randomBytes(32).toString("base64url"), // make sure its long and hard to guess
			name: data.name,
			description: data.description,
			currency: data.currency,
			weightsEnabled: data.weightsEnabled,
			weightTypes: data.weightTypes || getDefaultWeightTypes(),
			memberActiveDurationsEnabled: data.memberActiveDurationsEnabled,
			recurringExpensesEnabled: data.recurringExpensesEnabled,
		},
	});
	revalidatePath("/");
	return convertToPlainObject(group);
}

export const createGroupAction = actionClient
	.inputSchema(createGroupInputSchema)
	.outputSchema(createGroupReturnSchema)
	.action(async ({ parsedInput }) => createGroup(parsedInput.group));
