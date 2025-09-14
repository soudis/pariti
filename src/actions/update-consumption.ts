"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type ConsumptionFormData,
	editConsumptionInputSchema,
	editConsumptionReturnSchema,
} from "@/lib/schemas";

async function updateConsumption(
	consumptionId: string,
	data: ConsumptionFormData,
) {
	const consumption = await db.consumption.findUnique({
		where: { id: consumptionId },
		include: {
			resource: true,
		},
	});

	if (!consumption) throw new Error("Consumption not found");

	const totalCost = data.isUnitAmount
		? data.amount * Number(consumption.resource.unitPrice || 0)
		: data.amount;

	const amountPerMember = totalCost / data.selectedMembers.length;

	const updatedConsumption = await db.consumption.update({
		where: { id: consumptionId },
		data: {
			amount: data.amount,
			isUnitAmount: data.isUnitAmount,
			date: data.date,
			description: data.description,
		},
		include: {
			consumptionMembers: {
				include: {
					member: true,
				},
			},
		},
	});

	// Update consumption members
	await db.consumptionMember.deleteMany({
		where: { consumptionId },
	});

	await db.consumptionMember.createMany({
		data: data.selectedMembers.map((memberId) => ({
			consumptionId,
			memberId,
			amount: amountPerMember,
		})),
	});

	revalidatePath(`/group/${consumption.resource.groupId}`);
	return { consumption: updatedConsumption };
}

export const updateConsumptionAction = actionClient
	.inputSchema(editConsumptionInputSchema)
	.outputSchema(editConsumptionReturnSchema)
	.action(async ({ parsedInput }) =>
		updateConsumption(parsedInput.consumptionId, parsedInput.consumption),
	);
