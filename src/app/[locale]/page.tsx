"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AccessibleGroupsSection } from "@/components/accessible-groups-section";
import { HowItWorksDialog } from "@/components/how-it-works-dialog";
import { TopBar } from "@/components/top-bar";
import { authClient, useSession } from "@/lib/auth-client";

export default function Home() {
	const t = useTranslations();
	const { data: session, isPending } = useSession();
	const isAuthenticated = !!session?.user;

	useEffect(() => {
		if (!isPending && !isAuthenticated) {
			authClient.signIn.sso({
				providerId: "habidat",
				callbackURL: "/",
			});
		}
	}, [isPending, isAuthenticated]);

	if (isPending || !isAuthenticated) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
				<div className="text-center">
					<Image
						src="/logo.png"
						alt="Pariti Logo"
						width={80}
						height={80}
						className="rounded-2xl shadow-lg bg-primary mx-auto mb-4"
						priority
					/>
					<p className="text-gray-600 dark:text-gray-300">
						{t("auth.redirecting")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
				<div className="max-w-6xl mx-auto space-y-6">
					<TopBar
						title={t("home.title")}
						subtitle={t("home.subtitle")}
						showHomeLink={false}
						actions={<HowItWorksDialog />}
					/>

					<AccessibleGroupsSection />
				</div>
			</div>
		</div>
	);
}
