"use client";

import type { Member } from "@prisma/client";
import Decimal from "decimal.js";
import { Check, Edit3, Lock, Undo2, Unlock, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { getCalculatedGroup } from "@/actions/get-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
import { getCalculatedMemberAmounts } from "@/lib/get-calculated-member-amounts";
import {
	type ConsumptionFormData,
	type ExpenseFormData,
	getDefaultWeightTypes,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface MemberEditorProps {
	group: Awaited<ReturnType<typeof getCalculatedGroup>>;
	expenseDate: Date;
	className?: string;
	// For unit-based consumptions
	isUnitBased?: boolean;
	unitPrice?: number;
}

export function MemberEditor({
	group,
	group: { members, currency, weightsEnabled, weightTypes },
	expenseDate,
	className,
	isUnitBased = false,
	unitPrice = 1,
}: MemberEditorProps) {
	const splitAllId = useId();
	const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
	const [editingWeightMemberId, setEditingWeightMemberId] = useState<
		string | null
	>(null);
	const [tempWeightValue, setTempWeightValue] = useState<string>("");
	const [tempAmountValue, setTempAmountValue] = useState<string>("");
	const t = useTranslations("forms.expense");

	// Get available weight types or use default
	const availableWeightTypes = weightTypes || getDefaultWeightTypes();

	const { watch, setValue, formState } = useFormContext<
		ExpenseFormData | ConsumptionFormData
	>();
	const selectedMembersIds = watch("selectedMembers") || [];
	const splitAll = watch("splitAll") || false;
	const totalAmount = watch("amount") || 0;
	const sharingMethod = watch("sharingMethod");
	const memberAmounts = watch("memberAmounts") || [];
	const formErrors = formState.errors;
	console.log(formErrors);

	const activeMembersAtDate = useMemo(() => {
		return members.filter(
			(member) =>
				(!member.activeFrom ||
					new Date(member.activeFrom).getTime() <= expenseDate.getTime()) &&
				(!member.activeTo ||
					new Date(member.activeTo).getTime() >= expenseDate.getTime()),
		);
	}, [members, expenseDate]);

	const calculatedMemberAmounts = useMemo(() => {
		return getCalculatedMemberAmounts(
			group,
			memberAmounts,
			{
				amount: new Decimal(totalAmount),
				sharingMethod,
				splitAll,
				date: expenseDate,
			},
			isUnitBased ? unitPrice : undefined,
		);
	}, [
		group,
		memberAmounts,
		totalAmount,
		sharingMethod,
		splitAll,
		expenseDate,
		isUnitBased,
		unitPrice,
	]);

	const totalCurrentAmount = useMemo(
		() => calculatedMemberAmounts.reduce((sum, ma) => sum + ma.amount, 0),
		[calculatedMemberAmounts],
	);

	const difference = useMemo(
		() =>
			(isUnitBased ? totalAmount * unitPrice : totalAmount) -
			totalCurrentAmount,
		[isUnitBased, totalAmount, unitPrice, totalCurrentAmount],
	);

	const handleMemberToggle = (memberId: string, checked: boolean) => {
		let updatedSelectedMembers = selectedMembersIds;
		if (checked) {
			updatedSelectedMembers = [...selectedMembersIds, memberId];
		} else {
			updatedSelectedMembers = selectedMembersIds.filter(
				(id: string) => id !== memberId,
			);
		}
		setValue("selectedMembers", updatedSelectedMembers);
		setValue("memberAmounts", [
			...memberAmounts.filter((ma) =>
				updatedSelectedMembers.includes(ma.memberId),
			),
			...updatedSelectedMembers
				.filter((id) => !memberAmounts.some((ma) => ma.memberId === id))
				.map((id) => ({ memberId: id, amount: null, weight: null })),
		]);
	};

	const handleSplitAllToggle = (checked: boolean) => {
		setValue("splitAll", checked);
	};

	const handleAmountChange = (memberId: string, newAmount: number) => {
		// Update the amount and mark as manually edited
		const updatedAmounts = memberAmounts.map((ma) =>
			ma.memberId === memberId ? { ...ma, amount: newAmount } : ma,
		);
		setValue("memberAmounts", updatedAmounts);
	};

	const handleAmountInputChange = (_memberId: string, value: string) => {
		setTempAmountValue(value);
	};

	const handleAmountInputBlur = (memberId: string) => {
		const amount = parseFloat(tempAmountValue);
		if (!Number.isNaN(amount) && amount >= 0) {
			handleAmountChange(memberId, amount);
		}
		setEditingMemberId(null);
		setTempAmountValue("");
	};

	const handleAmountInputFocus = (memberId: string) => {
		setEditingMemberId(memberId);
		const memberAmount = calculatedMemberAmounts.find(
			(ma) => ma.memberId === memberId,
		);
		setTempAmountValue(memberAmount?.amount.toFixed(2) || "0");
	};

	const handleToggleManualEdit = (memberId: string) => {
		const memberToToggle = memberAmounts.find((ma) => ma.memberId === memberId);
		if (!memberToToggle) return;

		const isCurrentlyManual = !!memberToToggle.amount;

		// Toggle the manual edit status
		const updatedAmounts = memberAmounts.map((ma) =>
			ma.memberId === memberId
				? {
						...ma,
						amount: isCurrentlyManual
							? null
							: calculatedMemberAmounts.find((ma) => ma.memberId === memberId)
									?.amount,
					}
				: ma,
		);
		setValue("memberAmounts", updatedAmounts);
	};

	const handleResetToDefaults = () => {
		// Reset all amounts to automatic (not manually edited)
		const resetAmounts = memberAmounts.map((ma) => ({
			...ma,
			amount: null,
			weight: null,
		}));
		setValue("memberAmounts", resetAmounts);
	};

	const handleWeightChange = (memberId: string, newWeight: number) => {
		const updatedAmounts = memberAmounts.map((ma) =>
			ma.memberId === memberId ? { ...ma, weight: newWeight } : ma,
		);
		setValue("memberAmounts", updatedAmounts);
	};

	const handleWeightInputChange = (_memberId: string, value: string) => {
		setTempWeightValue(value);
	};

	const handleWeightInputBlur = (memberId: string) => {
		const weight = parseFloat(tempWeightValue);
		if (!Number.isNaN(weight) && weight >= 0) {
			handleWeightChange(memberId, weight);
		}
		setEditingWeightMemberId(null);
		setTempWeightValue("");
	};

	const handleWeightInputFocus = (memberId: string) => {
		setEditingWeightMemberId(memberId);
		setTempWeightValue(
			calculatedMemberAmounts
				.find((ma) => ma.memberId === memberId)
				?.weight.toString() || "1",
		);
	};

	const isMemberActive = (member: Member) => {
		const now = expenseDate;
		const activeFrom = member.activeFrom ? new Date(member.activeFrom) : null;
		const activeTo = member.activeTo ? new Date(member.activeTo) : null;

		if (activeFrom && now < activeFrom) return false;
		if (activeTo && now > activeTo) return false;
		return true;
	};

	return (
		<div className={cn("space-y-4", className)}>
			{/* Split All Option */}
			<div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
				<div className="flex items-center space-x-4">
					<Checkbox
						id={splitAllId}
						checked={splitAll}
						onCheckedChange={handleSplitAllToggle}
					/>
					<Label htmlFor={splitAllId} className="text-sm font-medium">
						{t("splitBetween")}
					</Label>
				</div>
				{activeMembersAtDate.length > 0 && (
					<p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
						{t("includesActiveMembers", {
							count: activeMembersAtDate.length,
							date: expenseDate.toLocaleDateString(),
						})}
					</p>
				)}

				{/* Weight Type Selection for Split All */}
				{splitAll && weightsEnabled && (
					<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
						<Label className="text-sm font-medium mb-2 block">
							{t("distributionMethod")}
						</Label>
						<Select
							value={sharingMethod}
							onValueChange={(value: string) => {
								setValue("sharingMethod", value);
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="equal">{t("shareEqually")}</SelectItem>
								{availableWeightTypes.map((weightType) => (
									<SelectItem key={weightType.id} value={weightType.id}>
										{t("byWeightType", { weightType: weightType.name })}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			{/* Individual Member Selection with Amount Editing */}
			{!splitAll && (
				<div className="space-y-3">
					<div className="flex items-center justify-between h-8">
						<div className="flex items-center gap-2">
							<Users className="w-4 h-4" />
							<Label className="text-sm font-medium">
								{t("selectMembersAndAmounts")}
							</Label>
						</div>
						<div className="flex items-center gap-2">
							<Select
								value={sharingMethod}
								onValueChange={(value: string) => {
									setValue("sharingMethod", value);
								}}
							>
								<SelectTrigger className="w-32 h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="equal">{t("shareEqually")}</SelectItem>
									{availableWeightTypes.length === 1 ? (
										<SelectItem value="weights">
											{t("shareByWeights")}
										</SelectItem>
									) : (
										availableWeightTypes.map((weightType) => (
											<SelectItem
												key={weightType.id}
												value={`weights-${weightType.id}`}
											>
												{t("byWeightType", { weightType: weightType.name })}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
							{memberAmounts.some((ma) => !!ma.amount || !!ma.weight) && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleResetToDefaults}
									className="text-xs"
								>
									<Undo2 className="w-3 h-3" />
								</Button>
							)}
						</div>
					</div>
					<div className="space-y-3">
						{members.map((member) => {
							const isActive = isMemberActive(member);
							const isSelected = selectedMembersIds.includes(member.id);
							const memberAmount = memberAmounts.find(
								(ma) => ma.memberId === member.id,
							) || {
								memberId: member.id,
								amount: null,
								weight: null,
							};
							const calculatedMemberAmount = calculatedMemberAmounts.find(
								(ma) => ma.memberId === member.id,
							);
							const isEditing = editingMemberId === member.id;
							const isManuallyEdited = !!memberAmount.amount;

							return (
								<div
									key={member.id}
									className={cn(
										"px-3 py-1 rounded-lg border bg-gray-50 dark:bg-gray-800",
										!isActive && "opacity-50",
										isSelected &&
											"bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
									)}
								>
									<div className="flex items-center gap-3 h-8">
										<Checkbox
											id={member.id}
											checked={isSelected}
											onCheckedChange={(checked) =>
												handleMemberToggle(member.id, checked as boolean)
											}
											disabled={!isActive}
										/>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<User className="w-4 h-4" />
												<span className="font-medium text-sm truncate">
													{member.name}
												</span>
												{weightsEnabled && sharingMethod === "equal" && (
													<span className="text-xs text-gray-500">
														({t("weight")}: {calculatedMemberAmount?.weight})
													</span>
												)}
												{sharingMethod === "weights" && !isManuallyEdited && (
													<div className="flex items-center gap-1">
														<span className="text-xs text-gray-500">
															({t("weight")}:
														</span>
														<Input
															type="number"
															step="0.1"
															min="0"
															value={
																editingWeightMemberId === member.id
																	? tempWeightValue
																	: calculatedMemberAmount?.weight.toString() ||
																		"1"
															}
															onChange={(e) =>
																handleWeightInputChange(
																	member.id,
																	e.target.value,
																)
															}
															onFocus={() => handleWeightInputFocus(member.id)}
															onBlur={() => handleWeightInputBlur(member.id)}
															onKeyDown={(e) => {
																if (e.key === "Enter") {
																	handleWeightInputBlur(member.id);
																}
															}}
															className="w-12 h-5 text-xs text-center no-spinner"
														/>
														<span className="text-xs text-gray-500">)</span>
													</div>
												)}
												{isManuallyEdited && (
													<Edit3 className="w-3 h-3 text-blue-500" />
												)}
												{!isActive && (
													<Badge variant="outline" className="text-xs">
														{t("inactive")}
													</Badge>
												)}
											</div>
										</div>

										{isSelected && (
											<div className="flex items-center gap-2">
												{isEditing ? (
													<div className="flex items-center gap-2">
														<Input
															type="number"
															step="0.01"
															min="0"
															value={
																editingMemberId === member.id
																	? tempAmountValue
																	: calculatedMemberAmount?.amount.toFixed(2) ||
																		"0"
															}
															onChange={(e) =>
																handleAmountInputChange(
																	member.id,
																	e.target.value,
																)
															}
															onFocus={() => handleAmountInputFocus(member.id)}
															onBlur={() => handleAmountInputBlur(member.id)}
															onKeyDown={(e) => {
																if (e.key === "Enter") {
																	handleAmountInputBlur(member.id);
																}
															}}
															className="w-24 text-sm h-8 no-spinner text-right"
															autoFocus
														/>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => handleAmountInputBlur(member.id)}
															className="text-xs h-8"
														>
															<Check className="w-3 h-3" />
														</Button>
													</div>
												) : (
													<div className="flex items-center gap-2">
														<button
															className="text-sm font-mono"
															type="button"
															onClick={() => setEditingMemberId(member.id)}
														>
															{formatCurrency(
																calculatedMemberAmount?.amount || 0,
																currency,
															)}
														</button>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => setEditingMemberId(member.id)}
															className="text-xs h-8"
														>
															<Edit3 className="w-3 h-3" />
														</Button>
													</div>
												)}

												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => handleToggleManualEdit(member.id)}
													className={`text-xs h-8 ${
														isManuallyEdited
															? "text-blue-600 hover:text-blue-700"
															: "text-gray-400 hover:text-gray-600"
													}`}
													title={
														isManuallyEdited
															? t("allowAutomaticRecalculation")
															: t("protectFromAutomaticRecalculation")
													}
												>
													{isManuallyEdited ? (
														<Lock className="w-3 h-3" />
													) : (
														<Unlock className="w-3 h-3" />
													)}
												</Button>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>

					{/* Total and Difference */}
					{selectedMembersIds.length > 0 && (
						<div className="pt-3 border-t space-y-2">
							<div className="flex justify-between text-sm">
								<span>{t("totalAmount")}:</span>
								<span className="font-mono">
									{formatCurrency(
										isUnitBased ? totalAmount * unitPrice : totalAmount,
										currency,
									)}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>{t("currentSplit")}:</span>
								<span className="font-mono">
									{formatCurrency(totalCurrentAmount, currency)}
								</span>
							</div>
							{difference !== 0 && (
								<div
									className={`flex justify-between text-sm ${
										difference > 0 ? "text-red-600" : "text-green-600"
									}`}
								>
									<span>{t("difference")}:</span>
									<span className="font-mono">
										{difference > 0 ? "+" : ""}
										{formatCurrency(difference, currency)}
									</span>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
