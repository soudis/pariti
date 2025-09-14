"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createSettlementAction } from "@/actions";
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
import { SelectField, TextField } from "@/components/ui/form-field";
import { type SettlementFormData, settlementSchema } from "@/lib/schemas";
import { handleActionErrors } from "@/lib/utils";

interface Member {
	id: string;
	name: string;
}

interface Resource {
	id: string;
	name: string;
}

interface SettlementDialogProps {
	groupId: string;
	members: Member[];
	resources: Resource[];
	children: React.ReactNode;
}

export function SettlementDialog({
	groupId,
	members,
	resources,
	children,
}: SettlementDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const t = useTranslations("forms.createSettlement");

	const { executeAsync: createSettlement } = useAction(createSettlementAction);

	const form = useForm({
		resolver: zodResolver(settlementSchema),
		defaultValues: {
			title: "",
			description: "",
			settlementType: "optimized",
			centerId: "",
		},
	});

	const onSubmit = async (data: SettlementFormData) => {
		setLoading(true);

		handleActionErrors(await createSettlement({ groupId, settlement: data }));

		setOpen(false);
		form.reset();
		setLoading(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<TextField
							control={form.control}
							name="title"
							label={t("titleLabel")}
							placeholder={t("titlePlaceholder")}
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
							name="settlementType"
							label={t("settlementTypeLabel")}
							options={[
								{ value: "optimized", label: t("optimized") },
								{ value: "around_member", label: t("aroundMember") },
								{ value: "around_resource", label: t("aroundResource") },
							]}
						/>

						{form.watch("settlementType") !== "optimized" && (
							<SelectField
								control={form.control}
								name="centerId"
								label={
									form.watch("settlementType") === "around_member"
										? t("centerMemberLabel")
										: t("centerResourceLabel")
								}
								placeholder={t("selectCenter")}
								required
								options={
									form.watch("settlementType") === "around_member"
										? members.map((member) => ({
												value: member.id,
												label: member.name,
											}))
										: resources.map((resource) => ({
												value: resource.id,
												label: resource.name,
											}))
								}
							/>
						)}

						<div className="space-y-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
							<h4 className="font-medium text-sm">
								{t("settlementTypeInfo.title")}
							</h4>
							<div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
								{form.watch("settlementType") === "optimized" && (
									<p>{t("settlementTypeInfo.optimized")}</p>
								)}
								{form.watch("settlementType") === "around_member" && (
									<p>{t("settlementTypeInfo.aroundMember")}</p>
								)}
								{form.watch("settlementType") === "around_resource" && (
									<p>{t("settlementTypeInfo.aroundResource")}</p>
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
							<Button type="submit" disabled={loading}>
								{loading ? t("generating") : t("generate")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
