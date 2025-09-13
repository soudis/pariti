"use client";

import type { Member } from "@prisma/client";
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

interface EditMemberDialogProps {
	member: Member;
	onUpdate: (
		memberId: string,
		data: {
			name: string;
			email?: string;
			iban?: string;
			activeFrom: Date;
			activeTo?: Date;
		},
	) => Promise<void>;
	children: React.ReactNode;
}

export function EditMemberDialog({
	member,
	onUpdate,
	children,
}: EditMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState(member.name);
	const [email, setEmail] = useState(member.email || "");
	const [iban, setIban] = useState(member.iban || "");
	const [activeFrom, setActiveFrom] = useState<Date>(
		new Date(member.activeFrom),
	);
	const [activeTo, setActiveTo] = useState<Date | undefined>(
		member.activeTo ? new Date(member.activeTo) : undefined,
	);
	const [hasEndDate, setHasEndDate] = useState(!!member.activeTo);
	const t = useTranslations("forms.editMember");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		try {
			await onUpdate(member.id, {
				name,
				email: email || undefined,
				iban: iban || undefined,
				activeFrom,
				activeTo: hasEndDate ? activeTo : undefined,
			});

			setOpen(false);
		} catch (error) {
			console.error("Failed to update member:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			// Reset form when closing
			setName(member.name);
			setEmail(member.email || "");
			setIban(member.iban || "");
			setActiveFrom(new Date(member.activeFrom));
			setActiveTo(member.activeTo ? new Date(member.activeTo) : undefined);
			setHasEndDate(!!member.activeTo);
		}
		setOpen(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
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
							value={name}
							onChange={(e) => setName(e.target.value)}
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
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={t("emailPlaceholder")}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="iban">{t("iban")}</Label>
						<Input
							id={useId()}
							name="iban"
							value={iban}
							onChange={(e) => setIban(e.target.value)}
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
									name="hasEndDate"
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
							{loading ? t("updating") : t("update")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
