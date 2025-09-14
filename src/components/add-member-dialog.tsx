"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
	NumberField,
	TextField,
} from "@/components/ui/form-field";
import { addMember } from "@/lib/actions";
import { type MemberFormData, memberSchema } from "@/lib/schemas";

interface AddMemberDialogProps {
	groupId: string;
	weightsEnabled: boolean;
	children: React.ReactNode;
}

export function AddMemberDialog({
	groupId,
	weightsEnabled,
	children,
}: AddMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const t = useTranslations("forms.addMember");

	const form = useForm({
		resolver: zodResolver(memberSchema),
		defaultValues: {
			name: "",
			iban: "",
			weight: 1,
			activeFrom: new Date(),
			activeTo: undefined,
			hasEndDate: false,
		},
	});

	const onSubmit = async (data: MemberFormData) => {
		setLoading(true);

		try {
			await addMember({
				name: data.name,
				iban: data.iban || undefined,
				weight: data.weight || 1,
				groupId,
				activeFrom: data.activeFrom,
				activeTo: data.activeTo || undefined,
			});

			setOpen(false);
			form.reset();
		} catch (error) {
			console.error("Failed to add member:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<TextField
							control={form.control}
							name="name"
							label={t("name")}
							placeholder={t("namePlaceholder")}
							required
						/>

						<TextField
							control={form.control}
							name="iban"
							label={t("iban")}
							placeholder={t("ibanPlaceholder")}
						/>

						{weightsEnabled && (
							<NumberField
								control={form.control}
								name="weight"
								label={t("weight")}
								placeholder={t("weightPlaceholder")}
								description={t("weightDescription")}
								step="0.1"
								min={0.1}
							/>
						)}

						<DateField
							control={form.control}
							name="activeFrom"
							label={t("activeFrom")}
							placeholder={t("activeFromPlaceholder")}
						/>

						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<CheckboxField
									control={form.control}
									name="hasEndDate"
									text={t("setEndDate")}
								/>
							</div>

							{(form.watch("hasEndDate") as Date) && (
								<DateField
									control={form.control}
									name="activeTo"
									label={t("activeTo")}
									placeholder={t("activeToPlaceholder")}
								/>
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
								{loading ? t("adding") : t("add")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
