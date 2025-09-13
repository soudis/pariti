"use client";

import { DollarSign, Share2, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GroupHeaderProps {
	group: {
		id: string;
		name: string;
		description: string | null;
		createdAt: Date;
		updatedAt: Date;
		members: Array<{ id: string; name: string }>;
		expenses: Array<{ id: string; amount: number }>;
	};
}

export function GroupHeader({ group }: GroupHeaderProps) {
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
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
			</CardContent>
		</Card>
	);
}
