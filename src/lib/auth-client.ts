import { createAuthClient } from "better-auth/react";
import { ssoClient } from "@better-auth/sso/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
	plugins: [ssoClient(), inferAdditionalFields<typeof auth>()],
});

export const { useSession, signOut } = authClient;
