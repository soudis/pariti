"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
	FormControl,
	FormDescription,
	FormField as FormFieldPrimitive,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormFieldProps<TFormValues extends FieldValues = FieldValues> {
	control: Control<TFormValues>;
	name: FieldPath<TFormValues>;
	label?: string;
	description?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	className?: string;
}

interface TextFieldProps<TFormValues extends FieldValues = FieldValues>
	extends FormFieldProps<TFormValues> {
	type?: "text" | "email" | "password" | "number" | "tel" | "url";
	step?: string;
	min?: number;
	max?: number;
}

interface TextareaFieldProps<TFormValues extends FieldValues = FieldValues>
	extends FormFieldProps<TFormValues> {
	rows?: number;
}

interface SelectFieldProps<TFormValues extends FieldValues = FieldValues>
	extends FormFieldProps<TFormValues> {
	options: Array<{ value: string; label: string }>;
}

interface CheckboxFieldProps<TFormValues extends FieldValues = FieldValues>
	extends FormFieldProps<TFormValues> {
	text?: string;
}

interface DateFieldProps<TFormValues extends FieldValues = FieldValues>
	extends FormFieldProps<TFormValues> {
	placeholder?: string;
}

export function TextField<TFormValues extends FieldValues = FieldValues>({
	control,
	name,
	label,
	description,
	placeholder,
	required,
	disabled,
	className,
	type = "text",
	step,
	min,
	max,
}: TextFieldProps<TFormValues>) {
	return (
		<FormFieldPrimitive
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<Input
							{...field}
							type={type}
							placeholder={placeholder}
							required={required}
							disabled={disabled}
							step={step}
							min={min}
							max={max}
							value={field.value || ""}
						/>
					</FormControl>
					{description && <FormDescription>{description}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

export function NumberField<TFormValues extends FieldValues = FieldValues>({
	control,
	name,
	label,
	description,
	placeholder,
	required,
	disabled,
	className,
	step = "0.01",
	min = 0,
	max,
}: TextFieldProps<TFormValues>) {
	return (
		<FormFieldPrimitive
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<Input
							{...field}
							type="number"
							placeholder={placeholder}
							required={required}
							disabled={disabled}
							step={step}
							min={min}
							max={max}
							value={field.value || ""}
						/>
					</FormControl>
					{description && <FormDescription>{description}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

export function TextareaField<TFormValues extends FieldValues = FieldValues>({
	control,
	name,
	label,
	description,
	placeholder,
	required,
	disabled,
	className,
	rows = 3,
}: TextareaFieldProps<TFormValues>) {
	return (
		<FormFieldPrimitive
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<Textarea
							{...field}
							placeholder={placeholder}
							required={required}
							disabled={disabled}
							rows={rows}
							value={field.value || ""}
						/>
					</FormControl>
					{description && <FormDescription>{description}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

export function SelectField<TFormValues extends FieldValues = FieldValues>({
	control,
	name,
	label,
	description,
	placeholder,
	required,
	disabled,
	className,
	options,
}: SelectFieldProps<TFormValues>) {
	return (
		<FormFieldPrimitive
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && <FormLabel>{label}</FormLabel>}
					<Select
						onValueChange={field.onChange}
						defaultValue={field.value}
						disabled={disabled}
						required={required}
					>
						<FormControl>
							<SelectTrigger className="w-full">
								<SelectValue placeholder={placeholder} />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{description && <FormDescription>{description}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

export function CheckboxField<TFormValues extends FieldValues = FieldValues>({
	control,
	name,
	label,
	description,
	disabled,
	className,
	text,
}: CheckboxFieldProps<TFormValues>) {
	return (
		<FormFieldPrimitive
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem
					className={cn(
						"flex flex-row items-start space-x-3 space-y-0",
						className,
					)}
				>
					<FormControl>
						<Checkbox
							checked={field.value}
							onCheckedChange={field.onChange}
							disabled={disabled}
						/>
					</FormControl>
					<div className="space-y-1 leading-none">
						{label && <FormLabel>{label}</FormLabel>}
						{text && (
							<FormLabel className="text-sm font-normal">{text}</FormLabel>
						)}
						{description && <FormDescription>{description}</FormDescription>}
					</div>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

export function DateField<TFormValues extends FieldValues = FieldValues>({
	control,
	name,
	label,
	description,
	placeholder,
	disabled,
	className,
	clearable = false,
}: DateFieldProps<TFormValues> & { clearable?: boolean }) {
	return (
		<FormFieldPrimitive
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<div className="flex gap-2 items-center">
							<div className="flex-1 min-w-0">
								<DatePicker
									value={field.value ? new Date(field.value) : undefined}
									onChange={field.onChange}
									placeholder={placeholder}
									disabled={disabled}
								/>
							</div>
							{clearable && field.value && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="shrink-0"
									onClick={() => field.onChange(null)}
								>
									<span className="sr-only">Clear</span>
									<span aria-hidden>×</span>
								</Button>
							)}
						</div>
					</FormControl>
					{description && <FormDescription>{description}</FormDescription>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
