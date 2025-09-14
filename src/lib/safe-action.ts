import { getTranslations } from "next-intl/server";
import { createSafeActionClient } from "next-safe-action";

export class UserError extends Error {
	messageId?: string;

	async getMessage() {
		const t = await getTranslations("error");
		return this.messageId ? t(this.messageId) : this.message;
	}

	constructor(messageId?: string, message?: string) {
		super(message ?? messageId);
		this.messageId = messageId;
	}
}

export const actionClient = createSafeActionClient({
	// https://next-safe-action.dev/docs/define-actions/create-the-client#handleservererror
	handleServerError: async (error) => {
		const t = await getTranslations("error");

		if (error instanceof UserError) {
			return await error.getMessage();
		}

		console.error("Action error:", error);
		return t("server");
	},
});
