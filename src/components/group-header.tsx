"use client";

import type { Group } from "@prisma/client";
import { Home, Menu, Share2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface GroupHeaderProps {
	group: Group;
}

interface VisitedGroup {
	id: string;
	name: string;
	lastVisited: number;
}

const VISITED_GROUPS_KEY = "parity_visited_groups";

export function GroupHeader({ group }: GroupHeaderProps) {
	const t = useTranslations("group");
	const router = useRouter();
	const [visitedGroups, setVisitedGroups] = useState<VisitedGroup[]>([]);
	const [loading, setLoading] = useState(true);

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/group/${group.id}`
			: `/group/${group.id}`;

	// Load visited groups from localStorage
	useEffect(() => {
		try {
			const stored = localStorage.getItem(VISITED_GROUPS_KEY);
			if (stored) {
				const groups = JSON.parse(stored) as VisitedGroup[];
				// Filter out current group and sort by last visited
				const otherGroups = groups
					.filter((g) => g.id !== group.id)
					.sort((a, b) => b.lastVisited - a.lastVisited)
					.slice(0, 5); // Show max 5 other groups
				setVisitedGroups(otherGroups);
			}
		} catch (error) {
			console.error("Failed to load visited groups:", error);
		} finally {
			setLoading(false);
		}
	}, [group.id]);

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			toast.success(t("copied"));
		} catch (error) {
			console.error("Failed to copy:", error);
			toast.error(t("failedToCopyLink"));
		}
	};

	const navigateToGroup = (groupId: string) => {
		router.push(`/group/${groupId}`);
	};

	const navigateToHome = () => {
		router.push("/");
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
					<div className="ml-auto">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="p-2"
									title={t("menu")}
								>
									<Menu className="w-4 h-4" />
									<span className="sr-only">{t("menu")}</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-80" align="end">
								<div className="space-y-4">
									{/* Navigation Section */}
									<div>
										<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
											Navigation
										</h4>
										<div className="space-y-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={navigateToHome}
												className="w-full justify-start"
											>
												<Home className="w-4 h-4 mr-2" />
												Home
											</Button>
										</div>
									</div>

									{/* Other Groups Section */}
									{!loading && visitedGroups.length > 0 && (
										<div>
											<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
												Other Groups
											</h4>
											<div className="space-y-1">
												{visitedGroups.map((visitedGroup) => (
													<Button
														key={visitedGroup.id}
														variant="ghost"
														size="sm"
														onClick={() => navigateToGroup(visitedGroup.id)}
														className="w-full justify-start"
													>
														<Users className="w-4 h-4 mr-2" />
														<span className="truncate">
															{visitedGroup.name}
														</span>
													</Button>
												))}
											</div>
										</div>
									)}

									{/* Actions Section */}
									<div>
										<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
											Actions
										</h4>
										<div className="space-y-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={copyToClipboard}
												className="w-full justify-start"
											>
												<Share2 className="w-4 h-4 mr-2" />
												{t("shareGroup")}
											</Button>
											<div className="flex items-center justify-between">
												<span className="text-sm text-gray-600 dark:text-gray-400">
													Theme
												</span>
												<ThemeToggle />
											</div>
										</div>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</CardHeader>
		</Card>
	);
}
