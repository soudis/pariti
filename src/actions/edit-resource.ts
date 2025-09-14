"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	editResourceInputSchema,
	editResourceReturnSchema,
	type ResourceFormData,
} from "@/lib/schemas";

async function editResource(resourceId: string, data: ResourceFormData) {
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

export const editResourceAction = actionClient
	.inputSchema(editResourceInputSchema)
	.outputSchema(editResourceReturnSchema)
	.action(async ({ parsedInput }) =>
		editResource(parsedInput.resourceId, parsedInput.resource),
	);
