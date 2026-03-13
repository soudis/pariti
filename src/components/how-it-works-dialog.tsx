"use client";

import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const steps = [
	{ key: "step1", color: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" },
	{ key: "step2", color: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400" },
	{ key: "step3", color: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400" },
	{ key: "step4", color: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400" },
	{ key: "step5", color: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400" },
] as const;

export function HowItWorksDialog() {
	const t = useTranslations("home.howItWorks");

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<HelpCircle className="w-4 h-4 mr-2" />
					{t("title")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
				</DialogHeader>
				<div className="flex-1 overflow-y-auto space-y-4 pr-1">
					{steps.map((step, index) => (
						<Card key={step.key}>
							<CardHeader className="pb-2">
								<div className="flex items-center gap-3">
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.color}`}
									>
										<span className="font-bold">{index + 1}</span>
									</div>
									<CardTitle className="text-base">
										{t(`${step.key}.title`)}
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-gray-600 dark:text-gray-300">
									{t(`${step.key}.description`)}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
