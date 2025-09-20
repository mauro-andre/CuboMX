import { resolve, dirname, join } from "path";
import { defineConfig } from "vite";
import nunjucks from "nunjucks";
import fs from "fs-extra";
import { globSync } from "glob";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const pages = [
    {
        template: "pages/home.njk",
        path: "/",
        title: "Home",
    },
    {
        template: "pages/introduction.njk",
        path: "/docs",
        title: "Introduction",
        onSidebar: true,
        svgIcon: "svg/info-outline.svg",
    },
    {
        template: "pages/installation.njk",
        path: "/docs/installation",
        title: "Installation",
        onSidebar: true,
        svgIcon: "svg/server-square-outline.svg",
    },
    {
        template: "pages/components.njk",
        path: "/docs/components",
        title: "Components",
        onSidebar: true,
        svgIcon: "svg/widget-2-outline.svg",
    },
];

const cartApp = {
    total: 96,
    items: [
        {
            description: "A very cool gaming mouse",
            qty: 2,
            price: 19,
            total: 38,
            img: "/img/mouse.png"
        },
        {
            description: "A very wonderful gaming keyboard",
            qty: 2,
            price: 29,
            total: 58,
            img: "/img/keyboard.png"
        },
    ],
};

const nunjucksBuildConfig = {
    templatesDir: resolve(__dirname, "src"),
    outputDir: resolve(__dirname, "public"),
    entryPoints: pages,
};

const nunjucksPreRender = (config) => {
    const nunjucksEnv = nunjucks.configure(config.templatesDir, {
        noCache: true,
    });

    function renderAll() {
        console.log("[nunjucks] Pre-rendering templates...");
        try {
            fs.emptyDirSync(config.outputDir);
            for (const entry of config.entryPoints) {
                let output = entry.path.startsWith("/")
                    ? entry.path.slice(1)
                    : entry.path;
                output = join(output, "index.html");
                const outputPath = resolve(config.outputDir, output);
                const html = nunjucksEnv.render(entry.template, {
                    pages: pages,
                    title: entry.title,
                    cartApp: cartApp,
                });
                fs.ensureDirSync(dirname(outputPath));
                fs.writeFileSync(outputPath, html);
            }
            console.log("[nunjucks] Pre-rendering complete.");
        } catch (e) {
            console.error("[nunjucks] Error rendering templates:", e);
        }
    }

    return {
        name: "nunjucks-pre-renderer",
        buildStart() {
            // render inicial
            renderAll();

            // adiciona todos os .njk ao watcher do Rollup (importante pro --watch)
            const files = globSync(resolve(config.templatesDir, "**/*.njk"));
            for (const f of files) {
                try {
                    this.addWatchFile(f);
                } catch (err) {
                    // em alguns ambientes addWatchFile pode falhar; só loga
                    console.warn(
                        "[nunjucks] addWatchFile falhou para:",
                        f,
                        err
                    );
                }
            }
            console.log(`[nunjucks] watching ${files.length} template(s).`);
        },
        writeBundle() {
            // Copia a pasta de imagens APÓS o build
            const imageSrc = resolve(__dirname, "src/img");
            const imageDest = resolve(__dirname, "dist/img");
            try {
                fs.copySync(imageSrc, imageDest, { overwrite: true });
                console.log("[assets] Images copied to dist/img.");
            } catch (e) {
                console.error("[assets] Error copying images:", e);
            }
        },
    };
};

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
            input: globSync(
                resolve(nunjucksBuildConfig.outputDir, "**/*.html")
            ),
        },
    },
});
