"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	createResourceInputSchema,
	createResourceReturnSchema,
	type ResourceFormData,
} from "@/lib/schemas";

async function createResource(groupId: string, data: ResourceFormData) {
	const resource = await db.resource.create({
		data: {
			name: data.name,
			description: data.description,
			unit: data.unit,
			unitPrice: data.unitPrice,
			groupId,
		},
		include: {
			consumptions: {
				include: {
					consumptionMembers: {
						include: {
							member: true,
						},
					},
				},
			},
		},
	});

	revalidatePath(`/group/${groupId}`);
	return { resource };
}

export const createResourceAction = actionClient
	.inputSchema(createResourceInputSchema)
	.outputSchema(createResourceReturnSchema)
	.action(async ({ parsedInput }) =>
		createResource(parsedInput.groupId, parsedInput.resource),
	);
