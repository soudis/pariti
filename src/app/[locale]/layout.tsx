import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { QueryProvider } from "@/components/query-provider";

const locales = ["en"];

export const metadata: Metadata = {
	title: "Shary - Money Sharing Made Simple",
	description: "A modern money sharing app for groups and friends",
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
	if (!locales.includes(locale ?? "en")) notFound();

	// Providing all messages to the client
	// side is the easiest way to get started
	const messages = await getMessages({ locale: locale ?? "en" });

	return (
		<NextIntlClientProvider messages={messages}>
			<QueryProvider>{children}</QueryProvider>
		</NextIntlClientProvider>
	);
}
