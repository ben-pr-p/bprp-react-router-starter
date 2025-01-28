import { createORPCClient } from "@orpc/client";
import { createORPCReactQueryUtils } from "@orpc/react-query";
import { RPCLink } from "@orpc/client/fetch";
import type { router } from "@/orpc/router.server";

const rpcLink = new RPCLink({
  url: "http://localhost:5173/orpc",
  // fetch: optional override for the default fetch function
  // headers: provide additional headers
});

export const orpcFetch = createORPCClient<typeof router>(rpcLink);
export const orpcFetchQuery = createORPCReactQueryUtils(orpcFetch);
