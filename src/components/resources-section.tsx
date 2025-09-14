"use client";

import {
	Calendar,
	Edit,
	Eye,
	EyeOff,
	Package,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useId, useState } from "react";
import { CreateConsumptionDialog } from "@/components/create-consumption-dialog";
import { CreateResourceDialog } from "@/components/create-resource-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	type getGroup,
	removeConsumption,
	removeResource,
} from "@/lib/actions";
import { formatCurrency } from "@/lib/currency";

interface ResourcesSectionProps {
	groupId: string;
	resources: Awaited<ReturnType<typeof getGroup>>["resources"];
	members: Awaited<ReturnType<typeof getGroup>>["members"];
	group: Awaited<ReturnType<typeof getGroup>>;
	cutoffDate: Date | null;
}

export function ResourcesSection({
	groupId,
	group,
	resources,
	members,
	cutoffDate,
}: ResourcesSectionProps) {
	const [deletingResourceId, setDeletingResourceId] = useState<string | null>(
		null,
	);
	const [deletingConsumptionId, setDeletingConsumptionId] = useState<
		string | null
	>(null);
	const [showHiddenConsumptions, setShowHiddenConsumptions] = useQueryState(
		"showHiddenConsumptions",
		{
			shallow: false,
		},
	);
	const t = useTranslations("resources");
	const showHiddenId = useId();

	// Helper function to filter consumptions based on cutoff date
	const filterConsumptions = (
		consumptions: Awaited<
			ReturnType<typeof getGroup>
		>["resources"][number]["consumptions"],
	) => {
		if (!cutoffDate || showHiddenConsumptions === "true") {
			return consumptions;
		}
		return consumptions.filter(
			(consumption) => new Date(consumption.date) >= cutoffDate,
		);
	};

	const handleDeleteResource = async (resourceId: string) => {
		setDeletingResourceId(resourceId);
		try {
			await removeResource(resourceId);
		} catch (error) {
			console.error("Failed to remove resource:", error);
		} finally {
			setDeletingResourceId(null);
		}
	};

	const handleDeleteConsumption = async (consumptionId: string) => {
		setDeletingConsumptionId(consumptionId);
		try {
			await removeConsumption(consumptionId);
		} catch (error) {
			console.error("Failed to remove consumption:", error);
		} finally {
			setDeletingConsumptionId(null);
		}
	};

	const formatDate = (date: Date) => new Date(date).toLocaleDateString();

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Package className="w-5 h-5" />
						{t("title")}
					</CardTitle>
					<div className="flex items-center gap-8">
						{cutoffDate && (
							<div className="flex items-center gap-2">
								<Label htmlFor={showHiddenId} className="text-sm">
									{showHiddenConsumptions ? (
										<Eye className="w-4 h-4" />
									) : (
										<EyeOff className="w-4 h-4" />
									)}
								</Label>
								<Switch
									id={showHiddenId}
									checked={showHiddenConsumptions === "true"}
									onCheckedChange={(checked) =>
										setShowHiddenConsumptions(checked ? "true" : "false")
									}
									disabled={false}
								/>
								<span className="text-sm text-gray-600 dark:text-gray-300">
									{t("showHidden")}
								</span>
							</div>
						)}
						<div className="flex gap-2">
							<CreateConsumptionDialog
								groupId={groupId}
								resources={resources}
								members={members}
							>
								<Button size="sm">
									<Plus className="w-4 h-4 mr-2" />
									{t("logConsumption")}
								</Button>
							</CreateConsumptionDialog>
							<CreateResourceDialog groupId={groupId}>
								<Button size="sm" variant="outline">
									<Plus className="w-4 h-4 mr-2" />
									{t("addResource")}
								</Button>
							</CreateResourceDialog>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{resources.length === 0 ? (
					<div className="text-center py-8 text-gray-500 dark:text-gray-400">
						<Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p>{t("noResources")}</p>
						<p className="text-sm">{t("noResourcesDescription")}</p>
					</div>
				) : (
					<div className="space-y-6">
						{resources.map((resource) => (
							<div key={resource.id} className="border rounded-lg p-4">
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<h3 className="font-medium text-lg">{resource.name}</h3>
											{resource.unit && resource.unitPrice && (
												<Badge variant="outline" className="text-xs">
													{formatCurrency(
														Number(resource.unitPrice),
														group.currency,
													)}
													/{resource.unit}
												</Badge>
											)}
										</div>
										{resource.description && (
											<p className="text-sm text-gray-600 dark:text-gray-300">
												{resource.description}
											</p>
										)}
									</div>
									<div className="flex items-center gap-2">
										<CreateResourceDialog
											groupId={groupId}
											resource={{
												...resource,
												unitPrice: Number(resource.unitPrice),
											}}
											onResourceUpdated={() => window.location.reload()}
										>
											<Button
												variant="ghost"
												size="sm"
												className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
											>
												<Edit className="w-4 h-4" />
											</Button>
										</CreateResourceDialog>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDeleteResource(resource.id)}
											disabled={deletingResourceId === resource.id}
											className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</div>

								{filterConsumptions(resource.consumptions).length === 0 ? (
									<div className="text-center py-4 text-gray-500 dark:text-gray-400">
										<p className="text-sm">{t("noConsumptions")}</p>
									</div>
								) : (
									<div className="space-y-3">
										<h4 className="font-medium text-sm text-gray-700 dark:text-gray-200">
											{t("consumptions")}:
										</h4>
										{filterConsumptions(resource.consumptions).map(
											(consumption) => (
												<div
													key={consumption.id}
													className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
												>
													<div className="flex items-start justify-between mb-2">
														<div className="flex-1">
															<div className="flex items-center gap-2">
																<Badge variant="secondary" className="text-sm">
																	{consumption.isUnitAmount
																		? `${consumption.amount} ${resource.unit}`
																		: formatCurrency(
																				Number(consumption.amount),
																				group.currency,
																			)}
																</Badge>
																{consumption.isUnitAmount &&
																	resource.unitPrice && (
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{formatCurrency(
																				Number(consumption.amount) *
																					Number(resource.unitPrice),
																				group.currency,
																			)}{" "}
																			{t("total")}
																		</Badge>
																	)}
															</div>
															{consumption.description && (
																<p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
																	{consumption.description}
																</p>
															)}
														</div>
														<div className="flex items-center gap-2">
															<CreateConsumptionDialog
																groupId={groupId}
																resources={resources}
																members={members}
																consumption={{
																	...consumption,
																	amount: Number(consumption.amount),
																	selectedMembers:
																		consumption.consumptionMembers.map(
																			(cm) => cm.memberId,
																		),
																}}
																onConsumptionUpdated={() =>
																	window.location.reload()
																}
															>
																<Button
																	variant="ghost"
																	size="sm"
																	className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
																>
																	<Edit className="w-4 h-4" />
																</Button>
															</CreateConsumptionDialog>
															<Button
																variant="ghost"
																size="sm"
																onClick={() =>
																	handleDeleteConsumption(consumption.id)
																}
																disabled={
																	deletingConsumptionId === consumption.id
																}
																className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
															>
																<Trash2 className="w-4 h-4" />
															</Button>
														</div>
													</div>

													<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
														<div className="flex items-center gap-1">
															<Calendar className="w-4 h-4" />
															<span>{formatDate(consumption.date)}</span>
														</div>
														<div className="flex items-center gap-1">
															<Users className="w-4 h-4" />
															<span>
																{consumption.consumptionMembers.length}{" "}
																{t("members")}
															</span>
														</div>
													</div>

													<div className="space-y-1">
														<p className="text-sm font-medium text-gray-700 dark:text-gray-200">
															{t("splitBetween")}:
														</p>
														<div className="flex flex-wrap gap-2">
															{consumption.consumptionMembers.map(
																(consumptionMember: any) => (
																	<Badge
																		key={consumptionMember.member.id}
																		variant="outline"
																		className="text-xs"
																	>
																		{consumptionMember.member.name}: €
																		{Number(consumptionMember.amount).toFixed(
																			2,
																		)}
																	</Badge>
																),
															)}
														</div>
													</div>
												</div>
											),
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
