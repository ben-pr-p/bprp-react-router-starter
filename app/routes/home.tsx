import type { Route } from "./+types/home";
import { useQuery } from "@tanstack/react-query";
import { withPrefetch } from "@/lib/orpcCaller.server";
import { orpcFetchQuery } from "@/lib/orpcFetch";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader() {
  return await withPrefetch(async (queryClient, orpc) => {
    await queryClient.prefetchQuery(orpc.getNumCpus.queryOptions());
    // With this commented, there's an HTTP request
    // await queryClient.prefetchQuery(orpc.currentDate.queryOptions());
  });
}

export default function Home() {
  const { data, isLoading, error } = useQuery(
    orpcFetchQuery.getNumCpus.queryOptions()
  );

  const {
    data: date,
    isLoading: dateLoading,
    error: dateError,
  } = useQuery(orpcFetchQuery.currentDate.queryOptions());

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      CPU: {data}
      <br />
      Date: {date?.toISOString()}
    </div>
  );
}
