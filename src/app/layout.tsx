import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Parity - Money Sharing Made Simple",
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
		<html lang="en">
			<head>
				<link rel="icon" href="/logo-192.png" type="image/png" />
				<link rel="shortcut icon" href="/logo-192.png" type="image/png" />
				<link rel="apple-touch-icon" href="/logo-192.png" />
			</head>
			<body className={inter.className}>{children}</body>
		</html>
	);
}
