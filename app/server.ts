import { createHonoServer } from "react-router-hono-server/bun";
import { startWorker } from "./tasks/worker";

export default await createHonoServer({
  async beforeAll() {
    // Just make sure the worker is started
    await startWorker();
  },
});
