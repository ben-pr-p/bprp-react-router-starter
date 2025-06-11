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

function getTaskList() {
  const taskList = createTaskList()
    .addTask("after-create-widget", afterCreateWidget)
    .getTaskList();
  return taskList;
}

type MyTaskList = ReturnType<typeof getTaskList>;

let runner: Runner;
let runnerPromise: Promise<Runner>;

export const startWorker = async () => {
  if (!runnerPromise) {
    const { pool } = await getPool();
    const taskList = getTaskList();
    runnerPromise = run({
      pgPool: pool,
      taskList: taskList as unknown as TaskList,
    });

    runner = await runnerPromise;
  }
};

export const addJob: AddJobFn<MyTaskList> = async (taskName, payload) => {
  if (!runner) {
    await startWorker();
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const unknownPayload = payload as unknown as any;

  return runner.addJob(taskName, unknownPayload);
};
