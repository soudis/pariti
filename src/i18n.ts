import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// Can be imported from a shared config
const locales = ["en"];

export default getRequestConfig(async ({ locale }) => {
	// Validate that the incoming `locale` parameter is valid
	const validLocale = locale || "en";
	if (!locales.includes(validLocale)) notFound();

	return {
		locale: validLocale,
		messages: (await import(`../messages/${validLocale}.json`)).default,
	};
});
