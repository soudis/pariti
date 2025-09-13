"use client";

import type { Group, Member } from "@prisma/client";
import { Decimal } from "decimal.js";
import { useEffect, useId, useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createExpense, getActiveMembersForDate } from "@/lib/actions";
import { convertToPlainObject } from "@/lib/utils";

interface AddExpenseDialogProps {
	group: Group & {
		members: Member[];
	};
	children: React.ReactNode;
}

export function AddExpenseDialog({ group, children }: AddExpenseDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
	const [splitAll, setSplitAll] = useState(false);
	const [amount, setAmount] = useState("");
	const [isRecurring, setIsRecurring] = useState(false);
	const [recurringType, setRecurringType] = useState<
		"weekly" | "monthly" | "yearly"
	>("monthly");
	const [recurringStartDate, setRecurringStartDate] = useState<Date>();
	const [expenseDate, setExpenseDate] = useState<Date>(new Date());
	const [activeMembersAtDate, setActiveMembersAtDate] = useState<Member[]>(
		group.members,
	);

	// Initialize active members when dialog opens
	// biome-ignore lint/correctness/useExhaustiveDependencies: no update needed
	useEffect(() => {
		if (open) {
			updateActiveMembersForDate(expenseDate);
		}
	}, [open]);

	const handleMemberToggle = (memberId: string, checked: boolean) => {
		if (checked) {
			setSelectedMembers([...selectedMembers, memberId]);
		} else {
			setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
		}
	};

	const handleSplitAllToggle = (checked: boolean) => {
		setSplitAll(checked);
		if (checked) {
			// Select all active members at the expense date when "split all" is enabled
			setSelectedMembers(activeMembersAtDate.map((member) => member.id));
		} else {
			// Clear selection when "split all" is disabled
			setSelectedMembers([]);
		}
	};

	const updateActiveMembersForDate = async (date: Date) => {
		try {
			const activeMembers = await getActiveMembersForDate(group.id, date);
			setActiveMembersAtDate(activeMembers);

			// If split all is enabled, update selected members to active members at this date
			if (splitAll) {
				setSelectedMembers(activeMembers.map((member) => member.id));
			}
		} catch (error) {
			console.error("Failed to get active members:", error);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const title = formData.get("title") as string;
		const description = formData.get("description") as string;
		const amount = parseFloat(formData.get("amount") as string);
		const paidById = formData.get("paidBy") as string;

		if (selectedMembers.length === 0) {
			alert("Please select at least one member for this expense");
			setLoading(false);
			return;
		}

		if (isRecurring && !recurringStartDate) {
			alert("Please select a start date for recurring expenses");
			setLoading(false);
			return;
		}

		try {
			await createExpense(
				convertToPlainObject({
					title,
					description: description || null,
					amount: new Decimal(amount),
					groupId: group.id,
					paidById,
					memberIds: selectedMembers,
					splitAll,
					isRecurring,
					recurringType: isRecurring ? recurringType : null,
					recurringStartDate: isRecurring ? (recurringStartDate ?? null) : null,
					date: expenseDate,
				}),
			);

			setOpen(false);
			setSelectedMembers([]);
			setSplitAll(false);
			setAmount("");
			setIsRecurring(false);
			setRecurringType("monthly");
			setRecurringStartDate(undefined);
			setExpenseDate(new Date());
			// Reset form
			// e.currentTarget.reset()
		} catch (error) {
			console.error("Failed to create expense:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Add Expense</DialogTitle>
					<DialogDescription>
						Add a new expense to your group. Select which members this expense
						applies to.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id={useId()}
							name="title"
							placeholder="e.g., Dinner at restaurant"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description (optional)</Label>
						<Input
							id={useId()}
							name="description"
							placeholder="e.g., Great food and drinks"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="amount">Amount</Label>
							<Input
								id={useId()}
								name="amount"
								type="number"
								step="0.01"
								min="0"
								placeholder="0.00"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="paidBy">Paid by</Label>
							<Select name="paidBy" required>
								<SelectTrigger>
									<SelectValue placeholder="Select member" />
								</SelectTrigger>
								<SelectContent>
									{group.members.map((member) => (
										<SelectItem key={member.id} value={member.id}>
											{member.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="expenseDate">Date</Label>
						<DatePicker
							value={expenseDate}
							onChange={(date) => {
								const newDate = date || new Date();
								setExpenseDate(newDate);
								updateActiveMembersForDate(newDate);
							}}
							placeholder="Select expense date"
						/>
					</div>

					{/* Recurring Options */}
					<div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
						<div className="flex items-center space-x-2">
							<Checkbox
								id={useId()}
								checked={isRecurring}
								onCheckedChange={(checked) =>
									setIsRecurring(checked as boolean)
								}
							/>
							<Label htmlFor="isRecurring" className="text-sm font-medium">
								Make this a recurring expense
							</Label>
						</div>

						{isRecurring && (
							<div className="space-y-4 pl-6">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="recurringType">Frequency</Label>
										<Select
											value={recurringType}
											onValueChange={(value: "weekly" | "monthly" | "yearly") =>
												setRecurringType(value)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="weekly">Weekly</SelectItem>
												<SelectItem value="monthly">Monthly</SelectItem>
												<SelectItem value="yearly">Yearly</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="recurringStartDate">Start Date</Label>
										<DatePicker
											value={recurringStartDate}
											onChange={(date) => setRecurringStartDate(date)}
											placeholder="Select start date"
										/>
									</div>
								</div>

								<p className="text-xs text-gray-600 dark:text-gray-400">
									This expense will be automatically generated for each{" "}
									{recurringType} period from the start date.
								</p>
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label>Split between</Label>

						{/* All Members Option */}
						<div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
							<Checkbox
								id={useId()}
								checked={splitAll}
								onCheckedChange={(checked) =>
									handleSplitAllToggle(checked as boolean)
								}
							/>
							<Label
								htmlFor={useId()}
								className="text-sm font-medium text-blue-700 dark:text-blue-300"
							>
								All Members (including future members)
							</Label>
						</div>

						<div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
							{activeMembersAtDate.map((member) => (
								<div key={member.id} className="flex items-center space-x-2">
									<Checkbox
										id={member.id}
										checked={selectedMembers.includes(member.id)}
										onCheckedChange={(checked) =>
											handleMemberToggle(member.id, checked as boolean)
										}
										disabled={splitAll}
									/>
									<Label
										htmlFor={member.id}
										className={`text-sm font-normal ${splitAll ? "text-gray-400 dark:text-gray-500" : ""}`}
									>
										{member.name}
									</Label>
								</div>
							))}
							{activeMembersAtDate.length === 0 && (
								<p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
									No active members on this date
								</p>
							)}
						</div>

						{selectedMembers.length > 0 && (
							<div className="space-y-1">
								<p className="text-sm text-gray-600 dark:text-gray-300">
									Amount per person: $
									{(Number(amount || 0) / selectedMembers.length).toFixed(2)}
								</p>
								{splitAll && (
									<p className="text-xs text-blue-600 dark:text-blue-400">
										This expense will include all {activeMembersAtDate.length}{" "}
										active members on {expenseDate.toLocaleDateString()}
									</p>
								)}
							</div>
						)}
					</div>

					<div className="flex justify-end space-x-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={loading || selectedMembers.length === 0}
						>
							{loading ? "Adding..." : "Add Expense"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
