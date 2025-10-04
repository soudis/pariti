import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "@/components/query-provider";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
	title: "Pariti - Money Sharing Made Simple",
	description: "A  money sharing app for groups and friends",
	icons: {
		icon: "/logo-192.png",
		shortcut: "/logo-192.png",
		apple: "/logo-192.png",
	},
	openGraph: {
		title: "Pariti - Money Sharing Made Simple",
		description: "A money sharing app for groups and friends",
		images: ["/logo-512.png"],
	},
};

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	// Validate that the incoming `locale` parameter is valid
	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}
	// Providing all messages to the client
	// side is the easiest way to get started
	const messages = await getMessages({ locale: locale ?? "en" });

	return (
		<NextIntlClientProvider messages={messages}>
			<NuqsAdapter>
				<QueryProvider>{children}</QueryProvider>
			</NuqsAdapter>
		</NextIntlClientProvider>
	);
}
