import { createAuthClient } from "better-auth/react";
import { ssoClient } from "@better-auth/sso/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";
import { HABIDAT_SSO_PROVIDER_ID } from "./saml-config";

export const authClient = createAuthClient({
	plugins: [ssoClient(), inferAdditionalFields<typeof auth>()],
});

export const { useSession, signOut } = authClient;

/**
 * End the Pariti session and send a SAML LogoutRequest to habidat-auth.
 * Falls back to a local sign-out if SLO is unavailable.
 */
export async function signOutWithSlo(): Promise<void> {
	try {
		const res = await fetch(
			`/api/auth/sso/saml2/logout/${HABIDAT_SSO_PROVIDER_ID}`,
			{
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					callbackURL: `${window.location.origin}/`,
				}),
				redirect: "manual",
			},
		);
		const location = res.headers.get("Location");
		if (
			location &&
			(res.status === 301 ||
				res.status === 302 ||
				res.status === 303 ||
				res.status === 307 ||
				res.status === 308)
		) {
			window.location.assign(location);
			return;
		}
	} catch {
		// Local sign-out below.
	}
	await authClient.signOut();
	window.location.assign("/");
}
