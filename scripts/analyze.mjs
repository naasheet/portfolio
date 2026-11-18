// Cross-platform `ANALYZE=true next build` (no cross-env; see CLAUDE.md §3).
// @next/bundle-analyzer only hooks into webpack, so this build uses --webpack.
import { spawn } from "node:child_process";

process.env.ANALYZE = "true";

const child = spawn("npx", ["next", "build", "--webpack"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 1));
