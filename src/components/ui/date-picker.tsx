"use client";

import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
	value?: Date;
	onChange?: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function DatePicker({
	value,
	onChange,
	placeholder = "Pick a date",
	disabled = false,
	className,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);
	const locale = useLocale();

	const handleDateSelect = (date: Date | undefined) => {
		onChange?.(date);
		setOpen(false); // Close the popover when a date is selected
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"w-full justify-start text-left font-normal",
						!value && "text-muted-foreground",
						className,
					)}
					disabled={disabled}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{value ? (
						format(value, "PPP", { locale: locale === "de" ? de : enUS })
					) : (
						<span>{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					key={open ? (value?.getTime() ?? "empty") : "closed"}
					defaultMonth={value ?? new Date()}
					lang={locale}
					weekStartsOn={locale === "de" ? 1 : 0}
					mode="single"
					formatters={{
						formatCaption: (date) => {
							return format(date, "MMMM yyyy", {
								locale: locale === "de" ? de : enUS,
							});
						},
						formatWeekdayName: (index) => {
							return format(index, "E", {
								locale: locale === "de" ? de : enUS,
							});
						},
					}}
					selected={value}
					onSelect={handleDateSelect}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
