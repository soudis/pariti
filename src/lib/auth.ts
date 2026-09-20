import { prismaAdapter } from "@better-auth/prisma-adapter";
import { sso } from "@better-auth/sso";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db } from "./db";
import { buildHabidatSamlConfig, HABIDAT_SSO_PROVIDER_ID } from "./saml-config";

function originOf(value: string | undefined): string | undefined {
	if (!value?.trim()) return undefined;
	try {
		return new URL(value).origin;
	} catch {
		return undefined;
	}
}

function trustedOrigins(): string[] {
	return [
		...new Set(
			[
				originOf(process.env.BETTER_AUTH_URL),
				originOf(process.env.SAML_IDP_ISSUER),
				originOf(process.env.SAML_IDP_ENTITY_ID),
				originOf(process.env.SAML_IDP_ENTRY_POINT),
			].filter((origin): origin is string => Boolean(origin)),
		),
	];
}

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: "postgresql",
		transaction: true,
	}),
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: [HABIDAT_SSO_PROVIDER_ID],
			requireLocalEmailVerified: false,
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => ({
					data: { ...user, emailVerified: true },
				}),
			},
		},
	},
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
			provisionUserOnEveryLogin: true,
			saml: {
				enableSingleLogout: true,
			},
			// SAML ignores account.trustedProviders (trustProviderByName: false).
			// Existing users with a different NameID/accountId otherwise get
			// account_not_linked and ACS redirects home, which restarts SSO.
			resolveUser: async (input, { database }) => {
				const email = input.providerUser.email?.toLowerCase();
				if (!email) return { action: "continue" as const };
				const existing = await database.findOne<{ id: string }>({
					model: "user",
					where: [{ field: "email", value: email }],
				});
				if (!existing?.id) return { action: "continue" as const };
				return {
					action: "link" as const,
					userId: existing.id,
					profile: "update" as const,
				};
			},
			provisionUser: async ({
				user,
				userInfo,
			}: {
				user: { id: string };
				userInfo: Record<string, unknown> & {
					attributes?: Record<string, unknown>;
				};
			}) => {
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
							providerId: HABIDAT_SSO_PROVIDER_ID,
							domain: process.env.SAML_DOMAIN || "localhost",
							samlConfig: buildHabidatSamlConfig(),
						},
					]
				: [],
		}),
		nextCookies(),
	],
	trustedOrigins: trustedOrigins(),
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
