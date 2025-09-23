import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Do not import lovable-tagger at the top level

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const plugins = [react()];
  
  if (mode === 'development') {
    const { componentTagger } = await import('lovable-tagger');
    plugins.push(componentTagger() as any);
  }
  
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
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(dirname, "./src"),
      },
    },
  };
});
