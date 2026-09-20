import { prismaAdapter } from "@better-auth/prisma-adapter";
import { sso } from "@better-auth/sso";
import { betterAuth } from "better-auth";
import { headers } from "next/headers";
import { db } from "./db";
import { buildHabidatSamlConfig, HABIDAT_SSO_PROVIDER_ID } from "./saml-config";

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
			provisionUserOnEveryLogin: true,
			saml: {
				enableSingleLogout: true,
			},
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
							providerId: HABIDAT_SSO_PROVIDER_ID,
							domain: process.env.SAML_DOMAIN || "localhost",
							samlConfig: buildHabidatSamlConfig(),
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
