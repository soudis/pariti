"use client";

import type { Member } from "@prisma/client";
import { Edit, Plus, Trash2, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import {
	calculateMemberBalances,
	type getGroup,
	removeMemberAction,
	updateMemberAction,
} from "@/actions";
import { AddMemberDialog } from "@/components/add-member-dialog";
import { EditMemberDialog } from "@/components/edit-member-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { MemberFormData } from "@/lib/schemas";
import { handleActionErrors } from "@/lib/utils";

interface MembersSectionProps {
	group: Awaited<ReturnType<typeof getGroup>>;
}

export function MembersSection({ group }: MembersSectionProps) {
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [memberBalances, setMemberBalances] = useState<
		Array<{ memberId: string; balance: number }>
	>([]);
	const [loadingBalances, setLoadingBalances] = useState(false);
	const t = useTranslations("members");

	const { executeAsync: removeMember } = useAction(removeMemberAction);
	const { executeAsync: updateMember } = useAction(updateMemberAction);

	// Load member balances
	useEffect(() => {
		const loadBalances = async () => {
			setLoadingBalances(true);
			try {
				const balances = await calculateMemberBalances(group.id);
				setMemberBalances(balances);
			} catch (error) {
				console.error("Failed to load member balances:", error);
			} finally {
				setLoadingBalances(false);
			}
		};

		loadBalances();
	}, [group.id]); // Recalculate when group changes

	const getMemberBalance = (memberId: string) => {
		const balance = memberBalances.find((b) => b.memberId === memberId);
		return balance ? balance.balance : 0;
	};

	const formatBalance = (balance: number) => {
		if (balance === 0) return formatCurrency(0, group.currency);
		const sign = balance > 0 ? "+" : "";
		return `${sign}${formatCurrency(Math.abs(balance), group.currency)}`;
	};

	const getBalanceColor = (balance: number) => {
		if (balance > 0) return "text-green-600 dark:text-green-400";
		if (balance < 0) return "text-red-600 dark:text-red-400";
		return "text-gray-600 dark:text-gray-400";
	};

	const handleDeleteMember = async (memberId: string) => {
		setDeletingId(memberId);
		await handleActionErrors(await removeMember({ memberId }));
		setDeletingId(null);
	};

	const handleUpdateMember = async (
		memberId: Member["id"],
		data: MemberFormData,
	) => {
		handleActionErrors(await updateMember({ memberId, member: data }));
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<CardTitle className="flex items-center gap-2">
						<Users className="w-5 h-5" />
						{t("title")}
					</CardTitle>
					<AddMemberDialog
						groupId={group.id}
						weightsEnabled={group.weightsEnabled}
					>
						<Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
							<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
							<span className="truncate">{t("addMember")}</span>
						</Button>
					</AddMemberDialog>
				</div>
			</CardHeader>
			<CardContent>
				{group.members.length === 0 ? (
					<div className="text-center py-8 text-gray-500 dark:text-gray-400">
						<User className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p>{t("noMembers")}</p>
						<p className="text-sm">{t("noMembersDescription")}</p>
					</div>
				) : (
					<div className="space-y-3">
						{/* Header row for balance column */}
						<div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
							<div className="flex items-center gap-3 flex-1">
								<div className="w-8 h-8"></div>
								<div className="flex-1">
									<span>{t("member")}</span>
								</div>
							</div>
							<div className="w-24 text-right">
								<span>{t("balance")}</span>
							</div>
							<div className="w-24"></div>
						</div>

						{group.members.map((member) => (
							<div
								key={member.id}
								className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
							>
								<div className="flex items-center gap-3 flex-1">
									<div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
										<User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
									</div>
									<div className="flex-1">
										<p className="font-medium">{member.name}</p>
										{member.email && (
											<p className="text-sm text-gray-500 dark:text-gray-400">
												{member.email}
											</p>
										)}
										{member.iban && (
											<p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
												{member.iban}
											</p>
										)}
										<div className="flex items-center gap-2 mt-1">
											<span className="text-xs text-gray-500 dark:text-gray-400">
												{t("active")}:{" "}
												{new Date(member.activeFrom).toLocaleDateString()}
											</span>
											{member.activeTo && (
												<span className="text-xs text-gray-500 dark:text-gray-400">
													- {new Date(member.activeTo).toLocaleDateString()}
												</span>
											)}
											{!member.activeTo && (
												<span className="text-xs text-green-600 dark:text-green-400">
													{t("ongoing")}
												</span>
											)}
										</div>
									</div>
								</div>

								{/* Balance column - right aligned */}
								<div className="w-24 text-right">
									{loadingBalances ? (
										<div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
									) : (
										<p
											className={`font-medium ${getBalanceColor(getMemberBalance(member.id))}`}
										>
											{formatBalance(getMemberBalance(member.id))}
										</p>
									)}
								</div>

								{/* Actions column */}
								<div className="flex items-center gap-2 w-24 justify-end">
									<EditMemberDialog
										member={{ ...member, weight: Number(member.weight) }}
										weightsEnabled={group.weightsEnabled}
										onUpdate={handleUpdateMember}
									>
										<Button
											variant="ghost"
											size="sm"
											className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
										>
											<Edit className="w-4 h-4" />
										</Button>
									</EditMemberDialog>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDeleteMember(member.id)}
										disabled={deletingId === member.id}
										className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
