import { test as base } from "@playwright/test";
import { spawn, ChildProcess } from "child_process";
import getPort from "get-port";

export type SeedOptions = {
  seedScenario: string;
  timeout?: number;
  healthPath?: string;
};

type SeedFixture = {
  port: number;
  baseUrl: string;
  childProcess: ChildProcess;
};

type MyFixtures = {
  isolate: SeedFixture;
};

async function waitForServerReady(
  url: string,
  timeout: number = 30000,
  interval: number = 250
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.log(`Server ready at ${url}`);
        return;
      }

      console.log(
        `Server responded with status ${response.status}, retrying...`
      );
    } catch (error) {
      if (Date.now() - startTime + interval >= timeout) {
        throw new Error(
          `Server failed to become ready at ${url} within ${timeout}ms. ` +
            `Last error: ${
              error instanceof Error ? error.message : String(error)
            }`
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Server readiness timeout after ${timeout}ms`);
}

async function killServerGracefully(
  childProcess: ChildProcess,
  gracefulTimeout: number = 5000
): Promise<void> {
  if (childProcess.killed || childProcess.exitCode !== null) {
    return;
  }

  return new Promise((resolve) => {
    childProcess.kill("SIGTERM");

    const forceKillTimer = setTimeout(() => {
      if (!childProcess.killed) {
        console.warn("Server did not shut down gracefully, forcing kill");
        childProcess.kill("SIGKILL");
      }
    }, gracefulTimeout);

    childProcess.on("exit", () => {
      clearTimeout(forceKillTimer);
      console.log("Server shut down successfully");
      resolve();
    });
  });
}

export const test = base.extend<SeedOptions & MyFixtures>({
  seedScenario: ["default", { option: true }],
  timeout: [30000, { option: true }],
  healthPath: ["/", { option: true }],

  isolate: async ({ seedScenario, timeout, healthPath, page }, use) => {
    let serverProcess: ChildProcess | undefined;
    let port: number;

    try {
      // Find available port
      port = await getPort();
      console.log(
        `Starting server on port ${port} with scenario: ${seedScenario}`
      );

      // Set up environment and spawn server
      const env = {
        ...process.env,
        SEEDS_SCENARIO: seedScenario,
        NODE_ENV: "test",
      };

      serverProcess = spawn(
        "bun",
        ["run", "react-router", "dev", "--port", port.toString()],
        {
          env,
          cwd: process.cwd(),
          stdio: ["pipe", "pipe", "pipe"],
          detached: false,
        }
      );

      // Error handling
      serverProcess.on("error", (err) => {
        console.error(`Server process error: ${err.message}`);
      });

      // Log server output for debugging
      serverProcess.stdout?.on("data", (data) => {
        if (process.env.DEBUG_SERVER) {
          console.log(`[SERVER] ${data.toString().trim()}`);
        }
      });

      serverProcess.stderr?.on("data", (data) => {
        console.error(`[SERVER ERROR] ${data.toString().trim()}`);
      });

      // Wait for server to be ready
      const baseUrl = `http://localhost:${port}`;
      await waitForServerReady(baseUrl + healthPath!, timeout!);

      // Navigate page to server URL
      await page.goto(baseUrl);

      const seedFixture: SeedFixture = {
        port,
        baseUrl,
        childProcess: serverProcess,
      };

      await use(seedFixture);
    } finally {
      // Kill server after tests complete
      if (serverProcess) {
        await killServerGracefully(serverProcess);
      }
    }
  },
});

export { expect } from "@playwright/test";
