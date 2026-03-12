/**
 * Prisma seed entrypoint. Runs ensureHabidatSsoProvider so the SP metadata
 * endpoint can resolve ?providerId=habidat. The same logic runs on Next.js
 * server startup via instrumentation.ts.
 *
 * Run: pnpm prisma db seed (or npx prisma db seed)
 */
import "dotenv/config";
import { ensureHabidatSsoProvider } from "../src/lib/seed-sso-provider";

async function main() {
	await ensureHabidatSsoProvider();
	if (process.env.SAML_IDP_ENTRY_POINT) {
		const base =
			process.env.BETTER_AUTH_URL || "http://localhost:3000";
		console.log(
			`SSO provider "habidat" upserted. Metadata: ${base}/api/auth/sso/saml2/sp/metadata?providerId=habidat`,
		);
	} else {
		console.log("SAML_IDP_ENTRY_POINT not set; skipping SSO provider seed.");
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
