import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({

      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {

        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "robots.txt"],

      devOptions: { enabled: true, type: "module" },
      manifest: {
        name: "Mr Book Worm",
        short_name: "Book Worm",
        description: "Каталог книг с рейтингами и рецензиями читателей",
        theme_color: "#2f2a1f",
        background_color: "#fffdf7",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {

        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
