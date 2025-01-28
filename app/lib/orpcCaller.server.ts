import { createORPCReactQueryUtils } from "@orpc/react-query";
import { createRouterClient } from "@orpc/server";
import { router } from "@/orpc/router.server";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { getKysely } from "@/database/db.server";

export const orpcCaller = createRouterClient(router, {
  context: {
    db: await getKysely(),
  },
});
export const orpcCallerQuery = createORPCReactQueryUtils(orpcCaller);

type WithPrefetchFn<T> = (
  queryClient: QueryClient,
  orpc: typeof orpcCallerQuery
) => Promise<T>;

export async function withPrefetch<T>(fn: WithPrefetchFn<T>) {
  const queryClient = new QueryClient();
  const result = await fn(queryClient, orpcCallerQuery);
  const dehydratedState = dehydrate(queryClient);
  return { result, __dehydratedState: dehydratedState };
}
