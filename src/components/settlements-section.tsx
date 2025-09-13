"use client";

import {
	ArrowRight,
	Calculator,
	Calendar,
	CheckCircle,
	Circle,
	Plus,
	QrCode,
	Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CreateSettlementDialog } from "@/components/create-settlement-dialog";
import { QRCodeDialog } from "@/components/qr-code-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type getGroup,
	removeSettlement,
	updateSettlementMemberStatus,
} from "@/lib/actions";

interface SettlementsSectionProps {
	groupId: string;
	settlements: Awaited<ReturnType<typeof getGroup>>["settlements"];
	members: Awaited<ReturnType<typeof getGroup>>["members"];
	resources: Awaited<ReturnType<typeof getGroup>>["resources"];
}

export function SettlementsSection({
	groupId,
	settlements,
	members,
	resources,
}: SettlementsSectionProps) {
	const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const t = useTranslations("settlements");

	const handleStatusUpdate = async (
		settlementMemberId: string,
		status: "open" | "completed",
	) => {
		setUpdatingStatus(settlementMemberId);
		try {
			await updateSettlementMemberStatus(settlementMemberId, status);
		} catch (error) {
			console.error("Failed to update settlement status:", error);
		} finally {
			setUpdatingStatus(null);
		}
	};

	const handleDeleteSettlement = async (settlementId: string) => {
		setDeletingId(settlementId);
		try {
			await removeSettlement(settlementId);
		} catch (error) {
			console.error("Failed to remove settlement:", error);
		} finally {
			setDeletingId(null);
		}
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
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Calculator className="w-5 h-5" />
						{t("title")}
					</CardTitle>
					<CreateSettlementDialog
						groupId={groupId}
						members={members}
						resources={resources}
					>
						<Button size="sm">
							<Plus className="w-4 h-4 mr-2" />
							{t("generateSettlement")}
						</Button>
					</CreateSettlementDialog>
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
															className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
														>
															<div className="flex items-center gap-3">
																<div className="flex items-center gap-2">
																	<span className="font-medium">
																		{getEntityName(
																			settlementMember.fromMember,
																			settlementMember.fromResource,
																		)}
																	</span>
																	<ArrowRight className="w-4 h-4 text-gray-400" />
																	<span className="font-medium">
																		{getEntityName(
																			settlementMember.toMember,
																			settlementMember.toResource,
																		)}
																	</span>
																</div>
																<Badge variant="secondary" className="text-sm">
																	€{Number(settlementMember.amount).toFixed(2)}
																</Badge>
															</div>
															<div className="flex items-center gap-2">
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
																	€{Number(settlementMember.amount).toFixed(2)}
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
