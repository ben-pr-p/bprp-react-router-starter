import { getNumCpus } from "@/lib/numCpus.server";
import {
  os,
  ORPCError,
  type InferRouterInputs,
  type InferRouterOutputs,
} from "@orpc/server";
import { oz } from "@orpc/zod";
import { z } from "zod";

const pub = os.context();

export const router = pub.router({
  getNumCpus: os.handler(async ({ input, context }) => {
    return getNumCpus();
  }),
  currentDate: os.handler(async ({ input, context }) => {
    return new Date();
  }),
});

export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
