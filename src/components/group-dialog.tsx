"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createGroupAction } from "@/actions/create-group";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import {
	CheckboxField,
	SelectField,
	TextField,
} from "@/components/ui/form-field";
import {
	type GroupFormData,
	getDefaultWeightTypes,
	groupSchema,
	type WeightType,
} from "@/lib/schemas";
import { handleActionErrors } from "@/lib/utils";

interface GroupDialogProps {
	children: React.ReactNode;
}

export function GroupDialog({ children }: GroupDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const locale = useLocale();
	const t = useTranslations("forms.group");

	const { executeAsync: createGroup } = useAction(createGroupAction);
	const form = useForm({
		resolver: zodResolver(groupSchema),
		defaultValues: {
			name: "",
			description: "",
			currency: "EUR",
			weightsEnabled: false,
			weightTypes: getDefaultWeightTypes(),
		},
	});

	const [weightTypes, setWeightTypes] = useState<WeightType[]>(
		getDefaultWeightTypes(),
	);

	useEffect(() => {
		if (open) {
			form.reset();
			setWeightTypes(getDefaultWeightTypes());
		}
	}, [open, form]);

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

	console.log(form.formState.isSubmitting);

	const onSubmit = async (data: GroupFormData) => {
		setLoading(true);

		const submitData = {
			...data,
			weightTypes: weightTypes,
		};

		const group = handleActionErrors(await createGroup({ group: submitData }));

		setOpen(false);
		form.reset();
		setWeightTypes(getDefaultWeightTypes());

		router.push(`/${locale}/group/${group.id}`);
		setLoading(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] h-full sm:h-[60vh] flex flex-col">
				<DialogHeader className="flex-shrink-0">
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<div className="flex-1 overflow-y-auto">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-4 px-4 sm:px-6 pb-4"
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
								name="weightsEnabled"
								label={t("weightsEnabled")}
								description={t("weightsEnabledDescription")}
							/>

							{/* Weight Types Management */}
							{!!form.watch("weightsEnabled") && (
								<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
									<div className="space-y-3">
										<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
											{t("weightTypes.title")}
										</h4>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={addWeightType}
											className="flex items-center gap-2 w-fit"
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
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => removeWeightType(weightType.id)}
														className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												)}
											</div>
										))}
									</div>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{t("weightTypes.description")}
									</p>
								</div>
							)}
						</form>
					</Form>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={loading}
					>
						{t("cancel")}
					</Button>
					<Button
						type="submit"
						disabled={loading}
						onClick={form.handleSubmit(onSubmit)}
					>
						{loading ? t("creating") : t("create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
