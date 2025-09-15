"use client";

import type { Expense, Group, Member } from "@prisma/client";
import {
	DollarSign,
	Package,
	Plus,
	Receipt,
	Share2,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { getGroup } from "@/actions";
import { ConsumptionDialog } from "@/components/consumption-dialog";
import { ExpenseDialog } from "@/components/expense-dialog";
import { MemberDialog } from "@/components/member-dialog";
import { ResourceDialog } from "@/components/resource-dialog";
import { SettlementDialog } from "@/components/settlement-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";

interface GroupOverviewProps {
	group: Group & { expenses: Expense[]; members: Member[] };
	resources: Awaited<ReturnType<typeof getGroup>>["resources"];
	consumptions: Awaited<
		ReturnType<typeof getGroup>
	>["resources"][number]["consumptions"];
	cutoffDate: Date | null;
}

export function GroupOverview({
	group,
	resources,
	consumptions,
	cutoffDate,
}: GroupOverviewProps) {
	const [copied, setCopied] = useState(false);
	const t = useTranslations("group");

	// Filter expenses and consumptions based on cutoff date
	const filteredExpenses = cutoffDate
		? group.expenses.filter((expense) => new Date(expense.date) >= cutoffDate)
		: group.expenses;

	const filteredConsumptions = cutoffDate
		? consumptions.filter(
				(consumption) => new Date(consumption.date) >= cutoffDate,
			)
		: consumptions;

	const totalExpenses = filteredExpenses.reduce(
		(sum, expense) => sum + Number(expense.amount),
		0,
	);
	const totalConsumptions = filteredConsumptions.reduce(
		(sum, consumption) => sum + Number(consumption.amount),
		0,
	);
	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/group/${group.id}`
			: `/group/${group.id}`;

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy:", error);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="min-w-0 flex-1">
						<CardTitle className="text-xl sm:text-2xl truncate">
							{group.name}
						</CardTitle>
						{group.description && (
							<p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
								{group.description}
							</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<Button
							onClick={copyToClipboard}
							variant="outline"
							size="sm"
							className="flex-shrink-0"
						>
							<Share2 className="w-4 h-4 mr-2" />
							<span className="hidden sm:inline">
								{copied ? t("copied") : t("shareGroup")}
							</span>
							<span className="sm:hidden">
								{copied ? t("copied") : "Share"}
							</span>
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 mb-6">
					<div className="text-center">
						<div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-2">
							<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
						</div>
						<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
							{t("members")}
						</p>
						<p className="text-base sm:text-lg font-semibold">
							{group.members.length}
						</p>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-2">
							<Receipt className="w-4 h-4 text-green-600 dark:text-green-400" />
						</div>
						<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
							{t("expenses")}
						</p>
						<p className="text-base sm:text-lg font-semibold">
							{filteredExpenses.length} (
							{formatCurrency(totalExpenses, group.currency)})
						</p>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-2">
							<Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
						</div>
						<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
							{t("resources")}
						</p>
						<p className="text-base sm:text-lg font-semibold">
							{resources.length}
						</p>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full mx-auto mb-2">
							<DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
						</div>
						<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
							{t("consumptions")}
						</p>
						<p className="text-base sm:text-lg font-semibold">
							{filteredConsumptions.length} (
							{formatCurrency(totalConsumptions, group.currency)})
						</p>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
						{t("quickActions")}
					</h3>

					{/* Primary Actions - Most Used */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						<ExpenseDialog group={group}>
							<Button
								variant="default"
								size="sm"
								className="w-full text-xs sm:text-sm"
							>
								<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
								<span className="truncate">{t("addExpense")}</span>
							</Button>
						</ExpenseDialog>

						<ConsumptionDialog
							groupId={group.id}
							resources={resources}
							members={group.members}
						>
							<Button
								variant="default"
								size="sm"
								className="w-full text-xs sm:text-sm"
							>
								<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
								<span className="truncate">{t("addConsumption")}</span>
							</Button>
						</ConsumptionDialog>
					</div>

					{/* Secondary Actions */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
						<MemberDialog
							groupId={group.id}
							weightsEnabled={group.weightsEnabled}
						>
							<Button
								variant="outline"
								size="sm"
								className="w-full text-xs sm:text-sm"
							>
								<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
								<span className="truncate">{t("addMember")}</span>
							</Button>
						</MemberDialog>

						<ResourceDialog groupId={group.id}>
							<Button
								variant="outline"
								size="sm"
								className="w-full text-xs sm:text-sm"
							>
								<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
								<span className="truncate">{t("addResource")}</span>
							</Button>
						</ResourceDialog>

						<SettlementDialog
							groupId={group.id}
							members={group.members}
							resources={resources}
						>
							<Button
								variant="outline"
								size="sm"
								className="w-full text-xs sm:text-sm"
							>
								<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
								<span className="truncate">{t("generateSettlement")}</span>
							</Button>
						</SettlementDialog>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
