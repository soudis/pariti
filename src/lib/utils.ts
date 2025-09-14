import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function convertToPlainObject<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

export function handleActionErrors<T>({
	serverError,
	data,
}: {
	serverError?: string;
	data?: T;
}) {
	if (!data) {
		throw serverError ?? "Validation error";
	}

	return data;
}
