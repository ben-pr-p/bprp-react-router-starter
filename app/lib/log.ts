import { PinoTransport } from "@loglayer/transport-pino";
import { LogLayer } from "loglayer";
import { pino } from "pino";

const log = new LogLayer({
  // Multiple loggers can also be used at the same time.
  transport: new PinoTransport({
    logger: pino({
      transport: {
        target: "pino-pretty",
        // options: {
        //   singleLine: true,
        // },
      },
    }),
  }),
  // Plugins can be created to modify log data before it's shipped to your logging library.
  plugins: [
    // redactionPlugin({
    //   paths: ["password"],
    //   censor: "[REDACTED]",
    // }),
  ],
});

export default log;
