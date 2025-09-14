"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ResourceFormData } from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

export async function editResource(id: string, data: ResourceFormData) {
	const resource = await db.resource.update({
		where: { id },
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
	return convertToPlainObject(resource);
}
