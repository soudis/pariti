"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { startHabidatSso } from "@/lib/auth-client";

export function SignInButton() {
	const t = useTranslations("auth");

	const handleSignIn = async () => {
		await startHabidatSso();
	};

	return (
		<Button
			size="lg"
			className="w-full text-sm sm:text-base"
			onClick={handleSignIn}
		>
			<LogIn className="w-4 h-4 mr-2" />
			<span className="truncate">{t("signIn")}</span>
		</Button>
	);
}
