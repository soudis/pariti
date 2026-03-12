"use client";

import { LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { authClient, useSession } from "@/lib/auth-client";

export function UserMenu() {
	const { data: session } = useSession();
	const t = useTranslations("auth");

	if (!session?.user) return null;

	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.reload();
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<User className="w-4 h-4" />
					<span className="truncate max-w-[120px]">
						{session.user.name || session.user.email}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-56" align="end">
				<div className="space-y-2">
					<p className="text-sm font-medium truncate">
						{session.user.name}
					</p>
					<p className="text-xs text-gray-500 truncate">
						{session.user.email}
					</p>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleSignOut}
						className="w-full justify-start"
					>
						<LogOut className="w-4 h-4 mr-2" />
						{t("signOut")}
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
