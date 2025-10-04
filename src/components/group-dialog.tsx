"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
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
import { GroupForm } from "@/components/ui/group-form";
import type { GroupFormData } from "@/lib/schemas";
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

	const onSubmit = async (data: GroupFormData) => {
		setLoading(true);

		const group = handleActionErrors(await createGroup({ group: data }));

		setOpen(false);
		router.push(`/${locale}/group/${group.id}`);
		setLoading(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] h-full flex flex-col">
				<DialogHeader className="flex-shrink-0">
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<div className="flex-1 overflow-y-auto">
					<GroupForm
						onSubmit={onSubmit}
						loading={loading}
						className="px-4 sm:px-6 pb-4"
						formId="group-form"
					/>
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
					<Button type="submit" disabled={loading} form="group-form">
						{loading ? t("creating") : t("create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
