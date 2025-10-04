"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import type { getCalculatedGroup } from "@/actions/get-group";
import { Button } from "@/components/ui/button";
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

interface GroupFormProps {
	group?: Awaited<ReturnType<typeof getCalculatedGroup>>; // For editing existing group
	onSubmit: (data: GroupFormData) => Promise<void>;
	loading?: boolean;
	showTooltips?: boolean; // Whether to show tooltips for weight type usage
	className?: string;
	formId?: string; // Optional form ID to use instead of generating one
}

export function GroupForm({
	group,
	onSubmit,
	showTooltips = false,
	className = "",
	formId: providedFormId,
}: GroupFormProps) {
	const t = useTranslations("forms.group");
	const generatedFormId = useId();
	const formId = providedFormId || generatedFormId;

	const form = useForm({
		resolver: zodResolver(groupSchema),
		defaultValues: {
			name: group?.name || "",
			description: group?.description || "",
			currency: group?.currency || "EUR",
			weightsEnabled: group?.weightsEnabled || false,
			weightTypes: group?.weightTypes || getDefaultWeightTypes(),
			memberActiveDurationsEnabled:
				group?.memberActiveDurationsEnabled || false,
			recurringExpensesEnabled: group?.recurringExpensesEnabled || false,
		},
	});

	const [weightTypes, setWeightTypes] = useState<WeightType[]>(
		group?.weightTypes || getDefaultWeightTypes(),
	);

	// Reset form when group changes (for editing mode)
	useEffect(() => {
		if (group) {
			form.reset({
				name: group.name,
				description: group.description || "",
				currency: group.currency,
				weightsEnabled: group.weightsEnabled,
				weightTypes: group.weightTypes || getDefaultWeightTypes(),
				memberActiveDurationsEnabled: group.memberActiveDurationsEnabled,
				recurringExpensesEnabled: group.recurringExpensesEnabled,
			});
			setWeightTypes(group.weightTypes || getDefaultWeightTypes());
		}
	}, [group, form]);

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

	const handleSubmit = async (data: GroupFormData) => {
		const submitData = {
			...data,
			weightTypes: weightTypes,
		};
		await onSubmit(submitData);
	};

	const renderWeightTypesSection = () => {
		if (!form.watch("weightsEnabled")) return null;

		return (
			<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
				<div className="flex flex-col gap-2">
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
							className="flex items-center  gap-2 p-2 bg-white dark:bg-gray-700 rounded border"
						>
							<input
								type="text"
								value={weightType.name}
								onChange={(e) =>
									updateWeightTypeName(weightType.id, e.target.value)
								}
								className="flex-1 px-2 py-1 text-sm border rounded bg-transparent w-full"
								placeholder={t("weightTypes.namePlaceholder")}
							/>
							{weightType.isDefault && (
								<span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
									{t("weightTypes.defaultLabel")}
								</span>
							)}
							{!weightType.isDefault &&
								(showTooltips && group ? (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<div>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => removeWeightType(weightType.id)}
														disabled={isWeightTypeInUse(weightType.id, group)}
														className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</TooltipTrigger>
											{isWeightTypeInUse(weightType.id, group) && (
												<TooltipContent side="left" align="start">
													<p>{t("weightTypes.deleteDisabledTooltip")}</p>
												</TooltipContent>
											)}
										</Tooltip>
									</TooltipProvider>
								) : (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeWeightType(weightType.id)}
										className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								))}
						</div>
					))}
				</div>
				<p className="text-xs text-gray-500 dark:text-gray-400">
					{t("weightTypes.description")}
				</p>
			</div>
		);
	};

	const renderWeightsEnabledField = () => {
		if (!showTooltips || !group) {
			return (
				<CheckboxField
					control={form.control}
					name="weightsEnabled"
					label={t("weightsEnabled")}
					description={t("weightsEnabledDescription")}
				/>
			);
		}

		return (
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
		);
	};

	return (
		<Form {...form}>
			<form
				id={formId}
				onSubmit={form.handleSubmit(handleSubmit)}
				className={`space-y-4 ${className}`}
			>
				<TextField
					control={form.control}
					name="name"
					label={t("name")}
					placeholder={t("namePlaceholder")}
					required
				/>

				<TextField
					control={form.control}
					name="description"
					label={t("descriptionLabel")}
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
					name="memberActiveDurationsEnabled"
					label={t("memberActiveDurationsEnabled")}
					description={t("memberActiveDurationsEnabledDescription")}
				/>

				<CheckboxField
					control={form.control}
					name="recurringExpensesEnabled"
					label={t("recurringExpensesEnabled")}
					description={t("recurringExpensesEnabledDescription")}
				/>
				{renderWeightsEnabledField()}

				{renderWeightTypesSection()}
			</form>
		</Form>
	);
}
