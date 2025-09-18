"use server";

import z from "zod";
import { db } from "@/lib/db";
import { convertToPlainObject } from "@/lib/utils";

export async function getActiveMembersForDate(groupId: string, date: Date) {
	const members = await db.member.findMany({
		where: {
			groupId,
			activeFrom: { lte: date },
			OR: [{ activeTo: null }, { activeTo: { gte: date } }],
		},
		orderBy: { name: "asc" },
	});
	return convertToPlainObject(
		members.map((member) => ({
			...member,
			weights: z.record(z.string(), z.number()).parse(member.weights),
		})),
	);
}
