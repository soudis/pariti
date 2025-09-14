"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type ConsumptionFormData,
	createConsumptionInputSchema,
	createConsumptionReturnSchema,
} from "@/lib/schemas";

async function createConsumption(data: ConsumptionFormData) {
	const resource = await db.resource.findUnique({
		where: { id: data.resourceId },
		include: { group: true },
	});

	if (!resource) throw new Error("Resource not found");

	const totalCost = data.isUnitAmount
		? data.amount * Number(resource.unitPrice || 0)
		: data.amount;

	const amountPerMember = totalCost / data.selectedMembers.length;

	const consumption = await db.consumption.create({
		data: {
			resourceId: data.resourceId,
			amount: data.amount,
			isUnitAmount: data.isUnitAmount,
			date: data.date,
			description: data.description,
			consumptionMembers: {
				create: data.selectedMembers.map((memberId) => ({
					memberId,
					amount: amountPerMember,
				})),
			},
		},
		include: {
			consumptionMembers: {
				include: {
					member: true,
				},
			},
		},
	});

	revalidatePath(`/group/${resource.groupId}`);
	return { consumption };
}

export const createConsumptionAction = actionClient
	.inputSchema(createConsumptionInputSchema)
	.outputSchema(createConsumptionReturnSchema)
	.action(async ({ parsedInput }) =>
		createConsumption(parsedInput.consumption),
	);
