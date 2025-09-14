"use client";

import { Edit3, Lock, Unlock, User, Users } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface Member {
	id: string;
	name: string;
	weight: number;
	activeFrom?: Date | null;
	activeTo?: Date | null;
}

interface MemberAmount {
	memberId: string;
	amount: number;
	isManuallyEdited: boolean;
}

interface MemberEditorProps {
	members: Member[];
	selectedMembers: string[];
	onSelectionChange: (memberIds: string[]) => void;
	splitAll: boolean;
	onSplitAllChange: (splitAll: boolean) => void;
	activeMembersAtDate: Member[];
	expenseDate: Date;
	memberAmounts: MemberAmount[];
	totalAmount: number;
	currency: string;
	weightsEnabled: boolean;
	onAmountsChange: (amounts: MemberAmount[]) => void;
	className?: string;
}

export function MemberEditor({
	members,
	selectedMembers,
	onSelectionChange,
	splitAll,
	onSplitAllChange,
	activeMembersAtDate,
	expenseDate,
	memberAmounts,
	totalAmount,
	currency,
	weightsEnabled,
	onAmountsChange,
	className,
}: MemberEditorProps) {
	const splitAllId = useId();
	const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

	// Calculate default amounts based on weights or equal split
	const calculateDefaultAmounts = (): MemberAmount[] => {
		if (weightsEnabled) {
			const totalWeight = members.reduce(
				(sum, member) => sum + member.weight,
				0,
			);
			return members.map((member) => ({
				memberId: member.id,
				amount: (totalAmount * member.weight) / totalWeight,
				isManuallyEdited: false,
			}));
		} else {
			const amountPerMember = totalAmount / members.length;
			return members.map((member) => ({
				memberId: member.id,
				amount: amountPerMember,
				isManuallyEdited: false,
			}));
		}
	};

	// Get current amounts, using defaults for members not in memberAmounts
	const getCurrentAmounts = (): MemberAmount[] => {
		const defaults = calculateDefaultAmounts();
		return members.map((member) => {
			const existing = memberAmounts.find((ma) => ma.memberId === member.id);
			return (
				existing ||
				defaults.find((d) => d.memberId === member.id) || {
					memberId: member.id,
					amount: 0,
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
	const difference = totalAmount - totalCurrentAmount;

	// Handle member changes and redistribution
	useEffect(() => {
		const currentMemberIds = members.map((m) => m.id);
		const existingMemberIds = memberAmounts.map((ma) => ma.memberId);

		// Check if members have changed
		const membersChanged =
			currentMemberIds.length !== existingMemberIds.length ||
			!currentMemberIds.every((id) => existingMemberIds.includes(id));

		if (membersChanged) {
			// Get manually edited amounts that are still valid
			const preservedAmounts = memberAmounts.filter(
				(ma) => ma.isManuallyEdited && currentMemberIds.includes(ma.memberId),
			);

			// Calculate new amounts for all current members
			const newAmounts = members.map((member) => {
				const preserved = preservedAmounts.find(
					(pa) => pa.memberId === member.id,
				);
				if (preserved) {
					return preserved; // Keep manually edited amounts
				}

				// Calculate default amount for new members
				if (weightsEnabled) {
					const totalWeight = members.reduce((sum, m) => sum + m.weight, 0);
					return {
						memberId: member.id,
						amount: (totalAmount * member.weight) / totalWeight,
						isManuallyEdited: false,
					};
				} else {
					const amountPerMember = totalAmount / members.length;
					return {
						memberId: member.id,
						amount: amountPerMember,
						isManuallyEdited: false,
					};
				}
			});

			// If we have manually edited amounts, redistribute the remaining
			if (preservedAmounts.length > 0) {
				const totalManualAmount = preservedAmounts.reduce(
					(sum, ma) => sum + ma.amount,
					0,
				);
				const remainingAmount = totalAmount - totalManualAmount;
				const automaticMembers = newAmounts.filter(
					(ma) => !ma.isManuallyEdited,
				);

				if (automaticMembers.length > 0) {
					if (weightsEnabled) {
						const totalWeight = automaticMembers.reduce((sum, ma) => {
							const member = members.find((m) => m.id === ma.memberId);
							return sum + (member?.weight || 1);
						}, 0);

						automaticMembers.forEach((ma) => {
							const member = members.find((m) => m.id === ma.memberId);
							const weight = member?.weight || 1;
							ma.amount =
								totalWeight > 0
									? (remainingAmount * weight) / totalWeight
									: remainingAmount / automaticMembers.length;
						});
					} else {
						const equalShare = remainingAmount / automaticMembers.length;
						automaticMembers.forEach((ma) => {
							ma.amount = equalShare;
						});
					}
				}
			}

			onAmountsChange(newAmounts);
		}
	}, [members, totalAmount, weightsEnabled, memberAmounts, onAmountsChange]);

	const handleMemberToggle = (memberId: string, checked: boolean) => {
		if (checked) {
			onSelectionChange([...selectedMembers, memberId]);
		} else {
			onSelectionChange(selectedMembers.filter((id) => id !== memberId));
		}
	};

	const handleSplitAllToggle = (checked: boolean) => {
		onSplitAllChange(checked);
		if (checked) {
			// Select all active members at the expense date
			onSelectionChange(activeMembersAtDate.map((member) => member.id));
		} else {
			// Clear selection when "split all" is disabled
			onSelectionChange([]);
		}
	};

	const handleAmountChange = (memberId: string, newAmount: number) => {
		// Find the member being edited
		const editedMember = currentAmounts.find((ma) => ma.memberId === memberId);
		if (!editedMember) return;

		// Calculate the remaining amount to redistribute
		const remainingAmount = totalAmount - newAmount;
		const otherMembers = currentAmounts.filter(
			(ma) => ma.memberId !== memberId,
		);

		// If there are no other members, just update the single member
		if (otherMembers.length === 0) {
			const updatedAmounts = currentAmounts.map((ma) =>
				ma.memberId === memberId
					? { ...ma, amount: newAmount, isManuallyEdited: true }
					: ma,
			);
			onAmountsChange(updatedAmounts);
			return;
		}

		// Redistribute the remaining amount among other members
		let updatedAmounts: MemberAmount[];

		if (weightsEnabled) {
			// Redistribute based on weights
			const otherMembersWithWeights = otherMembers.map((ma) => {
				const member = members.find((m) => m.id === ma.memberId);
				return {
					...ma,
					weight: member?.weight || 1,
				};
			});

			const totalWeight = otherMembersWithWeights.reduce(
				(sum, member) => sum + member.weight,
				0,
			);

			updatedAmounts = currentAmounts.map((ma) => {
				if (ma.memberId === memberId) {
					return { ...ma, amount: newAmount, isManuallyEdited: true };
				}

				// Only redistribute if this member is not manually edited
				if (ma.isManuallyEdited) {
					return ma;
				}

				const member = otherMembersWithWeights.find(
					(m) => m.memberId === ma.memberId,
				);
				const redistributedAmount =
					totalWeight > 0
						? (remainingAmount * (member?.weight || 1)) / totalWeight
						: remainingAmount / otherMembers.length;

				return { ...ma, amount: redistributedAmount };
			});
		} else {
			// Redistribute equally among non-manually-edited members
			const nonManualMembers = otherMembers.filter(
				(ma) => !ma.isManuallyEdited,
			);
			const equalShare =
				nonManualMembers.length > 0
					? remainingAmount / nonManualMembers.length
					: 0;

			updatedAmounts = currentAmounts.map((ma) => {
				if (ma.memberId === memberId) {
					return { ...ma, amount: newAmount, isManuallyEdited: true };
				}

				// Only redistribute if this member is not manually edited
				if (ma.isManuallyEdited) {
					return ma;
				}

				return { ...ma, amount: equalShare };
			});
		}

		onAmountsChange(updatedAmounts);
	};

	const handleToggleManualEdit = (memberId: string) => {
		const memberToToggle = currentAmounts.find(
			(ma) => ma.memberId === memberId,
		);
		if (!memberToToggle) return;

		const isCurrentlyManual = memberToToggle.isManuallyEdited;
		const willBeManual = !isCurrentlyManual;

		if (willBeManual) {
			// Switching to manual - no redistribution needed
			const updatedAmounts = currentAmounts.map((ma) =>
				ma.memberId === memberId ? { ...ma, isManuallyEdited: true } : ma,
			);
			onAmountsChange(updatedAmounts);
		} else {
			// Switching to automatic - need to redistribute
			const otherMembers = currentAmounts.filter(
				(ma) => ma.memberId !== memberId,
			);
			const manuallyEditedMembers = otherMembers.filter(
				(ma) => ma.isManuallyEdited,
			);
			const totalManualAmount = manuallyEditedMembers.reduce(
				(sum, ma) => sum + ma.amount,
				0,
			);
			const remainingAmount = totalAmount - totalManualAmount;
			const automaticMembers = otherMembers.filter(
				(ma) => !ma.isManuallyEdited,
			);
			automaticMembers.push(memberToToggle); // Include the member being switched to automatic

			let updatedAmounts: MemberAmount[];

			if (weightsEnabled) {
				// Redistribute based on weights among automatic members
				const automaticMembersWithWeights = automaticMembers.map((ma) => {
					const member = members.find((m) => m.id === ma.memberId);
					return {
						...ma,
						weight: member?.weight || 1,
					};
				});

				const totalWeight = automaticMembersWithWeights.reduce(
					(sum, member) => sum + member.weight,
					0,
				);

				updatedAmounts = currentAmounts.map((ma) => {
					if (ma.memberId === memberId) {
						const member = automaticMembersWithWeights.find(
							(m) => m.memberId === memberId,
						);
						const redistributedAmount =
							totalWeight > 0
								? (remainingAmount * (member?.weight || 1)) / totalWeight
								: remainingAmount / automaticMembers.length;
						return {
							...ma,
							amount: redistributedAmount,
							isManuallyEdited: false,
						};
					}

					// Only redistribute if this member is not manually edited
					if (ma.isManuallyEdited) {
						return ma;
					}

					const member = automaticMembersWithWeights.find(
						(m) => m.memberId === ma.memberId,
					);
					const redistributedAmount =
						totalWeight > 0
							? (remainingAmount * (member?.weight || 1)) / totalWeight
							: remainingAmount / automaticMembers.length;

					return { ...ma, amount: redistributedAmount };
				});
			} else {
				// Redistribute equally among automatic members
				const equalShare =
					automaticMembers.length > 0
						? remainingAmount / automaticMembers.length
						: 0;

				updatedAmounts = currentAmounts.map((ma) => {
					if (ma.memberId === memberId) {
						return { ...ma, amount: equalShare, isManuallyEdited: false };
					}

					// Only redistribute if this member is not manually edited
					if (ma.isManuallyEdited) {
						return ma;
					}

					return { ...ma, amount: equalShare };
				});
			}

			onAmountsChange(updatedAmounts);
		}
	};

	const handleResetToDefaults = () => {
		const defaults = calculateDefaultAmounts();
		onAmountsChange(defaults);
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
						Split between all active members
					</Label>
				</div>
				{activeMembersAtDate.length > 0 && (
					<p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
						This expense will include all {activeMembersAtDate.length} active
						members on {expenseDate.toLocaleDateString()}
					</p>
				)}
			</div>

			{/* Individual Member Selection with Amount Editing */}
			{!splitAll && (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Users className="w-4 h-4" />
							<Label className="text-sm font-medium">
								Select Members & Amounts
							</Label>
						</div>
						{selectedMembers.length > 0 && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleResetToDefaults}
								className="text-xs"
							>
								Reset to Defaults
							</Button>
						)}
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
								isManuallyEdited: false,
							};
							const isEditing = editingMemberId === member.id;
							const isManuallyEdited = memberAmount.isManuallyEdited;

							return (
								<div
									key={member.id}
									className={cn(
										"p-3 rounded-lg border bg-gray-50 dark:bg-gray-800",
										!isActive && "opacity-50",
										isSelected &&
											"bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
									)}
								>
									<div className="flex items-center gap-3">
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
												{weightsEnabled && (
													<span className="text-xs text-gray-500">
														(weight: {member.weight})
													</span>
												)}
												{isManuallyEdited && (
													<Edit3 className="w-3 h-3 text-blue-500" />
												)}
												{!isActive && (
													<Badge variant="outline" className="text-xs">
														Inactive
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
															value={memberAmount.amount.toFixed(2)}
															onChange={(e) =>
																handleAmountChange(
																	member.id,
																	parseFloat(e.target.value) || 0,
																)
															}
															className="w-24 text-sm"
															onKeyDown={(e) => {
																if (e.key === "Enter") {
																	setEditingMemberId(null);
																}
															}}
															autoFocus
														/>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => setEditingMemberId(null)}
															className="text-xs"
														>
															Done
														</Button>
													</div>
												) : (
													<div className="flex items-center gap-2">
														<span className="text-sm font-mono">
															{formatCurrency(memberAmount.amount, currency)}
														</span>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => setEditingMemberId(member.id)}
															className="text-xs"
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
													className={`text-xs ${
														isManuallyEdited
															? "text-blue-600 hover:text-blue-700"
															: "text-gray-400 hover:text-gray-600"
													}`}
													title={
														isManuallyEdited
															? "Allow automatic recalculation"
															: "Protect from automatic recalculation"
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
								<span>Total Amount:</span>
								<span className="font-mono">
									{formatCurrency(totalAmount, currency)}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Current Split:</span>
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
									<span>Difference:</span>
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
