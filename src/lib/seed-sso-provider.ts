/**
 * Ensures the habidat SSO provider row exists so the SP metadata endpoint
 * can resolve ?providerId=habidat. Safe to call on every server startup.
 */

import { PrismaClient } from "@generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const PROVIDER_ID = "habidat";

function getConnectionString(): string {
	const url = process.env.DATABASE_URL;
	const host = process.env.DATABASE_HOST;
	const username = process.env.DATABASE_USERNAME;
	const password = process.env.DATABASE_PASSWORD;
	const name = process.env.DATABASE_NAME;
	const hasParts = host && username && password && name;
	if (hasParts) {
		const port = process.env.DATABASE_PORT ?? "5432";
		const schema = process.env.DATABASE_SCHEMA ?? "public";
		return `postgres://${username}:${encodeURIComponent(password)}@${host}:${port}/${name}?schema=${schema}`;
	}
	if (!url) {
		throw new Error(
			"DATABASE_URL is not set (or set DATABASE_HOST, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME)",
		);
	}
	return url;
}

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

function buildSamlConfig(): string {
	const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
	const spEntityId =
		process.env.SAML_SP_ENTITY_ID ||
		`${baseUrl}/api/auth/sso/saml2/sp/metadata`;
	const idpIssuer = normalizeIdpIssuer(
		process.env.SAML_IDP_ENTITY_ID ||
			process.env.SAML_IDP_ISSUER ||
			process.env.SAML_IDP_ENTRY_POINT ||
			"",
	);
	const cert = normalizeIdpCertForSaml(process.env.SAML_IDP_CERT || "");

	return JSON.stringify({
		issuer: idpIssuer,
		entryPoint: process.env.SAML_IDP_ENTRY_POINT as string,
		cert,
		callbackUrl: "/",
		spMetadata: { entityID: spEntityId },
		mapping: {
			id: process.env.SAML_MAPPING_ID || "nameID",
			email: process.env.SAML_MAPPING_EMAIL || "email",
			name: process.env.SAML_MAPPING_NAME || "username",
			extraFields: {
				[process.env.SAML_GROUPS_CLAIM_KEY || "groups"]:
					process.env.SAML_GROUPS_CLAIM_KEY || "groups",
			},
		},
	});
}

/**
 * Upserts the habidat SSO provider so SP metadata ?providerId=habidat works.
 * No-op if SAML_IDP_ENTRY_POINT is not set. Safe to call on every server startup.
 */
export async function ensureHabidatSsoProvider(): Promise<void> {
	if (!process.env.SAML_IDP_ENTRY_POINT) {
		return;
	}

	const connectionString = getConnectionString();
	const adapter = new PrismaPg({ connectionString });
	const prisma = new PrismaClient({ adapter });

	try {
		const domain = process.env.SAML_DOMAIN || "localhost";
		const issuer = normalizeIdpIssuer(
			process.env.SAML_IDP_ENTITY_ID ||
				process.env.SAML_IDP_ISSUER ||
				process.env.SAML_IDP_ENTRY_POINT ||
				"",
		);

		await prisma.ssoProvider.upsert({
			where: { id: PROVIDER_ID },
			create: {
				id: PROVIDER_ID,
				providerId: PROVIDER_ID,
				issuer,
				domain,
				samlConfig: buildSamlConfig(),
				oidcConfig: null,
				userId: null,
				organizationId: null,
			},
			update: {
				issuer,
				domain,
				samlConfig: buildSamlConfig(),
			},
		});
	} finally {
		await prisma.$disconnect();
	}
}
