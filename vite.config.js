import { resolve } from "path";
import { defineConfig } from "vite";
import { promises as fs } from "fs";
import path from "path";

// Custom plugin to copy the .d.ts file after the build
function copyDtsFile() {
    return {
        name: "copy-dts-file", // a name for the plugin
        // This hook runs after Vite has written the bundle to disk
        async closeBundle() {
            const sourceFile = resolve(__dirname, "src/cubomx.d.ts");
            const destFile = resolve(__dirname, "dist/cubomx.d.ts");

            try {
                // Ensure the destination directory exists
                await fs.mkdir(path.dirname(destFile), { recursive: true });
                // Copy the file
                await fs.copyFile(sourceFile, destFile);
                console.log("\n✓ cubomx.d.ts copied to dist/");
            } catch (e) {
                console.error(`\n✗ Failed to copy cubomx.d.ts: ${e}`);
            }
        },
    };
}

export default defineConfig({
    plugins: [
        copyDtsFile(), // Add our custom plugin
    ],
    build: {
        // Generate optimized build for a library
        lib: {
            // The entry point of the library
            entry: resolve(__dirname, "src/CuboMX.js"),
            // The global variable name when used in a UMD build
            name: "CuboMX",
            // The file names for the generated bundles
            fileName: "cubomx",
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
    test: {
        // Set up the test environment
        environment: "jsdom",
        // You can add other test configurations here in the future
    },
});
