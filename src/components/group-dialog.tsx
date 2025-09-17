"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createGroupAction } from "@/actions/create-group";
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
	SelectField,
	TextField,
} from "@/components/ui/form-field";
import { type GroupFormData, groupSchema } from "@/lib/schemas";
import { handleActionErrors } from "@/lib/utils";

interface GroupDialogProps {
	children: React.ReactNode;
}

export function GroupDialog({ children }: GroupDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const locale = useLocale();
	const t = useTranslations("forms.group");

	const { executeAsync: createGroup } = useAction(createGroupAction);
	const form = useForm({
		resolver: zodResolver(groupSchema),
		defaultValues: {
			name: "",
			description: "",
			currency: "EUR",
			weightsEnabled: false,
		},
	});

	useEffect(() => {
		if (open) {
			form.reset();
		}
	}, [open, form]);

	console.log(form.formState.isSubmitting);

	const onSubmit = async (data: GroupFormData) => {
		setLoading(true);

		const group = handleActionErrors(await createGroup({ group: data }));

		setOpen(false);
		form.reset();

		router.push(`/${locale}/group/${group.id}`);
		setLoading(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] h-full sm:h-[60vh] flex flex-col">
				<DialogHeader className="flex-shrink-0">
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
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

							<SelectField
								control={form.control}
								name="currency"
								label={t("currency")}
								options={[
									{ value: "USD", label: "USD - US Dollar" },
									{ value: "EUR", label: "EUR - Euro" },
									{ value: "GBP", label: "GBP - British Pound" },
									{ value: "CHF", label: "CHF - Swiss Franc" },
									{ value: "CAD", label: "CAD - Canadian Dollar" },
									{ value: "AUD", label: "AUD - Australian Dollar" },
									{ value: "JPY", label: "JPY - Japanese Yen" },
									{ value: "CNY", label: "CNY - Chinese Yuan" },
									{ value: "INR", label: "INR - Indian Rupee" },
									{ value: "BRL", label: "BRL - Brazilian Real" },
								]}
								required
							/>

							<CheckboxField
								control={form.control}
								name="weightsEnabled"
								label={t("weightsEnabled")}
								description={t("weightsEnabledDescription")}
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
						{loading ? t("creating") : t("create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
