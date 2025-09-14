"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	removeConsumptionInputSchema,
	removeConsumptionReturnSchema,
} from "@/lib/schemas";

async function removeConsumption(consumptionId: string) {
	const consumption = await db.consumption.findUnique({
		where: { id: consumptionId },
		include: {
			resource: {
				include: { group: true },
			},
		},
	});

	if (!consumption) throw new Error("Consumption not found");

	await db.consumption.delete({ where: { id: consumptionId } });

	revalidatePath(`/group/${consumption.resource.groupId}`);
	return { success: true };
}

export const removeConsumptionAction = actionClient
	.inputSchema(removeConsumptionInputSchema)
	.outputSchema(removeConsumptionReturnSchema)
	.action(async ({ parsedInput }) =>
		removeConsumption(parsedInput.consumptionId),
	);
