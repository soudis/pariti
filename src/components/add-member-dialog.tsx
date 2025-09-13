"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
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
import { addMember } from "@/lib/actions";

interface AddMemberDialogProps {
	groupId: string;
	children: React.ReactNode;
}

export function AddMemberDialog({ groupId, children }: AddMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [activeFrom, setActiveFrom] = useState<Date>(new Date());
	const [activeTo, setActiveTo] = useState<Date>();
	const [hasEndDate, setHasEndDate] = useState(false);
	const t = useTranslations("forms.addMember");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const email = formData.get("email") as string;
		const iban = formData.get("iban") as string;

		try {
			await addMember({
				name,
				email: email || undefined,
				iban: iban || undefined,
				groupId,
				activeFrom,
				activeTo: hasEndDate ? activeTo : undefined,
			});

			setOpen(false);
			setActiveFrom(new Date());
			setActiveTo(undefined);
			setHasEndDate(false);
			// Reset form
			// e.currentTarget.reset()
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
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">{t("name")}</Label>
						<Input
							id={useId()}
							name="name"
							placeholder={t("namePlaceholder")}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">{t("email")}</Label>
						<Input
							id={useId()}
							name="email"
							type="email"
							placeholder={t("emailPlaceholder")}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="iban">{t("iban")}</Label>
						<Input
							id={useId()}
							name="iban"
							placeholder={t("ibanPlaceholder")}
						/>
					</div>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="activeFrom">{t("activeFrom")}</Label>
							<DatePicker
								value={activeFrom}
								onChange={(date) => setActiveFrom(date || new Date())}
								placeholder={t("activeFromPlaceholder")}
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Checkbox
									id={useId()}
									checked={hasEndDate}
									onCheckedChange={(checked) =>
										setHasEndDate(checked as boolean)
									}
								/>
								<Label htmlFor="hasEndDate" className="text-sm">
									{t("setEndDate")}
								</Label>
							</div>

							{hasEndDate && (
								<DatePicker
									value={activeTo}
									onChange={(date) => setActiveTo(date)}
									placeholder={t("activeToPlaceholder")}
								/>
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
							{loading ? t("adding") : t("add")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
