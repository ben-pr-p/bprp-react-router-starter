import { runTaskListOnce, TaskList } from "graphile-worker";
import { taskList } from "@/tasks/worker";
import { Pool, PoolClient } from "pg";

export const runTaskListOnceTestWithClient = async (client: PoolClient) => {
  await runTaskListOnce(
    {},
    taskList as unknown as TaskList,
    // @ts-expect-error - allowed to do any here - graphile-worker hasn't upgraded pg-pool types yet
    client
  );
};

export const runTaskListOnceTestWithPool = async (pool: Pool) => {
  const client = await pool.connect();
  await runTaskListOnce(
    {},
    taskList as unknown as TaskList,
    // @ts-expect-error - allowed to do any here - graphile-worker hasn't upgraded pg-pool types yet
    client
  );
  await client.release();
};
