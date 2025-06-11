# Project Technologies and Patterns

## Basic Technologies

- **Framework**: Remix.run (React Router v7) with React - imports you may expect to come from '@remix-run/react|node' actually come from 'react-router'
- **Database**: PostgreSQL with Kysely for type-safe queries and Kanel for database schema codegen
- **API Layer**: ORPC (similar to tRPC) for type-safe server-client communication and server-side RPC calls
- **UI Components**: Tailwind CSS with shadcn/ui components
- **Data Fetching**: React Query for client-side data management
- **Testing**: Vitest with isolated wasm-backed databases per test

## UI Components

All shadcn/ui components can be available in `app/components/ui/`. Just run `bunx shadcn-ui@latest add <x>` to add a new component.

Do not directly add components to `app/components/ui`. That is only for components from shadcn/ui. Our components go elsewhere in the components directory.

## Adding a Route

1. Create a new file in `app/routes/` with the route name (e.g., `my-route.tsx`)
2. Add an entry to `app/routes.ts`
3. Structure your route with:
   ```typescript
   import type { Route } from "./+types/my-route"; // my-route is the name of the route file

   export async function loader({ params }: Route.LoaderArgs) {
     // Server-side data loading
     return {
       // Your data
     };
   }

   export default function MyRoute({ loaderData }: Route.ComponentProps) {
     // Your component
   }
   ```

## Database Migrations and Codegen

1. Add migrations in `app/database/migrations/current.sql`
2. Run codegen using `bun codegen`
3. Database types will be available in `app/database/types/`

## Data Loading Patterns

### When to use each approach:

1. **Loader Data (Server-Side)**
   - Use for static data that won't change during the lifetime of the page
   - Initial page load data that's critical for rendering

   Example:
   ```typescript
   // In app/orpc/user.server.ts
   export const userRouter = base.router({
     getUser: base
       .input(z.object({ userId: z.string() }))
       .handler(async ({ input, context }) => {
         return await context.db
           .selectFrom("users")
           .where("id", "=", input.userId)
           .executeTakeFirst();
       }),
   });

   // In your route file
   export async function loader({ params }: Route.LoaderArgs) {
     const user = await orpcCaller.user.getUser({ userId: params.userId });
     return { user };
   }

   export default function UserRoute({ loaderData }: Route.ComponentProps) {
     const { user } = loaderData;
     return <div>Hello {user.name}!</div>;
   }
   ```

2. **React Query with Prefetch**
   - Dynamic data needed on initial page load
   - Data that might change while the page is open
   - Use `prefetchQuery` in the loader for optimal loading
   - Data requirements that are most cleanly defined in nested components

   Example:
   ```typescript
   // In app/orpc/posts.server.ts
   export const postsRouter = base.router({
     getLatestPosts: base.handler(async ({ context }) => {
       return await context.db
         .selectFrom("posts")
         .orderBy("created_at", "desc")
         .limit(10)
         .execute();
     }),
   });

   // In your route file
   export async function loader() {
     return withPrefetch(async (queryClient, orpc) => {
       // This prefetches the query for client-side use
       await queryClient.prefetchQuery(orpc.posts.getLatestPosts.queryOptions());
			 // Can return other data if desired
     });
   }

   export default function PostsRoute() {
     // Data is already prefetched and available immediately
     const { data: posts } = useQuery(orpcFetchQuery.posts.getLatestPosts.queryOptions());

     return (
       <div>
         {posts.map(post => <PostCard key={post.id} post={post} />)}
       </div>
     );
   }
   ```

3. **Client-Side React Query**
   - Non-critical data that can load after initial render
   - User-triggered data fetches
   - Polling or real-time updates

   Example:
   ```typescript
   // In app/orpc/notifications.server.ts
   export const notificationsRouter = base.router({
     getNotifications: base.handler(async ({ context }) => {
       return await context.db
         .selectFrom("notifications")
         .where("read", "=", false)
         .execute();
     }),
   });

   // In your component
   function NotificationBell() {
		// Data is fetched when component is loaded
     const { data: notifications, isLoading, isError } = useQuery(orpcFetchQuery.notifications.getNotifications.queryOptions());

     return (
       <button>
         Notifications ({notifications?.length ?? 0})
       </button>
     );
   }
   ```

## ORPC Endpoints

- Place all data fetching logic in `app/orpc/` endpoints
- Benefits:
  - Type safety between client and server
  - Reusable across routes
  - Easy to test with isolated databases
  - Consistent error handling

Example:
```typescript
export const myRouter = base.router({
  getData: base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      return await context.db
        .selectFrom("my_table")
        .where("id", "=", input.id)
        .executeTakeFirst();
    }),
});
```

## Writing Tests with Database

1. Create test fixtures in the test fixtures directory
2. Use the `orpcTest` helper which provides an isolated test database and ORPC caller
3. Example test structure:
   ```typescript
   import { orpcTest } from "@/test/orpc-test";

   orpcTest("listWidgets", async ({ orpc }) => {
     // Setup test data directly using the database context
     await orpc.db.insertInto("widget")
       .values({ name: "test" })
       .execute();

     // Call your ORPC endpoint through the test caller
     const widgets = await orpc.caller.listWidgets();
     
     // Assert results
     expect(widgets).toBeInstanceOf(Array);
     expect(widgets.length).toBe(1);
     expect(widgets[0].name).toBe("test");
   });
   ```
4. Co-locate tests with the code they are testing

## Best Practices

1. Always use TypeScript and maintain type safety
2. Put shared UI components in `app/components/`
3. Use ORPC for all data fetching operations
4. Keep routes simple, move logic to ORPC endpoints
5. Use React Query's built-in caching and invalidation
6. Write tests for critical data operations
7. Use string interpolation instead of concatenation

