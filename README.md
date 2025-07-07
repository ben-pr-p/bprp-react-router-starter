# BPRP React Router Stack

This is a starter pack template designed for building robust, type-safe web applications using React Router v7, Tanstack Query, PostgreSQL, Kysely, and the use of pglite (Wasm-based PostgreSQL) for testing and development, among other technologies. 

It emphasizes a clean architecture, type-safety, and easy, isolated testing.

## Key Features & Benefits

*   **Full Type Safety**: End-to-end type safety from the database schema (Kysely + Kanel) through the API layer (ORPC) to your frontend components (TypeScript).
*   **Modern Frontend**: Built with React and the latest React Router v7 via Remix.run, leveraging features like route-based code splitting and optimized data loading.
*   **Efficient Data Management**: Utilizes React Query for powerful client-side caching, background updates, and seamless integration with server-side data fetching, including prefetching capabilities for optimal performance.
*   **React Query Hydration Baked In**: examples for how to use 
*   **Streamlined UI Development**: Integrates Tailwind CSS and shadcn/ui for building beautiful, accessible, and customizable user interfaces quickly.
*   **Isolated & Fast Testing**: Employs Vitest with PG Lite (PostgreSQL compiled to Wasm) to enable fast, isolated database tests for each test case without external dependencies.
*   **Developer Experience**: Optimized for Bun, providing fast installation, bundling, and execution. Includes tools like Graphile Migrate for database migrations and Kanel for database type generation.

## Technology Stack

*   **Framework**: Remix.run (React Router v7) with React
*   **Database**: PostgreSQL
*   **Query Builder**: Kysely (Type-safe SQL)
*   **Schema Codegen**: Kanel
*   **Migrations**: Graphile Migrate
*   **API**: ORPC (Type-safe RPC)
*   **Styling**: Tailwind CSS
*   **UI Components**: shadcn/ui
*   **Client Data Fetching**: React Query
*   **Testing**: Vitest with PG Lite (Wasm-based PostgreSQL)
*   **Runtime/Bundler**: Bun

## Getting Started

### Installation

To create a new project using this template, run:

```bash
bun create ben-pr-p/bprp-react-router-stack your-project-name
```

Replace `<template-source>` with the actual path or URL of this template repository (e.g., `github-username/repo-name`).

Then, navigate into your new project directory:

```bash
cd your-project-name
```

### Setup

Install dependencies:

```bash
bun install
```

Set up your environment variables by copying the example file:

```bash
cp .env.example .env
```

Update the `.env` file with your specific configurations (database connection, API keys, etc.).

### Database Setup

Run the initial database migrations:

```bash
bun migrate up
```

Generate database types:

```bash
bun codegen
```

### Development Server

Start the development server:

```bash
bun dev
```

Your application should now be running on `http://localhost:3000`.

## Development Workflow

*   **Adding Routes**: Create files in `app/routes/` and update `app/routes.ts`. Follow the structure outlined in the custom instructions.
*   **Database Migrations**: Add SQL changes to `app/database/migrations/current.sql`, then run `bun migrate up` and `bun codegen`.
*   **Data Fetching**: Define ORPC endpoints in `app/orpc/` and use them in your routes/components via loaders or React Query hooks (`useQuery`, `prefetchQuery`).
*   **Testing**: Write tests using the `orpcTest` helper for isolated database environments. Co-locate tests with the code they are testing.

Refer to the `.cursorrules` file or the detailed documentation comments within the codebase for more in-depth explanations of patterns and practices.


# TODO

- [ ] Make startWorker do literally nothing if started (not even return promise)
- [ ] Add Storybook
- [ ] 