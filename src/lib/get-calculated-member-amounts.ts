import type { getGroup } from "@/actions/get-group";

export interface MemberAmount {
	memberId: string;
	amount?: number | null;
	weight?: number | null;
}

export interface CalculatedMemberAmount {
	memberId: string;
	amount: number;
	weight: number;
}

/**
 * Redistributes amounts among members, preserving manually edited amounts
 * and ensuring the total matches the target amount
 */
export function getCalculatedMemberAmounts(
	group: Pick<Awaited<ReturnType<typeof getGroup>>, "members">,
	memberAmounts: MemberAmount[],
	{
		amount,
		sharingMethod,
		splitAll,
		date,
	}: Pick<
		Awaited<ReturnType<typeof getGroup>>["expenses"][number],
		"amount" | "sharingMethod" | "splitAll" | "date"
	>,
	unitPrice?: number,
): CalculatedMemberAmount[] {
	const getWeight = (memberId: string) => {
		if (sharingMethod === "equal") {
			return 1;
		}
		return (
			group.members.find((m) => m.id === memberId)?.weights?.[sharingMethod] ??
			1
		);
	};

	const totalAmount = Number(amount) * (unitPrice ?? 1);

	if (splitAll) {
		const activeMembers = group.members.filter((member) => {
			return (
				(!member.activeFrom || member.activeFrom <= date) &&
				(!member.activeTo || member.activeTo >= date)
			);
		});
		const weights = activeMembers.map((member) => getWeight(member.id));
		const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
		return activeMembers.map((member) => {
			const weight = getWeight(member.id);
			return {
				memberId: member.id,
				amount: (Number(totalAmount) / totalWeight) * weight,
				weight: weight,
			};
		});
	}

	// Separate manually edited and automatic members
	const manuallyEditedAmounts = memberAmounts.filter((ma) => !!ma.amount);
	const automaticAmounts = memberAmounts.filter((ma) => !ma.amount);

	// Calculate total of manually edited amounts
	const totalManualAmount = manuallyEditedAmounts.reduce(
		(sum, ma) => sum + (ma.amount || 0),
		0,
	);

	// Calculate remaining amount to redistribute
	const remainingAmount = Number(totalAmount) - totalManualAmount;

	// If no automatic members, return as is
	if (automaticAmounts.length === 0) {
		return memberAmounts.map((ma) => ({
			memberId: ma.memberId,
			amount: ma.amount || 0,
			weight: ma.weight || 0,
		}));
	}

	const weights = automaticAmounts.map(
		(ma) => ma.weight ?? getWeight(ma.memberId),
	);
	const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

	const calculatedMemberAmounts = automaticAmounts.map((ma) => {
		const weight = ma.weight ?? getWeight(ma.memberId);
		const amount =
			totalWeight > 0
				? (remainingAmount * weight) / totalWeight
				: remainingAmount / automaticAmounts.length;
		return {
			...ma,
			amount: amount,
			weight: weight,
		};
	});

	// Combine manually edited and redistributed amounts
	return [
		...manuallyEditedAmounts.map((ma) => ({
			memberId: ma.memberId,
			amount: ma.amount || 0,
			weight: ma.weight || 0,
		})),
		...calculatedMemberAmounts,
	].filter((ma) => ma.amount > 0);
}
