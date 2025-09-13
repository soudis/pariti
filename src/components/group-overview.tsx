"use client";

import type { Expense, Group, Member } from "@prisma/client";
import { DollarSign, Plus, Share2, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { AddMemberDialog } from "@/components/add-member-dialog";
import { CreateConsumptionDialog } from "@/components/create-consumption-dialog";
import { CreateResourceDialog } from "@/components/create-resource-dialog";
import { CreateSettlementDialog } from "@/components/create-settlement-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GroupOverviewProps {
	group: Group & { expenses: Expense[]; members: Member[] };
	resources: any[];
}

export function GroupOverview({ group, resources }: GroupOverviewProps) {
	const [copied, setCopied] = useState(false);
	const t = useTranslations("group");
	const locale = useLocale();

	const totalExpenses = group.expenses.reduce(
		(sum, expense) => sum + Number(expense.amount),
		0,
	);
	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/${locale}/group/${group.id}`
			: `/${locale}/group/${group.id}`;

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
					<div>
						<CardTitle className="text-2xl">{group.name}</CardTitle>
						{group.description && (
							<p className="text-gray-600 dark:text-gray-300 mt-1">
								{group.description}
							</p>
						)}
					</div>
					<Button onClick={copyToClipboard} variant="outline" size="sm">
						<Share2 className="w-4 h-4 mr-2" />
						{copied ? t("copied") : t("shareGroup")}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-6">
					<div className="text-center">
						<div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-2">
							<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
						</div>
						<p className="text-sm text-gray-600 dark:text-gray-300">
							{t("members")}
						</p>
						<p className="text-lg font-semibold">{group.members.length}</p>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-2">
							<DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
						</div>
						<p className="text-sm text-gray-600 dark:text-gray-300">
							{t("totalExpenses")}
						</p>
						<p className="text-lg font-semibold">${totalExpenses.toFixed(2)}</p>
					</div>
					<div className="text-center col-span-2 sm:col-span-1">
						<div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-2">
							<Badge className="w-4 h-4 text-purple-600 dark:text-purple-400" />
						</div>
						<p className="text-sm text-gray-600 dark:text-gray-300">
							{t("expenses")}
						</p>
						<p className="text-lg font-semibold">{group.expenses.length}</p>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
						{t("quickActions")}
					</h3>

					{/* Primary Actions - Most Used */}
					<div className="grid grid-cols-2 gap-2">
						<AddExpenseDialog group={group}>
							<Button variant="default" size="sm" className="w-full">
								<Plus className="w-4 h-4 mr-2" />
								{t("addExpense")}
							</Button>
						</AddExpenseDialog>

						<CreateConsumptionDialog
							groupId={group.id}
							resources={resources}
							members={group.members}
						>
							<Button variant="default" size="sm" className="w-full">
								<Plus className="w-4 h-4 mr-2" />
								{t("addConsumption")}
							</Button>
						</CreateConsumptionDialog>
					</div>

					{/* Secondary Actions */}
					<div className="grid grid-cols-3 gap-2">
						<AddMemberDialog groupId={group.id}>
							<Button variant="outline" size="sm" className="w-full">
								<Plus className="w-4 h-4 mr-2" />
								{t("addMember")}
							</Button>
						</AddMemberDialog>

						<CreateResourceDialog groupId={group.id}>
							<Button variant="outline" size="sm" className="w-full">
								<Plus className="w-4 h-4 mr-2" />
								{t("addResource")}
							</Button>
						</CreateResourceDialog>

						<CreateSettlementDialog
							groupId={group.id}
							members={group.members}
							resources={resources}
						>
							<Button variant="outline" size="sm" className="w-full">
								<Plus className="w-4 h-4 mr-2" />
								{t("generateSettlement")}
							</Button>
						</CreateSettlementDialog>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
