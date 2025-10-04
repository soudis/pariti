"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { GroupDialog } from "@/components/group-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { VisitedGroupsSection } from "@/components/visited-groups-section";

export default function Home() {
	const t = useTranslations();
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
				<div className="max-w-6xl mx-auto">
					{/* Theme Toggle */}
					<div className="flex justify-end mb-4">
						<ThemeToggle />
					</div>

					{/* Header */}
					<div className="text-center mb-8 sm:mb-12">
						<div className="flex justify-center mb-4 sm:mb-6">
							<Image
								src="/logo.png"
								alt="Pariti Logo"
								width={80}
								height={80}
								className="rounded-2xl shadow-lg bg-primary sm:w-[120px] sm:h-[120px]"
								priority
							/>
						</div>
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
							{t("home.title")}
						</h1>
						<p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-4 sm:px-0">
							{t("home.subtitle")}
						</p>
					</div>

					{/* Main Content - Create Group and Visited Groups */}
					<div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
						{/* Create New Group */}
						<div className="w-full">
							<Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors h-full">
								<CardHeader className="text-center">
									<div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
										<Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
									</div>
									<CardTitle className="text-lg sm:text-xl">
										{t("home.createGroup.title")}
									</CardTitle>
									<CardDescription className="text-sm sm:text-base">
										{t("home.createGroup.description")}
									</CardDescription>
								</CardHeader>
								<CardContent className="text-center">
									<GroupDialog>
										<Button size="lg" className="w-full text-sm sm:text-base">
											<Plus className="w-4 h-4 mr-2" />
											<span className="truncate">
												{t("home.createGroup.button")}
											</span>
										</Button>
									</GroupDialog>
								</CardContent>
							</Card>
						</div>

						{/* Visited Groups Section */}
						<div className="flex justify-center lg:justify-end">
							<div className="w-full max-w-md lg:max-w-none">
								<VisitedGroupsSection />
							</div>
						</div>
					</div>

					{/* Features */}
					<div className="mt-12 sm:mt-16">
						<h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white mb-6 sm:mb-8">
							{t("home.howItWorks.title")}
						</h2>
						<div className="space-y-6 sm:space-y-8">
							{/* Steps 1-2 */}
							<div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
								<Card>
									<CardHeader>
										<div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
											<span className="text-blue-600 dark:text-blue-400 font-bold">
												1
											</span>
										</div>
										<CardTitle className="text-lg">
											{t("home.howItWorks.step1.title")}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600 dark:text-gray-300">
											{t("home.howItWorks.step1.description")}
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-2">
											<span className="text-green-600 dark:text-green-400 font-bold">
												2
											</span>
										</div>
										<CardTitle className="text-lg">
											{t("home.howItWorks.step2.title")}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600 dark:text-gray-300">
											{t("home.howItWorks.step2.description")}
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Steps 3-4 */}
							<div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
								<Card>
									<CardHeader>
										<div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-2">
											<span className="text-purple-600 dark:text-purple-400 font-bold">
												3
											</span>
										</div>
										<CardTitle className="text-lg">
											{t("home.howItWorks.step3.title")}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600 dark:text-gray-300">
											{t("home.howItWorks.step3.description")}
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-2">
											<span className="text-orange-600 dark:text-orange-400 font-bold">
												4
											</span>
										</div>
										<CardTitle className="text-lg">
											{t("home.howItWorks.step4.title")}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600 dark:text-gray-300">
											{t("home.howItWorks.step4.description")}
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Step 5 */}
							<div className="flex justify-center">
								<div className="w-full max-w-md">
									<Card>
										<CardHeader>
											<div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-2 ">
												<span className="text-red-600 dark:text-red-400 font-bold">
													5
												</span>
											</div>
											<CardTitle className="text-lg">
												{t("home.howItWorks.step5.title")}
											</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-gray-600 dark:text-gray-300">
												{t("home.howItWorks.step5.description")}
											</p>
										</CardContent>
									</Card>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
