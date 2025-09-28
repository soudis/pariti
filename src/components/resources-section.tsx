"use client";
import {
	Calendar,
	ChevronDown,
	ChevronRight,
	Edit,
	Eye,
	EyeOff,
	Package,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useQueryState } from "nuqs";
import { useId, useState } from "react";
import {
	type getGroup,
	removeConsumptionAction,
	removeResourceAction,
} from "@/actions";
import type { getCalculatedGroup } from "@/actions/get-group";
import { ConsumptionDialog } from "@/components/consumption-dialog";
import { ResourceDialog } from "@/components/resource-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/currency";
import { handleActionErrors } from "@/lib/utils";

interface ResourcesSectionProps {
	group: Awaited<ReturnType<typeof getCalculatedGroup>>;
	cutoffDate: Date | null;
}

export function ResourcesSection({
	group,
	group: { resources, id: groupId },
	cutoffDate,
}: ResourcesSectionProps) {
	const [deletingResourceId, setDeletingResourceId] = useState<string | null>(
		null,
	);
	const [deletingConsumptionId, setDeletingConsumptionId] = useState<
		string | null
	>(null);
	const [expandedResources, setExpandedResources] = useQueryState(
		"expandedResources",
		{
			defaultValue: "",
			shallow: false,
		},
	);
	const [showHiddenConsumptions, setShowHiddenConsumptions] = useQueryState(
		"showHiddenConsumptions",
		{
			shallow: false,
		},
	);
	const t = useTranslations("resources");
	const showHiddenId = useId();

	const { executeAsync: removeResource } = useAction(removeResourceAction);
	const { executeAsync: removeConsumption } = useAction(
		removeConsumptionAction,
	);

	// Helper function to filter consumptions based on cutoff date
	const filterConsumptions = (
		consumptions: Awaited<
			ReturnType<typeof getCalculatedGroup>
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
		await handleActionErrors(await removeResource({ resourceId }));
		setDeletingResourceId(null);
	};

	const handleDeleteConsumption = async (consumptionId: string) => {
		setDeletingConsumptionId(consumptionId);
		await handleActionErrors(await removeConsumption({ consumptionId }));
		setDeletingConsumptionId(null);
	};

	const formatDate = (date: Date) => new Date(date).toLocaleDateString();

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

	// Helper function to calculate total consumption amount for a resource
	const calculateTotalConsumption = (
		consumptions: Awaited<
			ReturnType<typeof getGroup>
		>["resources"][number]["consumptions"],
	) => {
		return consumptions.reduce((total, consumption) => {
			// Find the resource to get unit price
			const resource = resources.find((r) =>
				r.consumptions.some((c) => c.id === consumption.id),
			);
			if (resource?.unitPrice && resource.unit) {
				return total + Number(consumption.amount) * Number(resource.unitPrice);
			}
			return total + Number(consumption.amount);
		}, 0);
	};

	// Helper function to toggle resource expansion
	const toggleResourceExpansion = (resourceId: string) => {
		const currentExpanded = expandedResources
			? expandedResources.split(",")
			: [];
		const isExpanded = currentExpanded.includes(resourceId);

		if (isExpanded) {
			// Remove the resource from expanded list
			const newExpanded = currentExpanded.filter((id) => id !== resourceId);
			setExpandedResources(
				newExpanded.length > 0 ? newExpanded.join(",") : null,
			);
		} else {
			// Add the resource to expanded list
			const newExpanded = [...currentExpanded, resourceId];
			setExpandedResources(newExpanded.join(","));
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<CardTitle className="flex items-center gap-2">
						<Package className="w-5 h-5" />
						{t("title")}
					</CardTitle>
					<div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
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
						<div className="grid grid-cols-1 sm:flex sm:gap-2 gap-2">
							<ConsumptionDialog group={group}>
								<Button
									size="sm"
									className="w-full sm:w-auto text-xs sm:text-sm"
								>
									<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
									<span className="truncate">{t("logConsumption")}</span>
								</Button>
							</ConsumptionDialog>
							<ResourceDialog groupId={groupId}>
								<Button
									size="sm"
									variant="outline"
									className="w-full sm:w-auto text-xs sm:text-sm"
								>
									<Plus className="w-4 h-4 mr-2 flex-shrink-0" />
									<span className="truncate">{t("addResource")}</span>
								</Button>
							</ResourceDialog>
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
						{resources.map((resource) => {
							const filteredConsumptions = filterConsumptions(
								resource.consumptions,
							);
							const isExpanded = expandedResources
								? expandedResources.split(",").includes(resource.id)
								: false;
							const totalConsumption =
								calculateTotalConsumption(filteredConsumptions);

							return (
								<div key={resource.id} className="border rounded-lg p-4">
									<div className="flex  sm:items-start sm:justify-between gap-3 mb-4">
										<div className="flex-1 min-w-0">
											<div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
												<h3 className="font-medium text-base sm:text-lg truncate">
													{resource.name}
												</h3>
												{resource.unit && resource.unitPrice && (
													<Badge
														variant="outline"
														className="text-xs flex-shrink-0"
													>
														{formatCurrency(
															Number(resource.unitPrice),
															group.currency,
														)}
														/{resource.unit}
													</Badge>
												)}
											</div>
											{resource.description && (
												<p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
													{resource.description}
												</p>
											)}
										</div>
										<div className="flex items-center gap-2 flex-shrink-0">
											<ResourceDialog
												groupId={groupId}
												resource={{
													...resource,
													unitPrice: Number(resource.unitPrice),
												}}
											>
												<Button
													variant="ghost"
													size="sm"
													className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
												>
													<Edit className="w-4 h-4" />
												</Button>
											</ResourceDialog>
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

									{/* Consumption Summary */}
									{filteredConsumptions.length === 0 ? (
										<div className="text-center py-4 text-gray-500 dark:text-gray-400">
											<p className="text-sm">{t("noConsumptions")}</p>
										</div>
									) : (
										<div className="space-y-3">
											{/* Summary Row */}
											<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
												<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
													<Badge
														variant="secondary"
														className="text-xs sm:text-sm"
													>
														{filteredConsumptions.length} {t("consumptions")}
													</Badge>
													<Badge
														variant="outline"
														className="text-xs sm:text-sm"
													>
														{formatCurrency(totalConsumption, group.currency)}{" "}
														{t("total")}
													</Badge>
													<Badge
														variant="outline"
														className={`text-xs sm:text-sm ${getBalanceColor(resource.balance)}`}
													>
														{formatBalance(resource.balance)} {t("balance")}
													</Badge>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => toggleResourceExpansion(resource.id)}
													className="text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 self-start sm:self-auto"
												>
													{isExpanded ? (
														<ChevronDown className="w-4 h-4" />
													) : (
														<ChevronRight className="w-4 h-4" />
													)}
													<span className="ml-1 text-xs sm:text-sm">
														{isExpanded ? t("hideDetails") : t("showDetails")}
													</span>
												</Button>
											</div>

											{/* Detailed Consumptions (only when expanded) */}
											{isExpanded && (
												<div className="space-y-3">
													<h4 className="font-medium text-sm text-gray-700 dark:text-gray-200">
														{t("consumptions")}:
													</h4>
													{filteredConsumptions.map((consumption) => (
														<div
															key={consumption.id}
															className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
														>
															<div className="flex items-start justify-between mb-2">
																<div className="flex-1">
																	<div className="flex items-center gap-2">
																		<Badge
																			variant="secondary"
																			className="text-sm"
																		>
																			{resource.unit && resource.unitPrice
																				? `${consumption.amount} ${resource.unit}`
																				: formatCurrency(
																						Number(consumption.amount),
																						group.currency,
																					)}
																		</Badge>
																		{resource.unit && resource.unitPrice && (
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
																	<ConsumptionDialog
																		group={group}
																		consumption={{
																			...consumption,
																			amount: Number(consumption.amount),
																			sharingMethod:
																				(consumption.sharingMethod as
																					| "equal"
																					| "weights") || "equal",
																			selectedMembers:
																				consumption.consumptionMembers.map(
																					(cm) => cm.memberId,
																				),
																			memberAmounts:
																				consumption.consumptionMembers.map(
																					(cm) => ({
																						memberId: cm.memberId,
																						amount: Number(cm.amount),
																						weight: Number(cm.weight),
																					}),
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
																	</ConsumptionDialog>
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
																	{consumption.calculatedConsumptionMembers.map(
																		(consumptionMember) => (
																			<Badge
																				key={consumptionMember.memberId}
																				variant="outline"
																				className="text-xs"
																			>
																				{
																					group.members.find(
																						(m) =>
																							m.id ===
																							consumptionMember.memberId,
																					)?.name
																				}
																				: €
																				{Number(
																					consumptionMember.amount,
																				).toFixed(2)}
																			</Badge>
																		),
																	)}
																</div>
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
