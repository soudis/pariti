"use client";

import {
	Calendar,
	DollarSign,
	Edit,
	Eye,
	EyeOff,
	Plus,
	ReceiptEuro,
	Repeat,
	Search,
	Trash2,
	User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useQueryState } from "nuqs";
import { useId, useState } from "react";
import { removeExpenseAction } from "@/actions";
import type { getCalculatedGroup } from "@/actions/get-group";
import { ExpenseDialog } from "@/components/expense-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/currency";
import { handleActionErrors } from "@/lib/utils";

interface ExpensesSectionProps {
	group: Awaited<ReturnType<typeof getCalculatedGroup>>;
	cutoffDate: Date | null;
}

export function ExpensesSection({
	group,
	group: { expenses },
	cutoffDate,
}: ExpensesSectionProps) {
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [filterText, setFilterText] = useState("");
	const [showHiddenExpenses, setShowHiddenExpenses] = useQueryState(
		"showHiddenExpenses",
		{
			shallow: false,
		},
	);
	const t = useTranslations("expenses");
	const showHiddenId = useId();

	const { executeAsync: removeExpense } = useAction(removeExpenseAction);

	if (!group) {
		return null;
	}

	// Use provided expenses or fall back to group expenses
	const allExpenses =
		expenses ||
		group.expenses.map((expense) => ({
			...expense,
			effectiveMembers: [],
		}));

	// Filter expenses based on cutoff date, toggle, and search text
	const filteredExpenses = allExpenses.filter((expense) => {
		// Apply cutoff date filter
		if (cutoffDate && showHiddenExpenses !== "true") {
			if (new Date(expense.date) < cutoffDate) {
				return false;
			}
		}

		// Apply text filter
		if (filterText.trim()) {
			const searchText = filterText.toLowerCase();
			const matchesTitle = expense.title.toLowerCase().includes(searchText);
			const matchesDescription =
				expense.description?.toLowerCase().includes(searchText) || false;
			const matchesPayer = expense.paidBy.name
				.toLowerCase()
				.includes(searchText);

			return matchesTitle || matchesDescription || matchesPayer;
		}

		return true;
	});

	const displayExpenses = filteredExpenses;

	const handleDeleteExpense = async (expenseId: string) => {
		setDeletingId(expenseId);
		await handleActionErrors(await removeExpense({ expenseId }));
		setDeletingId(null);
	};

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(date));
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<CardTitle className="flex items-center gap-2">
						<ReceiptEuro className="w-5 h-5" />
						{t("title")}
					</CardTitle>
					<div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
						{cutoffDate && (
							<div className="flex items-center gap-2">
								<Label htmlFor={showHiddenId} className="text-sm">
									{showHiddenExpenses ? (
										<Eye className="w-4 h-4" />
									) : (
										<EyeOff className="w-4 h-4" />
									)}
								</Label>
								<Switch
									id={showHiddenId}
									checked={showHiddenExpenses === "true"}
									onCheckedChange={(checked) =>
										setShowHiddenExpenses(checked ? "true" : "false")
									}
									disabled={false}
								/>
								<span className="text-sm text-gray-600 dark:text-gray-300">
									{t("showHidden")}
								</span>
							</div>
						)}
						<ExpenseDialog group={group}>
							<Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
								<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
								<span className="truncate">{t("addExpense")}</span>
							</Button>
						</ExpenseDialog>
					</div>
				</div>
				{/* Search Filter */}
				<div className="mt-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<Input
							type="text"
							placeholder={t("searchPlaceholder")}
							value={filterText}
							onChange={(e) => setFilterText(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{displayExpenses.length === 0 ? (
					<div className="text-center py-8 text-gray-500 dark:text-gray-400">
						<DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p>{t("noExpenses")}</p>
						<p className="text-sm">{t("noExpensesDescription")}</p>
					</div>
				) : (
					<div className="space-y-4">
						{displayExpenses.map((expense) => (
							<div
								key={`${expense.id}-${expense.date}`}
								className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
							>
								{/* Header with title, recurring badge, and action buttons */}
								<div className="flex items-start justify-between mb-3">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<h3 className="font-medium text-lg">{expense.title}</h3>
											{expense.isRecurring && (
												<Badge
													variant="outline"
													className="text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300 flex-shrink-0"
												>
													<Repeat className="w-3 h-3 mr-1" />
													{t(`recurring.${expense.recurringType}`)}
												</Badge>
											)}
										</div>
										{expense.description && (
											<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
												{expense.description}
											</p>
										)}
									</div>
									{/* Action buttons - aligned to top right */}
									<div className="flex items-start gap-2 flex-shrink-0 ml-2">
										{(!cutoffDate || new Date(expense.date) >= cutoffDate) && (
											<ExpenseDialog
												group={group}
												expense={{
													...expense,
													amount: Number(expense.amount),
													sharingMethod:
														(expense.sharingMethod as "equal" | "weights") ||
														"equal",
													recurringType: expense.recurringType as
														| "weekly"
														| "monthly"
														| "yearly"
														| undefined,
													recurringStartDate:
														expense.recurringStartDate ?? undefined,
													selectedMembers: expense.splitAll
														? []
														: expense.expenseMembers.map((em) => em.memberId),
													memberAmounts: expense.expenseMembers.map((em) => ({
														memberId: em.memberId,
														amount: Number(em.amount),
														weight: Number(em.weight),
													})),
												}}
											>
												<Button
													variant="ghost"
													size="sm"
													className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
												>
													<Edit className="w-4 h-4" />
												</Button>
											</ExpenseDialog>
										)}
										{(!cutoffDate || new Date(expense.date) >= cutoffDate) && (
											<ConfirmDeleteDialog
												title={t("deleteExpense")}
												description={t("deleteExpenseDescription")}
												itemName={expense.title}
												onConfirm={() => handleDeleteExpense(expense.id)}
											>
												<Button
													variant="ghost"
													size="sm"
													disabled={deletingId === expense.id}
													className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</ConfirmDeleteDialog>
										)}
									</div>
								</div>

								{/* Amount badge - separate line on mobile, inline on desktop */}
								<div className="flex justify-between items-center mb-3">
									<Badge variant="secondary" className="text-sm">
										{formatCurrency(Number(expense.amount), group.currency)}
									</Badge>
								</div>

								<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
									<div className="flex items-center gap-1">
										<User className="w-4 h-4" />
										<span>
											{t("paidBy")} {expense.paidBy.name}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<Calendar className="w-4 h-4" />
										<span>{formatDate(expense.date)}</span>
									</div>
								</div>

								<div className="space-y-2">
									<p className="text-sm font-medium text-gray-700 dark:text-gray-200">
										{t("splitBetween")}:
									</p>
									<div className="flex flex-wrap gap-2">
										{expense.splitAll ? (
											expense.calculatedExpenseMembers &&
											expense.calculatedExpenseMembers.length > 0 ? (
												expense.calculatedExpenseMembers.map((member) => (
													<Badge
														key={member.memberId}
														variant="outline"
														className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
													>
														{
															group.members.find(
																(m) => m.id === member.memberId,
															)?.name
														}
														: {formatCurrency(member.amount, group.currency)}
													</Badge>
												))
											) : (
												<Badge
													variant="secondary"
													className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
												>
													{t("allActiveMembers")}: $
													{(
														Number(expense.amount) / group.members.length
													).toFixed(2)}{" "}
													{t("each")}
												</Badge>
											)
										) : (
											expense.calculatedExpenseMembers.map((expenseMember) => (
												<Badge
													key={expenseMember.memberId}
													variant="outline"
													className="text-xs"
												>
													{
														group.members.find(
															(m) => m.id === expenseMember.memberId,
														)?.name
													}
													: ${Number(expenseMember.amount).toFixed(2)}
												</Badge>
											))
										)}
									</div>
									{expense.splitAll && (
										<p className="text-xs text-blue-600 dark:text-blue-400">
											{t("includesActiveMembers", {
												count:
													expense.calculatedExpenseMembers?.length ||
													group.members.length,
												date: new Date(expense.date).toLocaleDateString(),
											})}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
