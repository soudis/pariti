"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Group, Member } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	createExpenseAction,
	editExpenseAction,
	getActiveMembersForDate,
} from "@/actions";
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
	SelectField,
	TextField,
} from "@/components/ui/form-field";
import { MemberEditor } from "@/components/ui/member-editor";
import { type ExpenseFormData, expenseSchema } from "@/lib/schemas";
import { handleActionErrors } from "@/lib/utils";

interface ExpenseDialogProps {
	group: Group & {
		members: Member[];
	};
	children: React.ReactNode;
	expense?: ExpenseFormData & { id: string }; // For editing existing expense
}

export function ExpenseDialog({
	group,
	children,
	expense,
}: ExpenseDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [activeMembersAtDate, setActiveMembersAtDate] = useState<Member[]>(
		group.members,
	);
	const t = useTranslations("forms.expense");
	const { executeAsync: createExpense } = useAction(createExpenseAction);
	const { executeAsync: editExpense } = useAction(editExpenseAction);

	const form = useForm({
		resolver: zodResolver(expenseSchema),
		defaultValues: {
			title: "",
			description: "",
			amount: 0,
			paidById: "",
			date: new Date(),
			splitAll: false,
			selectedMembers: [],
			isRecurring: false,
			recurringType: "monthly",
			recurringStartDate: undefined,
			memberAmounts: [],
		},
	});

	const currentDate = form.watch("date") as Date;

	// Initialize form with expense data when editing
	useEffect(() => {
		if (expense) {
			form.reset({
				title: expense.title,
				description: expense.description || "",
				amount: expense.amount,
				paidById: expense.paidById,
				date: new Date(expense.date),
				splitAll: expense.splitAll,
				selectedMembers: expense.splitAll ? [] : expense.selectedMembers,
				isRecurring: expense.isRecurring,
				recurringType: expense.recurringType || "monthly",
				recurringStartDate: expense.recurringStartDate
					? new Date(expense.recurringStartDate)
					: undefined,
			});
		} else {
			form.reset({
				title: "",
				description: "",
				amount: 0,
				paidById: "",
				date: new Date(),
				splitAll: false,
				selectedMembers: [],
				isRecurring: false,
				recurringType: "monthly",
				recurringStartDate: undefined,
				memberAmounts: [],
			});
		}
	}, [expense, form]);

	const updateActiveMembersForDate = useCallback(
		async (date: Date) => {
			try {
				const activeMembers = await getActiveMembersForDate(group.id, date);
				setActiveMembersAtDate(activeMembers);

				// If split all is enabled, update selected members to active members at this date
				const splitAll = form.getValues("splitAll");
				if (splitAll) {
					form.setValue(
						"selectedMembers",
						activeMembers.map((member) => member.id),
					);
				}
			} catch (error) {
				console.error("Failed to get active members:", error);
			}
		},
		[group.id, form],
	);

	// Initialize active members when dialog opens
	useEffect(() => {
		if (open) {
			form.reset();
		}
	}, [open, form]);

	useEffect(() => {
		updateActiveMembersForDate(currentDate);
	}, [currentDate, updateActiveMembersForDate]);

	const onSubmit = async (data: ExpenseFormData) => {
		setLoading(true);

		try {
			// Include member amounts in the data
			const expenseData = {
				...data,
				memberAmounts: data.memberAmounts?.length
					? data.memberAmounts
					: undefined,
			};

			if (expense) {
				handleActionErrors(
					await editExpense({ expenseId: expense.id, expense: expenseData }),
				);
			} else {
				// Create new expense
				handleActionErrors(
					await createExpense({ groupId: group.id, expense: expenseData }),
				);
			}

			setOpen(false);
		} catch (error) {
			console.error(
				`Failed to ${expense ? "update" : "create"} expense:`,
				error,
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] h-full sm:h-[90vh] flex flex-col">
				<DialogHeader className="flex-shrink-0">
					<DialogTitle>{expense ? t("editTitle") : t("title")}</DialogTitle>
					<DialogDescription>
						{expense ? t("editDescription") : t("description")}
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
								name="title"
								label={t("titleField")}
								placeholder={t("titlePlaceholder")}
								required
							/>

							<TextField
								control={form.control}
								name="description"
								label={t("description")}
								placeholder={t("descriptionPlaceholder")}
							/>

							<div className="grid grid-cols-2 gap-4">
								<TextField
									control={form.control}
									name="amount"
									label={t("amount")}
									type="number"
									step="0.01"
									min={0}
									placeholder={t("amountPlaceholder")}
									required
								/>

								<SelectField
									control={form.control}
									name="paidById"
									label={t("paidBy")}
									placeholder={t("paidByPlaceholder")}
									required
									options={group.members.map((member) => ({
										value: member.id,
										label: member.name,
									}))}
								/>
							</div>

							<DateField
								control={form.control}
								name="date"
								label={t("date")}
								placeholder={t("datePlaceholder")}
							/>

							{/* Recurring Options */}
							<div className="space-y-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
								<CheckboxField
									control={form.control}
									name="isRecurring"
									label={t("recurring.title")}
								/>

								{(form.watch("isRecurring") as boolean) && (
									<div className="space-y-4 pl-6">
										<div className="grid grid-cols-2 gap-4">
											<SelectField
												control={form.control}
												name="recurringType"
												label={t("recurring.frequency")}
												options={[
													{ value: "weekly", label: t("recurring.weekly") },
													{ value: "monthly", label: t("recurring.monthly") },
													{ value: "yearly", label: t("recurring.yearly") },
												]}
											/>

											<DateField
												control={form.control}
												name="recurringStartDate"
												label={t("recurring.startDate")}
												placeholder={t("recurring.startDatePlaceholder")}
											/>
										</div>

										<p className="text-xs text-gray-600 dark:text-gray-400">
											{t("recurring.description", {
												type: form.watch("recurringType") || "monthly",
											})}
										</p>
									</div>
								)}
							</div>

							<MemberEditor
								members={activeMembersAtDate.map((member) => ({
									...member,
									weight: Number(member.weight),
								}))}
								activeMembersAtDate={activeMembersAtDate.map((member) => ({
									...member,
									weight: Number(member.weight),
								}))}
								expenseDate={form.watch("date") as Date}
								currency={group.currency}
								weightsEnabled={group.weightsEnabled}
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
						{loading
							? expense
								? t("updating")
								: t("adding")
							: expense
								? t("update")
								: t("add")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
