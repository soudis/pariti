"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import type { getCalculatedGroup } from "@/actions/get-group";
import { ExpensesSection } from "@/components/expenses-section";
import { ResourcesSection } from "@/components/resources-section";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CalculatedGroup = Awaited<ReturnType<typeof getCalculatedGroup>>;

interface MemberDetailsDialogProps {
	group: CalculatedGroup;
	member: CalculatedGroup["members"][number];
	cutoffDate: Date | null;
	children: ReactNode;
}

export function MemberDetailsDialog({
	group,
	member,
	cutoffDate,
	children,
}: MemberDetailsDialogProps) {
	const t = useTranslations("members");

	const groupWithOwnExpenses = useMemo<CalculatedGroup>(
		() => ({
			...group,
			expenses: group.expenses.filter((e) => e.paidById === member.id),
		}),
		[group, member.id],
	);

	const groupWithPartOfExpenses = useMemo<CalculatedGroup>(
		() => ({
			...group,
			expenses: group.expenses.filter((e) =>
				e.calculatedExpenseMembers.some((m) => m.memberId === member.id),
			),
		}),
		[group, member.id],
	);

	const groupWithPartOfConsumptions = useMemo<CalculatedGroup>(
		() => ({
			...group,
			resources: group.resources
				.map((resource) => ({
					...resource,
					consumptions: resource.consumptions.filter((c) =>
						c.calculatedConsumptionMembers.some(
							(m) => m.memberId === member.id,
						),
					),
				}))
				.filter((resource) => resource.consumptions.length > 0),
		}),
		[group, member.id],
	);

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="grid content-start sm-top-0 sm:top-0 sm:translate-y-[35px] max-sm:inset-0 sm:max-w-4xl sm:max-h-[calc(100vh-6rem)]">
				<DialogHeader>
					<DialogTitle>{member.name}</DialogTitle>
				</DialogHeader>
				<div className="overflow-y-auto max-h-[calc(100vh-10rem)] sm:max-h-[calc(90vh-8rem)]">
					<Tabs defaultValue="ownExpenses">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger
								value="ownExpenses"
								className="text-xs sm:text-sm whitespace-pre-wrap"
							>
								{t("details.ownExpenses")}
							</TabsTrigger>
							<TabsTrigger
								value="partOfExpenses"
								className="text-xs sm:text-sm whitespace-pre-wrap"
							>
								{t("details.partOfExpenses")}
							</TabsTrigger>
							<TabsTrigger
								value="partOfConsumptions"
								className="text-xs sm:text-sm whitespace-pre-wrap"
							>
								{t("details.partOfConsumptions")}
							</TabsTrigger>
						</TabsList>
						<TabsContent value="ownExpenses" className="mt-4">
							<ExpensesSection
								group={groupWithOwnExpenses}
								cutoffDate={cutoffDate}
								readOnly
								emptyStateVariant="ownExpenses"
							/>
						</TabsContent>
						<TabsContent value="partOfExpenses" className="mt-4">
							<ExpensesSection
								group={groupWithPartOfExpenses}
								cutoffDate={cutoffDate}
								readOnly
								emptyStateVariant="partOfExpenses"
							/>
						</TabsContent>
						<TabsContent value="partOfConsumptions" className="mt-4">
							<ResourcesSection
								group={groupWithPartOfConsumptions}
								cutoffDate={cutoffDate}
								readOnly
								emptyStateVariant="memberConsumptions"
							/>
						</TabsContent>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	);
}
