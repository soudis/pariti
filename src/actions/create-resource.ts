"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ResourceFormData } from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

export async function createResource(groupId: string, data: ResourceFormData) {
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
	return convertToPlainObject(resource);
}
