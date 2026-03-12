import { prismaAdapter } from "@better-auth/prisma-adapter";
import { sso } from "@better-auth/sso";
import { betterAuth } from "better-auth";
import { headers } from "next/headers";
import { db } from "./db";

/**
 * Normalize IdP cert to the same canonical form samlify uses when comparing
 * (raw base64), then back to PEM. Ensures ERROR_UNMATCH_CERTIFICATE_DECLARATION_IN_METADATA
 * doesn't happen due to .env formatting (spaces vs newlines, etc.).
 */
function normalizeIdpCertForSaml(cert: string): string {
	if (!cert.trim()) return "";
	const raw = cert
		.replace(/\r/g, "")
		.replace(/\n/g, "")
		.replace(/\s/g, "")
		.replace(/-----BEGINCERTIFICATE-----/gi, "")
		.replace(/-----ENDCERTIFICATE-----/gi, "");
	if (!raw) return "";
	const lines = raw.match(/.{1,64}/g) ?? [];
	return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

/** IdP issuer must match <Issuer> in the SAML response exactly (samlify uses !==). */
function normalizeIdpIssuer(issuer: string): string {
	return issuer.trim().replace(/\/+$/, "");
}

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	user: {
		additionalFields: {
			samlGroups: {
				type: "string",
				required: false,
				defaultValue: "[]",
				input: false,
			},
		},
	},
	plugins: [
		sso({
			provisionUser: async ({ user, userInfo }) => {
				const claimKey = process.env.SAML_GROUPS_CLAIM_KEY || "groups";
				const raw =
					userInfo?.attributes?.[claimKey] ??
					(userInfo as Record<string, unknown>)?.[claimKey];

				let groups: string[] = [];
				if (Array.isArray(raw)) {
					groups = raw.map(String);
				} else if (typeof raw === "string") {
					try {
						const parsed = JSON.parse(raw);
						groups = Array.isArray(parsed) ? parsed.map(String) : [raw];
					} catch {
						groups = raw
							.split(",")
							.map((s) => s.trim())
							.filter(Boolean);
					}
				}

				await db.user.update({
					where: { id: user.id },
					data: { samlGroups: JSON.stringify(groups) },
				});
			},
			defaultSSO: process.env.SAML_IDP_ENTRY_POINT
				? [
						{
							providerId: "habidat",
							domain: process.env.SAML_DOMAIN || "localhost",
							samlConfig: {
								issuer: normalizeIdpIssuer(
									process.env.SAML_IDP_ENTITY_ID ||
										process.env.SAML_IDP_ISSUER ||
										process.env.SAML_IDP_ENTRY_POINT ||
										"",
								),
								entryPoint: process.env.SAML_IDP_ENTRY_POINT as string,
							cert: normalizeIdpCertForSaml(process.env.SAML_IDP_CERT || ""),
								callbackUrl: "/",
								spMetadata: {
									entityID:
										process.env.SAML_SP_ENTITY_ID ||
										`${process.env.BETTER_AUTH_URL}/api/auth/sso/saml2/sp/metadata`,
								},
								mapping: {
									id: process.env.SAML_MAPPING_ID || "nameID",
									email: process.env.SAML_MAPPING_EMAIL || "email",
									name: process.env.SAML_MAPPING_NAME || "displayName",
									extraFields: {
										[process.env.SAML_GROUPS_CLAIM_KEY || "groups"]:
											process.env.SAML_GROUPS_CLAIM_KEY || "groups",
									},
								},
							},
						},
					]
				: [],
		}),
	],
	trustedOrigins: process.env.BETTER_AUTH_URL
		? [process.env.BETTER_AUTH_URL]
		: [],
});

export async function getSession() {
	const h = await headers();
	return auth.api.getSession({ headers: h });
}

export async function getCurrentUser() {
	const session = await getSession();
	return session?.user ?? null;
}

export async function requireUser() {
	const user = await getCurrentUser();
	if (!user) {
		throw new Error("Authentication required");
	}
	return user;
}

export type Session = Awaited<ReturnType<typeof getSession>>;
export type AuthUser = NonNullable<Session>["user"];
