"use client";

import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { usePathname, useRouter } from "@/i18n/navigation";

const languages = [
	{ code: "en", name: "English" },
	{ code: "de", name: "Deutsch" },
];

export function LanguageSwitcher() {
	const locale = useLocale();
	const t = useTranslations("group.menuItems");
	const router = useRouter();
	const pathname = usePathname();

	const switchLanguage = (newLocale: string) => {
		router.push(pathname, { locale: newLocale });
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="icon" title={t("language")}>
					<Globe className="h-[1.2rem] w-[1.2rem]" />
					<span className="sr-only">{t("language")}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-48" align="end">
				<div className="space-y-1">
					{languages.map((language) => (
						<Button
							key={language.code}
							variant="ghost"
							size="sm"
							onClick={() => switchLanguage(language.code)}
							className="w-full justify-start"
						>
							<span className="flex-1 text-left">{language.name}</span>
							{locale === language.code && <Check className="h-4 w-4" />}
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
