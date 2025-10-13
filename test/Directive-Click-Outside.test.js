import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Directive: mx-on:click.outside", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("should execute the expression when clicking outside the element", async () => {
        const outsideSpy = vi.fn();
        CuboMX.component("myComp", { onOutside: outsideSpy });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="el" mx-on:click.outside="onOutside()">Inside</div>
            </div>
            <div id="outside-area">Outside</div>
        `;

        CuboMX.start();
        await vi.runAllTimersAsync();

        document.getElementById("outside-area").click();

        expect(outsideSpy).toHaveBeenCalledTimes(1);
    });

    it("should NOT execute the expression when clicking inside the element", async () => {
        const outsideSpy = vi.fn();
        CuboMX.component("myComp", { onOutside: outsideSpy });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="el" mx-on:click.outside="onOutside()">Inside</div>
            </div>
        `;

        CuboMX.start();
        await vi.runAllTimersAsync();

        document.getElementById("el").click();

        expect(outsideSpy).not.toHaveBeenCalled();
    });

    it("should NOT execute the expression when clicking on a child of the element", async () => {
        const outsideSpy = vi.fn();
        CuboMX.component("myComp", { onOutside: outsideSpy });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="el" mx-on:click.outside="onOutside()">
                    <span id="child">Inside Child</span>
                </div>
            </div>
        `;

        CuboMX.start();
        await vi.runAllTimersAsync();

        document.getElementById("child").click();

        expect(outsideSpy).not.toHaveBeenCalled();
    });

    it("should remove the event listener when the element is removed from the DOM", async () => {
        const outsideSpy = vi.fn();
        CuboMX.component("myComp", { onOutside: outsideSpy });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="el" mx-on:click.outside="onOutside()">Inside</div>
            </div>
            <div id="outside-area">Outside</div>
        `;

        CuboMX.start();
        await vi.runAllTimersAsync();

        // Remove the element
        const compEl = document.querySelector('[mx-data="myComp"]');
        compEl.remove();
        await vi.runAllTimersAsync(); // Allow mutation observer to run destroy logic

        // Click outside again
        document.getElementById("outside-area").click();

        // The spy should not have been called again, proving the listener was cleaned up
        expect(outsideSpy).not.toHaveBeenCalled();
    });

    it("should work correctly with a real-world dropdown example", async () => {
        CuboMX.component("dropdown", () => ({
            isOpen: true,
            close() {
                this.isOpen = false;
            }
        }));

        document.body.innerHTML = `
            <div mx-data="dropdown()" mx-ref="d1">
                <div mx-show="isOpen" mx-on:click.outside="close()">
                    Dropdown content
                </div>
            </div>
            <div id="outside-area"></div>
        `;

        CuboMX.start();
        await vi.runAllTimersAsync();

        const dropdownContent = document.querySelector('[mx-show]');
        
        // 1. Initially open
        expect(CuboMX.d1.isOpen).toBe(true);
        expect(dropdownContent.style.display).not.toBe("none");

        // 2. Click outside
        document.getElementById("outside-area").click();
        await vi.runAllTimersAsync();

        // 3. Should be closed
        expect(CuboMX.d1.isOpen).toBe(false);
        expect(dropdownContent.style.display).toBe("none");
    });
});
