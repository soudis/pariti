"use client";

import { ChevronRight, Plus, Shield, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getAccessibleGroups } from "@/actions/get-accessible-groups";
import { GroupDialog } from "@/components/group-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

interface AccessibleGroup {
	id: string;
	name: string;
	description: string | null;
	currency: string;
	createdAt: Date;
	memberCount: number;
}

export function AccessibleGroupsSection() {
	const [groups, setGroups] = useState<AccessibleGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const t = useTranslations("home.accessibleGroups");
	const tCreate = useTranslations("home.createGroup");

	useEffect(() => {
		getAccessibleGroups()
			.then((result) => setGroups(result as AccessibleGroup[]))
			.catch(() => setGroups([]))
			.finally(() => setLoading(false));
	}, []);

	const navigateToGroup = (groupId: string) => {
		router.push(`/group/${groupId}`);
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Shield className="w-5 h-5" />
						{t("title")}
					</CardTitle>
					<GroupDialog isAuthenticated>
						<Button size="sm">
							<Plus className="w-4 h-4 mr-2" />
							{tCreate("button")}
						</Button>
					</GroupDialog>
				</div>
			</CardHeader>
			<CardContent>
				{loading ? null : groups.length === 0 ? (
					<p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
						{t("empty")}
					</p>
				) : (
					<div className="space-y-3">
						{groups.map((group) => (
							<button
								type="button"
								key={group.id}
								onClick={() => navigateToGroup(group.id)}
								className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left cursor-pointer"
							>
								<div className="flex-1 min-w-0">
									<div className="flex gap-4 space-between mb-1 flex-wrap">
										<h3 className="font-medium text-sm truncate">
											{group.name}
										</h3>
										<span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
											<Users className="w-3.5 h-3.5" />
											{t("members", { count: group.memberCount })}
										</span>
									</div>
									{group.description && (
										<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
											{group.description}
										</p>
									)}
								</div>
								<ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 ml-2" />
							</button>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
