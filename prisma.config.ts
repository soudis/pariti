import "dotenv/config";
import { defineConfig, env } from "prisma/config";

function buildUrlFromParts(): string {
	const host = env("DATABASE_HOST");
	const port = process.env.DATABASE_PORT ?? "5432";
	const username = env("DATABASE_USERNAME");
	const password = env("DATABASE_PASSWORD");
	const name = env("DATABASE_NAME");
	const schema = process.env.DATABASE_SCHEMA ?? "public";
	return `postgres://${username}:${encodeURIComponent(password)}@${host}:${port}/${name}?schema=${schema}`;
}

function getDatabaseUrl(): string {
	const hasParts =
		process.env.DATABASE_HOST &&
		process.env.DATABASE_USERNAME &&
		process.env.DATABASE_PASSWORD &&
		process.env.DATABASE_NAME;
	if (hasParts) return buildUrlFromParts();
	return env("DATABASE_URL");
}

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "tsx prisma/seed.ts",
	},
	datasource: {
		url: getDatabaseUrl(),
	},
});
