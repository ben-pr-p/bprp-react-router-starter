import { getPool } from "@/database/pg.server";
import { sendEmail } from "@/emails/send";
import type { AddJobFn } from "graphile-saga";
import { type Runner, type TaskList, run } from "graphile-worker";
// worker.ts
import { createTask, createTaskList } from "graphile-worker-zod";
import { z } from "zod";

const afterCreateWidget = createTask(
  z.object({
    widgetId: z.string(),
  }),
  async ({ widgetId }) => {
    await sendEmail(
      {
        to: "test@test.com",
        from: "test@test.com",
        replyTo: "test@test.com",
      },
      "Test",
      "sample-two",
      { widgetId }
    );
  }
);

const taskList = createTaskList()
  .addTask("after-create-widget", afterCreateWidget)
  .getTaskList();

let runner: Runner;
let runnerPromise: Promise<Runner>;

export const startWorker = async () => {
  const { pool } = await getPool();

  if (!runnerPromise) {
    runnerPromise = run({
      pgPool: pool,
      taskList: taskList as unknown as TaskList,
    });

    runner = await runnerPromise;
  }
};

export const addJob: AddJobFn<typeof taskList> = async (taskName, payload) => {
  if (!runner) {
    await startWorker();
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const unknownPayload = payload as unknown as any;

  return runner.addJob(taskName, unknownPayload);
};
