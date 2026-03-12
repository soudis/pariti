"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { updateGroupAction } from "@/actions";
import { getCurrentUserSamlGroups } from "@/actions/get-current-user-groups";
import type { getCalculatedGroup } from "@/actions/get-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupForm } from "@/components/ui/group-form";
import type { GroupFormData } from "@/lib/schemas";
import { handleActionErrors } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

interface SettingsSectionProps {
	group: Awaited<ReturnType<typeof getCalculatedGroup>>;
}

export function SettingsSection({ group }: SettingsSectionProps) {
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	const [userSamlGroups, setUserSamlGroups] = useState<string[]>([]);
	const t = useTranslations("forms.settings");
	const { data: session } = useSession();
	const isAuthenticated = !!session?.user;

	const { executeAsync: updateGroup } = useAction(updateGroupAction);

	useEffect(() => {
		if (isAuthenticated) {
			getCurrentUserSamlGroups().then(setUserSamlGroups);
		}
	}, [isAuthenticated]);

	const onSubmit = async (data: GroupFormData) => {
		setLoading(true);
		setMessage(null);

		handleActionErrors(await updateGroup({ groupId: group.id, group: data }));
		setLoading(false);
		setMessage({ type: "success", text: t("settingsUpdated") });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Settings className="w-5 h-5" />
					{t("title")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<GroupForm
					group={group}
					onSubmit={onSubmit}
					loading={loading}
					showTooltips={true}
					className="space-y-6"
					formId="group-form"
					showSamlGroupSelector={isAuthenticated}
					userSamlGroups={userSamlGroups}
				/>

				{message && (
					<div
						className={`p-3 rounded-md text-sm ${
							message.type === "success"
								? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border"
								: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border"
						}`}
					>
						{message.text}
					</div>
				)}

				<div className="flex justify-end">
					<Button type="submit" form="group-form" disabled={loading}>
						{loading ? t("updating") : t("updateSettings")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
