"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createMemberAction } from "@/actions/create-member";
import type { getCalculatedGroup } from "@/actions/get-group";
import { updateMemberAction } from "@/actions/update-member";
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
	DateField,
	NumberField,
	TextField,
} from "@/components/ui/form-field";
import {
	getDefaultWeightTypes,
	type MemberFormData,
	memberSchema,
	type WeightType,
} from "@/lib/schemas";
import { handleActionErrors } from "@/lib/utils";

interface MemberDialogProps {
	group: Awaited<ReturnType<typeof getCalculatedGroup>>;
	weightsEnabled: boolean;
	weightTypes?: WeightType[];
	member?: MemberFormData & { id: string }; // For editing existing member
	children: React.ReactNode;
}

export function MemberDialog({
	group,
	group: { id: groupId },
	weightsEnabled,
	weightTypes,
	member,
	children,
}: MemberDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const t = useTranslations("forms.member");

	const { executeAsync: createMember } = useAction(createMemberAction);
	const { executeAsync: updateMember } = useAction(updateMemberAction);
	const router = useRouter();
	const locale = useLocale();

	// Get available weight types or use default
	const availableWeightTypes = weightTypes || getDefaultWeightTypes();

	const form = useForm({
		resolver: zodResolver(memberSchema),
		defaultValues: {
			name: member?.name || "",
			email: member?.email || "",
			iban: member?.iban || "",
			weight: member?.weight || 1, // Legacy field
			weights:
				member?.weights ||
				// biome-ignore lint/performance/noAccumulatingSpread: needed
				group.weightTypes.reduce((acc, wt) => ({ ...acc, [wt.id]: 1 }), {}), // New multiple weights field
			activeFrom: member?.activeFrom || new Date(),
			activeTo: member?.activeTo ? new Date(member.activeTo) : undefined,
			hasEndDate: !!member?.activeTo,
		},
	});

	// Reset form when dialog opens or member changes
	useEffect(() => {
		if (open) {
			form.reset({
				name: member?.name || "",
				email: member?.email || "",
				iban: member?.iban || "",
				weight: member?.weight || 1, // Legacy field
				weights:
					member?.weights ||
					// biome-ignore lint/performance/noAccumulatingSpread: needed
					group.weightTypes.reduce((acc, wt) => ({ ...acc, [wt.id]: 1 }), {}), // New multiple weights field
				activeFrom: member?.activeFrom || new Date(),
				activeTo: member?.activeTo ? new Date(member.activeTo) : undefined,
				hasEndDate: !!member?.activeTo,
			});
		}
	}, [open, member, form, group.weightTypes]);

	const onSubmit = async (data: MemberFormData) => {
		setLoading(true);

		try {
			if (member) {
				// Update existing member
				handleActionErrors(
					await updateMember({ memberId: member.id, member: data }),
				);
			} else {
				// Create new member
				handleActionErrors(await createMember({ groupId, member: data }));
				form.reset();
				router.push(`/${locale}/group/${groupId}?tab=members`);
			}
			setOpen(false);
		} catch (error) {
			console.error(`Failed to ${member ? "update" : "create"} member:`, error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] h-full flex flex-col">
				<DialogHeader className="flex-shrink-0">
					<DialogTitle>{member ? t("title") : t("title")}</DialogTitle>
					<DialogDescription>
						{member ? t("description") : t("description")}
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
								name="email"
								label={t("email")}
								placeholder={t("emailPlaceholder")}
								type="email"
							/>

							<TextField
								control={form.control}
								name="iban"
								label={t("iban")}
								placeholder={t("ibanPlaceholder")}
							/>

							{weightsEnabled && (
								<div className="space-y-4">
									{availableWeightTypes.length === 1 ? (
										// Single weight type (backward compatibility)
										<NumberField
											control={form.control}
											name="weight"
											label={t("weight")}
											placeholder={t("weightPlaceholder")}
											min={0}
											step="0.1"
											required
										/>
									) : (
										// Multiple weight types
										<div className="space-y-3">
											<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
												Weights
											</h4>
											{availableWeightTypes.map((weightType) => (
												<NumberField
													key={weightType.id}
													control={form.control}
													name={`weights.${weightType.id}`}
													label={weightType.name}
													placeholder={`Weight for ${weightType.name}`}
													min={0}
													step="0.1"
													required
												/>
											))}
										</div>
									)}
								</div>
							)}

							<DateField
								control={form.control}
								name="activeFrom"
								label={t("activeFrom")}
								placeholder={t("activeFromPlaceholder")}
								required
							/>

							<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
								<CheckboxField
									control={form.control}
									name="hasEndDate"
									label={t("hasEndDate")}
								/>

								{(form.watch("hasEndDate") as boolean) && (
									<div className="space-y-4 pl-6">
										<DateField
											control={form.control}
											name="activeTo"
											label={t("activeTo")}
											placeholder={t("activeToPlaceholder")}
											required
										/>
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
							? member
								? t("updating")
								: t("creating")
							: member
								? t("update")
								: t("create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
