const HTTP_REDIRECT = "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect";
const NAMEID_UNSPECIFIED =
	"urn:oasis:names:tc:SAML:2.0:nameid-format:unspecified";

export const HABIDAT_SSO_PROVIDER_ID = "habidat";

/**
 * Normalize IdP cert to the same canonical form samlify uses when comparing
 * (raw base64), then back to PEM. Ensures ERROR_UNMATCH_CERTIFICATE_DECLARATION_IN_METADATA
 * doesn't happen due to .env formatting (spaces vs newlines, etc.).
 */
export function normalizeIdpCertForSaml(cert: string): string {
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
export function normalizeIdpIssuer(issuer: string): string {
	return issuer.trim().replace(/\/+$/, "");
}

export function getAuthBaseUrl(): string {
	return (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(
		/\/+$/,
		"",
	);
}

export function getIdpIssuer(): string {
	return normalizeIdpIssuer(
		process.env.SAML_IDP_ENTITY_ID ||
			process.env.SAML_IDP_ISSUER ||
			process.env.SAML_IDP_ENTRY_POINT ||
			"",
	);
}

/** habidat-auth IdP SLO. Defaults to {issuer}/sso/logout. */
export function getIdpSloUrl(): string | undefined {
	const explicit = process.env.SAML_IDP_SLO_URL?.trim();
	if (explicit) return explicit.replace(/\/+$/, "");
	const issuer = getIdpIssuer();
	if (!/^https?:\/\//i.test(issuer)) return undefined;
	return `${issuer}/sso/logout`;
}

export function getSpEntityId(): string {
	return (
		process.env.SAML_SP_ENTITY_ID ||
		`${getAuthBaseUrl()}/api/auth/sso/saml2/sp/metadata`
	);
}

export function getSpAcsUrl(): string {
	return `${getAuthBaseUrl()}/api/auth/sso/saml2/sp/acs/${HABIDAT_SSO_PROVIDER_ID}`;
}

export function getSpSloUrl(): string {
	return `${getAuthBaseUrl()}/api/auth/sso/saml2/sp/slo/${HABIDAT_SSO_PROVIDER_ID}`;
}

export function buildHabidatSamlConfig() {
	const spEntityId = getSpEntityId();
	const idpIssuer = getIdpIssuer();
	const cert = normalizeIdpCertForSaml(process.env.SAML_IDP_CERT || "");
	const sloUrl = getIdpSloUrl();

	return {
		// Better Auth 1.7: samlConfig.issuer is the SP entity ID, not the IdP.
		issuer: spEntityId,
		entryPoint: process.env.SAML_IDP_ENTRY_POINT as string,
		cert,
		callbackUrl: "/",
		identifierFormat: NAMEID_UNSPECIFIED,
		// habidat-auth / samlify signs the Response, not the Assertion element.
		wantAssertionsSigned: false,
		idpMetadata: {
			entityID: idpIssuer,
			...(sloUrl
				? {
						singleLogoutService: [{ Binding: HTTP_REDIRECT, Location: sloUrl }],
					}
				: {}),
		},
		spMetadata: { entityID: spEntityId },
		mapping: {
			email: process.env.SAML_MAPPING_EMAIL || "email",
			name: process.env.SAML_MAPPING_NAME || "displayName",
			extraFields: {
				[process.env.SAML_GROUPS_CLAIM_KEY || "groups"]:
					process.env.SAML_GROUPS_CLAIM_KEY || "groups",
			},
		},
	};
}
