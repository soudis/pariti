"use client";

import { Edit3, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";

interface MemberAmount {
	memberId: string;
	amount: number;
	isManuallyEdited: boolean;
}

interface Member {
	id: string;
	name: string;
	weight: number;
}

interface MemberAmountEditorProps {
	members: Member[];
	memberAmounts: MemberAmount[];
	totalAmount: number;
	currency: string;
	weightsEnabled: boolean;
	onAmountsChange: (amounts: MemberAmount[]) => void;
}

export function MemberAmountEditor({
	members,
	memberAmounts,
	totalAmount,
	currency,
	weightsEnabled,
	onAmountsChange,
}: MemberAmountEditorProps) {
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

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-medium">Member Amounts</h4>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleResetToDefaults}
					className="text-xs"
				>
					Reset to Defaults
				</Button>
			</div>

			<div className="space-y-3">
				{members.map((member) => {
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
							className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
						>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
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
								</div>
							</div>

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
						</div>
					);
				})}
			</div>

			{/* Total and Difference */}
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
		</div>
	);
}
