import { PrismaClient } from "@generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

function getConnectionString(): string {
	const url = process.env.DATABASE_URL;
	const hasParts =
		process.env.DATABASE_HOST &&
		process.env.DATABASE_USERNAME &&
		process.env.DATABASE_PASSWORD &&
		process.env.DATABASE_NAME;
	if (hasParts) {
		const host = process.env.DATABASE_HOST!;
		const port = process.env.DATABASE_PORT ?? "5432";
		const username = process.env.DATABASE_USERNAME!;
		const password = process.env.DATABASE_PASSWORD!;
		const name = process.env.DATABASE_NAME!;
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

function createPrisma() {
	const connectionString = getConnectionString();
	const adapter = new PrismaPg({ connectionString });
	return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
