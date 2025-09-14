"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type ResourceFormData,
	updateResourceInputSchema,
	updateResourceReturnSchema,
} from "@/lib/schemas";

async function updateResource(resourceId: string, data: ResourceFormData) {
	const resource = await db.resource.update({
		where: { id: resourceId },
		data: {
			name: data.name,
			description: data.description,
			unit: data.unit,
			unitPrice: data.unitPrice,
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

	revalidatePath(`/group/${resource.groupId}`);
	return { resource };
}

export const updateResourceAction = actionClient
	.inputSchema(updateResourceInputSchema)
	.outputSchema(updateResourceReturnSchema)
	.action(async ({ parsedInput }) =>
		updateResource(parsedInput.resourceId, parsedInput.resource),
	);
