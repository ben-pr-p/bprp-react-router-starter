import { getPool } from "@/database/pg.server";
import type { AddJobFn } from "graphile-saga";
import { type Runner, type TaskList, run } from "graphile-worker";
import { createTaskList } from "graphile-worker-zod";

function getTaskList() {
  const taskList = createTaskList()
    // .addTask(
    //   "task-one",
    //   taskOne
    // )
    .getTaskList();
  return taskList;
}

export const taskList = getTaskList();

type MyTaskList = ReturnType<typeof getTaskList>;

let runner: Runner;
let runnerPromise: Promise<Runner>;

const CRONTAB = `
  0 * * * * task-one
`;

export const startWorker = async () => {
  if (!runnerPromise) {
    runnerPromise = (async () => {
      const { pool } = await getPool();
      runner = await run({
        // @ts-expect-error - allowed to do any here - graphile-worker hasn't upgraded pg-pool types yet
        pgPool: pool,
        taskList: taskList as unknown as TaskList,
        crontab: CRONTAB,
      });

      return runner;
    })();

    return runnerPromise;
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
