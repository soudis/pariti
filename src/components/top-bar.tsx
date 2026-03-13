"use client";

import { Home, Menu, Plus, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { GroupDialog } from "@/components/group-dialog";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { UserMenu } from "@/components/user-menu";
import { useSession } from "@/lib/auth-client";

interface VisitedGroup {
	id: string;
	name: string;
	lastVisited: number;
}

const VISITED_GROUPS_KEY = "parity_visited_groups";

interface TopBarProps {
	title: string;
	subtitle?: string;
	/** Extra buttons rendered between the title and the menu (e.g. share). */
	actions?: React.ReactNode;
	/** Whether to show the Home link in the menu (hide on the home page itself). */
	showHomeLink?: boolean;
}

export function TopBar({
	title,
	subtitle,
	actions,
	showHomeLink = true,
}: TopBarProps) {
	const t = useTranslations("group");
	const router = useRouter();
	const [visitedGroups, setVisitedGroups] = useState<VisitedGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const { data: session } = useSession();
	const isAuthenticated = !!session?.user;

	useEffect(() => {
		try {
			const stored = localStorage.getItem(VISITED_GROUPS_KEY);
			if (stored) {
				const groups = JSON.parse(stored) as VisitedGroup[];
				const sorted = groups
					.sort((a, b) => b.lastVisited - a.lastVisited)
					.slice(0, 5);
				setVisitedGroups(sorted);
			}
		} catch (error) {
			console.error("Failed to load visited groups:", error);
		} finally {
			setLoading(false);
		}
	}, []);

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
					<div className="flex items-center gap-3 min-w-0">
						<button
							type="button"
							onClick={navigateToHome}
							className="flex-shrink-0 hover:opacity-50 transition-opacity cursor-pointer"
							title={t("menuItems.home")}
						>
							<Image
								src="/logo.png"
								alt="Pariti"
								width={64}
								height={64}
								className="w-12 h-12"
							/>
						</button>
						<div className="min-w-0">
							<h1 className="text-lg sm:text-2xl font-bold word-break-break-all">
								{title}
							</h1>
							{subtitle && (
								<p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 mt-1 line-clamp-1 sm:line-clamp-2">
									{subtitle}
								</p>
							)}
						</div>
					</div>
					<div className="ml-auto flex items-center gap-2">
						{actions}
						<UserMenu />
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
									{showHomeLink && (
										<div>
											<Button
												variant="ghost"
												size="sm"
												onClick={navigateToHome}
												className="w-full justify-start"
											>
												<Home className="w-4 h-4 mr-2" />
												{t("menuItems.home")}
											</Button>
										</div>
									)}
									{isAuthenticated && (
										<div>
											<GroupDialog isAuthenticated={isAuthenticated}>
												<Button
													variant="ghost"
													size="sm"
													className="w-full justify-start"
												>
													<Plus className="w-4 h-4 mr-2" />
													{t("menuItems.createNewGroup")}
												</Button>
											</GroupDialog>
										</div>
									)}
									{!loading && visitedGroups.length > 0 && (
										<div>
											<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
												{t("menuItems.otherGroups")}
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
									<div className="flex items-center justify-between">
										<span className="text-sm">{t("menuItems.theme")}</span>
										<ThemeToggle />
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">{t("menuItems.language")}</span>
										<LanguageSwitcher />
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
