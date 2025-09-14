"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Member } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
import { type MemberFormData, memberSchema } from "@/lib/schemas";

interface EditMemberDialogProps {
	member: MemberFormData & { id: string };
	weightsEnabled: boolean;
	onUpdate: (memberId: Member["id"], data: MemberFormData) => Promise<void>;
	children: React.ReactNode;
}

export function EditMemberDialog({
	member,
	weightsEnabled,
	onUpdate,
	children,
}: EditMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const t = useTranslations("forms.editMember");

	const form = useForm({
		resolver: zodResolver(memberSchema),
		defaultValues: {
			name: member.name,
			email: member.email || "",
			iban: member.iban || "",
			weight: member.weight || 1,
			activeFrom: member.activeFrom,
			activeTo: member.activeTo ? new Date(member.activeTo) : undefined,
			hasEndDate: !!member.activeTo,
		},
	});

	// Reset form when dialog opens
	useEffect(() => {
		if (open) {
			form.reset({
				name: member.name,
				email: member.email || "",
				iban: member.iban || "",
				weight: member.weight || 1,
				activeFrom: member.activeFrom,
				activeTo: member.activeTo ? new Date(member.activeTo) : undefined,
				hasEndDate: !!member.activeTo,
			});
		}
	}, [open, member, form]);

	const onSubmit = async (data: MemberFormData) => {
		setLoading(true);

		try {
			await onUpdate(member.id, data);

			setOpen(false);
		} catch (error) {
			console.error("Failed to update member:", error);
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
							name="email"
							label={t("email")}
							type="email"
							placeholder={t("emailPlaceholder")}
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
								{loading ? t("updating") : t("update")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
