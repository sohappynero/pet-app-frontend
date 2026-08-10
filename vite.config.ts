import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // 加载对应模式的环境变量(.env.production / .env.development)
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    // 构建时替换:把 import.meta.env.VITE_API_BASE_URL 替换成字面量
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: ["localhost", "127.0.0.1"],
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
        "/uploads": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
