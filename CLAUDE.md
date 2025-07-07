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

I use @ as the root indicator, so import from `@/components/ui/card` instead of `~/components/ui/card`.

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

### Important Database Schema Notes

- **Table References**: When using Kysely queries, do NOT include schema names (e.g., `my_schema.`)
- ✅ Correct: `.selectFrom("form_submission")`
- ❌ Incorrect: `.selectFrom("uaw.form_submission")`
- The database configuration automatically handles schema resolution
- Schema names are only needed in migration SQL files, not in TypeScript code

## Data Loading Patterns

**Important**: The `withPrefetch` function provides three parameters:
- `queryClient` - React Query client for prefetching
- `orpc` - Direct ORPC caller for server-side operations. Call procedures directly as a function
- `orpcQuery` - ORPC React Query utils for generating query options. Used for prefetching queries on the client.

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
   import { withPrefetch } from "@/lib/orpcCaller.server";
   export async function loader({ context }: Route.LoaderArgs) {
     return withPrefetch<{ someData: string }>(async (queryClient, orpc, orpcQuery) => {
       // This prefetches the query for client-side use
       await queryClient.prefetchQuery(
         orpcQuery.posts.getLatestPosts.queryOptions({
           input: {} // Pass any required input parameters here
         })
       );
       
       // Can return other data if desired
       return { someData: "example" };
     });
   }

   export default function PostsRoute({ loaderData }: Route.ComponentProps) {
     const { result: { someData } } = loaderData;
     
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

### Router Organization Pattern

When you need multiple routers, use this file structure:

1. **`base.server.ts`** - Shared ORPC context and base configuration
2. **Individual router files** (e.g., `formSubmissions.server.ts`, `formReviews.server.ts`)
3. **`router.server.ts`** - Main router that combines all sub-routers

Example structure:
```typescript
// app/orpc/base.server.ts
import { os } from "@orpc/server";
import { getKysely } from "@/database/db.server";

type MyDB = Awaited<ReturnType<typeof getKysely>>;
type ORPCContext = { db: MyDB; };

export const base = os.context<ORPCContext>();

// app/orpc/posts.server.ts
import { base } from "./base.server";

export const postsRouter = base.router({
  getData: base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      return await context.db
        .selectFrom("posts")
        .where("id", "=", input.id)
        .executeTakeFirst();
    }),
});

// app/orpc/router.server.ts
import { base } from "./base.server";
import { postsRouter } from "./posts.server";
import { usersRouter } from "./users.server";

export const router = base.router({
  posts: postsRouter,
  users: usersRouter,
});
```

This pattern:
- **Separates concerns** - each feature has its own router file
- **Shares context** - all routers use the same base configuration
- **Maintains type safety** - TypeScript infers the complete router structure
- **Enables scalability** - easy to add new feature routers
- **Promotes organization** - logical grouping of related endpoints

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

## Running Tests

### Unit Tests
Never run `bun test` - this incorrectly uses bun's test runner, which is not compatible with vitest.
Instead, run `bun run test` to use vitest.

### End-to-End (E2E) Tests with Playwright

For full browser testing with isolated database scenarios, use Playwright:

```bash
# Run all e2e tests
bun x playwright test

# Run specific test file
bun x playwright test basic.spec.ts

# Run with UI mode for debugging
bun x playwright test --ui
```

#### E2E Test Structure

E2E tests are located in `app/test/e2e/` and use a custom fixture that:
- Spawns an isolated server per test with dynamic port allocation
- Seeds the database with scenario-specific test data
- Provides proper cleanup after each test

#### Writing E2E Tests

Import the custom fixture and specify a seed scenario:

```typescript
// app/test/e2e/my-feature.spec.ts
import { test, expect } from "./fixtures/isolate-fixture";

// Configure the seed scenario for this test file
test.use({ 
  seedScenario: "my-test-scenario" 
});

test("feature works correctly", async ({ page, isolate }) => {
  // Server is already running with seeded data
  console.log(`Testing against ${isolate.baseUrl}`);
  
  // Test your feature
  await expect(page).toHaveTitle(/Update Your Information - UAW/i);
  
  // Access isolate.port, isolate.baseUrl, isolate.childProcess if needed
});
```

#### Available Seed Scenarios

Seed scenarios are defined in `app/database/seeds/` and provide different test data:

- **`basic-test-data`** - Minimal data for simple smoke tests
- **`user-registration-flow`** - Multiple form submissions representing user registration states  
- **`admin-test-data`** - Admin-focused data with various review states
- **`default`** - Full sample dataset (from `default.server.ts`)

#### Different Scenarios Per Test

```typescript
// Default scenario for the file
test.use({ seedScenario: "user-registration-flow" });

test("user flow test", async ({ page, isolate }) => {
  // Uses user-registration-flow data
});

// Different scenario for specific test group
test.describe("Admin tests", () => {
  test.use({ seedScenario: "admin-test-data" });
  
  test("admin can review submissions", async ({ page, isolate }) => {
    // Uses admin-test-data scenario
  });
});
```

#### Creating New Seed Scenarios

1. **Create the seed file** in `app/database/seeds/`:
   ```typescript
   // app/database/seeds/my-scenario.server.ts
   import type { SeedsFn } from "./types";
   
   export const myScenarioSeeds: SeedsFn = async (db) => {
     console.log("🌱 Running my scenario...");
     
     // Insert test data specific to your scenario
     await db.insertInto("form_submission")
       .values({ /* your test data */ })
       .execute();
   };
   ```

2. **Register the scenario** in `app/database/seeds/index.server.ts`:
   ```typescript
   import { myScenarioSeeds } from "./my-scenario.server";
   
   export const seeds: Seeds = {
     default: defaultSeeds,
     scenarios: {
       "my-scenario": {
         includeDefault: false, // Set to true to also run default seeds
         fn: myScenarioSeeds,
       },
       // ... other scenarios
     },
   };
   ```

3. **Use in tests**:
   ```typescript
   test.use({ seedScenario: "my-scenario" });
   ```

#### E2E Test Fixture Options

The `isolate` fixture accepts these options:

```typescript
test.use({
  seedScenario: "basic-test-data", // Required: which seed scenario to use
  timeout: 30000,                  // Optional: server startup timeout (default: 30s)
  healthPath: "/",                 // Optional: health check endpoint (default: "/")
});
```

#### Best Practices for E2E Tests

- **Use specific seed scenarios** - Don't rely on default data for focused tests
- **Test user journeys** - E2E tests should cover complete workflows
- **Keep scenarios isolated** - Each scenario should be independent and repeatable
- **Name scenarios descriptively** - Use names like "user-registration-flow" not "test1"
- **Clean test data** - Seed scenarios should create minimal, focused test data

## Async Task Queuing with Graphile Worker

This project uses Graphile Worker for reliable background job processing with type-safe task definitions.

### Task Definition Pattern

1. **Define tasks in separate files** for better organization:
   ```typescript
   // In app/tasks/myTask.ts
   import { createTask } from "graphile-worker-zod";
   import { z } from "zod";

   export const myTask = createTask(
     z.object({
       userId: z.string(),
       data: z.object({ /* your payload schema */ }),
     }),
     async ({ userId, data }) => {
       // Task implementation
       console.log(`Processing task for user ${userId}`);
     }
   );
   ```

2. **Import and add tasks to the task list** in `app/tasks/worker.ts`:
   ```typescript
   import { myTask } from "./myTask";
   import { anotherTask } from "./anotherTask";

   function getTaskList() {
     const taskList = createTaskList()
       .addTask("my-task-name", myTask)
       .addTask("another-task", anotherTask)
       .getTaskList();
     return taskList;
   }
   ```

3. **Export typed `addJob` function**:
   ```typescript
   type MyTaskList = ReturnType<typeof getTaskList>;

   export const addJob: AddJobFn<MyTaskList> = async (taskName, payload) => {
     if (!runner) {
       await startWorker();
     }
     const unknownPayload = payload as unknown as any;
     return runner.addJob(taskName, unknownPayload);
   };
   ```

### Queue Jobs from ORPC Endpoints

```typescript
// In your ORPC endpoint
import { addJob } from "@/tasks/worker";

export const createWidget = base
  .input(z.object({ name: z.string() }))
  .handler(async ({ input, context }) => {
    const widget = await context.db.insertInto("widget")
      .values({ name: input.name })
      .returning("id")
      .executeTakeFirst();

    // Queue background task with type safety
    await addJob("after-create-widget", {
      widgetId: widget.id,
    });

    return { id: widget.id };
  });
```

### Task Best Practices

- **Keep payloads small** - pass around an identifier and implement data fetching as needed inside of the task instead of fetching it at queue time.
- **Keep tasks small** - don't do too much in a task. If you need to do something complex, break it down into smaller tasks using `graphile-saga`.

### Email Integration Pattern

Tasks commonly send emails using the type-safe email system:

```typescript
const sendWelcomeEmail = createTask(
  z.object({
    userId: z.string(),
    email: z.string(),
  }),
  async ({ userId, email }) => {
    await sendEmail(
      {
        to: email,
        from: "noreply@app.com",
        replyTo: "support@app.com",
      },
      "Welcome!",
      "welcome-email", // Template name
      { userId } // Template props
    );
  }
);
```

### Worker Lifecycle

- Worker runs automatically when `RUN_WORKER=true` in environment
- Uses PostgreSQL connection pool from `getPool()`
- Jobs are persisted in database and survive application restarts
- Failed jobs are automatically retried with exponential backoff

### Key Dependencies

- `graphile-worker`: Core job queue functionality
- `graphile-worker-zod`: Type-safe task definitions with Zod schemas
- `graphile-saga`: Type definitions for AddJobFn
- Tasks run in isolated processes with full access to database and ORPC context

## Logging

This project uses a custom logging setup with LogLayer and Pino. 

### Import Statement
```typescript
import log from "@/lib/log";
```

### Usage
- **log.info()** only accepts strings, not objects
- Use template literals for dynamic content
- ✅ Correct: `log.info(\`Processing \${count} records\`)`
- ❌ Incorrect: `log.info({ count }, "Processing records")`

### Example
```typescript
log.info("Starting data sync");
log.info(\`Retrieved \${data.length} records from warehouse\`);
log.error(\`Sync failed: \${error}\`);
```

## Environment Variables and Configuration

**NEVER access `process.env` directly** - always use the centralized configuration system:

### ✅ Correct Pattern
```typescript
import { config } from "@/config";

// Use typed config values
const secret = config.CSRF_SECRET;
const dbUrl = config.DATABASE_URL;
```

### ❌ Incorrect Pattern  
```typescript
// DON'T DO THIS - bypasses type safety and validation
const secret = process.env.CSRF_SECRET || "default-value";
```

### Adding New Environment Variables
1. Add the variable to `app/config.ts` with proper type validation using `envalid`
2. Use appropriate validators: `str()`, `bool()`, `email()`, `num()`, etc.
3. Set appropriate defaults for development with `devDefault`
4. Import and use `config` object throughout the application

Example:
```typescript
// In app/config.ts
export const config = cleanEnv(process.env, {
  NEW_API_KEY: str({ devDefault: "dev-key" }),
  MAX_RETRIES: num({ default: 3 }),
  FEATURE_ENABLED: bool({ default: false }),
});

// In your code
import { config } from "@/config";
const apiKey = config.NEW_API_KEY; // Fully typed and validated
```

## URL State Management with nuqs

When managing component state that should be reflected in the URL (like active tabs, search filters, pagination), use `nuqs` instead of `useState`:

### ✅ Correct Pattern (with nuqs)
```typescript
import { useQueryState } from "nuqs";

function MyComponent() {
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "overview",
    shallow: false, // Use shallow: false for better UX with back/forward
  });

  const [searchTerm, setSearchTerm] = useQueryState("search", {
    defaultValue: "",
    shallow: false,
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {/* Tab content */}
    </Tabs>
  );
}
```

### ❌ Incorrect Pattern (with useState)
```typescript
import { useState } from "react";

function MyComponent() {
  // Don't use useState for URL-shareable state
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {/* Tab content */}
    </Tabs>
  );
}
```

### When to Use nuqs
- **Tab navigation** - Users should be able to share URLs with specific tabs active
- **Search/filter state** - Filters should persist on page refresh
- **Pagination** - Current page should be in URL
- **Form wizard steps** - Users can bookmark specific steps
- **Any state that enhances shareability**

## Best Practices

1. Always use TypeScript and maintain type safety
2. Put shared UI components in `app/components/`
3. Use ORPC for all data fetching operations
4. Keep routes simple, move logic to ORPC endpoints
5. Use React Query's built-in caching and invalidation
6. Write tests for critical data operations
7. Use string interpolation instead of concatenation
8. **Queue heavy operations as background tasks** - don't block user requests
9. **Use type-safe task definitions** with Zod schemas for all async jobs
10. **Co-locate email templates** with their task definitions for clarity
11. **Never access `process.env` directly** - always use the centralized `config` object
12. **Use nuqs for URL-shareable state** - prefer URL state over component state when possible

