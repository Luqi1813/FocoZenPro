import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
    plugins: [react()],
    define: {
        'process.env.NODE_ENV': JSON.stringify('production')
    },
    build: {
        outDir: 'dist/react',
        emptyOutDir: false,
        cssCodeSplit: false,
        rollupOptions: {
            input: path.resolve(__dirname, 'src/react/main.jsx'),
            output: {
                format: 'es',
                entryFileNames: 'react-app.js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    if ((assetInfo.name || '').endsWith('.css')) {
                        return 'react-app.css';
                    }

                    return 'assets/[name][extname]';
                }
            }
        }
    }
});
