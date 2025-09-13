"use client";

import { Decimal } from "decimal.js";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	createConsumption,
	editConsumption,
	getActiveMembersForDate,
	type getGroup,
} from "@/lib/actions";
import { convertToPlainObject } from "@/lib/utils";

interface CreateConsumptionDialogProps {
	groupId: string;
	resources: Awaited<ReturnType<typeof getGroup>>["resources"];
	members: Awaited<ReturnType<typeof getGroup>>["members"];
	children: React.ReactNode;
	consumption?: any; // For editing existing consumption
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
	const [selectedResource, setSelectedResource] = useState<
		Awaited<ReturnType<typeof getGroup>>["resources"][number] | null
	>(null);
	const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
	const [amount, setAmount] = useState("");
	const [isUnitAmount, setIsUnitAmount] = useState(false);
	const [consumptionDate, setConsumptionDate] = useState<Date>(new Date());
	const [activeMembersAtDate, setActiveMembersAtDate] =
		useState<Awaited<ReturnType<typeof getGroup>>["members"]>(members);
	const t = useTranslations("forms.createConsumption");
	const resourceId = useId();
	const descriptionId = useId();
	const amountId = useId();
	const isUnitAmountId = useId();

	// Initialize form with consumption data when editing
	useEffect(() => {
		if (consumption) {
			const resource = resources.find((r) => r.id === consumption.resourceId);
			setSelectedResource(resource || null);
			setAmount(consumption.amount.toString());
			setIsUnitAmount(consumption.isUnitAmount);
			setConsumptionDate(new Date(consumption.date));
			if (consumption.consumptionMembers) {
				setSelectedMembers(
					consumption.consumptionMembers.map((cm: any) => cm.memberId),
				);
			}
		} else {
			// Reset form for new consumption
			setSelectedResource(null);
			setAmount("");
			setIsUnitAmount(false);
			setConsumptionDate(new Date());
			setSelectedMembers([]);
		}
	}, [consumption, resources]);

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
			updateActiveMembersForDate(consumptionDate);
		}
	}, [open, consumptionDate, updateActiveMembersForDate]);

	const handleResourceChange = (resourceId: string) => {
		const resource = resources.find((r) => r.id === resourceId);
		setSelectedResource(resource || null);
		setIsUnitAmount(false); // Reset to money amount by default
		setAmount("");
	};

	const handleMemberToggle = (memberId: string, checked: boolean) => {
		if (checked) {
			setSelectedMembers([...selectedMembers, memberId]);
		} else {
			setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const description = formData.get("description") as string;
		const parsedAmount = parseFloat(amount);

		if (!selectedResource) {
			alert(t("validation.selectResource"));
			setLoading(false);
			return;
		}

		if (selectedMembers.length === 0) {
			alert(t("validation.selectMembers"));
			setLoading(false);
			return;
		}

		if (isUnitAmount && !selectedResource.unitPrice) {
			alert(t("validation.noUnitPrice"));
			setLoading(false);
			return;
		}

		try {
			if (consumption) {
				// Edit existing consumption
				const consumptionMembers = selectedMembers.map((memberId) => ({
					memberId,
					amount: calculateAmountPerMember(),
				}));

				await editConsumption(consumption.id, {
					amount: parsedAmount,
					isUnitAmount,
					date: consumptionDate,
					description: description || undefined,
					consumptionMembers,
				});
			} else {
				// Create new consumption
				await createConsumption(
					convertToPlainObject({
						resourceId: selectedResource.id,
						amount: new Decimal(parsedAmount),
						isUnitAmount,
						memberIds: selectedMembers,
						description: description || null,
						date: consumptionDate,
					}),
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

	const calculateTotalCost = () => {
		if (!selectedResource || !amount) return 0;
		const parsedAmount = parseFloat(amount);
		if (isUnitAmount && selectedResource.unitPrice) {
			return parsedAmount * Number(selectedResource.unitPrice);
		}
		return parsedAmount;
	};

	const calculateAmountPerMember = () => {
		const totalCost = calculateTotalCost();
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
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={resourceId}>{t("resourceLabel")}</Label>
						<Select
							value={selectedResource?.id || ""}
							onValueChange={handleResourceChange}
							required
						>
							<SelectTrigger>
								<SelectValue placeholder={t("resourcePlaceholder")} />
							</SelectTrigger>
							<SelectContent>
								{resources.map((resource) => (
									<SelectItem key={resource.id} value={resource.id}>
										{resource.name}
										{resource.unit && resource.unitPrice && (
											<span className="text-sm text-gray-500 ml-2">
												({Number(resource.unitPrice)}€/{resource.unit})
											</span>
										)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor={descriptionId}>{t("descriptionLabel")}</Label>
						<Input
							id={descriptionId}
							name="description"
							placeholder={t("descriptionPlaceholder")}
							defaultValue={consumption?.description || ""}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="consumptionDate">{t("dateLabel")}</Label>
						<DatePicker
							value={consumptionDate}
							onChange={(date) => {
								const newDate = date || new Date();
								setConsumptionDate(newDate);
								updateActiveMembersForDate(newDate);
							}}
							placeholder={t("datePlaceholder")}
						/>
					</div>

					{selectedResource && (
						<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
							<div className="space-y-2">
								<Label htmlFor={amountId}>{t("amountLabel")}</Label>
								<div className="flex items-center space-x-2">
									<Input
										id={amountId}
										name="amount"
										type="number"
										step="0.01"
										min="0"
										placeholder="0.00"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										required
										className="flex-1"
									/>
									{selectedResource.unit && (
										<span className="text-sm text-gray-500 whitespace-nowrap">
											{isUnitAmount ? selectedResource.unit : "€"}
										</span>
									)}
								</div>
							</div>

							{selectedResource.unit && selectedResource.unitPrice && (
								<div className="flex items-center space-x-2">
									<Checkbox
										id={isUnitAmountId}
										checked={isUnitAmount}
										onCheckedChange={(checked) =>
											setIsUnitAmount(checked as boolean)
										}
									/>
									<Label htmlFor={isUnitAmountId} className="text-sm">
										{t("isUnitAmount", { unit: selectedResource.unit })}
									</Label>
								</div>
							)}

							{amount && (
								<div className="space-y-1">
									<p className="text-sm text-gray-600 dark:text-gray-300">
										{t("totalCost")}: €{calculateTotalCost().toFixed(2)}
									</p>
									{selectedMembers.length > 0 && (
										<p className="text-sm text-gray-600 dark:text-gray-300">
											{t("amountPerPerson")}: €
											{calculateAmountPerMember().toFixed(2)}
										</p>
									)}
								</div>
							)}
						</div>
					)}

					<div className="space-y-2">
						<Label>{t("consumedByLabel")}</Label>
						<div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
							{activeMembersAtDate.map((member) => (
								<div key={member.id} className="flex items-center space-x-2">
									<Checkbox
										id={member.id}
										checked={selectedMembers.includes(member.id)}
										onCheckedChange={(checked) =>
											handleMemberToggle(member.id, checked as boolean)
										}
									/>
									<Label htmlFor={member.id} className="text-sm font-normal">
										{member.name}
									</Label>
								</div>
							))}
							{activeMembersAtDate.length === 0 && (
								<p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
									{t("noActiveMembers")}
								</p>
							)}
						</div>
					</div>

					<div className="flex justify-end space-x-2">
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
							disabled={loading || selectedMembers.length === 0}
						>
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
			</DialogContent>
		</Dialog>
	);
}
