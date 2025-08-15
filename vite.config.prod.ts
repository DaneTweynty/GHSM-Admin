import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./components', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./hooks', import.meta.url)),
      '@services': fileURLToPath(new URL('./services', import.meta.url)),
      '@utils': fileURLToPath(new URL('./utils', import.meta.url)),
      '@pages': fileURLToPath(new URL('./pages', import.meta.url)),
      '@context': fileURLToPath(new URL('./context', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Supabase and data fetching
          'data-vendor': [
            '@supabase/supabase-js',
            '@tanstack/react-query',
            '@tanstack/react-query-devtools'
          ],
          
          // UI library
          'ui-vendor': [
            '@headlessui/react',
            '@heroicons/react',
            'framer-motion'
          ],
          
          // Date and utility libraries
          'utils-vendor': [
            'date-fns',
            'clsx',
            'react-hot-toast'
          ],
          
          // Chart and visualization
          'chart-vendor': [
            'recharts',
            'd3-scale',
            'd3-array'
          ],
          
          // Calendar and scheduling
          'calendar-vendor': [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/interaction'
          ],
          
          // PDF and export utilities
          'export-vendor': [
            'jspdf',
            'html2canvas'
          ]
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop() 
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
          
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|ttf|eot)$/.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
    // Increase chunk size warning limit for better performance
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      '@headlessui/react',
      '@heroicons/react/24/outline',
      'date-fns',
      'clsx'
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  
  // Preview configuration for testing production build
  preview: {
    port: 4173,
    host: true,
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    postcss: './postcss.config.cjs',
  },
  
  // Environment variable configuration
  envPrefix: 'VITE_',
  
  // PWA and caching configuration
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
});
