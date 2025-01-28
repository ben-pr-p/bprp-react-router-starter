import { describe, expect, it } from "vitest";
import { orpcTest } from "./orpc-test";

orpcTest("listWidgets", async ({ orpc }) => {
  await orpc.db.insertInto("widget").values({ name: "test" }).execute();
  const widgets = await orpc.caller.listWidgets();
  expect(widgets).toBeInstanceOf(Array);
  expect(widgets.length).toBe(1);
  expect(widgets[0].name).toBe("test");
});
