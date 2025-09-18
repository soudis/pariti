"use server";

import { revalidatePath } from "next/cache";
import { getCalculatedGroup } from "@/actions/get-group";
import { db } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import {
	createSettlementInputSchema,
	createSettlementReturnSchema,
	type SettlementFormData,
} from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

async function createSettlement(groupId: string, data: SettlementFormData) {
	const group = await getCalculatedGroup(groupId);

	if (!group) throw new Error("Group not found");

	// Generate settlement transactions based on type
	const transactions = generateSettlementTransactions(
		{
			...group.members.reduce((acc, member) => {
				acc.set(member.id, member.balance);
				return acc;
			}, new Map<string, number>()),
			...group.resources.reduce((acc, resource) => {
				acc.set(resource.id, resource.balance);
				return acc;
			}, new Map<string, number>()),
		},
		data.settlementType,
		data.centerId,
	);

	if (transactions.length === 0) {
		throw new Error("No settlements needed - all balances are zero");
	}

	// Create settlement record
	const settlement = await db.settlement.create({
		data: {
			groupId: groupId,
			title: data.title,
			description: data.description,
			settlementMembers: {
				create: transactions.map((transaction) => ({
					fromMemberId:
						transaction.fromType === "member" ? transaction.fromId : null,
					toMemberId: transaction.toType === "member" ? transaction.toId : null,
					fromResourceId:
						transaction.fromType === "resource" ? transaction.fromId : null,
					toResourceId:
						transaction.toType === "resource" ? transaction.toId : null,
					amount: transaction.amount,
				})),
			},
		},
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
	});

	revalidatePath(`/group/${groupId}`);
	return { settlement: convertToPlainObject(settlement) };
}

export const createSettlementAction = actionClient
	.inputSchema(createSettlementInputSchema)
	.outputSchema(createSettlementReturnSchema)
	.action(async ({ parsedInput }) =>
		createSettlement(parsedInput.groupId, parsedInput.settlement),
	);

// Helper function to generate settlement transactions
function generateSettlementTransactions(
	balances: Map<string, number>,
	settlementType: "optimized" | "around_member" | "around_resource",
	centerId?: string,
) {
	const transactions: Array<{
		fromType: "member" | "resource";
		fromId: string;
		toType: "member" | "resource";
		toId: string;
		amount: number;
	}> = [];

	// Separate positive and negative balances
	const creditors: Array<{ key: string; amount: number }> = [];
	const debtors: Array<{ key: string; amount: number }> = [];

	for (const [key, amount] of balances.entries()) {
		if (amount > 0.01) {
			creditors.push({ key, amount });
		} else if (amount < -0.01) {
			debtors.push({ key, amount: Math.abs(amount) });
		}
	}

	if (settlementType === "optimized") {
		// Optimized settlement: minimize number of transactions
		creditors.sort((a, b) => b.amount - a.amount);
		debtors.sort((a, b) => b.amount - a.amount);

		let creditorIndex = 0;
		let debtorIndex = 0;

		while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
			const creditor = creditors[creditorIndex];
			const debtor = debtors[debtorIndex];

			const amount = Math.min(creditor.amount, debtor.amount);

			if (amount > 0.01) {
				const [fromType, fromId] = parseKey(debtor.key);
				const [toType, toId] = parseKey(creditor.key);

				transactions.push({
					fromType,
					fromId,
					toType,
					toId,
					amount,
				});

				creditor.amount -= amount;
				debtor.amount -= amount;
			}

			if (creditor.amount < 0.01) creditorIndex++;
			if (debtor.amount < 0.01) debtorIndex++;
		}
	} else if (settlementType === "around_member" && centerId) {
		// All transactions go through one member
		const centerKey = `member_${centerId}`;
		const centerBalance = balances.get(centerKey) || 0;

		if (centerBalance > 0) {
			// Center member is owed money, others pay them
			for (const debtor of debtors) {
				if (debtor.key !== centerKey) {
					const [fromType, fromId] = parseKey(debtor.key);
					transactions.push({
						fromType,
						fromId,
						toType: "member",
						toId: centerId,
						amount: debtor.amount,
					});
				}
			}
		} else if (centerBalance < 0) {
			// Center member owes money, they pay others
			for (const creditor of creditors) {
				if (creditor.key !== centerKey) {
					const [toType, toId] = parseKey(creditor.key);
					transactions.push({
						fromType: "member",
						fromId: centerId,
						toType,
						toId,
						amount: creditor.amount,
					});
				}
			}
		}
	} else if (settlementType === "around_resource" && centerId) {
		// All transactions go through one resource
		const centerKey = `resource_${centerId}`;
		const centerBalance = balances.get(centerKey) || 0;

		if (centerBalance > 0) {
			// Resource is owed money, members pay it
			for (const debtor of debtors) {
				if (debtor.key !== centerKey) {
					const [fromType, fromId] = parseKey(debtor.key);
					transactions.push({
						fromType,
						fromId,
						toType: "resource",
						toId: centerId,
						amount: debtor.amount,
					});
				}
			}
		} else if (centerBalance < 0) {
			// Resource owes money, it pays members
			for (const creditor of creditors) {
				if (creditor.key !== centerKey) {
					const [toType, toId] = parseKey(creditor.key);
					transactions.push({
						fromType: "resource",
						fromId: centerId,
						toType,
						toId,
						amount: creditor.amount,
					});
				}
			}
		}
	}

	return transactions;
}

// Helper function to parse balance key
function parseKey(key: string): ["member" | "resource", string] {
	const [type, id] = key.split("_");
	return [type as "member" | "resource", id];
}
