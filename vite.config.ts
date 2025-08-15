import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
          host: 'localhost',
          port: 5173,
          strictPort: true,
          hmr: {
            host: 'localhost',
            port: 5173,
            protocol: 'ws'
          }
        },
        build: {
          rollupOptions: {
            onwarn(warning, warn) {
              // Suppress "use client" directive warnings from react-hot-toast
              if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && 
                  warning.message.includes('use client')) {
                return;
              }
              warn(warning);
            },
            output: {
              manualChunks: {
                // Vendor libraries
                vendor: ['react', 'react-dom'],
                // UI libraries
                ui: ['lucide-react', 'react-hot-toast'],
                // Chat components (largest components)
                chat: [
                  './components/ImprovedChat',
                  './hooks/useChat',
                  './services/chatService',
                  './utils/chatUtils'
                ],
                // Calendar and scheduling
                calendar: [
                  './components/WeekView',
                  './components/MonthView',
                  './components/DayView',
                  './components/AnnualView',
                  './services/scheduleService'
                ],
                // Student/Teacher management
                management: [
                  './components/StudentsList',
                  './components/TeachersList',
                  './components/BillingList',
                  './components/StudentDetailView',
                  './components/TeacherDetailView'
                ]
              }
            }
          },
          // Optimize chunk size
          chunkSizeWarningLimit: 500,
          // Enable source maps for debugging
          sourcemap: false,
          // Minimize output
          minify: 'terser',
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true
            }
          }
        },
        define: {
          'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
          'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, '.'),
          }
        }
    };
});
