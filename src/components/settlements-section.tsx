"use client";

import {
	ArrowRight,
	Calculator,
	Calendar,
	CheckCircle,
	Circle,
	Plus,
	QrCode,
	Scale,
	Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import {
	type getGroup,
	removeSettlementAction,
	updateSettlementMemberStatusAction,
} from "@/actions";
import type { getGroupWithRecurringExpenses } from "@/actions/get-group";
import { QRCodeDialog } from "@/components/qr-code-dialog";
import { SettlementDialog } from "@/components/settlement-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { handleActionErrors } from "@/lib/utils";

interface SettlementsSectionProps {
	currency: string;
	group: Awaited<ReturnType<typeof getGroupWithRecurringExpenses>>;
}

export function SettlementsSection({
	group: { settlements, members, resources, id: groupId },

	currency,
}: SettlementsSectionProps) {
	const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const t = useTranslations("settlements");

	const { executeAsync: updateSettlementMemberStatus } = useAction(
		updateSettlementMemberStatusAction,
	);
	const { executeAsync: removeSettlement } = useAction(removeSettlementAction);

	const handleStatusUpdate = async (
		settlementMemberId: string,
		status: "open" | "completed",
	) => {
		setUpdatingStatus(settlementMemberId);
		handleActionErrors(
			await updateSettlementMemberStatus({ settlementMemberId, status }),
		);
		setUpdatingStatus(null);
	};

	const handleDeleteSettlement = async (settlementId: string) => {
		setDeletingId(settlementId);
		handleActionErrors(await removeSettlement({ settlementId }));
		setDeletingId(null);
	};

	const formatDate = (date: Date) => new Date(date).toLocaleDateString();

	const getEntityName = (
		member?: { name: string } | null,
		resource?: { name: string } | null,
	) => {
		if (member) return member.name;
		if (resource) return resource.name;
		return "Unknown";
	};

	const openSettlements = settlements.filter((s) => s.status === "open");
	const completedSettlements = settlements.filter(
		(s) => s.status === "completed",
	);

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<CardTitle className="flex items-center gap-2">
						<Scale className="w-5 h-5" />
						{t("title")}
					</CardTitle>
					<SettlementDialog
						groupId={groupId}
						members={members}
						resources={resources}
					>
						<Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
							<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
							<span className="truncate">{t("generateSettlement")}</span>
						</Button>
					</SettlementDialog>
				</div>
			</CardHeader>
			<CardContent>
				{settlements.length === 0 ? (
					<div className="text-center py-8 text-gray-500 dark:text-gray-400">
						<Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p>{t("noSettlements")}</p>
						<p className="text-sm">{t("noSettlementsDescription")}</p>
					</div>
				) : (
					<div className="space-y-6">
						{/* Open Settlements */}
						{openSettlements.length > 0 && (
							<div>
								<h3 className="font-medium text-lg mb-4 flex items-center gap-2">
									<Circle className="w-5 h-5 text-orange-500" />
									{t("openSettlements")}
								</h3>
								<div className="space-y-4">
									{openSettlements.map((settlement) => (
										<div key={settlement.id} className="border rounded-lg p-4">
											<div className="flex items-start justify-between mb-4">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-2">
														<h4 className="font-medium text-lg">
															{settlement.title}
														</h4>
														<Badge
															variant="outline"
															className="text-orange-600 border-orange-200"
														>
															{t("open")}
														</Badge>
													</div>
													{settlement.description && (
														<p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
															{settlement.description}
														</p>
													)}
													<div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
														<div className="flex items-center gap-1">
															<Calendar className="w-4 h-4" />
															<span>{formatDate(settlement.createdAt)}</span>
														</div>
													</div>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleDeleteSettlement(settlement.id)}
													disabled={deletingId === settlement.id}
													className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>

											<div className="space-y-3">
												<h5 className="font-medium text-sm text-gray-700 dark:text-gray-200">
													{t("payments")}:
												</h5>
												{settlement.settlementMembers.map(
													(settlementMember) => (
														<div
															key={settlementMember.id}
															className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
														>
															{/* Payment info */}
															<div className="flex items-center gap-3 mb-3">
																<div className="flex items-center gap-2 flex-1 min-w-0">
																	<span className="font-medium truncate">
																		{getEntityName(
																			settlementMember.fromMember,
																			settlementMember.fromResource,
																		)}
																	</span>
																	<ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
																	<span className="font-medium truncate">
																		{getEntityName(
																			settlementMember.toMember,
																			settlementMember.toResource,
																		)}
																	</span>
																</div>
																<Badge
																	variant="secondary"
																	className="text-sm flex-shrink-0"
																>
																	{formatCurrency(
																		Number(settlementMember.amount),
																		currency,
																	)}
																</Badge>
															</div>

															{/* Action buttons - separate line */}
															<div className="flex items-center gap-2 flex-wrap">
																{/* QR Code button for bank transfer */}
																{settlementMember.toMember?.iban && (
																	<QRCodeDialog
																		recipientName={
																			settlementMember.toMember.name
																		}
																		iban={settlementMember.toMember.iban}
																		amount={Number(settlementMember.amount)}
																		description={settlement.title}
																	>
																		<Button
																			variant="outline"
																			size="sm"
																			className="flex items-center gap-2"
																		>
																			<QrCode className="w-4 h-4" />
																			{t("qrCode")}
																		</Button>
																	</QRCodeDialog>
																)}
																<Button
																	variant={
																		settlementMember.status === "completed"
																			? "default"
																			: "outline"
																	}
																	size="sm"
																	onClick={() =>
																		handleStatusUpdate(
																			settlementMember.id,
																			settlementMember.status === "completed"
																				? "open"
																				: "completed",
																		)
																	}
																	disabled={
																		updatingStatus === settlementMember.id
																	}
																	className="flex items-center gap-2"
																>
																	{settlementMember.status === "completed" ? (
																		<CheckCircle className="w-4 h-4" />
																	) : (
																		<Circle className="w-4 h-4" />
																	)}
																	{settlementMember.status === "completed"
																		? t("completed")
																		: t("markCompleted")}
																</Button>
															</div>
														</div>
													),
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Completed Settlements */}
						{completedSettlements.length > 0 && (
							<div>
								<h3 className="font-medium text-lg mb-4 flex items-center gap-2">
									<CheckCircle className="w-5 h-5 text-green-500" />
									{t("completedSettlements")}
								</h3>
								<div className="space-y-4">
									{completedSettlements.map((settlement) => (
										<div
											key={settlement.id}
											className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20"
										>
											<div className="flex items-start justify-between mb-4">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-2">
														<h4 className="font-medium text-lg">
															{settlement.title}
														</h4>
														<Badge
															variant="outline"
															className="text-green-600 border-green-200"
														>
															{t("completed")}
														</Badge>
													</div>
													{settlement.description && (
														<p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
															{settlement.description}
														</p>
													)}
													<div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
														<div className="flex items-center gap-1">
															<Calendar className="w-4 h-4" />
															<span>{formatDate(settlement.createdAt)}</span>
														</div>
													</div>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleDeleteSettlement(settlement.id)}
													disabled={deletingId === settlement.id}
													className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>

											<div className="space-y-2">
												<h5 className="font-medium text-sm text-gray-700 dark:text-gray-200">
													{t("payments")}:
												</h5>
												{settlement.settlementMembers.map(
													(settlementMember) => (
														<div
															key={settlementMember.id}
															className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
														>
															<div className="flex items-center gap-2">
																<span className="text-sm">
																	{getEntityName(
																		settlementMember.fromMember,
																		settlementMember.fromResource,
																	)}
																</span>
																<ArrowRight className="w-3 h-3 text-gray-400" />
																<span className="text-sm">
																	{getEntityName(
																		settlementMember.toMember,
																		settlementMember.toResource,
																	)}
																</span>
															</div>
															<div className="flex items-center gap-2">
																<span className="text-sm font-medium">
																	{formatCurrency(
																		Number(settlementMember.amount),
																		currency,
																	)}
																</span>
																<CheckCircle className="w-4 h-4 text-green-500" />
															</div>
														</div>
													),
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
