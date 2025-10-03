import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Directive: mx-swap-template URL Priority", () => {
    let pushStateSpy;
    let replaceStateSpy;

    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
        document.title = "Original Title";

        // Mock history functions
        pushStateSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
        replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // Helper to simulate CuboMX start and wait for a tick
    const startCuboMX = async () => {
        CuboMX.start();
        await new Promise(resolve => setTimeout(resolve, 0));
    };

    it("should prioritize 'url' attribute on the triggering element over template metadata", async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template" url="/template-url" page-title="Template Title"></template>
            <button id="btn1" mx-swap-template="my-template" mx-target="#container" url="/element-url-1">Swap 1</button>
            <button id="btn2" mx-swap-template="my-template" mx-target="#container" url="/element-url-2">Swap 2</button>
        `;
        await startCuboMX();

        // Act 1
        document.getElementById("btn1").click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert 1: Element's URL should be used
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), "Template Title", "/element-url-1");
        expect(document.title).toBe("Template Title");

        // Reset spy for next click
        pushStateSpy.mockClear();

        // Act 2
        document.getElementById("btn2").click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert 2: Element's URL should be used
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), "Template Title", "/element-url-2");
        expect(document.title).toBe("Template Title");
    });

    it("should prioritize 'data-url' attribute on the triggering element over template metadata", async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template" url="/template-url" page-title="Template Title"></template>
            <button id="btn1" mx-swap-template="my-template" mx-target="#container" data-url="/element-data-url-1">Swap 1</button>
        `;
        await startCuboMX();

        // Act
        document.getElementById("btn1").click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert: Element's data-url should be used
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), "Template Title", "/element-data-url-1");
        expect(document.title).toBe("Template Title");
    });

    it("should fall back to template's 'url' metadata if no URL on triggering element", async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template" url="/template-url" page-title="Template Title"></template>
            <button id="btn1" mx-swap-template="my-template" mx-target="#container">Swap 1</button>
        `;
        await startCuboMX();

        // Act
        document.getElementById("btn1").click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert: Template's URL should be used
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), "Template Title", "/template-url");
        expect(document.title).toBe("Template Title");
    });

    it("should fall back to template's 'data-url' metadata if no URL on triggering element and no 'url' on template", async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template" data-url="/template-data-url" page-title="Template Title"></template>
            <button id="btn1" mx-swap-template="my-template" mx-target="#container">Swap 1</button>
        `;
        await startCuboMX();

        // Act
        document.getElementById("btn1").click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert: Template's data-url should be used
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), "Template Title", "/template-data-url");
        expect(document.title).toBe("Template Title");
    });

    it("should not update history if no URL is found on triggering element or template", async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template" page-title="Template Title"></template>
            <button id="btn1" mx-swap-template="my-template" mx-target="#container">Swap 1</button>
        `;
        await startCuboMX();

        // Act
        document.getElementById("btn1").click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert: pushState should not have been called
        expect(pushStateSpy).not.toHaveBeenCalled();
        expect(document.title).toBe("Original Title"); // Title should not change if no URL for history
    });

    it("should prioritize 'url' on triggering element over 'data-url' on triggering element", async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template" url="/template-url" page-title="Template Title"></template>
            <button id="btn1" mx-swap-template="my-template" mx-target="#container" data-url="/element-data-url" url="/element-url">Swap 1</button>
        `;
        await startCuboMX();

        // Act
        document.getElementById("btn1").click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert: Element's 'url' should be used
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), "Template Title", "/element-url");
        expect(document.title).toBe("Template Title");
    });

    it("should prioritize 'page-title' on triggering element over template metadata", async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template" url="/template-url" page-title="Template Title"></template>
            <button id="btn1" mx-swap-template="my-template" mx-target="#container" url="/element-url" page-title="Element Title">Swap 1</button>
        `;
        await startCuboMX();

        // Act
        document.getElementById("btn1").click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert: Element's page-title should be used
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), "Element Title", "/element-url");
        expect(document.title).toBe("Element Title");
    });

    it("should prioritize 'data-page-title' on triggering element over template metadata", async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template" url="/template-url" page-title="Template Title"></template>
            <button id="btn1" mx-swap-template="my-template" mx-target="#container" url="/element-url" data-page-title="Element Data Title">Swap 1</button>
        `;
        await startCuboMX();

        // Act
        document.getElementById("btn1").click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert: Element's data-page-title should be used
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), "Element Data Title", "/element-url");
        expect(document.title).toBe("Element Data Title");
    });

    it("should prioritize 'page-title' on triggering element over 'data-page-title' on triggering element", async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="my-template" url="/template-url" page-title="Template Title"></template>
            <button id="btn1" mx-swap-template="my-template" mx-target="#container" url="/element-url" data-page-title="Element Data Title" page-title="Element Title">Swap 1</button>
        `;
        await startCuboMX();

        // Act
        document.getElementById("btn1").click();
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert: Element's 'page-title' should be used
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), "Element Title", "/element-url");
        expect(document.title).toBe("Element Title");
    });
});
