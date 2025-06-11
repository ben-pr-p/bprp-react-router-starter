import { createORPCReactQueryUtils } from "@orpc/react-query";
import { createRouterClient } from "@orpc/server";
import { router } from "@/orpc/router.server";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { getKysely } from "@/database/db.server";

export async function getORPCCaller() {
  const db = await getKysely();
  return createRouterClient(router, {
    context: {
      db,
    },
  });
}

export async function getORPCCallerQuery() {
  const orpcCaller = await getORPCCaller();
  return createORPCReactQueryUtils(orpcCaller);
}

type WithPrefetchFn<T> = (
  queryClient: QueryClient,
  orpc: Awaited<ReturnType<typeof getORPCCallerQuery>>
) => Promise<T>;

export async function withPrefetch<T>(fn: WithPrefetchFn<T>) {
  const queryClient = new QueryClient();
  const orpcCallerQuery = await getORPCCallerQuery();
  const result = await fn(queryClient, orpcCallerQuery);
  const dehydratedState = dehydrate(queryClient);
  return { result, __dehydratedState: dehydratedState };
}
