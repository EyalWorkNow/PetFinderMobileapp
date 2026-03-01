import { PostgresRepository } from "../src/db/postgres-repository";
import { appConfig } from "../src/config";
import { Pool } from "pg";

async function run() {
    console.log("Connecting to DB:", appConfig.DATABASE_URL);
    const pool = new Pool({ connectionString: appConfig.DATABASE_URL });
    const repo = new PostgresRepository(pool);

    try {
        const res = await pool.query("SELECT id, user_id FROM posts WHERE status = 'ACTIVE' LIMIT 1");
        if (res.rowCount === 0) {
            console.log("No active posts found.");
            process.exit(0);
        }

        const post = res.rows[0];
        console.log("Found post:", post);

        console.log("Attempting to resolve post...");
        const result = await repo.resolvePost(post.id, post.user_id);
        console.log("Resolve result:", result);
    } catch (e) {
        console.error("Caught error:", e);
    } finally {
        await pool.end();
    }
}

run();
