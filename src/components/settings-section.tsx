"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Settings, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateGroupAction } from "@/actions";
import type { getCalculatedGroup } from "@/actions/get-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
	CheckboxField,
	SelectField,
	TextField,
} from "@/components/ui/form-field";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	isAnyWeightTypeInUse,
	isWeightTypeInUse,
} from "@/lib/check-weight-type-usage";
import {
	type GroupFormData,
	getDefaultWeightTypes,
	groupSchema,
	type WeightType,
} from "@/lib/schemas";
import { handleActionErrors } from "@/lib/utils";

interface SettingsSectionProps {
	group: Awaited<ReturnType<typeof getCalculatedGroup>>;
}

export function SettingsSection({ group }: SettingsSectionProps) {
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	const t = useTranslations("forms.settings");

	const { executeAsync: updateGroup } = useAction(updateGroupAction);

	const form = useForm({
		resolver: zodResolver(groupSchema),
		defaultValues: {
			name: group.name,
			description: group.description || "",
			currency: group.currency,
			weightsEnabled: group.weightsEnabled,
			weightTypes: group.weightTypes || getDefaultWeightTypes(),
		},
	});

	const [weightTypes, setWeightTypes] = useState<WeightType[]>(
		group.weightTypes || getDefaultWeightTypes(),
	);

	const addWeightType = () => {
		const newWeightType: WeightType = {
			id: `weight-type-${Date.now()}`,
			name: `Weight Type ${weightTypes.length + 1}`,
			isDefault: false,
		};
		const updatedWeightTypes = [...weightTypes, newWeightType];
		setWeightTypes(updatedWeightTypes);
		form.setValue("weightTypes", updatedWeightTypes);
	};

	const removeWeightType = (id: string) => {
		// Don't allow removing the default weight type
		const weightType = weightTypes.find((wt) => wt.id === id);
		if (weightType?.isDefault) return;

		const updatedWeightTypes = weightTypes.filter((wt) => wt.id !== id);
		setWeightTypes(updatedWeightTypes);
		form.setValue("weightTypes", updatedWeightTypes);
	};

	const updateWeightTypeName = (id: string, name: string) => {
		const updatedWeightTypes = weightTypes.map((wt) =>
			wt.id === id ? { ...wt, name } : wt,
		);
		setWeightTypes(updatedWeightTypes);
		form.setValue("weightTypes", updatedWeightTypes);
	};

	const onSubmit = async (data: GroupFormData) => {
		setLoading(true);
		setMessage(null);

		const submitData = {
			...data,
			weightTypes: weightTypes,
		};

		handleActionErrors(
			await updateGroup({ groupId: group.id, group: submitData }),
		);
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

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<div>
											<CheckboxField
												control={form.control}
												name="weightsEnabled"
												label={t("weightsEnabled")}
												description={t("weightsEnabledDescription")}
												disabled={isAnyWeightTypeInUse(weightTypes, group)}
											/>
										</div>
									</TooltipTrigger>
									{isAnyWeightTypeInUse(weightTypes, group) && (
										<TooltipContent side="top" align="start">
											<p>{t("weightTypes.weightsDisabledTooltip")}</p>
										</TooltipContent>
									)}
								</Tooltip>
							</TooltipProvider>

							{/* Weight Types Management */}
							{!!form.watch("weightsEnabled") && (
								<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
									<div className="flex items-center justify-between">
										<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
											{t("weightTypes.title")}
										</h4>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={addWeightType}
											className="flex items-center gap-2"
										>
											<Plus className="w-4 h-4" />
											{t("weightTypes.addButton")}
										</Button>
									</div>
									<div className="space-y-2">
										{weightTypes.map((weightType) => (
											<div
												key={weightType.id}
												className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded border"
											>
												<input
													type="text"
													value={weightType.name}
													onChange={(e) =>
														updateWeightTypeName(weightType.id, e.target.value)
													}
													className="flex-1 px-2 py-1 text-sm border rounded bg-transparent"
													placeholder={t("weightTypes.namePlaceholder")}
												/>
												{weightType.isDefault && (
													<span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
														{t("weightTypes.defaultLabel")}
													</span>
												)}
												{!weightType.isDefault && (
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<div>
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			removeWeightType(weightType.id)
																		}
																		disabled={isWeightTypeInUse(
																			weightType.id,
																			group,
																		)}
																		className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
																	>
																		<Trash2 className="w-4 h-4" />
																	</Button>
																</div>
															</TooltipTrigger>
															{isWeightTypeInUse(weightType.id, group) && (
																<TooltipContent side="left" align="start">
																	<p>
																		{t("weightTypes.deleteDisabledTooltip")}
																	</p>
																</TooltipContent>
															)}
														</Tooltip>
													</TooltipProvider>
												)}
											</div>
										))}
									</div>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{t("weightTypes.description")}
									</p>
								</div>
							)}
						</div>

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
