import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: CI
    ? [
        {
          command: "npm start",
          cwd: "../server",
          url: "http://localhost:3000/api/v1/news",
          reuseExistingServer: false,
          timeout: 60_000,
        },
        {
          command: "npm run dev -- --port 5173",
          cwd: "../client",
          url: "http://localhost:5173",
          reuseExistingServer: false,
          timeout: 60_000,
        },
      ]
    : undefined,
});
