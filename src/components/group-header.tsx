"use client";

import type { Group } from "@prisma/client";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

interface GroupHeaderProps {
	group: Group;
}

export function GroupHeader({ group }: GroupHeaderProps) {
	const t = useTranslations("group");

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/group/${group.id}`
			: `/group/${group.id}`;

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			toast.success(t("copied"));
		} catch (error) {
			console.error("Failed to copy:", error);
			toast.error("Failed to copy link");
		}
	};

	return (
		<Card className="py-2">
			<CardHeader className="items-center flex w-full">
				<div className="flex items-center justify-between gap-3 w-full">
					<div className="min-w-0">
						<h1 className="text-lg sm:text-2xl font-bold  word-break-break-all">
							{group.name}
						</h1>
						{group.description && (
							<p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 mt-1 line-clamp-1 sm:line-clamp-2">
								{group.description}
							</p>
						)}
					</div>
					<div className="flex items-center gap-2 ml-auto">
						<ThemeToggle />
						<Button
							onClick={copyToClipboard}
							variant="outline"
							size="sm"
							className="p-2"
							title={t("shareGroup")}
						>
							<Share2 className="w-4 h-4" />
							<span className="sr-only">{t("shareGroup")}</span>
						</Button>
					</div>
				</div>
			</CardHeader>
		</Card>
	);
}
