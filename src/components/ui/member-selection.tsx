"use client";

import { User, Users } from "lucide-react";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Member {
	id: string;
	name: string;
	activeFrom?: Date | null;
	activeTo?: Date | null;
}

interface MemberSelectionProps {
	members: Member[];
	selectedMembers: string[];
	onSelectionChange: (memberIds: string[]) => void;
	splitAll: boolean;
	onSplitAllChange: (splitAll: boolean) => void;
	activeMembersAtDate: Member[];
	expenseDate: Date;
	className?: string;
}

export function MemberSelection({
	members,
	selectedMembers,
	onSelectionChange,
	splitAll,
	onSplitAllChange,
	activeMembersAtDate,
	expenseDate,
	className,
}: MemberSelectionProps) {
	const splitAllId = useId();
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

			{/* Individual Member Selection */}
			{!splitAll && (
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Users className="w-4 h-4" />
						<Label className="text-sm font-medium">Select Members</Label>
					</div>
					<div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
						{members.map((member) => {
							const isActive = isMemberActive(member);
							const isSelected = selectedMembers.includes(member.id);

							return (
								<div
									key={member.id}
									className={cn(
										"flex items-center space-x-3 p-2 rounded-lg border",
										!isActive && "opacity-50 bg-gray-100 dark:bg-gray-700",
										isSelected &&
											"bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
									)}
								>
									<Checkbox
										id={member.id}
										checked={isSelected}
										onCheckedChange={(checked) =>
											handleMemberToggle(member.id, checked as boolean)
										}
										disabled={!isActive}
									/>
									<div className="flex-1 flex items-center justify-between">
										<div className="flex items-center gap-2">
											<User className="w-4 h-4" />
											<span className="text-sm">{member.name}</span>
										</div>
										<div className="flex items-center gap-2">
											{!isActive && (
												<Badge variant="outline" className="text-xs">
													Inactive
												</Badge>
											)}
											{member.activeFrom && (
												<Badge variant="outline" className="text-xs">
													From{" "}
													{new Date(member.activeFrom).toLocaleDateString()}
												</Badge>
											)}
											{member.activeTo && (
												<Badge variant="outline" className="text-xs">
													Until {new Date(member.activeTo).toLocaleDateString()}
												</Badge>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
					{selectedMembers.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{selectedMembers.map((memberId) => {
								const member = members.find((m) => m.id === memberId);
								return (
									<Badge key={memberId} variant="secondary" className="text-xs">
										{member?.name}
									</Badge>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
