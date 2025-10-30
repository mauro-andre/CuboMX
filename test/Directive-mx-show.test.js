import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/cubomx";
beforeEach(() => {
    CuboMX.reset();
});
describe("mx-show - Basic Functionality", () => {
    it("should show element when property is true", () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="isVisible">Content</div>
            </div>
        `;
        CuboMX.component("app", { isVisible: true });
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.style.display).toBe("");
    });
    it("should hide element when property is false", () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="isVisible">Content</div>
            </div>
        `;
        CuboMX.component("app", { isVisible: false });
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.style.display).toBe("none");
    });
    it("should toggle visibility reactively when property changes", () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="isVisible">Content</div>
            </div>
        `;
        CuboMX.component("app", { isVisible: true });
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.style.display).toBe("");
        CuboMX.app.isVisible = false;
        expect(target.style.display).toBe("none");
        CuboMX.app.isVisible = true;
        expect(target.style.display).toBe("");
    });
    it("should handle truthy values as visible", () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="value">Content</div>
            </div>
        `;
        CuboMX.component("app", { value: "hello" });
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.style.display).toBe("");
        CuboMX.app.value = 1;
        expect(target.style.display).toBe("");
        CuboMX.app.value = [];
        expect(target.style.display).toBe("");
        CuboMX.app.value = {};
        expect(target.style.display).toBe("");
    });
    it("should handle falsy values as hidden", () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="value">Content</div>
            </div>
        `;
        CuboMX.component("app", { value: false });
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.style.display).toBe("none");
        CuboMX.app.value = 0;
        expect(target.style.display).toBe("none");
        CuboMX.app.value = "";
        expect(target.style.display).toBe("none");
        CuboMX.app.value = null;
        expect(target.style.display).toBe("none");
        CuboMX.app.value = undefined;
        expect(target.style.display).toBe("none");
    });
    it("should remove mx-cloak attribute after initialization", () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="isVisible" mx-cloak>Content</div>
            </div>
        `;
        CuboMX.component("app", { isVisible: true });
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.hasAttribute("mx-cloak")).toBe(false);
    });
});
describe("mx-show - Store and $ prefix", () => {
    it("should work with store using $ prefix", () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="$appStore.isOpen">Content</div>
            </div>
        `;
        CuboMX.store("appStore", { isOpen: true });
        CuboMX.component("app", {});
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.style.display).toBe("");
        CuboMX.appStore.isOpen = false;
        expect(target.style.display).toBe("none");
        CuboMX.appStore.isOpen = true;
        expect(target.style.display).toBe("");
    });
    it("should work with another component using $ prefix", () => {
        document.body.innerHTML = `
            <div mx-data="modal">
                <p :text="isOpen">false</p>
            </div>
            <div mx-data="trigger">
                <div id="target" mx-show="$modal.isOpen">Modal content</div>
            </div>
        `;
        CuboMX.component("modal", { isOpen: false });
        CuboMX.component("trigger", {});
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.style.display).toBe("none");
        CuboMX.modal.isOpen = true;
        expect(target.style.display).toBe("");
    });
    it("should work with mx-ref using $ prefix", () => {
        document.body.innerHTML = `
            <div mx-data="sidebar" mx-ref="sidebarRef">
                <p :text="expanded">false</p>
            </div>
            <div mx-data="main">
                <div id="target" mx-show="$sidebarRef.expanded">Extra content</div>
            </div>
        `;
        CuboMX.component("sidebar", { expanded: false });
        CuboMX.component("main", {});
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.style.display).toBe("none");
        CuboMX.sidebarRef.expanded = true;
        expect(target.style.display).toBe("");
    });
});
describe("mx-show - Multiple Elements", () => {
    it("should control multiple elements with same property", () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target1" mx-show="isVisible">Content 1</div>
                <div id="target2" mx-show="isVisible">Content 2</div>
                <div id="target3" mx-show="isVisible">Content 3</div>
            </div>
        `;
        CuboMX.component("app", { isVisible: true });
        CuboMX.start();
        const target1 = document.querySelector("#target1");
        const target2 = document.querySelector("#target2");
        const target3 = document.querySelector("#target3");
        expect(target1.style.display).toBe("");
        expect(target2.style.display).toBe("");
        expect(target3.style.display).toBe("");
        CuboMX.app.isVisible = false;
        expect(target1.style.display).toBe("none");
        expect(target2.style.display).toBe("none");
        expect(target3.style.display).toBe("none");
    });
    it("should control multiple elements with different properties independently", () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target1" mx-show="showFirst">Content 1</div>
                <div id="target2" mx-show="showSecond">Content 2</div>
            </div>
        `;
        CuboMX.component("app", { showFirst: true, showSecond: false });
        CuboMX.start();
        const target1 = document.querySelector("#target1");
        const target2 = document.querySelector("#target2");
        expect(target1.style.display).toBe("");
        expect(target2.style.display).toBe("none");
        CuboMX.app.showFirst = false;
        expect(target1.style.display).toBe("none");
        expect(target2.style.display).toBe("none");
        CuboMX.app.showSecond = true;
        expect(target1.style.display).toBe("none");
        expect(target2.style.display).toBe("");
    });
});
describe("mx-transition - Basic Transitions", () => {
    beforeEach(() => {
        // Add transition styles to document
        const style = document.createElement("style");
        style.textContent = `
            .fade-enter-start {
                opacity: 0;
            }
            .fade-enter-end {
                opacity: 1;
                transition: opacity 100ms;
            }
            .fade-leave-start {
                opacity: 1;
            }
            .fade-leave-end {
                opacity: 0;
                transition: opacity 100ms;
            }
        `;
        document.head.appendChild(style);
    });
    it("should apply transition classes on enter", async () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="isVisible" mx-transition="fade">Content</div>
            </div>
        `;
        CuboMX.component("app", { isVisible: false });
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.style.display).toBe("none");
        CuboMX.app.isVisible = true;
        // Element should be visible immediately
        expect(target.style.display).toBe("");
        // Wait for requestAnimationFrame cycles
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        // Should have enter-end class
        expect(target.classList.contains("fade-enter-end")).toBe(true);
    });
    it("should apply transition classes on leave", async () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="isVisible" mx-transition="fade">Content</div>
            </div>
        `;
        CuboMX.component("app", { isVisible: true });
        CuboMX.start();
        const target = document.querySelector("#target");
        expect(target.style.display).toBe("");
        CuboMX.app.isVisible = false;
        // Wait for requestAnimationFrame cycles
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        // Should have leave-end class
        expect(target.classList.contains("fade-leave-end")).toBe(true);
        // Element should still be visible during transition
        expect(target.style.display).toBe("");
        // Wait for transition to complete (100ms + buffer)
        await new Promise((resolve) => setTimeout(resolve, 200));
        // After transition, element should be hidden
        expect(target.style.display).toBe("none");
        // Transition classes should be removed
        expect(target.classList.contains("fade-leave-start")).toBe(false);
        expect(target.classList.contains("fade-leave-end")).toBe(false);
    });
    it("should clean up classes after enter transition completes", async () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="isVisible" mx-transition="fade">Content</div>
            </div>
        `;
        CuboMX.component("app", { isVisible: false });
        CuboMX.start();
        const target = document.querySelector("#target");
        CuboMX.app.isVisible = true;
        // Wait for transition to complete
        await new Promise((resolve) => setTimeout(resolve, 200));
        // All transition classes should be removed
        expect(target.classList.contains("fade-enter-start")).toBe(false);
        expect(target.classList.contains("fade-enter-end")).toBe(false);
        expect(target.style.display).toBe("");
    });
});
describe("mx-transition - Advanced Scenarios", () => {
    beforeEach(() => {
        const style = document.createElement("style");
        style.textContent = `
            .slide-enter-start {
                transform: translateX(-100%);
            }
            .slide-enter-end {
                transform: translateX(0);
                transition: transform 100ms ease-out;
            }
            .slide-leave-start {
                transform: translateX(0);
            }
            .slide-leave-end {
                transform: translateX(-100%);
                transition: transform 100ms ease-in;
            }
        `;
        document.head.appendChild(style);
    });
    it("should handle rapid toggle transitions", async () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="isVisible" mx-transition="slide">Content</div>
            </div>
        `;
        CuboMX.component("app", { isVisible: false });
        CuboMX.start();
        const target = document.querySelector("#target");
        // Rapid toggles
        CuboMX.app.isVisible = true;
        await new Promise((resolve) => setTimeout(resolve, 50)); // Mid-transition
        CuboMX.app.isVisible = false;
        await new Promise((resolve) => setTimeout(resolve, 50)); // Mid-transition
        CuboMX.app.isVisible = true;
        // Wait for all transitions to settle
        await new Promise((resolve) => setTimeout(resolve, 200));
        // Should end up visible
        expect(target.style.display).toBe("");
        // Should have cleaned up transition classes
        expect(target.classList.contains("slide-enter-start")).toBe(false);
        expect(target.classList.contains("slide-enter-end")).toBe(false);
    });
    it("should work with different transition names", async () => {
        const style = document.createElement("style");
        style.textContent = `
            .custom-enter-start { opacity: 0; transform: scale(0.9); }
            .custom-enter-end { opacity: 1; transform: scale(1); transition: all 100ms; }
            .custom-leave-start { opacity: 1; transform: scale(1); }
            .custom-leave-end { opacity: 0; transform: scale(0.9); transition: all 100ms; }
        `;
        document.head.appendChild(style);
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target" mx-show="isVisible" mx-transition="custom">Content</div>
            </div>
        `;
        CuboMX.component("app", { isVisible: false });
        CuboMX.start();
        const target = document.querySelector("#target");
        CuboMX.app.isVisible = true;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        expect(target.classList.contains("custom-enter-end")).toBe(true);
    });
});
describe("mx-transition - Multiple Elements", () => {
    beforeEach(() => {
        const style = document.createElement("style");
        style.textContent = `
            .fade-enter-start { opacity: 0; }
            .fade-enter-end { opacity: 1; transition: opacity 100ms; }
            .fade-leave-start { opacity: 1; }
            .fade-leave-end { opacity: 0; transition: opacity 100ms; }
        `;
        document.head.appendChild(style);
    });
    it("should handle transitions on multiple elements independently", async () => {
        document.body.innerHTML = `
            <div mx-data="app">
                <div id="target1" mx-show="show1" mx-transition="fade">Content 1</div>
                <div id="target2" mx-show="show2" mx-transition="fade">Content 2</div>
            </div>
        `;
        CuboMX.component("app", { show1: false, show2: false });
        CuboMX.start();
        const target1 = document.querySelector("#target1");
        const target2 = document.querySelector("#target2");
        expect(target1.style.display).toBe("none");
        expect(target2.style.display).toBe("none");
        // Show first element only
        CuboMX.app.show1 = true;
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(target1.style.display).toBe("");
        expect(target2.style.display).toBe("none");
        // Show second element
        CuboMX.app.show2 = true;
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(target1.style.display).toBe("");
        expect(target2.style.display).toBe("");
        // Hide first element
        CuboMX.app.show1 = false;
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(target1.style.display).toBe("none");
        expect(target2.style.display).toBe("");
    });
});
describe("mx-show - Error Handling", () => {
    it("should log error when component not found with $ prefix", () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => { });
        document.body.innerHTML = `
            <div mx-data="app">
                <div mx-show="$nonExistent.value">Content</div>
            </div>
        `;
        CuboMX.component("app", {});
        CuboMX.start();
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('mx-show directive failed: Component "nonExistent" not found'));
        consoleErrorSpy.mockRestore();
    });
    it("should log error when no mx-data ancestor found", () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => { });
        document.body.innerHTML = `
            <div mx-show="value">Content</div>
        `;
        CuboMX.start();
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("mx-show directive failed: No mx-data component found"));
        consoleErrorSpy.mockRestore();
    });
});
