"use client";

import {
	BarChart3,
	Package,
	ReceiptEuro,
	Scale,
	Settings,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import type { generateRecurringExpenseInstances, getGroup } from "@/actions";
import { ExpensesSection } from "@/components/expenses-section";
import { MembersSection } from "@/components/members-section";
import { OverviewSection } from "@/components/overview-section";
import { ResourcesSection } from "@/components/resources-section";
import { SettingsSection } from "@/components/settings-section";
import { SettlementsSection } from "@/components/settlements-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GroupTabsProps {
	group: Awaited<ReturnType<typeof getGroup>>;
	expenses?: Awaited<ReturnType<typeof generateRecurringExpenseInstances>>;
	cutoffDate: Date | null;
	consumptions: Awaited<
		ReturnType<typeof getGroup>
	>["resources"][number]["consumptions"];
}

export function GroupTabs({
	group,
	expenses,
	group: { resources, settlements },
	cutoffDate,
	consumptions,
}: GroupTabsProps) {
	const t = useTranslations("group");
	const [activeTab, setActiveTab] = useQueryState("tab", {
		defaultValue: "overview",
		shallow: false,
	});

	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
			<TabsList className="grid w-full grid-cols-6 min-h-12">
				<TabsTrigger value="overview" className="flex items-center gap-2">
					<BarChart3 className="w-4 h-4" />
					<span className="hidden sm:inline">{t("overview")}</span>
				</TabsTrigger>
				<TabsTrigger value="members" className="flex items-center gap-2">
					<Users className="w-4 h-4" />
					<span className="hidden sm:inline">{t("members")}</span>
				</TabsTrigger>
				<TabsTrigger value="expenses" className="flex items-center gap-2">
					<ReceiptEuro className="w-4 h-4" />
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

			<TabsContent value="overview" className="mt-4">
				<OverviewSection
					group={group}
					resources={resources}
					consumptions={consumptions}
					cutoffDate={cutoffDate}
				/>
			</TabsContent>

			<TabsContent value="members" className="mt-4">
				<MembersSection group={group} />
			</TabsContent>

			<TabsContent value="expenses" className="mt-4">
				<ExpensesSection
					group={group}
					expenses={expenses}
					cutoffDate={cutoffDate}
				/>
			</TabsContent>

			<TabsContent value="resources" className="mt-4">
				<ResourcesSection
					groupId={group.id}
					group={group}
					cutoffDate={cutoffDate}
				/>
			</TabsContent>

			<TabsContent value="settlements" className="mt-4">
				<SettlementsSection
					groupId={group.id}
					settlements={settlements}
					members={group.members}
					resources={resources}
					currency={group.currency}
				/>
			</TabsContent>

			<TabsContent value="settings" className="mt-4">
				<SettingsSection group={group} />
			</TabsContent>
		</Tabs>
	);
}
