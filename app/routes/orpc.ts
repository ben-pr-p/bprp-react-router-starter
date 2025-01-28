import { RPCHandler } from "@orpc/server/fetch";
import { router } from "@/orpc/router.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getKysely } from "@/database/db.server";

const rpcHandler = new RPCHandler(router);

async function handleRequest(request: Request) {
  const { response } = await rpcHandler.handle(request, {
    prefix: "/orpc",
    context: {
      db: await getKysely(),
    },
  });
  return response;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return await handleRequest(request);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return await handleRequest(request);
};
