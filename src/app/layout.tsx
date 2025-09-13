import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shary - Money Sharing Made Simple",
  description: "A modern money sharing app for groups and friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
