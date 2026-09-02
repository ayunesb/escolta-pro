import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const dirname = path.dirname(fileURLToPath(import.meta.url));

  return {
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(dirname, 'index.html'),
          client: path.resolve(dirname, 'client.html'),
          guard: path.resolve(dirname, 'guard.html'),
          admin: path.resolve(dirname, 'admin.html'),
        }
      }
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(dirname, "./src"),
      },
    },
  };
});
