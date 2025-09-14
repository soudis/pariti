"use server";

import { db } from "@/lib/db";
import { convertToPlainObject } from "@/lib/utils";

export async function getGroup(id: string) {
	const group = await db.group.findUnique({
		where: { id },
		include: {
			members: true,
			expenses: {
				include: {
					paidBy: true,
					expenseMembers: {
						include: {
							member: true,
						},
					},
				},
				orderBy: { date: "desc" },
			},
			resources: {
				include: {
					consumptions: {
						include: {
							consumptionMembers: {
								include: {
									member: true,
								},
							},
						},
						orderBy: { date: "desc" },
					},
				},
				orderBy: { createdAt: "desc" },
			},
			settlements: {
				include: {
					settlementMembers: {
						include: {
							fromMember: true,
							toMember: true,
							fromResource: true,
							toResource: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!group) throw new Error("Group not found");

	// Convert all Decimal values to numbers
	return convertToPlainObject(group);
}
