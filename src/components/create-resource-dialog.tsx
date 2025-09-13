"use client";

import { Decimal } from "decimal.js";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createResource, editResource } from "@/lib/actions";
import { convertToPlainObject } from "@/lib/utils";

interface CreateResourceDialogProps {
	groupId: string;
	children: React.ReactNode;
	resource?: any; // For editing existing resource
	onResourceUpdated?: () => void;
}

export function CreateResourceDialog({
	groupId,
	children,
	resource,
	onResourceUpdated,
}: CreateResourceDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [hasUnit, setHasUnit] = useState(false);
	const t = useTranslations("forms.createResource");
	const nameId = useId();

	// Initialize form with resource data when editing
	useEffect(() => {
		if (resource) {
			setHasUnit(!!(resource.unit && resource.unitPrice));
		} else {
			setHasUnit(false);
		}
	}, [resource]);
	const descriptionId = useId();
	const hasUnitId = useId();
	const unitId = useId();
	const unitPriceId = useId();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const description = formData.get("description") as string;
		const unit = formData.get("unit") as string;
		const unitPrice = formData.get("unitPrice") as string;

		try {
			if (resource) {
				// Edit existing resource
				await editResource(resource.id, {
					name,
					description: description || undefined,
					unit: hasUnit ? unit || undefined : undefined,
					unitPrice: hasUnit && unitPrice ? parseFloat(unitPrice) : undefined,
				});
			} else {
				// Create new resource
				await createResource(
					convertToPlainObject({
						name,
						description: description || null,
						unit: hasUnit ? unit || null : null,
						unitPrice: hasUnit && unitPrice ? new Decimal(unitPrice) : null,
						groupId,
					}),
				);
			}

			setOpen(false);
			if (onResourceUpdated) {
				onResourceUpdated();
			}
		} catch (error) {
			console.error(
				`Failed to ${resource ? "update" : "create"} resource:`,
				error,
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{resource ? "Edit Resource" : t("title")}</DialogTitle>
					<DialogDescription>
						{resource ? "Update the resource details." : t("description")}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={nameId}>{t("name")}</Label>
						<Input
							id={nameId}
							name="name"
							placeholder={t("namePlaceholder")}
							defaultValue={resource?.name || ""}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={descriptionId}>{t("descriptionLabel")}</Label>
						<Input
							id={descriptionId}
							name="description"
							placeholder={t("descriptionPlaceholder")}
							defaultValue={resource?.description || ""}
						/>
					</div>

					<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
						<div className="flex items-center space-x-2">
							<Checkbox
								id={hasUnitId}
								checked={hasUnit}
								onCheckedChange={(checked) => setHasUnit(checked as boolean)}
							/>
							<Label htmlFor={hasUnitId} className="text-sm font-medium">
								{t("hasUnit")}
							</Label>
						</div>

						{hasUnit && (
							<div className="space-y-4 pl-6">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor={unitId}>{t("unitLabel")}</Label>
										<Input
											id={unitId}
											name="unit"
											placeholder={t("unitPlaceholder")}
											defaultValue={resource?.unit || ""}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={unitPriceId}>{t("unitPriceLabel")}</Label>
										<Input
											id={unitPriceId}
											name="unitPrice"
											type="number"
											step="0.01"
											min="0"
											placeholder="0.00"
											defaultValue={resource?.unitPrice || ""}
										/>
									</div>
								</div>
								<p className="text-xs text-gray-600 dark:text-gray-400">
									{t("unitInfo")}
								</p>
							</div>
						)}
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
						<Button type="submit" disabled={loading}>
							{loading
								? resource
									? "Updating..."
									: t("creating")
								: resource
									? "Update Resource"
									: t("create")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
