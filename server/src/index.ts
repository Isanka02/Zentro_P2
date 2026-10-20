import dotenv from "dotenv";
import { validateEnvironment } from "./config/validateEnv";

dotenv.config();

const startServer = async () => {
  validateEnvironment();

  const [{ default: app }, { connectDB }, { seedAdmin }, { default: mongoose }] = await Promise.all([
    import("./app"),
    import("./config/db"),
    import("./utils/seedAdmin"),
    import("mongoose"),
  ]);

  await connectDB();
  await seedAdmin();

  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  let shutdownStarted = false;
  const shutdown = (signal: string) => {
    if (shutdownStarted) return;
    shutdownStarted = true;
    console.log(`${signal} received; closing server`);
    server.close((serverError) => {
      void (async () => {
        let exitCode = serverError ? 1 : 0;
        try {
          await mongoose.disconnect();
        } catch {
          exitCode = 1;
          console.error("MongoDB disconnect failed during shutdown");
        }
        if (serverError) {
          console.error("HTTP server failed to close cleanly");
        }
        process.exit(exitCode);
      })();
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error: unknown) => {
  console.error("Server startup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
