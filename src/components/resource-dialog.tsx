"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createResourceAction, editResourceAction } from "@/actions";
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
import { CheckboxField, TextField } from "@/components/ui/form-field";
import { type ResourceFormData, resourceSchema } from "@/lib/schemas";
import { handleActionErrors } from "@/lib/utils";

interface ResourceDialogProps {
	groupId: string;
	children: React.ReactNode;
	resource?: ResourceFormData & { id: string }; // For editing existing resource
}

export function ResourceDialog({
	groupId,
	children,
	resource,
}: ResourceDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const t = useTranslations("forms.resource");
	const router = useRouter();
	const locale = useLocale();
	const { executeAsync: createResource } = useAction(createResourceAction);
	const { executeAsync: editResource } = useAction(editResourceAction);

	const form = useForm({
		resolver: zodResolver(resourceSchema),
		defaultValues: {
			name: "",
			description: "",
			hasUnit: false,
			unit: "",
			unitPrice: 0,
		},
	});

	// Initialize form with resource data when editing
	useEffect(() => {
		if (resource) {
			form.reset({
				name: resource.name,
				description: resource.description || "",
				hasUnit: !!(resource.unit && resource.unitPrice),
				unit: resource.unit || "",
				unitPrice: resource.unitPrice || 0,
			});
		} else {
			form.reset({
				name: "",
				description: "",
				hasUnit: false,
				unit: "",
				unitPrice: 0,
			});
		}
	}, [resource, form]);

	const onSubmit = async (data: ResourceFormData) => {
		setLoading(true);

		if (resource) {
			// Edit existing resource
			handleActionErrors(
				await editResource({ resourceId: resource.id, resource: data }),
			);
		} else {
			// Create new resource
			handleActionErrors(await createResource({ groupId, resource: data }));
			router.push(`/${locale}/group/${groupId}?tab=resources`);
		}

		setOpen(false);
		setLoading(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] h-full sm:h-[60vh] flex flex-col">
				<DialogHeader className="flex-shrink-0">
					<DialogTitle>{resource ? "Edit Resource" : t("title")}</DialogTitle>
					<DialogDescription>
						{resource ? "Update the resource details." : t("description")}
					</DialogDescription>
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

							<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
								<CheckboxField
									control={form.control}
									name="hasUnit"
									label={t("hasUnit")}
								/>

								{(form.watch("hasUnit") as boolean) && (
									<div className="space-y-4 pl-6">
										<div className="grid grid-cols-2 gap-4">
											<TextField
												control={form.control}
												name="unit"
												label={t("unitLabel")}
												placeholder={t("unitPlaceholder")}
											/>

											<TextField
												control={form.control}
												name="unitPrice"
												label={t("unitPriceLabel")}
												type="number"
												step="0.01"
												min={0}
												placeholder="0.00"
											/>
										</div>
										<p className="text-xs text-gray-600 dark:text-gray-400">
											{t("unitInfo")}
										</p>
									</div>
								)}
							</div>
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
							? resource
								? "Updating..."
								: t("creating")
							: resource
								? "Update Resource"
								: t("create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
