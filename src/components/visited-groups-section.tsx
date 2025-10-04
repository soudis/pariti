"use client";

import { ExternalLink, Share2, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface VisitedGroup {
	id: string;
	name: string;
	lastVisited: number;
}

const VISITED_GROUPS_KEY = "parity_visited_groups";
const MAX_VISITED_GROUPS = 10;

export function VisitedGroupsSection() {
	const [visitedGroups, setVisitedGroups] = useState<VisitedGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const t = useTranslations("home.visitedGroups");
	const tGroup = useTranslations("group");

	// Load visited groups from localStorage
	useEffect(() => {
		try {
			const stored = localStorage.getItem(VISITED_GROUPS_KEY);
			if (stored) {
				const groups = JSON.parse(stored) as VisitedGroup[];
				// Sort by last visited (most recent first)
				const sortedGroups = groups.sort(
					(a, b) => b.lastVisited - a.lastVisited,
				);
				setVisitedGroups(sortedGroups);
			}
		} catch (error) {
			console.error("Failed to load visited groups:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Function to remove a group from visited groups
	const removeVisitedGroup = (groupId: string) => {
		try {
			setVisitedGroups((prev) => {
				const updated = prev.filter((group) => group.id !== groupId);
				localStorage.setItem(VISITED_GROUPS_KEY, JSON.stringify(updated));
				return updated;
			});
		} catch (error) {
			console.error("Failed to remove visited group:", error);
		}
	};

	// Function to navigate to a group
	const navigateToGroup = (groupId: string) => {
		window.location.href = `/group/${groupId}`;
	};

	// Function to copy group URL to clipboard
	const copyGroupUrl = async (groupId: string) => {
		const shareUrl = `${window.location.origin}/group/${groupId}`;
		try {
			await navigator.clipboard.writeText(shareUrl);
			toast.success(tGroup("copied"));
		} catch (error) {
			console.error("Failed to copy:", error);
			toast.error(tGroup("failedToCopyLink"));
		}
	};

	// Format last visited date
	const formatLastVisited = (timestamp: number) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInHours = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60 * 60),
		);

		if (diffInHours < 1) {
			return t("justNow");
		} else if (diffInHours < 24) {
			return t("hoursAgo", { hours: diffInHours });
		} else {
			const diffInDays = Math.floor(diffInHours / 24);
			if (diffInDays === 1) {
				return t("yesterday");
			} else if (diffInDays < 7) {
				return t("daysAgo", { days: diffInDays });
			} else {
				return date.toLocaleDateString();
			}
		}
	};

	if (loading) {
		return null;
	}

	if (visitedGroups.length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="w-5 h-5" />
					{t("title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{visitedGroups.map((group) => (
						<div
							key={group.id}
							className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
						>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<h3 className="font-medium text-sm truncate">{group.name}</h3>
									<Badge variant="outline" className="text-xs">
										{formatLastVisited(group.lastVisited)}
									</Badge>
								</div>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									{t("groupId")}: {group.id}
								</p>
							</div>
							<div className="flex items-center gap-2 ml-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => copyGroupUrl(group.id)}
									title={tGroup("shareGroup")}
									className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
								>
									<Share2 className="w-4 h-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigateToGroup(group.id)}
									className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
								>
									<ExternalLink className="w-4 h-4" />
								</Button>
								<ConfirmDeleteDialog
									title={t("removeFromMenu")}
									description={t("removeFromMenuDescription")}
									itemName={group.name}
									onConfirm={() => removeVisitedGroup(group.id)}
								>
									<Button
										variant="ghost"
										size="sm"
										className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</ConfirmDeleteDialog>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

// Export the function to add visited groups (to be used in group pages)
export const addVisitedGroup = (groupId: string, groupName: string) => {
	try {
		const newGroup: VisitedGroup = {
			id: groupId,
			name: groupName,
			lastVisited: Date.now(),
		};

		const stored = localStorage.getItem(VISITED_GROUPS_KEY);
		const existingGroups = stored ? (JSON.parse(stored) as VisitedGroup[]) : [];

		// Remove if already exists
		const filtered = existingGroups.filter((group) => group.id !== groupId);
		// Add new group at the beginning
		const updated = [newGroup, ...filtered].slice(0, MAX_VISITED_GROUPS);

		// Save to localStorage
		localStorage.setItem(VISITED_GROUPS_KEY, JSON.stringify(updated));
	} catch (error) {
		console.error("Failed to save visited group:", error);
	}
};
