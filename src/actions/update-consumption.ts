"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type ConsumptionFormData,
	editConsumptionInputSchema,
	editConsumptionReturnSchema,
} from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

async function updateConsumption(
	consumptionId: string,
	data: ConsumptionFormData,
) {
	const updatedConsumption = await db.consumption.update({
		where: { id: consumptionId },
		data: {
			amount: data.amount,
			isUnitAmount: data.isUnitAmount,
			date: data.date,
			description: data.description,
			sharingMethod: data.sharingMethod || "equal",
			splitAll: data.splitAll || true,
		},
		include: {
			consumptionMembers: {
				include: {
					member: true,
				},
			},
			resource: true,
		},
	});

	// Update consumption members
	if (data.memberAmounts !== undefined) {
		await db.consumptionMember.deleteMany({
			where: { consumptionId },
		});
	}

	if (data.memberAmounts && data.memberAmounts.length > 0) {
		await db.consumptionMember.createMany({
			data: data.memberAmounts.map((ma) => ({
				consumptionId,
				memberId: ma.memberId,
				amount: ma.amount,
				weight: ma.weight,
			})),
			skipDuplicates: true,
		});
	}

	revalidatePath(`/group/${updatedConsumption.resource.groupId}`);
	return { consumption: convertToPlainObject(updatedConsumption) };
}

export const updateConsumptionAction = actionClient
	.inputSchema(editConsumptionInputSchema)
	.outputSchema(editConsumptionReturnSchema)
	.action(async ({ parsedInput }) =>
		updateConsumption(parsedInput.consumptionId, parsedInput.consumption),
	);
