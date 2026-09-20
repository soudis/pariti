/**
 * Ensures the habidat SSO provider row exists so the SP metadata endpoint
 * can resolve ?providerId=habidat. Safe to call on every server startup.
 */

import { PrismaClient } from "@generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import {
	buildHabidatSamlConfig,
	getIdpIssuer,
	HABIDAT_SSO_PROVIDER_ID,
} from "./saml-config";

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
		const issuer = getIdpIssuer();
		const samlConfig = JSON.stringify(buildHabidatSamlConfig());

		await prisma.ssoProvider.upsert({
			where: { id: HABIDAT_SSO_PROVIDER_ID },
			create: {
				id: HABIDAT_SSO_PROVIDER_ID,
				providerId: HABIDAT_SSO_PROVIDER_ID,
				issuer,
				domain,
				samlConfig,
				oidcConfig: null,
				userId: null,
				organizationId: null,
			},
			update: {
				issuer,
				domain,
				samlConfig,
			},
		});
	} finally {
		await prisma.$disconnect();
	}
}
