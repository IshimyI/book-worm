import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // generateSW can't run custom code in the worker — switched to
      // injectManifest (own src/sw.js, precache manifest injected into it)
      // so the push/notificationclick handlers below have somewhere to live.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        // The vendor chunk alone is >2MB uncompressed; default is 2MB.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "robots.txt"],
      // The service worker (push/notificationclick handlers included) is
      // otherwise skipped entirely in `vite dev` — needed here since that's
      // the normal way this app gets run and tested locally.
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
        // Vendor code changes far less often than app code — splitting it
        // into its own chunk lets browsers cache it across deploys instead
        // of re-downloading React/Chakra/etc. on every release.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
