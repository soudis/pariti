"use client";

import type { Group } from "@generated/prisma";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";

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
			toast.error(t("failedToCopyLink"));
		}
	};

	return (
		<TopBar
			title={group.name}
			subtitle={group.description ?? undefined}
			actions={
				<Button
					variant="outline"
					size="sm"
					className="p-2"
					onClick={copyToClipboard}
					title={t("shareGroup")}
				>
					<Share2 className="w-4 h-4" />
					<span className="sr-only">{t("shareGroup")}</span>
				</Button>
			}
		/>
	);
}
