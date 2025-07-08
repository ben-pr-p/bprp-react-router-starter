import { test, expect } from "./fixtures/isolate-fixture";

test.use({
  // seedScenario: "default",
});

test("homepage loads with basic seed scenario", async ({ page, isolate }) => {
  console.log(`Testing against server at ${isolate.baseUrl}`);

  // Basic smoke test - check that the page loads
  await expect(page).toHaveTitle(/New React Router/i);

  // Check for basic page structure
  const mainContent = page.locator("main, [role='main'], body");
  await expect(mainContent).toBeVisible();
});
