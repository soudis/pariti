"use client";

import { useTranslations } from "next-intl";
import type { getCalculatedGroup } from "@/actions/get-group";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

interface MemberSplitDisplayProps {
	group: Awaited<ReturnType<typeof getCalculatedGroup>>;
	sharingMethod: string;
	splitAll?: boolean;
	calculatedMembers: Array<{
		memberId: string;
		amount: number;
	}>;
	totalAmount?: number;
	date?: Date;
}

export function MemberSplitDisplay({
	group,
	sharingMethod,
	splitAll = false,
	calculatedMembers,
	totalAmount,
	date,
}: MemberSplitDisplayProps) {
	const t = useTranslations("expenses");

	// Determine the split text based on sharing method and weight types
	const getSplitText = () => {
		if (sharingMethod === "equal" || !group.weightsEnabled) {
			return t("splitEquallyBetween");
		} else {
			// Find the weight type name
			const weightType = group.weightTypes?.find(
				(wt) => wt.id === sharingMethod,
			);
			if (weightType) {
				return t("splitByWeightTypeBetween", {
					weightType: weightType.name,
				});
			}
			return t("splitEquallyBetween");
		}
	};

	return (
		<div className="space-y-2">
			<p className="text-sm font-medium text-gray-700 dark:text-gray-200">
				{getSplitText()}:
			</p>
			<div className="flex flex-wrap gap-2">
				{splitAll ? (
					calculatedMembers && calculatedMembers.length > 0 ? (
						calculatedMembers
							.filter((member) => member.amount > 0) // Filter out 0 amounts
							.map((member) => (
								<Badge
									key={member.memberId}
									variant="secondary"
									className="text-sm"
								>
									<span className="border-r border-gray-200 dark:border-gray-700 pr-2">
										{group.members.find((m) => m.id === member.memberId)?.name}
									</span>
									<span className="pl-1">
										{formatCurrency(member.amount, group.currency)}
									</span>
								</Badge>
							))
					) : (
						<Badge
							variant="secondary"
							className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
						>
							{t("allActiveMembers")}:{" "}
							{formatCurrency(
								totalAmount ? totalAmount / group.members.length : 0,
								group.currency,
							)}{" "}
							{t("each")}
						</Badge>
					)
				) : (
					calculatedMembers
						.filter((member) => member.amount > 0) // Filter out 0 amounts
						.map((member) => (
							<Badge
								key={member.memberId}
								variant="secondary"
								className="text-sm"
							>
								<span className="border-r border-gray-200 dark:border-gray-700 pr-2">
									{group.members.find((m) => m.id === member.memberId)?.name}
								</span>
								<span className="pl-1">
									{formatCurrency(member.amount, group.currency)}
								</span>
							</Badge>
						))
				)}
			</div>
			{splitAll && date && (
				<p className="text-xs text-blue-600 dark:text-blue-400">
					{t("includesActiveMembers", {
						count: calculatedMembers?.length || group.members.length,
						date: new Date(date).toLocaleDateString(),
					})}
				</p>
			)}
		</div>
	);
}
