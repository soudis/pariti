"use client";

import { Check, Edit3, Lock, Undo2, Unlock, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useState } from "react";
import { useFormContext } from "react-hook-form";
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
import { type MemberAmount, redistributeAmounts } from "@/lib/redistribution";
import { cn } from "@/lib/utils";

interface Member {
	id: string;
	name: string;
	weight: number;
	activeFrom?: Date | null;
	activeTo?: Date | null;
}

interface MemberEditorProps {
	members: Member[];
	activeMembersAtDate: Member[];
	expenseDate: Date;
	currency: string;
	weightsEnabled: boolean;
	className?: string;
	// For unit-based consumptions
	isUnitBased?: boolean;
	unitPrice?: number;
}

export function MemberEditor({
	members,
	activeMembersAtDate,
	expenseDate,
	currency,
	weightsEnabled,
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

	const { watch, setValue } = useFormContext();
	const selectedMembers = watch("selectedMembers") || [];
	const splitAll = watch("splitAll") || false;
	const totalAmount = watch("amount") || 0;
	const sharingMethod = watch("sharingMethod") || "equal";
	const memberAmounts = watch("memberAmounts") || [];

	// Get current amounts for selected members only
	const getCurrentAmounts = (): MemberAmount[] => {
		return members.map((member) => {
			const existing = memberAmounts.find(
				(ma: MemberAmount) => ma.memberId === member.id,
			);
			return (
				existing || {
					memberId: member.id,
					amount: 0,
					weight: 1,
					isManuallyEdited: false,
				}
			);
		});
	};

	const currentAmounts = getCurrentAmounts();
	const totalCurrentAmount = currentAmounts.reduce(
		(sum, ma) => sum + ma.amount,
		0,
	);
	const difference =
		(isUnitBased ? totalAmount * unitPrice : totalAmount) - totalCurrentAmount;

	const redistribute = useCallback(
		(
			selectedMembersLocal: string[] = selectedMembers,
			amountsLocal: MemberAmount[] = currentAmounts,
			sharingMethodLocal: "equal" | "weights" = sharingMethod,
		) => {
			const selectedMembersList = activeMembersAtDate.filter((member) =>
				selectedMembersLocal.includes(member.id),
			);
			const selectedAmounts = amountsLocal.filter(
				(ma) =>
					selectedMembersLocal.includes(ma.memberId) &&
					activeMembersAtDate.find((member) => member.id === ma.memberId),
			);

			// For unit-based consumptions, we need to work with units internally
			if (isUnitBased && unitPrice > 0) {
				// Convert monetary amounts to units for redistribution
				const amountsInUnits = selectedAmounts.map((ma) => ({
					...ma,
					amount: ma.amount / unitPrice,
				}));

				const redistributedAmounts = redistributeAmounts(
					selectedMembersList,
					amountsInUnits,
					totalAmount, // totalAmount is already in units
					weightsEnabled,
					sharingMethodLocal,
				);

				// Convert back to monetary amounts for storage
				const monetaryAmounts = redistributedAmounts.map((ma) => ({
					...ma,
					amount: ma.amount * unitPrice,
				}));
				setValue("memberAmounts", monetaryAmounts);
			} else {
				// For regular expenses, work directly with monetary amounts
				const redistributedAmounts = redistributeAmounts(
					selectedMembersList,
					selectedAmounts,
					totalAmount,
					weightsEnabled,
					sharingMethodLocal,
				);
				setValue("memberAmounts", redistributedAmounts);
			}
		},
		[
			activeMembersAtDate,
			selectedMembers,
			currentAmounts,
			totalAmount,
			weightsEnabled,
			sharingMethod,
			isUnitBased,
			unitPrice,
			setValue,
		],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: always needs to update when totalAmount changes
	useEffect(() => {
		redistribute();
	}, [totalAmount]);

	const handleMemberToggle = (memberId: string, checked: boolean) => {
		let updatedSelectedMembers = selectedMembers;
		if (checked) {
			updatedSelectedMembers = [...selectedMembers, memberId];
		} else {
			updatedSelectedMembers = selectedMembers.filter(
				(id: string) => id !== memberId,
			);
		}
		setValue("selectedMembers", updatedSelectedMembers);
		redistribute(updatedSelectedMembers);
	};

	const handleSplitAllToggle = (checked: boolean) => {
		setValue("splitAll", checked);
		if (checked) {
			// Select all active members at the expense date
			setValue(
				"selectedMembers",
				activeMembersAtDate.map((member) => member.id),
			);
			redistribute(activeMembersAtDate.map((member) => member.id));
		} else {
			// Clear selection when "split all" is disabled
			setValue("selectedMembers", []);
			redistribute([]);
		}
	};

	const handleAmountChange = (memberId: string, newAmount: number) => {
		// Update the amount and mark as manually edited
		const hasChanged =
			newAmount !==
			currentAmounts.find((ma) => ma.memberId === memberId)?.amount;
		if (hasChanged) {
			const updatedAmounts = currentAmounts.map((ma) =>
				ma.memberId === memberId
					? { ...ma, amount: newAmount, isManuallyEdited: true }
					: ma,
			);

			// Trigger redistribution with updated amounts
			redistribute(selectedMembers, updatedAmounts);
		}
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
		const memberAmount = currentAmounts.find((ma) => ma.memberId === memberId);
		setTempAmountValue(memberAmount?.amount.toFixed(2) || "0");
	};

	const handleToggleManualEdit = (memberId: string) => {
		const memberToToggle = currentAmounts.find(
			(ma) => ma.memberId === memberId,
		);
		if (!memberToToggle) return;

		const isCurrentlyManual = memberToToggle.isManuallyEdited;

		// Toggle the manual edit status
		const updatedAmounts = currentAmounts.map((ma) =>
			ma.memberId === memberId
				? { ...ma, isManuallyEdited: !isCurrentlyManual }
				: ma,
		);
		redistribute(selectedMembers, updatedAmounts);
	};

	const handleResetToDefaults = () => {
		// Reset all amounts to automatic (not manually edited)
		const resetAmounts = currentAmounts.map((ma) => ({
			...ma,
			isManuallyEdited: false,
		}));
		redistribute(selectedMembers, resetAmounts);
	};

	const handleWeightChange = (memberId: string, newWeight: number) => {
		const updatedAmounts = currentAmounts.map((ma) =>
			ma.memberId === memberId ? { ...ma, weight: newWeight } : ma,
		);
		setValue("memberAmounts", updatedAmounts);
		// Trigger redistribution with new weights
		redistribute(selectedMembers, updatedAmounts);
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
		setTempWeightValue(getMemberWeight(memberId).toString());
	};

	const getMemberWeight = (memberId: string): number => {
		const memberAmount = currentAmounts.find((ma) => ma.memberId === memberId);
		return memberAmount?.weight ?? 1;
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
								onValueChange={(value: "equal" | "weights") => {
									setValue("sharingMethod", value);
									redistribute(selectedMembers, currentAmounts, value);
								}}
							>
								<SelectTrigger className="w-32 h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="equal">{t("shareEqually")}</SelectItem>
									<SelectItem value="weights">{t("shareByWeights")}</SelectItem>
								</SelectContent>
							</Select>
							{currentAmounts.some((ma) => ma.isManuallyEdited) && (
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
							const isSelected = selectedMembers.includes(member.id);
							const memberAmount = currentAmounts.find(
								(ma) => ma.memberId === member.id,
							) || {
								memberId: member.id,
								amount: 0,
								weight: 1,
								isManuallyEdited: false,
							};
							const isEditing = editingMemberId === member.id;
							const isManuallyEdited = memberAmount.isManuallyEdited;

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
														({t("weight")}: {member.weight})
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
																	: getMemberWeight(member.id)
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
																	: memberAmount.amount.toFixed(2)
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
															{formatCurrency(memberAmount.amount, currency)}
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
					{selectedMembers.length > 0 && (
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
