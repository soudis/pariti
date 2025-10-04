"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createConsumptionAction, editConsumptionAction } from "@/actions";
import type { getCalculatedGroup } from "@/actions/get-group";
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
	DateField,
	SelectField,
	TextField,
} from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { MemberEditor } from "@/components/ui/member-editor";
import { type ConsumptionFormData, consumptionSchema } from "@/lib/schemas";
import { handleActionErrors } from "@/lib/utils";

interface ConsumptionDialogProps {
	group: Awaited<ReturnType<typeof getCalculatedGroup>>;
	children: React.ReactNode;
	consumption?: ConsumptionFormData & { id: string }; // For editing existing consumption
	onConsumptionUpdated?: () => void;
}

export function ConsumptionDialog({
	group,
	group: { resources },
	children,
	consumption,
	onConsumptionUpdated,
}: ConsumptionDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const t = useTranslations("forms.consumption");

	const { executeAsync: createConsumption } = useAction(
		createConsumptionAction,
	);
	const { executeAsync: editConsumption } = useAction(editConsumptionAction);

	const form = useForm({
		resolver: zodResolver(consumptionSchema),
		defaultValues: {
			resourceId: "",
			description: "",
			amount: 0,
			isUnitAmount: false,
			date: new Date(),
			splitAll: false,
			selectedMembers: [],
			sharingMethod: "equal",
			memberAmounts: [],
		},
	});

	// Initialize form with consumption data when editing
	useEffect(() => {
		if (consumption) {
			const resource = resources.find((r) => r.id === consumption.resourceId);
			form.reset({
				resourceId: consumption.resourceId,
				description: consumption.description || "",
				amount: consumption.amount,
				isUnitAmount:
					consumption.isUnitAmount ??
					(resource?.unit && resource?.unitPrice) ??
					false,
				date: new Date(consumption.date),
				splitAll: consumption.splitAll,
				selectedMembers: consumption.selectedMembers,
				sharingMethod: consumption.sharingMethod || "equal",
				memberAmounts: consumption.memberAmounts || [],
			});
		} else {
			form.reset({
				resourceId: "",
				description: "",
				amount: 0,
				isUnitAmount: true,
				date: new Date(),
				splitAll: false,
				selectedMembers: [],
				sharingMethod: "equal",
				memberAmounts: [],
			});
		}
	}, [consumption, form, resources]);

	const resourceId = form.watch("resourceId");
	useEffect(() => {
		if (resourceId) {
			const resource = resources.find((r) => r.id === resourceId);
			form.setValue(
				"isUnitAmount",
				(resource?.unit && resource?.unitPrice) ?? false,
			);

			// Auto-select default weight type from resource if available
			if (resource?.defaultWeightType) {
				form.setValue("sharingMethod", resource.defaultWeightType);
			}
		}
	}, [resourceId, form, resources]);

	// Initialize active members when dialog opens
	useEffect(() => {
		if (open) {
			form.reset();

			// Auto-select resource if there's only one available
			if (!consumption && resources.length === 1) {
				form.setValue("resourceId", resources[0].id);
				// Also set the default weight type if available
				if (resources[0].defaultWeightType) {
					form.setValue("sharingMethod", resources[0].defaultWeightType);
				}
			}
		}
	}, [open, form, consumption, resources]);

	const onSubmit = async (data: ConsumptionFormData) => {
		setLoading(true);

		try {
			// Get member amounts from the member editor
			const memberAmounts = form.getValues("memberAmounts") || [];

			// Include member amounts in the data
			const consumptionData = {
				...data,
				memberAmounts: memberAmounts.length ? memberAmounts : undefined,
			};

			if (consumption) {
				handleActionErrors(
					await editConsumption({
						consumptionId: consumption.id,
						consumption: consumptionData,
					}),
				);
			} else {
				// Create new consumption
				handleActionErrors(
					await createConsumption({ consumption: consumptionData }),
				);
			}

			setOpen(false);
			if (onConsumptionUpdated) {
				onConsumptionUpdated();
			}
		} catch (error) {
			console.error(
				`Failed to ${consumption ? "update" : "create"} consumption:`,
				error,
			);
		} finally {
			setLoading(false);
		}
	};
	const isUnitAmount = form.watch("isUnitAmount");

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] h-full flex flex-col">
				<DialogHeader className="flex-shrink-0">
					<DialogTitle>{consumption ? t("editTitle") : t("title")}</DialogTitle>
					<DialogDescription>
						{consumption ? t("editDescription") : t("description")}
					</DialogDescription>
				</DialogHeader>
				<div className="flex-1 overflow-y-auto">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-4 px-4 sm:px-6 pb-4"
						>
							<SelectField
								control={form.control}
								name="resourceId"
								label={t("resourceLabel")}
								placeholder={t("resourcePlaceholder")}
								required
								options={resources.map((resource) => ({
									value: resource.id,
									label: `${resource.name}${resource.unit && resource.unitPrice ? ` (${Number(resource.unitPrice)}€/${resource.unit})` : ""}`,
								}))}
							/>

							<TextField
								control={form.control}
								name="description"
								label={t("descriptionLabel")}
								placeholder={t("descriptionPlaceholder")}
							/>

							<DateField
								control={form.control}
								name="date"
								label={t("dateLabel")}
								placeholder={t("datePlaceholder")}
							/>

							{resourceId && (
								<>
									<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
										<div className="space-y-2">
											<Label>
												{isUnitAmount ? t("amountLabel") : t("totalCostLabel")}
											</Label>
											<div className="flex items-center space-x-2">
												<TextField
													control={form.control}
													name="amount"
													type="number"
													step="1"
													min={0}
													placeholder="0.00"
													required
													className="flex-1"
												/>
												{(() => {
													const selectedResource = resources.find(
														(r) => r.id === form.getValues("resourceId"),
													);
													return (
														selectedResource?.unit && (
															<span className="text-sm text-gray-500 whitespace-nowrap">
																{isUnitAmount ? selectedResource.unit : "€"}
															</span>
														)
													);
												})()}
											</div>
										</div>

										{(() => {
											const selectedResource = resources.find(
												(r) => r.id === form.getValues("resourceId"),
											);
											return (
												selectedResource?.unit &&
												selectedResource?.unitPrice && (
													<CheckboxField
														control={form.control}
														name="isUnitAmount"
														text={t("isUnitAmount", {
															unit: selectedResource.unit,
														})}
													/>
												)
											);
										})()}
									</div>

									<MemberEditor
										group={group}
										expenseDate={form.watch("date") as Date}
										isUnitBased={form.watch("isUnitAmount") as boolean}
										unitPrice={(() => {
											const selectedResource = resources.find(
												(r) => r.id === form.getValues("resourceId"),
											);
											return selectedResource?.unitPrice &&
												selectedResource.unit
												? Number(selectedResource.unitPrice)
												: 1;
										})()}
									/>
								</>
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
						{loading
							? consumption
								? "Updating..."
								: t("adding")
							: consumption
								? t("updateButton")
								: t("add")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
