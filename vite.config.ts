import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "./", // 设置项目根目录
  build: {
    outDir: "dist", // 打包目录
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"), // 别名映射
    },
  },
});