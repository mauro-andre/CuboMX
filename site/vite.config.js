import { resolve, dirname } from "path";
import { defineConfig } from "vite";
import nunjucks from "nunjucks";
import fs from "fs-extra";
import { globSync } from "glob"; // <--- IMPORT ADDED
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// --- Custom Build Configuration ---
const nunjucksBuildConfig = {
    templatesDir: resolve(__dirname, "src"),
    outputDir: resolve(__dirname, "public"),
    entryPoints: [
        { template: "pages/index.njk", output: "index.html" },
        { template: "pages/docs/index.njk", output: "docs/index.html" },
        {
            template: "pages/docs/get-started/index.njk",
            output: "docs/get-started/index.html",
        },
    ],
};

// --- Custom Vite Plugin ---
const nunjucksPreRender = (config) => {
    const nunjucksEnv = nunjucks.configure(config.templatesDir);

    function renderAll() {
        console.log("Pre-rendering Nunjucks templates...");
        try {
            fs.emptyDirSync(config.outputDir);
            for (const entry of config.entryPoints) {
                const templatePath = resolve(
                    config.templatesDir,
                    entry.template
                );
                const outputPath = resolve(config.outputDir, entry.output);
                const html = nunjucksEnv.render(entry.template, {});
                fs.ensureDirSync(dirname(outputPath));
                fs.writeFileSync(outputPath, html);
            }
            console.log("...pre-rendering complete.");
        } catch (e) {
            console.error("Error rendering Nunjucks templates:", e);
        }
    }
    return {
        name: "nunjucks-pre-renderer",
        buildStart() {
            renderAll();
            // garante que o rollup veja os njk no modo build --watch
            const files = globSync(resolve(config.templatesDir, "**/*.njk"));
            for (const f of files) {
                this.addWatchFile(f);
            }
        },
        handleHotUpdate({ file, server }) {
            if (file.endsWith(".njk")) {
                console.log("Template change detected, re-rendering...");
                renderAll();
                if (server) {
                    server.ws.send({ type: "full-reload", path: "*" });
                }
            }
        },
    };
};

// --- Final Vite Config ---
export default defineConfig({
    root: nunjucksBuildConfig.outputDir,
    plugins: [nunjucksPreRender(nunjucksBuildConfig)],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    build: {
        outDir: resolve(__dirname, "dist"),
        emptyOutDir: true,
        watch: {
            include: "src/**",
        },
        rollupOptions: {
            // Use globSync to find all generated HTML files as input
            input: globSync(
                resolve(nunjucksBuildConfig.outputDir, "**/*.html")
            ),
        },
    },
});
