import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
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
