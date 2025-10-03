import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Directive: mx-delay", () => {
    let style;

    beforeEach(() => {
        // Reset CuboMX and the DOM
        CuboMX.reset();
        document.body.innerHTML = "";
        document.head.innerHTML = "";

        // Use fake timers to control setTimeout
        vi.useFakeTimers();

        // Add the essential CSS rule for the directive to work
        style = document.createElement("style");
        style.innerHTML = `[mx-delay] { display: none !important; }`;
        document.head.appendChild(style);
    });

    afterEach(() => {
        // Restore real timers
        vi.useRealTimers();
    });

    it("should make an element visible after the specified delay", async () => {
        // Arrange
        document.body.innerHTML = `<div id="test-el" mx-delay="500">Hello</div>`;
        const el = document.getElementById("test-el");
        CuboMX.start();

        // Assert: Immediately after start, it should be hidden by the CSS rule
        expect(window.getComputedStyle(el).display).toBe("none");

        // Act: Advance time by the specified delay
        await vi.advanceTimersByTimeAsync(500);

        // Assert: After the delay, the attribute is removed and the element is visible
        expect(el.hasAttribute("mx-delay")).toBe(false);
        expect(window.getComputedStyle(el).display).toBe("block"); // Default for div
    });

    it("should restore the original display style (e.g., flex) after the delay", async () => {
        // Arrange
        document.body.innerHTML = `<div id="test-el" style="display: flex;" mx-delay="300">Flex content</div>`;
        const el = document.getElementById("test-el");
        CuboMX.start();

        // Wait for the next tick to ensure styles are applied in the test environment
        await vi.advanceTimersByTimeAsync(0);

        // Assert: It's hidden initially
        expect(window.getComputedStyle(el).display).toBe("none");

        // Act: Advance time
        await vi.advanceTimersByTimeAsync(300);

        // Assert: The original display style is restored
        expect(el.hasAttribute("mx-delay")).toBe(false);
        expect(window.getComputedStyle(el).display).toBe("flex");
    });

    it("should work as a cloak when no delay value is provided (delay=0)", async () => {
        // Arrange: An element that should be hidden by mx-show
        document.body.innerHTML = `<div id="test-el" mx-show="false" mx-delay>Hidden</div>`;
        const el = document.getElementById("test-el");
        CuboMX.start();

        // Assert: It's hidden initially by the [mx-delay] CSS rule
        expect(window.getComputedStyle(el).display).toBe("none");
        expect(el.hasAttribute("mx-delay")).toBe(true);

        // Act: Advance timers. setTimeout(..., 0) will run in the next tick.
        await vi.runAllTimersAsync();

        // Assert: The mx-delay attribute is gone, but the element is now hidden by mx-show
        expect(el.hasAttribute("mx-delay")).toBe(false);
        expect(window.getComputedStyle(el).display).toBe("none");
    });

    it("should do nothing if the element is removed from the DOM before the delay completes", async () => {
        // Arrange
        document.body.innerHTML = `<div id="test-el" mx-delay="1000">Content</div>`;
        const el = document.getElementById("test-el");
        CuboMX.start();

        // Assert: It's hidden
        expect(window.getComputedStyle(el).display).toBe("none");

        // Act: Advance time partially, then remove the element
        await vi.advanceTimersByTimeAsync(500);
        el.remove();

        // Assert: The element is no longer in the DOM
        expect(document.getElementById("test-el")).toBeNull();

        // Act: Advance time past the original delay. This should not throw an error.
        await expect(vi.advanceTimersByTimeAsync(500)).resolves.not.toThrow();
    });

    it('should treat mx-delay="0" the same as an empty mx-delay', async () => {
        document.body.innerHTML = `<div id="test-el" mx-show="false" mx-delay="0">Hidden</div>`;
        const el = document.getElementById("test-el");
        CuboMX.start();

        expect(window.getComputedStyle(el).display).toBe("none");
        await vi.runAllTimersAsync();
        expect(el.hasAttribute("mx-delay")).toBe(false);
        expect(window.getComputedStyle(el).display).toBe("none");
    });
});
