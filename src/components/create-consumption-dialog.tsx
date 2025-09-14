"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Decimal } from "decimal.js";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	createConsumption,
	editConsumption,
	getActiveMembersForDate,
	type getGroup,
} from "@/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { MemberSelection } from "@/components/ui/member-selection";

import { type ConsumptionFormData, consumptionSchema } from "@/lib/schemas";
import { convertToPlainObject } from "@/lib/utils";

interface CreateConsumptionDialogProps {
	groupId: string;
	resources: Awaited<ReturnType<typeof getGroup>>["resources"];
	members: Awaited<ReturnType<typeof getGroup>>["members"];
	children: React.ReactNode;
	consumption?: ConsumptionFormData & { id: string }; // For editing existing consumption
	onConsumptionUpdated?: () => void;
}

export function CreateConsumptionDialog({
	groupId,
	resources,
	members,
	children,
	consumption,
	onConsumptionUpdated,
}: CreateConsumptionDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [activeMembersAtDate, setActiveMembersAtDate] =
		useState<Awaited<ReturnType<typeof getGroup>>["members"]>(members);
	const t = useTranslations("forms.createConsumption");

	const form = useForm({
		resolver: zodResolver(consumptionSchema),
		defaultValues: {
			resourceId: "",
			description: "",
			amount: 0,
			isUnitAmount: false,
			date: new Date(),
			selectedMembers: [],
		},
	});

	// Initialize form with consumption data when editing
	useEffect(() => {
		if (consumption) {
			form.reset({
				resourceId: consumption.resourceId,
				description: consumption.description || "",
				amount: consumption.amount,
				isUnitAmount: consumption.isUnitAmount,
				date: new Date(consumption.date),
				selectedMembers: consumption.selectedMembers,
			});
		} else {
			form.reset({
				resourceId: "",
				description: "",
				amount: 0,
				isUnitAmount: false,
				date: new Date(),
				selectedMembers: [],
			});
		}
	}, [consumption, form]);

	const updateActiveMembersForDate = useCallback(
		async (date: Date) => {
			try {
				const activeMembers = await getActiveMembersForDate(groupId, date);
				setActiveMembersAtDate(activeMembers);
			} catch (error) {
				console.error("Failed to get active members:", error);
			}
		},
		[groupId],
	);

	// Initialize active members when dialog opens
	useEffect(() => {
		if (open) {
			const currentDate = form.getValues("date") as Date;
			updateActiveMembersForDate(currentDate);
		}
	}, [open, form, updateActiveMembersForDate]);

	const onSubmit = async (data: ConsumptionFormData) => {
		setLoading(true);

		try {
			if (consumption) {
				await editConsumption(consumption.id, data);
			} else {
				// Create new consumption
				await createConsumption(data);
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

	const calculateTotalCost = () => {
		const selectedResource = resources.find(
			(r) => r.id === form.getValues("resourceId"),
		);
		const amount = Number(form.getValues("amount"));
		const isUnitAmount = form.getValues("isUnitAmount") as boolean;

		if (!selectedResource || !amount) return 0;
		if (isUnitAmount && selectedResource.unitPrice) {
			return amount * Number(selectedResource.unitPrice);
		}
		return amount;
	};

	const calculateAmountPerMember = () => {
		const totalCost = calculateTotalCost();
		const selectedMembers = form.getValues("selectedMembers") as string[];
		return selectedMembers.length > 0 ? totalCost / selectedMembers.length : 0;
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{consumption ? "Edit Consumption" : t("title")}
					</DialogTitle>
					<DialogDescription>
						{consumption ? "Update the consumption details." : t("description")}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

						{form.watch("resourceId") && (
							<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
								<div className="space-y-2">
									<Label>{t("amountLabel")}</Label>
									<div className="flex items-center space-x-2">
										<TextField
											control={form.control}
											name="amount"
											type="number"
											step="0.01"
											min={0}
											placeholder="0.00"
											required
											className="flex-1"
										/>
										{(() => {
											const selectedResource = resources.find(
												(r) => r.id === form.getValues("resourceId"),
											);
											const isUnitAmount = form.watch("isUnitAmount");
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

								{(form.watch("amount") as number) && (
									<div className="space-y-1">
										<p className="text-sm text-gray-600 dark:text-gray-300">
											{t("totalCost")}: €{calculateTotalCost().toFixed(2)}
										</p>
										{form.watch("selectedMembers").length > 0 && (
											<p className="text-sm text-gray-600 dark:text-gray-300">
												{t("amountPerPerson")}: €
												{calculateAmountPerMember().toFixed(2)}
											</p>
										)}
									</div>
								)}
							</div>
						)}

						<MemberSelection
							members={members}
							selectedMembers={form.watch("selectedMembers")}
							onSelectionChange={(members) =>
								form.setValue("selectedMembers", members)
							}
							splitAll={false}
							onSplitAllChange={() => {}} // Not used in consumption
							activeMembersAtDate={activeMembersAtDate}
							expenseDate={form.watch("date") as Date}
						/>

						<div className="flex justify-end space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={loading}
							>
								{t("cancel")}
							</Button>
							<Button type="submit" disabled={loading}>
								{loading
									? consumption
										? "Updating..."
										: t("adding")
									: consumption
										? "Update Consumption"
										: t("add")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
