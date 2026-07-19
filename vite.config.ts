import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1);

export default defineConfig({
  base: process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : "/",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3001,
  },
  preview: {
    host: "0.0.0.0",
    port: 3001,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/echarts")) return "charts";
          if (
            id.includes("node_modules/antd") ||
            id.includes("node_modules/@ant-design/icons")
          ) {
            return "antd";
          }
        },
      },
    },
  },
});
