import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: '/albedo/', // absolut: /albedo (uden skråstreg) redirecter ikke, så relative stier knækker
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
