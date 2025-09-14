"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function removeExpense(id: string) {
	const expense = await db.expense.findUnique({
		where: { id },
		include: { group: true },
	});

	if (!expense) return null;

	await db.expense.delete({ where: { id } });

	revalidatePath(`/group/${expense.groupId}`);
	return expense;
}
