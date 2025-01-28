import { getNumCpus } from "@/lib/numCpus.server";
import {
  os,
  ORPCError,
  type InferRouterInputs,
  type InferRouterOutputs,
} from "@orpc/server";
import { oz } from "@orpc/zod";
import { z } from "zod";
import { getKysely } from "@/database/db.server";

type MyDB = Awaited<ReturnType<typeof getKysely>>;

type ORPCContext = {
  db: MyDB;
};

// DB is inserted in request handler or test driver
const base = os.context<ORPCContext>();

export const router = base.router({
  getNumCpus: base.handler(async ({ input, context }) => {
    return getNumCpus();
  }),
  currentDate: base.handler(async ({ input, context }) => {
    return new Date();
  }),
  listWidgets: base.handler(async ({ input, context }) => {
    return await context.db.selectFrom("widget").selectAll().execute();
  }),
});

export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
