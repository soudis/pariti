"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface ConfirmDeleteDialogProps {
	title: string;
	description?: string;
	itemName?: string;
	onConfirm: () => void | Promise<void>;
	children: React.ReactNode;
	disabled?: boolean;
	variant?: "default" | "destructive";
}

export function ConfirmDeleteDialog({
	title,
	description,
	itemName,
	onConfirm,
	children,
	disabled = false,
	variant = "destructive",
}: ConfirmDeleteDialogProps) {
	const [open, setOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const t = useTranslations("common");

	const handleConfirm = async () => {
		setIsDeleting(true);
		try {
			await onConfirm();
			setOpen(false);
		} catch (error) {
			// Error handling is expected to be done by the parent component
			console.error("Delete operation failed:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleCancel = () => {
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
							<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
						</div>
						<div>
							<DialogTitle className="text-left text-lg sm:text-base">
								{title}
							</DialogTitle>
							{description && (
								<DialogDescription className="text-left mt-1 text-base sm:text-sm">
									{description}
								</DialogDescription>
							)}
						</div>
					</div>
				</DialogHeader>

				{itemName && (
					<div className="py-6 sm:py-4">
						<p className="text-lg sm:text-sm text-gray-600 dark:text-gray-300">
							{t("deleteConfirmation", { item: itemName })}
						</p>
					</div>
				)}

				<DialogFooter className="flex-col sm:flex-row gap-2">
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isDeleting}
						className="w-full sm:w-auto"
					>
						{t("cancel")}
					</Button>
					<Button
						variant={variant}
						onClick={handleConfirm}
						disabled={disabled || isDeleting}
						className="w-full sm:w-auto"
					>
						{isDeleting ? (
							<>
								<div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
								{t("deleting")}
							</>
						) : (
							<>
								<Trash2 className="w-4 h-4 mr-2" />
								{t("delete")}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
