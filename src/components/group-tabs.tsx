"use client";

import { Package, Receipt, Scale, Settings, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { ExpensesSection } from "@/components/expenses-section";
import { MembersSection } from "@/components/members-section";
import { ResourcesSection } from "@/components/resources-section";
import { SettingsSection } from "@/components/settings-section";
import { SettlementsSection } from "@/components/settlements-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GroupTabsProps {
	group: any;
	expenses: any[];
	resources: any[];
	settlements: any[];
	cutoffDate: Date | null;
}

export function GroupTabs({
	group,
	expenses,
	resources,
	settlements,
	cutoffDate,
}: GroupTabsProps) {
	const t = useTranslations("group");
	const [activeTab, setActiveTab] = useQueryState("tab", {
		defaultValue: "members",
		shallow: false,
	});

	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
			<TabsList className="grid w-full grid-cols-5 min-h-12">
				<TabsTrigger value="members" className="flex items-center gap-2">
					<Users className="w-4 h-4" />
					<span className="hidden sm:inline">{t("members")}</span>
				</TabsTrigger>
				<TabsTrigger value="expenses" className="flex items-center gap-2">
					<Receipt className="w-4 h-4" />
					<span className="hidden sm:inline">{t("expenses")}</span>
				</TabsTrigger>
				<TabsTrigger value="resources" className="flex items-center gap-2">
					<Package className="w-4 h-4" />
					<span className="hidden sm:inline">{t("resources")}</span>
				</TabsTrigger>
				<TabsTrigger value="settlements" className="flex items-center gap-2">
					<Scale className="w-4 h-4" />
					<span className="hidden sm:inline">{t("settlements")}</span>
				</TabsTrigger>
				<TabsTrigger value="settings" className="flex items-center gap-2">
					<Settings className="w-4 h-4" />
					<span className="hidden sm:inline">{t("settings")}</span>
				</TabsTrigger>
			</TabsList>

			<TabsContent value="members" className="mt-6">
				<MembersSection group={group} />
			</TabsContent>

			<TabsContent value="expenses" className="mt-6">
				<ExpensesSection
					group={group}
					expenses={expenses}
					cutoffDate={cutoffDate}
				/>
			</TabsContent>

			<TabsContent value="resources" className="mt-6">
				<ResourcesSection
					groupId={group.id}
					group={group}
					resources={resources}
					members={group.members}
					cutoffDate={cutoffDate}
				/>
			</TabsContent>

			<TabsContent value="settlements" className="mt-6">
				<SettlementsSection
					groupId={group.id}
					settlements={settlements}
					members={group.members}
					resources={resources}
					currency={group.currency}
				/>
			</TabsContent>

			<TabsContent value="settings" className="mt-6">
				<SettingsSection group={group} />
			</TabsContent>
		</Tabs>
	);
}
