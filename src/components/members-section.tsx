"use client";

import { Edit, Plus, Trash2, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { removeMemberAction } from "@/actions";
import type { getCalculatedGroup } from "@/actions/get-group";
import { MemberDialog } from "@/components/member-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { handleActionErrors } from "@/lib/utils";

interface MembersSectionProps {
	group: Awaited<ReturnType<typeof getCalculatedGroup>>;
}

export function MembersSection({ group }: MembersSectionProps) {
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const t = useTranslations("members");

	const { executeAsync: removeMember } = useAction(removeMemberAction);

	const formatBalance = (balance: number) => {
		if (balance === 0) return formatCurrency(0, group.currency);
		const sign = balance > 0 ? "+" : "-";
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

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<CardTitle className="flex items-center gap-2">
						<Users className="w-5 h-5" />
						{t("title")}
					</CardTitle>
					<MemberDialog
						group={group}
						weightsEnabled={group.weightsEnabled}
						weightTypes={group.weightTypes}
					>
						<Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
							<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
							<span className="truncate">{t("addMember")}</span>
						</Button>
					</MemberDialog>
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
					<div className="space-y-4">
						{group.members.map((member) => (
							<div
								key={member.id}
								className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
							>
								{/* Header with member info and action buttons */}
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-3 flex-1 min-w-0">
										<div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
											<User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-medium">{member.name}</p>
											{member.email && (
												<p className="text-sm text-gray-500 dark:text-gray-400 truncate">
													{member.email}
												</p>
											)}
											{member.iban && (
												<p className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">
													{member.iban}
												</p>
											)}
											{/* Weights display */}
											{group.weightsEnabled && (
												<div className="mt-2 flex flex-wrap gap-1">
													{group.weightTypes && group.weightTypes.length > 1 ? (
														// Multiple weight types
														group.weightTypes.map((weightType) => {
															const weight =
																member.weights?.[weightType.id] || 0;
															return (
																<Badge
																	key={weightType.id}
																	variant="secondary"
																	className="text-xs"
																>
																	{weightType.name}: {Number(weight).toFixed(1)}
																</Badge>
															);
														})
													) : (
														// Single weight (legacy)
														<Badge variant="secondary" className="text-xs">
															Weight:{" "}
															{Number(
																member.weights?.[group.weightTypes[0].id] || 1,
															).toFixed(1)}
														</Badge>
													)}
												</div>
											)}
										</div>
									</div>
									{/* Action buttons - aligned to top right */}
									<div className="flex items-start gap-2 flex-shrink-0 ml-2">
										<MemberDialog
											group={group}
											member={member}
											weightsEnabled={group.weightsEnabled}
											weightTypes={group.weightTypes}
										>
											<Button
												variant="ghost"
												size="sm"
												className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
											>
												<Edit className="w-4 h-4" />
											</Button>
										</MemberDialog>
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

								{/* Active period info */}
								<div className="flex items-center gap-2 mb-3">
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

								{/* Balance - separate line */}
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium text-gray-700 dark:text-gray-200">
										{t("balance")}:
									</span>
									<p
										className={`font-medium ${getBalanceColor(member.balance)}`}
									>
										{formatBalance(member.balance)}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
