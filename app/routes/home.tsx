import type { Route } from "./+types/home";
import { useQuery } from "@tanstack/react-query";
import { withPrefetch } from "@/lib/orpcCaller.server";
import { orpcFetchQuery } from "@/lib/orpcFetch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

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
    <div className="p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
      CPU: {data}
      <br />
      Date: {date?.toISOString()}
      <br />
      ShadCN button:
      <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Click me</Button>
    </div>
  );
}
