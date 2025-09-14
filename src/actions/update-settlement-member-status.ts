"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	updateSettlementMemberStatusInputSchema,
	updateSettlementMemberStatusReturnSchema,
} from "@/lib/schemas";

async function updateSettlementMemberStatus(
	settlementMemberId: string,
	status: "open" | "completed",
) {
	const settlementMember = await db.settlementMember.findUnique({
		where: { id: settlementMemberId },
		include: {
			settlement: {
				include: {
					settlementMembers: true,
				},
			},
		},
	});

	if (!settlementMember) throw new Error("Settlement member not found");

	// Update the specific settlement member status
	await db.settlementMember.update({
		where: { id: settlementMemberId },
		data: { status },
	});

	// Check if all settlement members are now completed
	const allCompleted = settlementMember.settlement.settlementMembers.every(
		(sm) =>
			sm.status === "completed" ||
			(sm.id === settlementMemberId && status === "completed"),
	);

	// Update settlement status if all members are completed
	if (allCompleted) {
		await db.settlement.update({
			where: { id: settlementMember.settlementId },
			data: { status: "completed" },
		});
	}

	revalidatePath(`/group/${settlementMember.settlement.groupId}`);
	return { success: true };
}

export const updateSettlementMemberStatusAction = actionClient
	.inputSchema(updateSettlementMemberStatusInputSchema)
	.outputSchema(updateSettlementMemberStatusReturnSchema)
	.action(async ({ parsedInput }) =>
		updateSettlementMemberStatus(
			parsedInput.settlementMemberId,
			parsedInput.status,
		),
	);
