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

	// Get existing consumption members to preserve manually edited amounts
	const existingConsumptionMembers = await db.consumptionMember.findMany({
		where: { consumptionId },
	});

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

	// Prepare consumption members data
	let consumptionMembersData: Array<{
		consumptionId: string;
		memberId: string;
		amount: number;
		isManuallyEdited: boolean;
	}>;

	if (data.memberAmounts && data.memberAmounts.length > 0) {
		// Use manually specified amounts
		consumptionMembersData = data.memberAmounts.map((ma) => ({
			consumptionId,
			memberId: ma.memberId,
			amount: ma.amount,
			isManuallyEdited: ma.isManuallyEdited,
		}));
	} else {
		// Calculate equal split automatically, preserving manually edited amounts
		const amountPerMember = totalCost / data.selectedMembers.length;
		consumptionMembersData = data.selectedMembers.map((memberId) => {
			const existing = existingConsumptionMembers.find(
				(cm) => cm.memberId === memberId,
			);
			return {
				consumptionId,
				memberId,
				amount: existing?.isManuallyEdited
					? Number(existing.amount)
					: amountPerMember,
				isManuallyEdited: existing?.isManuallyEdited || false,
			};
		});
	}

	await db.consumptionMember.createMany({
		data: consumptionMembersData,
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
