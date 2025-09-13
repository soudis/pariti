"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createSettlement } from "@/lib/actions";

interface Member {
	id: string;
	name: string;
}

interface Resource {
	id: string;
	name: string;
}

interface CreateSettlementDialogProps {
	groupId: string;
	members: Member[];
	resources: Resource[];
	children: React.ReactNode;
}

export function CreateSettlementDialog({
	groupId,
	members,
	resources,
	children,
}: CreateSettlementDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [settlementType, setSettlementType] = useState<
		"optimized" | "around_member" | "around_resource"
	>("optimized");
	const [centerId, setCenterId] = useState<string>("");
	const t = useTranslations("forms.createSettlement");
	const titleId = useId();
	const descriptionId = useId();
	const typeId = useId();
	const centerIdField = useId();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const title = formData.get("title") as string;
		const description = formData.get("description") as string;

		try {
			await createSettlement({
				groupId,
				title,
				description: description || undefined,
				settlementType,
				centerId: settlementType !== "optimized" ? centerId : undefined,
			});

			setOpen(false);
			setSettlementType("optimized");
			setCenterId("");
			// Reset form
			e.currentTarget.reset();
		} catch (error) {
			console.error("Failed to create settlement:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={titleId}>{t("titleLabel")}</Label>
						<Input
							id={titleId}
							name="title"
							placeholder={t("titlePlaceholder")}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={descriptionId}>{t("descriptionLabel")}</Label>
						<Input
							id={descriptionId}
							name="description"
							placeholder={t("descriptionPlaceholder")}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={typeId}>{t("settlementTypeLabel")}</Label>
						<Select
							value={settlementType}
							onValueChange={(
								value: "optimized" | "around_member" | "around_resource",
							) => setSettlementType(value)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="optimized">{t("optimized")}</SelectItem>
								<SelectItem value="around_member">
									{t("aroundMember")}
								</SelectItem>
								<SelectItem value="around_resource">
									{t("aroundResource")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{settlementType !== "optimized" && (
						<div className="space-y-2">
							<Label htmlFor={centerIdField}>
								{settlementType === "around_member"
									? t("centerMemberLabel")
									: t("centerResourceLabel")}
							</Label>
							<Select value={centerId} onValueChange={setCenterId} required>
								<SelectTrigger>
									<SelectValue placeholder={t("selectCenter")} />
								</SelectTrigger>
								<SelectContent>
									{settlementType === "around_member"
										? members.map((member) => (
												<SelectItem key={member.id} value={member.id}>
													{member.name}
												</SelectItem>
											))
										: resources.map((resource) => (
												<SelectItem key={resource.id} value={resource.id}>
													{resource.name}
												</SelectItem>
											))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="space-y-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
						<h4 className="font-medium text-sm">
							{t("settlementTypeInfo.title")}
						</h4>
						<div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
							{settlementType === "optimized" && (
								<p>{t("settlementTypeInfo.optimized")}</p>
							)}
							{settlementType === "around_member" && (
								<p>{t("settlementTypeInfo.aroundMember")}</p>
							)}
							{settlementType === "around_resource" && (
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
						<Button
							type="submit"
							disabled={
								loading || (settlementType !== "optimized" && !centerId)
							}
						>
							{loading ? t("generating") : t("generate")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
