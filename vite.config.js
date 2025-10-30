import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
            rollupTypes: true,
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "src/cubomx.ts"),
            name: "CuboMX",
            fileName: "cubomx",
        },
        rollupOptions: {
            external: [],
            output: {
                globals: {},
            },
        },
    },
    test: {
        environment: "jsdom",
    },
});
