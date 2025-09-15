import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Pariti - Money Sharing Made Simple",
	description: "A money sharing app for groups and friends",
	icons: {
		icon: "/logo-192.png",
		shortcut: "/logo-192.png",
		apple: "/logo-192.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/logo-192.png" type="image/png" />
				<link rel="shortcut icon" href="/logo-192.png" type="image/png" />
				<link rel="apple-touch-icon" href="/logo-192.png" />
			</head>
			<body className={inter.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
					<Toaster richColors position="bottom-center" />
				</ThemeProvider>
			</body>
		</html>
	);
}
