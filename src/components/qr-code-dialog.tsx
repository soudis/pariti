"use client";

import { QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Girocode } from "react-girocode";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface QRCodeDialogProps {
	recipientName: string;
	iban: string;
	amount: number;
	description?: string;
	children: React.ReactNode;
}

export function QRCodeDialog({
	recipientName,
	iban,
	amount,
	description,
	children,
}: QRCodeDialogProps) {
	const [open, setOpen] = useState(false);
	const t = useTranslations("qrCode");

	// Format amount for QR code (in cents)
	const amountInCents = Math.round(amount * 100);

	// Create reference for the transaction
	const reference = description || `Payment to ${recipientName}`;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] h-full sm:max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<QrCode className="w-5 h-5" />
						{t("title")}
					</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					{/* Transaction Details */}
					<div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<div className="flex justify-between">
							<span className="text-sm text-gray-600 dark:text-gray-300">
								{t("recipient")}:
							</span>
							<span className="text-sm font-medium">{recipientName}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-gray-600 dark:text-gray-300">
								{t("iban")}:
							</span>
							<span className="text-sm font-mono">{iban}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-sm text-gray-600 dark:text-gray-300">
								{t("amount")}:
							</span>
							<span className="text-sm font-medium">€{amount.toFixed(2)}</span>
						</div>
						{description && (
							<div className="flex justify-between">
								<span className="text-sm text-gray-600 dark:text-gray-300">
									{t("reference")}:
								</span>
								<span className="text-sm">{description}</span>
							</div>
						)}
					</div>

					{/* QR Code */}
					<div className="flex justify-center p-4 bg-white rounded-lg border">
						<Girocode
							iban={iban}
							amount={amountInCents}
							text={reference}
							recipient={recipientName}
						/>
					</div>

					{/* Instructions */}
					<div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
						<p>{t("instructions.title")}</p>
						<ol className="list-decimal list-inside space-y-1 ml-2">
							<li>{t("instructions.step1")}</li>
							<li>{t("instructions.step2")}</li>
							<li>{t("instructions.step3")}</li>
						</ol>
					</div>

					<div className="flex justify-end">
						<Button onClick={() => setOpen(false)} variant="outline">
							{t("close")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
