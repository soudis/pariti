"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Group, Member } from "@prisma/client";
import { Decimal } from "decimal.js";
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
import { MemberSelection } from "@/components/ui/member-selection";
import { type ExpenseFormData, expenseSchema } from "@/lib/schemas";
import { convertToPlainObject, handleActionErrors } from "@/lib/utils";

interface AddExpenseDialogProps {
	group: Group & {
		members: Member[];
	};
	children: React.ReactNode;
	expense?: ExpenseFormData & { id: string }; // For editing existing expense
	onExpenseUpdated?: () => void;
}

export function AddExpenseDialog({
	group,
	children,
	expense,
	onExpenseUpdated,
}: AddExpenseDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [activeMembersAtDate, setActiveMembersAtDate] = useState<Member[]>(
		group.members,
	);
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
		},
	});

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
			const currentDate = form.getValues("date") as Date;
			updateActiveMembersForDate(currentDate);
		}
	}, [open, form, updateActiveMembersForDate]);

	const onSubmit = async (data: ExpenseFormData) => {
		setLoading(true);

		try {
			if (expense) {
				handleActionErrors(
					await editExpense({ expenseId: expense.id, expense: data }),
				);
			} else {
				// Create new expense
				handleActionErrors(
					await createExpense({ groupId: group.id, expense: data }),
				);
			}

			setOpen(false);
			if (onExpenseUpdated) {
				onExpenseUpdated();
			}
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
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle>
					<DialogDescription>
						{expense
							? "Update the expense details and member selection."
							: "Add a new expense to your group. Select which members this expense applies to."}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<TextField
							control={form.control}
							name="title"
							label="Title"
							placeholder="e.g., Dinner at restaurant"
							required
						/>

						<TextField
							control={form.control}
							name="description"
							label="Description (optional)"
							placeholder="e.g., Great food and drinks"
						/>

						<div className="grid grid-cols-2 gap-4">
							<TextField
								control={form.control}
								name="amount"
								label="Amount"
								type="number"
								step="0.01"
								min={0}
								placeholder="0.00"
								required
							/>

							<SelectField
								control={form.control}
								name="paidById"
								label="Paid by"
								placeholder="Select member"
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
							label="Date"
							placeholder="Select expense date"
						/>

						{/* Recurring Options */}
						<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
							<CheckboxField
								control={form.control}
								name="isRecurring"
								label="Make this a recurring expense"
							/>

							{(form.watch("isRecurring") as boolean) && (
								<div className="space-y-4 pl-6">
									<div className="grid grid-cols-2 gap-4">
										<SelectField
											control={form.control}
											name="recurringType"
											label="Frequency"
											options={[
												{ value: "weekly", label: "Weekly" },
												{ value: "monthly", label: "Monthly" },
												{ value: "yearly", label: "Yearly" },
											]}
										/>

										<DateField
											control={form.control}
											name="recurringStartDate"
											label="Start Date"
											placeholder="Select start date"
										/>
									</div>

									<p className="text-xs text-gray-600 dark:text-gray-400">
										This expense will be automatically generated for each{" "}
										{form.watch("recurringType")} period from the start date.
									</p>
								</div>
							)}
						</div>

						<MemberSelection
							members={group.members}
							selectedMembers={form.watch("selectedMembers")}
							onSelectionChange={(members) =>
								form.setValue("selectedMembers", members)
							}
							splitAll={form.watch("splitAll") as boolean}
							onSplitAllChange={(splitAll) =>
								form.setValue("splitAll", splitAll)
							}
							activeMembersAtDate={activeMembersAtDate}
							expenseDate={form.watch("date") as Date}
						/>

						<div className="flex justify-end space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={loading}>
								{loading
									? expense
										? "Updating..."
										: "Adding..."
									: expense
										? "Update Expense"
										: "Add Expense"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
