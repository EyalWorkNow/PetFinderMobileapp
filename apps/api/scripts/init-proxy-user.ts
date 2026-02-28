import { Pool } from "pg";
import { config as loadEnv } from "dotenv";

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
const PROXY_USER_ID = "a15be06a-e0d5-4280-bd13-b9f5363dc17f";
const PROXY_USER_EMAIL = "mail@mail.com";

async function run() {
    if (!DATABASE_URL) {
        console.error("DATABASE_URL is not set");
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log(`Syncing proxy user ${PROXY_USER_EMAIL} into public.users...`);
        await pool.query(
            "INSERT INTO users (id, email, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO NOTHING;",
            [PROXY_USER_ID, PROXY_USER_EMAIL]
        );
        console.log("✅ Proxy user synced successfully!");
    } catch (error) {
        console.error("❌ Failed to sync proxy user:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
