import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests (6.2+): pure logic only, in Node. The @/ alias matches tsconfig.json.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
