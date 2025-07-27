// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  server: {
    host: true,
    // Needed for proper WebContainer support
    port: 5173,
    strictPort: true,
    // Ensure exact port is used
    hmr: {
      clientPort: 443
      // Fix HMR in WebContainer environment
    },
    cors: true
    // Enable CORS for development
  },
  base: process.env.NODE_ENV === "production" ? "https://bearsprediction.com/" : "/"
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IHRydWUsIC8vIE5lZWRlZCBmb3IgcHJvcGVyIFdlYkNvbnRhaW5lciBzdXBwb3J0XG4gICAgcG9ydDogNTE3MyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLCAvLyBFbnN1cmUgZXhhY3QgcG9ydCBpcyB1c2VkXG4gICAgaG1yOiB7XG4gICAgICBjbGllbnRQb3J0OiA0NDMgLy8gRml4IEhNUiBpbiBXZWJDb250YWluZXIgZW52aXJvbm1lbnRcbiAgICB9LFxuICAgIGNvcnM6IHRydWUsIC8vIEVuYWJsZSBDT1JTIGZvciBkZXZlbG9wbWVudFxuICB9LFxuICBiYXNlOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nIFxuICAgID8gJ2h0dHBzOi8vYmVhcnNwcmVkaWN0aW9uLmNvbS8nXG4gICAgOiAnLycsXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxFQUMxQjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUE7QUFBQSxJQUNaLEtBQUs7QUFBQSxNQUNILFlBQVk7QUFBQTtBQUFBLElBQ2Q7QUFBQSxJQUNBLE1BQU07QUFBQTtBQUFBLEVBQ1I7QUFBQSxFQUNBLE1BQU0sUUFBUSxJQUFJLGFBQWEsZUFDM0IsaUNBQ0E7QUFDTixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
