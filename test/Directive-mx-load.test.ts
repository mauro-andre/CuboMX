import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/cubomx";

// Mock fetch globally
global.fetch = vi.fn();

describe("Directive mx-load", () => {
    const originalTitle = document.title;

    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
        vi.clearAllMocks();
        // Reset history
        window.history.replaceState(null, "", "/");
        // Reset title
        document.title = originalTitle;
    });

    it("should fetch content and swap into body on load", async () => {
        const mockHtml = `
            <html>
                <body>
                    <div id="content">Loaded Content</div>
                </body>
            </html>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            url: "/page.html",
            redirected: false,
            text: () => Promise.resolve(mockHtml),
        });

        document.body.innerHTML = `
            <div id="app">Original</div>
            <div mx-load="/page.html"></div>
        `;

        CuboMX.start();

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(global.fetch).toHaveBeenCalledWith(
            "/page.html",
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );

        expect(document.body.innerHTML).toContain("Loaded Content");
        expect(document.querySelector("#app")).toBeNull();
    });

    it("should swap content into custom target", async () => {
        const mockHtml = `
            <body>
                <div>New Main Content</div>
            </body>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        document.body.innerHTML = `
            <div id="main">Original Content</div>
            <div mx-load="/page.html" mx-target="#main:innerHTML"></div>
        `;

        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 10));

        const main = document.querySelector("#main")!;
        expect(main.innerHTML).toContain("New Main Content");
        expect(main.innerHTML).not.toContain("Original Content");
    });

    it("should select specific content from response with mx-select", async () => {
        const mockHtml = `
            <html>
                <body>
                    <div id="header">Header</div>
                    <div id="article">Article Content</div>
                    <div id="footer">Footer</div>
                </body>
            </html>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        document.body.innerHTML = `
            <div id="target">Original</div>
            <div mx-load="/page.html" mx-target="#target:innerHTML" mx-select="#article"></div>
        `;

        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 10));

        const target = document.querySelector("#target")!;
        expect(target.innerHTML).toContain("Article Content");
        expect(target.innerHTML).not.toContain("Header");
        expect(target.innerHTML).not.toContain("Footer");
    });

    // it("should update document title with mx-title", async () => {
    //     (global.fetch as any).mockResolvedValueOnce({
    //         ok: true,
    //         text: () => Promise.resolve("<body>Content</body>"),
    //     });

    //     document.body.innerHTML = `
    //         <div mx-load="/page.html" mx-title="Loaded Page Title"></div>
    //     `;

    //     CuboMX.start();

    //     await new Promise((resolve) => setTimeout(resolve, 10));

    //     expect(document.title).toBe("Loaded Page Title");
    //     expect(document.title).not.toBe(originalTitle);
    // });

    // it("should push URL to history when loading", async () => {
    //     (global.fetch as any).mockResolvedValueOnce({
    //         ok: true,
    //         text: () => Promise.resolve("<body>Content</body>"),
    //     });

    //     document.body.innerHTML = `
    //         <div mx-load="/loaded-page.html"></div>
    //     `;

    //     CuboMX.start();

    //     await new Promise((resolve) => setTimeout(resolve, 10));

    //     expect(window.location.pathname).toBe("/loaded-page.html");
    // });

    it("should show error when mx-load attribute is empty", () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        document.body.innerHTML = `
            <div mx-load=""></div>
        `;

        CuboMX.start();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                "mx-load directive failed: URL is required in mx-load attribute"
            )
        );

        consoleErrorSpy.mockRestore();
    });

    it("should handle fetch errors gracefully", async () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        (global.fetch as any).mockRejectedValueOnce(
            new Error("Network error")
        );

        document.body.innerHTML = `
            <div id="target">Original</div>
            <div mx-load="/error.html" mx-target="#target:innerHTML"></div>
        `;

        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Failed to fetch content for /error.html"),
            expect.any(Error)
        );

        // Content should remain unchanged
        const target = document.querySelector("#target")!;
        expect(target.textContent).toBe("Original");

        consoleErrorSpy.mockRestore();
    });

    it("should work with outerHTML swap mode", async () => {
        const mockHtml = `
            <body>
                <div id="target" class="new">Replaced</div>
            </body>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        document.body.innerHTML = `
            <div id="container">
                <div id="target" class="old">Original</div>
            </div>
            <div mx-load="/page.html" mx-target="#target:outerHTML"></div>
        `;

        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 10));

        const target = document.querySelector("#target")!;
        expect(target.className).toBe("new");
        expect(target.textContent).toBe("Replaced");
    });

    it("should work with beforebegin swap mode", async () => {
        const mockHtml = `
            <body>
                <div class="before">Before Content</div>
            </body>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        document.body.innerHTML = `
            <div id="container">
                <div id="target">Target</div>
            </div>
            <div mx-load="/page.html" mx-target="#target:beforebegin"></div>
        `;

        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 10));

        const container = document.querySelector("#container")!;
        expect(container.innerHTML).toContain("Before Content");
        expect(container.innerHTML).toContain("Target");
        expect(
            container.querySelector(".before")!.nextElementSibling?.id
        ).toBe("target");
    });

    it("should work with afterend swap mode", async () => {
        const mockHtml = `
            <body>
                <div class="after">After Content</div>
            </body>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        document.body.innerHTML = `
            <div id="container">
                <div id="target">Target</div>
            </div>
            <div mx-load="/page.html" mx-target="#target:afterend"></div>
        `;

        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 10));

        const container = document.querySelector("#container")!;
        expect(container.innerHTML).toContain("After Content");
        expect(container.innerHTML).toContain("Target");
        expect(
            container.querySelector("#target")!.nextElementSibling?.className
        ).toBe("after");
    });

    it("should work with multiple mx-load elements on same page", async () => {
        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve("<body>Content 1</body>"),
            })
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve("<body>Content 2</body>"),
            });

        document.body.innerHTML = `
            <div id="target1">Target 1</div>
            <div id="target2">Target 2</div>
            <div mx-load="/page1.html" mx-target="#target1:innerHTML"></div>
            <div mx-load="/page2.html" mx-target="#target2:innerHTML"></div>
        `;

        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(document.querySelector("#target1")!.innerHTML).toContain(
            "Content 1"
        );
        expect(document.querySelector("#target2")!.innerHTML).toContain(
            "Content 2"
        );
    });

    // it("should combine mx-title with custom target", async () => {
    //     (global.fetch as any).mockResolvedValueOnce({
    //         ok: true,
    //         text: () => Promise.resolve("<body>New Content</body>"),
    //     });

    //     document.body.innerHTML = `
    //         <div id="main">Original</div>
    //         <div mx-load="/page.html" mx-target="#main:innerHTML" mx-title="Custom Title"></div>
    //     `;

    //     CuboMX.start();

    //     await new Promise((resolve) => setTimeout(resolve, 10));

    //     expect(document.querySelector("#main")!.innerHTML).toContain(
    //         "New Content"
    //     );
    //     expect(document.title).toBe("Custom Title");
    // });

    it("should work when dynamically added to DOM", async () => {
        document.body.innerHTML = `
            <div id="container"></div>
        `;

        CuboMX.start();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve("<body>Dynamic Content</body>"),
        });

        // Dynamically add mx-load element
        const container = document.querySelector("#container")!;
        container.innerHTML = `
            <div id="target">Original</div>
            <div mx-load="/page.html" mx-target="#target:innerHTML"></div>
        `;

        // Wait for MutationObserver to process
        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(document.querySelector("#target")!.innerHTML).toContain(
            "Dynamic Content"
        );
    });

    it("should handle empty response gracefully", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(""),
        });

        document.body.innerHTML = `
            <div id="target">Original</div>
            <div mx-load="/empty.html" mx-target="#target:innerHTML"></div>
        `;

        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Should clear the target
        const target = document.querySelector("#target")!;
        expect(target.innerHTML.trim()).toBe("");
    });

    it("should work with select innerHTML mode", async () => {
        const mockHtml = `
            <html>
                <body>
                    <div id="content">
                        <p>Paragraph 1</p>
                        <p>Paragraph 2</p>
                    </div>
                </body>
            </html>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        document.body.innerHTML = `
            <div id="target">Original</div>
            <div mx-load="/page.html" mx-target="#target:innerHTML" mx-select="#content:innerHTML"></div>
        `;

        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 10));

        const target = document.querySelector("#target")!;
        expect(target.innerHTML).toContain("Paragraph 1");
        expect(target.innerHTML).toContain("Paragraph 2");
        expect(target.querySelector("#content")).toBeNull(); // Should not include the wrapper
    });

    it("should preserve reactive bindings after swap", async () => {
        const mockHtml = `
            <body>
                <div mx-data="counter">
                    <p :text="count">0</p>
                    <button @click="increment()">Increment</button>
                </div>
            </body>
        `;

        const counter = {
            count: 0,
            increment() {
                this.count += 1;
            },
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        document.body.innerHTML = `
            <div id="target">
                <div mx-data="counter">
                    <p :text="count">0</p>
                    <button @click="increment()">+</button>
                </div>
            </div>
            <div mx-load="/page.html" mx-target="#target:innerHTML"></div>
        `;

        CuboMX.component("counter", counter);
        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 20));

        const button = document.querySelector("button")!;
        const p = document.querySelector("p")!;

        expect(p.textContent).toBe("0");

        button.click();

        expect(p.textContent).toBe("1");
    });

    it("should load content immediately on page load", async () => {
        const mockHtml = `<body><div id="loaded">Loaded on init</div></body>`;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        document.body.innerHTML = `
            <div id="placeholder">Loading...</div>
            <div mx-load="/initial-content.html" mx-target="#placeholder:outerHTML"></div>
        `;

        CuboMX.start();

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(document.querySelector("#loaded")).not.toBeNull();
        expect(document.querySelector("#loaded")!.textContent).toBe(
            "Loaded on init"
        );
        expect(document.querySelector("#placeholder")).toBeNull();
    });
});
