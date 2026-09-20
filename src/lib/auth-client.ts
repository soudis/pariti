import { ssoClient } from "@better-auth/sso/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";
import { HABIDAT_SSO_PROVIDER_ID } from "./saml-config";

export const authClient = createAuthClient({
	plugins: [ssoClient(), inferAdditionalFields<typeof auth>()],
});

export const { useSession, signOut } = authClient;

const SSO_ATTEMPT_KEY = "pariti.sso.attempt";

export function clearSsoAttempt(): void {
	sessionStorage.removeItem(SSO_ATTEMPT_KEY);
}

export function hasSsoAttempt(): boolean {
	return sessionStorage.getItem(SSO_ATTEMPT_KEY) === "1";
}

export async function startHabidatSso(): Promise<void> {
	sessionStorage.setItem(SSO_ATTEMPT_KEY, "1");
	const path = window.location.pathname || "/";
	await authClient.signIn.sso({
		providerId: HABIDAT_SSO_PROVIDER_ID,
		callbackURL: path,
		errorCallbackURL: path,
	});
}

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
