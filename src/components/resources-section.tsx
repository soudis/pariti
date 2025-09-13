"use client";

import {
	Calendar,
	Eye,
	EyeOff,
	Package,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { CreateConsumptionDialog } from "@/components/create-consumption-dialog";
import { CreateResourceDialog } from "@/components/create-resource-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	type getGroup,
	getSettlementCutoffDate,
	removeConsumption,
	removeResource,
} from "@/lib/actions";

interface ResourcesSectionProps {
	groupId: string;
	resources: Awaited<ReturnType<typeof getGroup>>["resources"];
	members: Awaited<ReturnType<typeof getGroup>>["members"];
}

export function ResourcesSection({
	groupId,
	resources,
	members,
}: ResourcesSectionProps) {
	const [deletingResourceId, setDeletingResourceId] = useState<string | null>(
		null,
	);
	const [deletingConsumptionId, setDeletingConsumptionId] = useState<
		string | null
	>(null);
	const [showHiddenConsumptions, setShowHiddenConsumptions] = useState(false);
	const [cutoffDate, setCutoffDate] = useState<Date | null>(null);
	const [loadingCutoff, setLoadingCutoff] = useState(false);
	const t = useTranslations("resources");
	const showHiddenId = useId();

	// Load cutoff date for filtering
	useEffect(() => {
		const loadCutoffDate = async () => {
			setLoadingCutoff(true);
			try {
				const cutoff = await getSettlementCutoffDate(groupId);
				setCutoffDate(cutoff);
			} catch (error) {
				console.error("Failed to load cutoff date:", error);
			} finally {
				setLoadingCutoff(false);
			}
		};

		loadCutoffDate();
	}, [groupId]);

	// Helper function to filter consumptions based on cutoff date
	const filterConsumptions = (consumptions: any[]) => {
		if (!cutoffDate || showHiddenConsumptions) {
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
					<div className="flex items-center gap-3">
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
									checked={showHiddenConsumptions}
									onCheckedChange={setShowHiddenConsumptions}
									disabled={loadingCutoff}
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
								<Button size="sm" variant="outline">
									<Plus className="w-4 h-4 mr-2" />
									{t("logConsumption")}
								</Button>
							</CreateConsumptionDialog>
							<CreateResourceDialog groupId={groupId}>
								<Button size="sm">
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
													€{Number(resource.unitPrice)}/{resource.unit}
												</Badge>
											)}
										</div>
										{resource.description && (
											<p className="text-sm text-gray-600 dark:text-gray-300">
												{resource.description}
											</p>
										)}
									</div>
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
																		: `€${consumption.amount.toFixed(2)}`}
																</Badge>
																{consumption.isUnitAmount &&
																	resource.unitPrice && (
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			€
																			{(
																				Number(consumption.amount) *
																				Number(resource.unitPrice)
																			).toFixed(2)}{" "}
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
