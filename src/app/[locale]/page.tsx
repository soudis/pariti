"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AccessibleGroupsSection } from "@/components/accessible-groups-section";
import { HowItWorksDialog } from "@/components/how-it-works-dialog";
import { SignInButton } from "@/components/sign-in-button";
import { TopBar } from "@/components/top-bar";
import {
	clearSsoAttempt,
	hasSsoAttempt,
	startHabidatSso,
	useSession,
} from "@/lib/auth-client";

export default function Home() {
	const t = useTranslations();
	const { data: session, isPending } = useSession();
	const isAuthenticated = !!session?.user;
	const [ssoGate, setSsoGate] = useState<"pending" | "error" | "ok">("pending");
	const [ssoError, setSsoError] = useState<string | null>(null);

	useEffect(() => {
		const error = new URLSearchParams(window.location.search).get("error");
		if (error) {
			clearSsoAttempt();
			setSsoError(error);
			setSsoGate("error");
			return;
		}
		setSsoGate("ok");
	}, []);

	useEffect(() => {
		if (isPending) return;
		if (isAuthenticated) {
			clearSsoAttempt();
			return;
		}
		if (ssoGate !== "ok") return;
		if (hasSsoAttempt()) {
			clearSsoAttempt();
			setSsoError("session_not_established");
			setSsoGate("error");
			return;
		}
		void startHabidatSso();
	}, [isPending, isAuthenticated, ssoGate]);

	if (isPending || !isAuthenticated) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
				<div className="text-center max-w-md px-4">
					<Image
						src="/logo.png"
						alt="Pariti Logo"
						width={80}
						height={80}
						className="rounded-2xl shadow-lg bg-primary mx-auto mb-4"
						priority
					/>
					{ssoGate === "error" && ssoError ? (
						<div className="space-y-4">
							<p className="text-gray-700 dark:text-gray-200">
								{t("auth.signInFailed", { error: ssoError })}
							</p>
							<SignInButton />
						</div>
					) : (
						<p className="text-gray-600 dark:text-gray-300">
							{t("auth.redirecting")}
						</p>
					)}
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
