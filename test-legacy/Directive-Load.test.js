import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Directive: mx-load", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should load and swap content into a target", async () => {
        const mockFetch = vi.fn().mockResolvedValue(
            new Response(
                '<html><body><div id="source">Final Content</div></body></html>',
                {
                    status: 200,
                    headers: { "Content-Type": "text/html" },
                }
            )
        );
        vi.stubGlobal("fetch", mockFetch);

        document.body.innerHTML = `
            <div id="container">Initial Content</div>
            <div mx-load="/content" mx-target="#container" mx-select="#source"></div>
        `;

        CuboMX.start();
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Assert that the swap happened correctly (outerHTML swap)
        const oldContainer = document.querySelector("#container");
        const newContent = document.querySelector("#source");

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(mockFetch).toHaveBeenCalledWith("/content", expect.any(Object));

        // The original container should be gone
        expect(oldContainer).toBeNull();
        // The new content should be in its place
        expect(newContent).not.toBeNull();
        expect(newContent.textContent).toBe("Final Content");
    });

    it("should auto-generate ID and self-replace if mx-target is omitted", async () => {
        const requestSpy = vi.spyOn(CuboMX, "request");
        document.body.innerHTML = `
            <div mx-load="/content">
                Skeleton...
            </div>
        `;

        CuboMX.start();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(requestSpy).toHaveBeenCalledOnce();
        const strategy = requestSpy.mock.calls[0][0].strategies[0];
        expect(strategy.select).toBe("this");
        expect(strategy.target).toMatch(/^#cubo-load-\d+:outerHTML$/);
    });

    it("should respect mx-select when provided", async () => {
        const requestSpy = vi.spyOn(CuboMX, "request");
        document.body.innerHTML = `
            <div id="container"></div>
            <div mx-load="/content" mx-target="#container" mx-select="#source"></div>
        `;

        CuboMX.start();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(requestSpy).toHaveBeenCalledOnce();
        expect(requestSpy).toHaveBeenCalledWith({
            url: "/content",
            strategies: [{ select: "#source", target: "#container" }],
        });
    });

    it("should compose with mx-swap-template to lazy-load content", async () => {
        // Mock the fetch call for the final content
        const mockFetch = vi.fn().mockResolvedValue(
            new Response('<div id="content">Real Content</div>', {
                status: 200,
                headers: { "Content-Type": "text/html" },
            })
        );
        vi.stubGlobal("fetch", mockFetch);

        document.body.innerHTML = `
            <div id="container"></div>
            <button mx-swap-template="skeleton" mx-target="#container"></button>
            <template mx-template="skeleton">
                <div id="content" mx-load="/real-content">
                    Skeleton Loader...
                </div>
            </template>
        `;

        CuboMX.start();

        const button = document.querySelector("button");
        button.click(); // This swaps the skeleton in

        // Wait for the swap and the subsequent mx-load request
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(mockFetch).toHaveBeenCalledWith(
            "/real-content",
            expect.any(Object)
        );

        const finalContent = document.querySelector("#content");
        expect(finalContent.textContent).toBe("Real Content");
    });

    it("should infer mx-select from mx-target if omitted", async () => {
        const mockFetch = vi.fn().mockResolvedValue(
            new Response(
                '<html><body><div id="container">Updated Content</div></body></html>',
                {
                    status: 200,
                    headers: { "Content-Type": "text/html" },
                }
            )
        );
        vi.stubGlobal("fetch", mockFetch);

        document.body.innerHTML = `
            <div id="container">Initial Content</div>
            <div mx-load="/content" mx-target="#container"></div>
        `;

        CuboMX.start();
        await new Promise((resolve) => setTimeout(resolve, 10));

        const container = document.querySelector("#container");

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(mockFetch).toHaveBeenCalledWith("/content", expect.any(Object));
        expect(container).not.toBeNull();
        expect(container.textContent).toBe("Updated Content");
    });

    it("should self-replace with selected content when mx-target is omitted", async () => {
        const mockFetch = vi.fn().mockResolvedValue(
            new Response(
                '<html><body><div id="replacement">Replaced Content</div></body></html>',
                {
                    status: 200,
                    headers: { "Content-Type": "text/html" },
                }
            )
        );
        vi.stubGlobal("fetch", mockFetch);

        document.body.innerHTML = `
            <div mx-load="/content" mx-select="#replacement">Original Content</div>
        `;

        CuboMX.start();
        await new Promise((resolve) => setTimeout(resolve, 10));

        const replacement = document.querySelector("#replacement");

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(replacement).not.toBeNull();
        expect(replacement.textContent).toBe("Replaced Content");
        expect(document.body.textContent).not.toContain("Original Content");
    });

    it("should self-replace with the full response body when target and select are omitted", async () => {
        const mockFetch = vi.fn().mockResolvedValue(
            new Response('<p>Full response</p>', {
                status: 200,
                headers: { "Content-Type": "text/html" },
            })
        );
        vi.stubGlobal("fetch", mockFetch);

        document.body.innerHTML = `
            <div class="original" mx-load="/content">Original</div>
        `;

        CuboMX.start();
        await new Promise((resolve) => setTimeout(resolve, 10));

        const original = document.querySelector(".original");
        const replacement = document.querySelector("p");

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(original).toBeNull();
        expect(replacement).not.toBeNull();
        expect(replacement.textContent).toBe("Full response");
    });

    it("should handle multiple concurrent mx-load directives correctly", async () => {
        const mockFetch = vi.fn().mockImplementation((url) => {
            if (url.endsWith("/1")) {
                return Promise.resolve(new Response("<p>Content 1</p>"));
            }
            if (url.endsWith("/2")) {
                return Promise.resolve(new Response("<span>Content 2</span>"));
            }
            if (url.endsWith("/3")) {
                return Promise.resolve(new Response("<strong>Content 3</strong>"));
            }
            return Promise.resolve(new Response("Not Found", { status: 404 }));
        });
        vi.stubGlobal("fetch", mockFetch);

        document.body.innerHTML = `
            <div mx-load="/content/1">Loader 1</div>
            <div mx-load="/content/2">Loader 2</div>
            <div mx-load="/content/3">Loader 3</div>
        `;

        CuboMX.start();
        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(mockFetch).toHaveBeenCalledWith("/content/1", expect.any(Object));
        expect(mockFetch).toHaveBeenCalledWith("/content/2", expect.any(Object));
        expect(mockFetch).toHaveBeenCalledWith("/content/3", expect.any(Object));

        expect(document.body.textContent).not.toContain("Loader");

        const content1 = document.querySelector("p");
        const content2 = document.querySelector("span");
        const content3 = document.querySelector("strong");

        expect(content1).not.toBeNull();
        expect(content1.textContent).toBe("Content 1");

        expect(content2).not.toBeNull();
        expect(content2.textContent).toBe("Content 2");

        expect(content3).not.toBeNull();
        expect(content3.textContent).toBe("Content 3");
    });

    it("should activate mx-load within a template rendered by mx-swap-template", async () => {
        const mockFetch = vi.fn().mockResolvedValue(
            new Response('<div id="load-container">Final Content</div>', {
                status: 200,
                headers: { "Content-Type": "text/html" },
            })
        );
        vi.stubGlobal("fetch", mockFetch);

        document.body.innerHTML = `
            <div id="swap-container"></div>
            <div id="load-container">Initial Content</div>
            <button mx-swap-template="myTemplate" mx-target="#swap-container:innerHTML"></button>
            <template mx-template="myTemplate">
                <div mx-load="/final-content" mx-target="#load-container">
                    Loader...
                </div>
            </template>
        `;

        CuboMX.start();
        document.querySelector("button").click();

        // Wait for the first swap (template render)
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Check that the loader from the template is in place
        const swapContainer = document.querySelector("#swap-container");
        expect(swapContainer.textContent).toContain("Loader...");

        // Wait for the second swap (from the mx-load)
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(mockFetch).toHaveBeenCalledWith("/final-content", expect.any(Object));

        const loadContainer = document.querySelector("#load-container");
        expect(loadContainer.textContent).toBe("Final Content");
    });
});
