"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	createConsumptionAction,
	editConsumptionAction,
	getActiveMembersForDate,
	type getGroup,
} from "@/actions";
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
	groupId: string;
	resources: Awaited<ReturnType<typeof getGroup>>["resources"];
	members: Awaited<ReturnType<typeof getGroup>>["members"];
	children: React.ReactNode;
	consumption?: ConsumptionFormData & { id: string }; // For editing existing consumption
	onConsumptionUpdated?: () => void;
}

export function ConsumptionDialog({
	groupId,
	resources,
	members,
	children,
	consumption,
	onConsumptionUpdated,
}: ConsumptionDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [activeMembersAtDate, setActiveMembersAtDate] =
		useState<Awaited<ReturnType<typeof getGroup>>["members"]>(members);
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
			selectedMembers: [],
			sharingMethod: "equal" as const,
			memberAmounts: [],
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
				selectedMembers: [],
				sharingMethod: "equal",
				memberAmounts: [],
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

	// Initialize active members when dialog opens
	useEffect(() => {
		if (open) {
			form.reset();
		}
	}, [open, form]);

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

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] h-full sm:h-[90vh] flex flex-col">
				<DialogHeader className="flex-shrink-0">
					<DialogTitle>
						{consumption ? "Edit Consumption" : t("title")}
					</DialogTitle>
					<DialogDescription>
						{consumption ? "Update the consumption details." : t("description")}
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

							{form.watch("resourceId") && (
								<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
									<div className="space-y-2">
										<Label>{t("amountLabel")}</Label>
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
								</div>
							)}

							<MemberEditor
								members={activeMembersAtDate.map((member) => ({
									...member,
									weight: Number(member.weight),
								}))}
								activeMembersAtDate={activeMembersAtDate.map((member) => ({
									...member,
									weight: Number(member.weight),
								}))}
								expenseDate={form.watch("date") as Date}
								currency="€" // TODO: Get from group
								weightsEnabled={false} // TODO: Get from group
								isUnitBased={form.watch("isUnitAmount") as boolean}
								unitPrice={(() => {
									const selectedResource = resources.find(
										(r) => r.id === form.getValues("resourceId"),
									);
									return selectedResource?.unitPrice
										? Number(selectedResource.unitPrice)
										: 0;
								})()}
							/>
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
								? "Update Consumption"
								: t("add")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
