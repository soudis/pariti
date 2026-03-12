"use client";

import { ExternalLink, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getAccessibleGroups } from "@/actions/get-accessible-groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccessibleGroup {
	id: string;
	name: string;
	description: string | null;
	currency: string;
	createdAt: Date;
}

export function AccessibleGroupsSection() {
	const [groups, setGroups] = useState<AccessibleGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const t = useTranslations("home.accessibleGroups");

	useEffect(() => {
		getAccessibleGroups()
			.then((result) => setGroups(result as AccessibleGroup[]))
			.catch(() => setGroups([]))
			.finally(() => setLoading(false));
	}, []);

	if (loading) return null;
	if (groups.length === 0) return null;

	const navigateToGroup = (groupId: string) => {
		window.location.href = `/group/${groupId}`;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Shield className="w-5 h-5" />
					{t("title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{groups.map((group) => (
						<div
							key={group.id}
							className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
						>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<h3 className="font-medium text-sm truncate">
										{group.name}
									</h3>
									<Badge variant="outline" className="text-xs">
										{group.currency}
									</Badge>
								</div>
								{group.description && (
									<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
										{group.description}
									</p>
								)}
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateToGroup(group.id)}
								className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 ml-4"
							>
								<ExternalLink className="w-4 h-4" />
							</Button>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
