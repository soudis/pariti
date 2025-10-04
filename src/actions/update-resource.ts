"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	editResourceInputSchema,
	editResourceReturnSchema,
	type ResourceFormData,
} from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

async function updateResource(resourceId: string, data: ResourceFormData) {
	const resource = await db.resource.update({
		where: { id: resourceId },
		data: {
			name: data.name,
			description: data.description,
			unit: data.hasUnit ? data.unit : null,
			unitPrice: data.hasUnit ? data.unitPrice : null,
			defaultWeightType: data.defaultWeightType,
			linkedMemberId:
				data.linkedMemberId === "_none" ? null : data.linkedMemberId,
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
	return { resource: convertToPlainObject(resource) };
}

export const updateResourceAction = actionClient
	.inputSchema(editResourceInputSchema)
	.outputSchema(editResourceReturnSchema)
	.action(async ({ parsedInput }) =>
		updateResource(parsedInput.resourceId, parsedInput.resource),
	);
