"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	type ConsumptionFormData,
	createConsumptionInputSchema,
	createConsumptionReturnSchema,
} from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

async function createConsumption(data: ConsumptionFormData) {
	const resource = await db.resource.findUnique({
		where: { id: data.resourceId },
		include: { group: true },
	});

	if (!resource) throw new Error("Resource not found");

	const totalCost = data.isUnitAmount
		? data.amount * Number(resource.unitPrice || 0)
		: data.amount;

	// Prepare consumption members data
	let consumptionMembersData: Array<{
		memberId: string;
		amount: number;
		isManuallyEdited: boolean;
	}>;

	if (data.memberAmounts && data.memberAmounts.length > 0) {
		// Use manually specified amounts
		consumptionMembersData = data.memberAmounts.map((ma) => ({
			memberId: ma.memberId,
			amount: ma.amount,
			isManuallyEdited: ma.isManuallyEdited,
		}));
	} else {
		// Calculate equal split automatically
		const amountPerMember = totalCost / data.selectedMembers.length;
		consumptionMembersData = data.selectedMembers.map((memberId) => ({
			memberId,
			amount: amountPerMember,
			isManuallyEdited: false,
		}));
	}

	const consumption = await db.consumption.create({
		data: {
			resourceId: data.resourceId,
			amount: data.amount,
			isUnitAmount: data.isUnitAmount,
			date: data.date,
			description: data.description,
			consumptionMembers: {
				create: consumptionMembersData,
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
	return { consumption: convertToPlainObject(consumption) };
}

export const createConsumptionAction = actionClient
	.inputSchema(createConsumptionInputSchema)
	.outputSchema(createConsumptionReturnSchema)
	.action(async ({ parsedInput }) =>
		createConsumption(parsedInput.consumption),
	);
