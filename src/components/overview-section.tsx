"use client";

import type { Expense, Group, Member } from "@prisma/client";
import { DollarSign, Package, Plus, Receipt, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { getGroup } from "@/actions";
import type { getCalculatedGroup } from "@/actions/get-group";
import { ConsumptionDialog } from "@/components/consumption-dialog";
import { ExpenseDialog } from "@/components/expense-dialog";
import { MemberDialog } from "@/components/member-dialog";
import { ResourceDialog } from "@/components/resource-dialog";
import { SettlementDialog } from "@/components/settlement-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";

interface OverviewSectionProps {
	group: Awaited<ReturnType<typeof getCalculatedGroup>>;
	cutoffDate: Date | null;
}

export function OverviewSection({
	group,
	group: { resources },
	cutoffDate,
}: OverviewSectionProps) {
	const t = useTranslations("group");

	// Filter expenses and consumptions based on cutoff date
	const filteredExpenses = useMemo(
		() =>
			cutoffDate
				? group.expenses.filter(
						(expense) => new Date(expense.date) >= cutoffDate,
					)
				: group.expenses,
		[group.expenses, cutoffDate],
	);

	const filteredConsumptions = useMemo(
		() =>
			cutoffDate
				? group.resources
						.flatMap((resource) => resource.consumptions)
						.filter((consumption) => new Date(consumption.date) >= cutoffDate)
				: group.resources.flatMap((resource) => resource.consumptions),
		[group.resources, cutoffDate],
	);

	const totalExpenses = useMemo(
		() =>
			filteredExpenses.reduce(
				(sum, expense) => sum + Number(expense.amount),
				0,
			),
		[filteredExpenses],
	);
	const totalConsumptions = useMemo(
		() =>
			filteredConsumptions.reduce(
				(sum, consumption) => sum + Number(consumption.amount),
				0,
			),
		[filteredConsumptions],
	);

	return (
		<div className="space-y-6">
			{/* Statistics */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">{t("overview")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
				</CardContent>
			</Card>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">{t("quickActions")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* Primary Actions - Most Used */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<ExpenseDialog group={group}>
								<Button variant="default" size="sm" className="w-full text-sm">
									<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
									<span className="truncate">{t("addExpense")}</span>
								</Button>
							</ExpenseDialog>

							<ConsumptionDialog group={group}>
								<Button variant="default" size="sm" className="w-full text-sm">
									<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
									<span className="truncate">{t("addConsumption")}</span>
								</Button>
							</ConsumptionDialog>
						</div>

						{/* Secondary Actions */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<MemberDialog group={group} weightsEnabled={group.weightsEnabled}>
								<Button variant="outline" size="sm" className="w-full text-sm">
									<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
									<span className="truncate">{t("addMember")}</span>
								</Button>
							</MemberDialog>

							<ResourceDialog groupId={group.id}>
								<Button variant="outline" size="sm" className="w-full text-sm">
									<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
									<span className="truncate">{t("addResource")}</span>
								</Button>
							</ResourceDialog>

							<SettlementDialog
								groupId={group.id}
								members={group.members}
								resources={resources}
							>
								<Button variant="outline" size="sm" className="w-full text-sm">
									<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
									<span className="truncate">{t("generateSettlement")}</span>
								</Button>
							</SettlementDialog>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
