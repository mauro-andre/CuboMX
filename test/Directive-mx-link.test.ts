import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX, MxComponent } from "../src/cubomx";

// Mock fetch globally
global.fetch = vi.fn();

describe("Directive mx-link", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
        vi.clearAllMocks();
        // Reset history
        window.history.replaceState(null, "", "/");
    });

    it("should fetch content and swap into body when link is clicked", async () => {
        document.body.innerHTML = `
            <div id="app">
                <a href="/page.html" mx-link>Load Page</a>
            </div>
        `;

        const mockHtml = `
            <html>
                <body>
                    <div id="content">New Content</div>
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

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(global.fetch).toHaveBeenCalledWith(
            "/page.html",
            expect.objectContaining({
                method: "GET",
                credentials: "include",
            })
        );

        expect(document.body.innerHTML).toContain("New Content");
        expect(document.querySelector("#app")).toBeNull();
    });

    it("should prevent default link navigation", async () => {
        document.body.innerHTML = `
            <a href="/page.html" mx-link>Load Page</a>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve("<body>Content</body>"),
        });

        CuboMX.start();

        const link = document.querySelector("a")!;
        const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });

        link.dispatchEvent(clickEvent);

        expect(clickEvent.defaultPrevented).toBe(true);
    });

    it("should swap content into custom target", async () => {
        document.body.innerHTML = `
            <div id="main">Original Content</div>
            <a href="/page.html" mx-link mx-target="#main:innerHTML">Load</a>
        `;

        const mockHtml = `
            <body>
                <div>New Main Content</div>
            </body>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        const main = document.querySelector("#main")!;
        expect(main.innerHTML).toContain("New Main Content");
        expect(main.innerHTML).not.toContain("Original Content");
    });

    it("should select specific content from response with mx-select", async () => {
        document.body.innerHTML = `
            <div id="target">Original</div>
            <a href="/page.html" mx-link mx-target="#target:innerHTML" mx-select="#article">Load</a>
        `;

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

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        const target = document.querySelector("#target")!;
        expect(target.innerHTML).toContain("Article Content");
        expect(target.innerHTML).not.toContain("Header");
        expect(target.innerHTML).not.toContain("Footer");
    });

    it("should update document title with mx-title", async () => {
        document.body.innerHTML = `
            <a href="/page.html" mx-link mx-title="New Page Title">Load</a>
        `;

        const originalTitle = document.title;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve("<body>Content</body>"),
        });

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(document.title).toBe("New Page Title");
        expect(document.title).not.toBe(originalTitle);
    });

    it("should push URL to history when navigating", async () => {
        document.body.innerHTML = `
            <a href="/new-page.html" mx-link>Load</a>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve("<body>Content</body>"),
        });

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(window.location.pathname).toBe("/new-page.html");
    });

    it("should load HTML from component property when mx-link has value", async () => {
        document.body.innerHTML = `
            <div id="target">Original</div>
            <div mx-data="myComp">
                <a href="/page.html" mx-link="cachedContent" mx-target="#target:innerHTML">Load</a>
            </div>
        `;

        const myComp = {
            cachedContent: "<div>Cached HTML Content</div>",
        };

        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        const target = document.querySelector("#target")!;
        expect(target.innerHTML).toContain("Cached HTML Content");
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should load HTML from store using $ prefix", async () => {
        document.body.innerHTML = `
            <div id="target">Original</div>
            <div mx-data="myComp">
                <a href="/page.html" mx-link="$myStore.pageContent" mx-target="#target:innerHTML">Load</a>
            </div>
        `;

        const myStore = {
            pageContent: "<div>Store Content</div>",
        };

        const myComp = {};

        CuboMX.store("myStore", myStore);
        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        const target = document.querySelector("#target")!;
        expect(target.innerHTML).toContain("Store Content");
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should show error when href attribute is missing", () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        document.body.innerHTML = `
            <a mx-link>No Href</a>
        `;

        CuboMX.start();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("mx-link directive failed: It is necessary to have an href attribute")
        );

        consoleErrorSpy.mockRestore();
    });

    it("should show error when component is not found", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        document.body.innerHTML = `
            <div mx-data="myComp">
                <a href="/page.html" mx-link="$nonExistentStore.content">Load</a>
            </div>
        `;

        const myComp = {};

        CuboMX.component("myComp", myComp);
        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Component "nonExistentStore" not found')
        );

        consoleErrorSpy.mockRestore();
    });

    it("should show error when no mx-data component found in ancestors", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        document.body.innerHTML = `
            <a href="/page.html" mx-link="someProperty">Load</a>
        `;

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("No mx-data component found in element or ancestors")
        );

        consoleErrorSpy.mockRestore();
    });

    it("should handle fetch errors gracefully", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        document.body.innerHTML = `
            <div id="target">Original</div>
            <a href="/error.html" mx-link mx-target="#target:innerHTML">Load</a>
        `;

        (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

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
        document.body.innerHTML = `
            <div id="container">
                <div id="target" class="old">Original</div>
            </div>
            <a href="/page.html" mx-link mx-target="#target:outerHTML">Load</a>
        `;

        const mockHtml = `
            <body>
                <div id="target" class="new">Replaced</div>
            </body>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        const target = document.querySelector("#target")!;
        expect(target.className).toBe("new");
        expect(target.textContent).toBe("Replaced");
    });

    it("should work with beforebegin swap mode", async () => {
        document.body.innerHTML = `
            <div id="container">
                <div id="target">Target</div>
            </div>
            <a href="/page.html" mx-link mx-target="#target:beforebegin">Load</a>
        `;

        const mockHtml = `
            <body>
                <div class="before">Before Content</div>
            </body>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        const container = document.querySelector("#container")!;
        expect(container.innerHTML).toContain("Before Content");
        expect(container.innerHTML).toContain("Target");
        expect(container.querySelector(".before")!.nextElementSibling?.id).toBe("target");
    });

    it("should work with afterend swap mode", async () => {
        document.body.innerHTML = `
            <div id="container">
                <div id="target">Target</div>
            </div>
            <a href="/page.html" mx-link mx-target="#target:afterend">Load</a>
        `;

        const mockHtml = `
            <body>
                <div class="after">After Content</div>
            </body>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        });

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        const container = document.querySelector("#container")!;
        expect(container.innerHTML).toContain("After Content");
        expect(container.innerHTML).toContain("Target");
        expect(container.querySelector("#target")!.nextElementSibling?.className).toBe("after");
    });

    it("should work with multiple links on same page", async () => {
        document.body.innerHTML = `
            <div id="target1">Target 1</div>
            <div id="target2">Target 2</div>
            <a href="/page1.html" mx-link mx-target="#target1:innerHTML">Link 1</a>
            <a href="/page2.html" mx-link mx-target="#target2:innerHTML">Link 2</a>
        `;

        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve("<body>Content 1</body>"),
            })
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve("<body>Content 2</body>"),
            });

        CuboMX.start();

        const [link1, link2] = Array.from(document.querySelectorAll("a"));

        link1.click();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(document.querySelector("#target1")!.innerHTML).toContain("Content 1");
        expect(document.querySelector("#target2")!.textContent).toBe("Target 2");

        link2.click();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(document.querySelector("#target2")!.innerHTML).toContain("Content 2");
    });

    it("should work with MxComponent class", async () => {
        document.body.innerHTML = `
            <div id="target">Original</div>
            <div mx-data="pageLoader">
                <a href="/page.html" mx-link="cachedPage" mx-target="#target:innerHTML">Load</a>
            </div>
        `;

        class PageLoader extends MxComponent {
            cachedPage = "<div>Class Component Content</div>";
        }

        CuboMX.component("pageLoader", new PageLoader());
        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        const target = document.querySelector("#target")!;
        expect(target.innerHTML).toContain("Class Component Content");
    });

    it("should combine mx-title with custom target", async () => {
        document.body.innerHTML = `
            <div id="main">Original</div>
            <a href="/page.html" mx-link mx-target="#main:innerHTML" mx-title="Custom Title">Load</a>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve("<body>New Content</body>"),
        });

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(document.querySelector("#main")!.innerHTML).toContain("New Content");
        expect(document.title).toBe("Custom Title");
    });

    it("should work when dynamically added to DOM", async () => {
        document.body.innerHTML = `
            <div id="container"></div>
        `;

        CuboMX.start();

        // Dynamically add link
        const container = document.querySelector("#container")!;
        container.innerHTML = `
            <div id="target">Original</div>
            <a href="/page.html" mx-link mx-target="#target:innerHTML">Load</a>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve("<body>Dynamic Content</body>"),
        });

        // Wait for MutationObserver to process
        await new Promise((resolve) => setTimeout(resolve, 10));

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(document.querySelector("#target")!.innerHTML).toContain("Dynamic Content");
    });

    it("should handle empty response gracefully", async () => {
        document.body.innerHTML = `
            <div id="target">Original</div>
            <a href="/empty.html" mx-link mx-target="#target:innerHTML">Load</a>
        `;

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(""),
        });

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        // Should clear the target
        const target = document.querySelector("#target")!;
        expect(target.innerHTML.trim()).toBe("");
    });

    it("should work with select innerHTML mode", async () => {
        document.body.innerHTML = `
            <div id="target">Original</div>
            <a href="/page.html" mx-link mx-target="#target:innerHTML" mx-select="#content:innerHTML">Load</a>
        `;

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

        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        const target = document.querySelector("#target")!;
        expect(target.innerHTML).toContain("Paragraph 1");
        expect(target.innerHTML).toContain("Paragraph 2");
        expect(target.querySelector("#content")).toBeNull(); // Should not include the wrapper
    });

    it("should preserve reactive bindings after swap", async () => {
        document.body.innerHTML = `
            <div id="target">
                <div mx-data="counter">
                    <p :text="count">0</p>
                    <button @click="increment()">+</button>
                </div>
            </div>
            <a href="/page.html" mx-link mx-target="#target:innerHTML">Load</a>
        `;

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

        CuboMX.component("counter", counter);
        CuboMX.start();

        const link = document.querySelector("a")!;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 10));

        const button = document.querySelector("button")!;
        const p = document.querySelector("p")!;

        expect(p.textContent).toBe("0");

        button.click();

        expect(p.textContent).toBe("1");
    });
});
