import { defineConfig } from 'vite';
import path from 'path';
import shopify from 'vite-plugin-shopify';
import cleanup from '@by-association-only/vite-plugin-shopify-clean';
import glob from 'fast-glob';

export default defineConfig({
  // base: '/assets/', // The base path of the build
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './'),
      '@': path.resolve(__dirname, 'frontend'),
    },
  },
  css: {

  },
  plugins: [
    cleanup(),
    shopify({
      themeRoot: './',                        // The root directory of the Shopify theme
      sourceCodeDir: 'frontend',              // The directory where the source code is located
      entrypointsDir: 'frontend/entrypoints', // The directory where the entrypoints are located
      snippetFile: 'entry.liquid',            // The file where the script tag is injected
      additionalEntrypoints: [
        ...glob.sync('frontend/styles/sections/**/*.scss'), // SCSS entrypoints
        ...glob.sync('frontend/scripts/sections/**/*.js')   // JavaScript entrypoints
      ],
    }),
  ],
  build: {
    outDir: 'assets', // Output directory for the build
    // MUST stay false: `assets/` holds hand-maintained files (_custom.css, custom.js,
    // the SVG icon set) alongside Vite output, and `true` empties the whole directory
    // before each build, deleting them. Stale Vite output is pruned by the cleanup() plugin.
    emptyOutDir: false,
    sourcemap: false, // Do not ship source maps to production (dead weight on the storefront)
    // rollupOptions: {
    //   input: {
    //     main:       path.resolve(__dirname, 'frontend/entrypoints/main.theme.js'),
    //     product:    path.resolve(__dirname, 'frontend/entrypoints/theme.product.js'),
    //   },
    //   output: {
    //     entryFileNames: '[name].[hash].min.js',
    //     chunkFileNames: '[name].[hash].min.js',
    //     assetFileNames: '[name].[hash].min[extname]',
    //   },
    // },
    // sourcemap: false, // Enable sourcemaps
  },
});
