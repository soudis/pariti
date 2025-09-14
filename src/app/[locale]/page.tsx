"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CreateGroupDialog } from "@/components/create-group-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function Home() {
	const t = useTranslations();
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto">
					{/* Header */}
					<div className="text-center mb-12">
						<div className="flex justify-center mb-6 ">
							<Image
								src="/logo.png"
								alt="Parity Logo"
								width={120}
								height={120}
								className="rounded-2xl shadow-lg bg-primary"
								priority
							/>
						</div>
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
							{t("home.title")}
						</h1>
						<p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
							{t("home.subtitle")}
						</p>
					</div>

					{/* Main Content */}
					<div className="grid gap-8 md:grid-cols-2">
						{/* Create New Group */}
						<Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
							<CardHeader className="text-center">
								<div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
									<Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
								</div>
								<CardTitle className="text-xl">
									{t("home.createGroup.title")}
								</CardTitle>
								<CardDescription>
									{t("home.createGroup.description")}
								</CardDescription>
							</CardHeader>
							<CardContent className="text-center">
								<CreateGroupDialog>
									<Button size="lg" className="w-full">
										<Plus className="w-4 h-4 mr-2" />
										{t("home.createGroup.button")}
									</Button>
								</CreateGroupDialog>
							</CardContent>
						</Card>

						{/* Join Existing Group */}
						<Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-colors">
							<CardHeader className="text-center">
								<div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
									<svg
										className="w-6 h-6 text-green-600 dark:text-green-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Join Group</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
										/>
									</svg>
								</div>
								<CardTitle className="text-xl">
									{t("home.joinGroup.title")}
								</CardTitle>
								<CardDescription>
									{t("home.joinGroup.description")}
								</CardDescription>
							</CardHeader>
							<CardContent className="text-center">
								<Button variant="outline" size="lg" className="w-full">
									<svg
										className="w-4 h-4 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Join Group</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
										/>
									</svg>
									{t("home.joinGroup.button")}
								</Button>
							</CardContent>
						</Card>
					</div>

					{/* Features */}
					<div className="mt-16">
						<h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
							{t("home.howItWorks.title")}
						</h2>
						<div className="space-y-8">
							{/* Steps 1-2 */}
							<div className="grid gap-6 md:grid-cols-2">
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
							<div className="grid gap-6 md:grid-cols-2">
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
											<div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-2 mx-auto">
												<span className="text-red-600 dark:text-red-400 font-bold">
													5
												</span>
											</div>
											<CardTitle className="text-lg text-center">
												{t("home.howItWorks.step5.title")}
											</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-gray-600 dark:text-gray-300 text-center">
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
