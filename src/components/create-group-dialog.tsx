"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
import { TextField } from "@/components/ui/form-field";
import { createGroup } from "@/lib/actions";
import { type GroupFormData, groupSchema } from "@/lib/schemas";

interface CreateGroupDialogProps {
	children: React.ReactNode;
}

export function CreateGroupDialog({ children }: CreateGroupDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const locale = useLocale();
	const t = useTranslations("forms.createGroup");

	const form = useForm({
		resolver: zodResolver(groupSchema),
		defaultValues: {
			name: "",
			description: "",
		},
	});

	const onSubmit = async (data: any) => {
		setLoading(true);

		try {
			const group = await createGroup({
				name: data.name,
				description: data.description || undefined,
			});

			setOpen(false);
			form.reset();
			router.push(`/${locale}/group/${group.id}`);
		} catch (error) {
			console.error("Failed to create group:", error);
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
							name="description"
							label={t("descriptionLabel")}
							placeholder={t("descriptionPlaceholder")}
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
								{loading ? t("creating") : t("create")}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
