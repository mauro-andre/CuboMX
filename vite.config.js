import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Generate optimized build for a library
    lib: {
      // The entry point of the library
      entry: resolve(__dirname, 'src/CuboMX.js'),
      // The global variable name when used in a UMD build
      name: 'CuboMX',
      // The file names for the generated bundles
      fileName: 'cubomx',
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      // (e.g., if you were using React, you'd list 'react' here)
      external: [],
      output: {
        // Provide global variables for externalized dependencies in the UMD build
        globals: {},
      },
    },
  },
});
