import { Decimal } from "decimal.js";

export interface MemberAmount {
	memberId: string;
	amount: number;
	isManuallyEdited: boolean;
}

export interface Member {
	id: string;
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

	if (weightsEnabled) {
		// Redistribute based on weights
		const automaticMembers = automaticAmounts.map((ma) => {
			const member = members.find((m) => m.id === ma.memberId);
			return {
				...ma,
				weight: member?.weight || 1,
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
		isManuallyEdited: boolean;
	}>,
): MemberAmount[] {
	return memberAmounts.map((ma) => ({
		memberId: ma.memberId,
		amount: Number(ma.amount),
		isManuallyEdited: ma.isManuallyEdited,
	}));
}

/**
 * Converts numbers back to Decimal for database storage
 */
export function convertToDecimalAmounts(memberAmounts: MemberAmount[]): Array<{
	memberId: string;
	amount: Decimal;
	isManuallyEdited: boolean;
}> {
	return memberAmounts.map((ma) => ({
		memberId: ma.memberId,
		amount: new Decimal(ma.amount),
		isManuallyEdited: ma.isManuallyEdited,
	}));
}
