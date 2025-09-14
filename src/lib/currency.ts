// Currency formatting utilities

export const CURRENCY_SYMBOLS: Record<string, string> = {
	USD: "$",
	EUR: "€",
	GBP: "£",
	CHF: "CHF",
	CAD: "C$",
	AUD: "A$",
	JPY: "¥",
	CNY: "¥",
	INR: "₹",
	BRL: "R$",
};

export function formatCurrency(
	amount: number,
	currency: string = "USD",
): string {
	const symbol = CURRENCY_SYMBOLS[currency] || currency;

	// For currencies like JPY that don't use decimal places
	const decimals = ["JPY"].includes(currency) ? 0 : 2;

	return `${symbol}${amount.toFixed(decimals)}`;
}

export function getCurrencySymbol(currency: string = "USD"): string {
	return CURRENCY_SYMBOLS[currency] || currency;
}
