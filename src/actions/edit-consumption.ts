"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ConsumptionFormData } from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

export async function editConsumption(id: string, data: ConsumptionFormData) {
	const consumption = await db.consumption.findUnique({
		where: { id },
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
		where: { id },
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
		where: { consumptionId: id },
	});

	await db.consumptionMember.createMany({
		data: data.selectedMembers.map((memberId) => ({
			consumptionId: id,
			memberId,
			amount: amountPerMember,
		})),
	});

	revalidatePath(`/group/${consumption.resource.groupId}`);
	return convertToPlainObject(updatedConsumption);
}
