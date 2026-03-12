"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	removeSettlementInputSchema,
	removeSettlementReturnSchema,
} from "@/lib/schemas";

async function removeSettlement(settlementId: string) {
	const user = await requireUser();

	const settlement = await db.settlement.findUnique({
		where: { id: settlementId },
		include: { group: true },
	});

	if (!settlement) throw new Error("Settlement not found");

	if (settlement.group.createdByUserId !== user.id) {
		throw new Error("Only the group creator can delete settlements");
	}

	await db.settlement.delete({ where: { id: settlementId } });

	revalidatePath(`/group/${settlement.groupId}`);
	return { success: true };
}

export const removeSettlementAction = actionClient
	.inputSchema(removeSettlementInputSchema)
	.outputSchema(removeSettlementReturnSchema)
	.action(async ({ parsedInput }) =>
		removeSettlement(parsedInput.settlementId),
	);
