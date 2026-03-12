
export async function register() {
	if (process.env.NEXT_RUNTIME !== "nodejs") {
		return;
	}

	try {
		const { ensureHabidatSsoProvider } = await import("./lib/seed-sso-provider");
		await ensureHabidatSsoProvider();
	} catch (error) {
		console.error("[instrumentation] SSO provider seed failed:", error);
		// Don't throw: allow server to start even if DB is temporarily unavailable
	}
}
