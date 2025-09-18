import { Decimal } from "decimal.js";

export interface MemberAmount {
	memberId: string;
	amount: number;
	weight: number;
	isManuallyEdited: boolean;
}

export interface Member {
	id: string;
	weight: number; // Legacy field
	weights?: Record<string, number>; // New multiple weights field
}

export interface MemberWeight {
	memberId: string;
	weight: number;
}

/**
 * Redistributes amounts among members, preserving manually edited amounts
 * and ensuring the total matches the target amount
 */
export function redistributeAmounts(
	members: Member[],
	memberAmounts: MemberAmount[],
	totalAmount: number,
	weightsEnabled: boolean,
	sharingMethod: "equal" | "weights" = "equal",
	weightTypeId?: string,
): MemberAmount[] {
	// Separate manually edited and automatic members
	const manuallyEditedAmounts = memberAmounts.filter(
		(ma) => ma.isManuallyEdited,
	);
	const automaticAmounts = memberAmounts.filter((ma) => !ma.isManuallyEdited);

	// Calculate total of manually edited amounts
	const totalManualAmount = manuallyEditedAmounts.reduce(
		(sum, ma) => sum + ma.amount,
		0,
	);

	// Calculate remaining amount to redistribute
	const remainingAmount = totalAmount - totalManualAmount;

	// If no automatic members, return as is
	if (automaticAmounts.length === 0) {
		return memberAmounts;
	}

	// Redistribute remaining amount among automatic members
	let redistributedAmounts: MemberAmount[];

	if (sharingMethod === "weights") {
		// Redistribute based on custom weights from MemberAmount objects
		const totalWeight = automaticAmounts.reduce(
			(sum, ma) => sum + ma.weight,
			0,
		);

		redistributedAmounts = automaticAmounts.map((ma) => {
			const redistributedAmount =
				totalWeight > 0
					? (remainingAmount * ma.weight) / totalWeight
					: remainingAmount / automaticAmounts.length;

			return {
				...ma,
				amount: redistributedAmount,
			};
		});
	} else if (weightsEnabled && sharingMethod === "equal") {
		// Redistribute based on member weights (legacy behavior or specific weight type)
		const automaticMembers = automaticAmounts.map((ma) => {
			const member = members.find((m) => m.id === ma.memberId);
			let weight = 1; // Default to 1 for "Equally"

			// If a specific weight type is selected, use that weight
			if (
				weightTypeId &&
				member?.weights &&
				typeof member.weights === "object" &&
				member.weights[weightTypeId]
			) {
				weight = Number(member.weights[weightTypeId]) || 1;
			} else if (!weightTypeId) {
				// Legacy behavior: use member's default weight
				weight = member?.weight || 1;
			}

			return {
				...ma,
				weight: weight,
			};
		});

		const totalWeight = automaticMembers.reduce(
			(sum, member) => sum + member.weight,
			0,
		);

		redistributedAmounts = automaticAmounts.map((ma) => {
			const member = automaticMembers.find((m) => m.memberId === ma.memberId);
			const redistributedAmount =
				totalWeight > 0
					? (remainingAmount * (member?.weight || 1)) / totalWeight
					: remainingAmount / automaticAmounts.length;

			return {
				...ma,
				amount: redistributedAmount,
			};
		});
	} else {
		// Redistribute equally
		const equalShare =
			automaticAmounts.length > 0
				? remainingAmount / automaticAmounts.length
				: 0;

		redistributedAmounts = automaticAmounts.map((ma) => ({
			...ma,
			amount: equalShare,
		}));
	}

	// Combine manually edited and redistributed amounts
	return [...manuallyEditedAmounts, ...redistributedAmounts];
}

/**
 * Converts Prisma Decimal amounts to numbers for redistribution
 */
export function convertDecimalAmounts(
	memberAmounts: Array<{
		memberId: string;
		amount: Decimal;
		weight: Decimal;
		isManuallyEdited: boolean;
	}>,
): MemberAmount[] {
	return memberAmounts.map((ma) => ({
		memberId: ma.memberId,
		amount: Number(ma.amount),
		weight: Number(ma.weight),
		isManuallyEdited: ma.isManuallyEdited,
	}));
}

/**
 * Converts numbers back to Decimal for database storage
 */
export function convertToDecimalAmounts(memberAmounts: MemberAmount[]): Array<{
	memberId: string;
	amount: Decimal;
	weight: Decimal;
	isManuallyEdited: boolean;
}> {
	return memberAmounts.map((ma) => ({
		memberId: ma.memberId,
		amount: new Decimal(ma.amount),
		weight: new Decimal(ma.weight),
		isManuallyEdited: ma.isManuallyEdited,
	}));
}
