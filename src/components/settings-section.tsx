"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
	CheckboxField,
	SelectField,
	TextField,
} from "@/components/ui/form-field";
import { updateGroup } from "@/lib/actions";
import { groupSchema } from "@/lib/schemas";

interface SettingsSectionProps {
	group: {
		id: string;
		name: string;
		description: string | null;
		currency: string;
		weightsEnabled: boolean;
	};
}

export function SettingsSection({ group }: SettingsSectionProps) {
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	const t = useTranslations("forms.settings");

	const form = useForm({
		resolver: zodResolver(groupSchema),
		defaultValues: {
			name: group.name,
			description: group.description || "",
			currency: group.currency,
			weightsEnabled: group.weightsEnabled,
		},
	});

	const onSubmit = async (data: any) => {
		setLoading(true);
		setMessage(null);

		try {
			await updateGroup(group.id, {
				name: data.name,
				description: data.description || undefined,
				currency: data.currency,
				weightsEnabled: data.weightsEnabled,
			});

			setMessage({ type: "success", text: t("settingsUpdated") });
		} catch (error) {
			console.error("Failed to update group settings:", error);
			setMessage({ type: "error", text: t("updateFailed") });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Settings className="w-5 h-5" />
					{t("title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="space-y-4">
							<TextField
								control={form.control}
								name="name"
								label={t("groupName")}
								placeholder={t("groupNamePlaceholder")}
								required
							/>

							<TextField
								control={form.control}
								name="description"
								label={t("description")}
								placeholder={t("descriptionPlaceholder")}
							/>

							<SelectField
								control={form.control}
								name="currency"
								label={t("currency")}
								options={[
									{ value: "USD", label: "USD - US Dollar" },
									{ value: "EUR", label: "EUR - Euro" },
									{ value: "GBP", label: "GBP - British Pound" },
									{ value: "CHF", label: "CHF - Swiss Franc" },
									{ value: "CAD", label: "CAD - Canadian Dollar" },
									{ value: "AUD", label: "AUD - Australian Dollar" },
									{ value: "JPY", label: "JPY - Japanese Yen" },
									{ value: "CNY", label: "CNY - Chinese Yuan" },
									{ value: "INR", label: "INR - Indian Rupee" },
									{ value: "BRL", label: "BRL - Brazilian Real" },
								]}
								required
							/>

							<CheckboxField
								control={form.control}
								name="weightsEnabled"
								label={t("weightsEnabled")}
								description={t("weightsEnabledDescription")}
							/>
						</div>

						{message && (
							<div
								className={`p-3 rounded-md text-sm ${
									message.type === "success"
										? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
										: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
								}`}
							>
								{message.text}
							</div>
						)}

						<div className="flex justify-end">
							<Button type="submit" disabled={loading}>
								{loading ? t("updating") : t("updateSettings")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
