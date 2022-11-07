import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { resolve } from "path";

export default defineConfig(({ command }) => {
  const config = {
    plugins: [vue(), vueJsx()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };

  return command === "serve"
    ? {
        ...config,
        server: {
          host: "localhost",
          port: 3000,
          strictPort: true,
        },
      }
    : {
        ...config,
        build: {
          outDir: "dist",
          lib: {
            entry: resolve(__dirname, "./src/lib/index.ts"),
            name: "VueVnc",
            formats: ["es", "cjs"],
          },
          copyPublicDir: false,
          rollupOptions: {
            external: ["vue"],
          },
        },
      };
});
