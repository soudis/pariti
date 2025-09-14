"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function updateSettlementMemberStatus(
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

	if (!settlementMember) return null;

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
	return settlementMember;
}
