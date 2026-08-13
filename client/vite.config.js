import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
