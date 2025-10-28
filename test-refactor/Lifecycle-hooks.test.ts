import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src-refactor/cubomx";

describe("Lifecycle Hooks - init and destroy", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    describe("init() lifecycle hook", () => {
        it("should call init() when component is created", () => {
            const initSpy = vi.fn();

            CuboMX.component("counter", {
                count: 0,
                init() {
                    initSpy();
                },
            });

            document.body.innerHTML = `<div mx-data="counter"></div>`;
            CuboMX.start();

            expect(initSpy).toHaveBeenCalledTimes(1);
        });

        it("should call init() for all components when starting", () => {
            const initSpy1 = vi.fn();
            const initSpy2 = vi.fn();

            CuboMX.component("comp1", {
                init() {
                    initSpy1();
                },
            });

            CuboMX.component("comp2", {
                init() {
                    initSpy2();
                },
            });

            document.body.innerHTML = `
                <div mx-data="comp1"></div>
                <div mx-data="comp2"></div>
            `;
            CuboMX.start();

            expect(initSpy1).toHaveBeenCalledTimes(1);
            expect(initSpy2).toHaveBeenCalledTimes(1);
        });

        it("should have access to $el in init()", () => {
            let capturedEl: HTMLElement | null = null;

            CuboMX.component("test", {
                init(this: any) {
                    capturedEl = this.$el;
                },
            });

            document.body.innerHTML = `<div id="test-el" mx-data="test"></div>`;
            CuboMX.start();

            expect(capturedEl).not.toBeNull();
            expect(capturedEl!.id).toBe("test-el");
        });

        it("should call init() when new component is added to DOM", async () => {
            const initSpy = vi.fn();

            CuboMX.component("dynamic", {
                init() {
                    initSpy();
                },
            });

            document.body.innerHTML = `<div id="container"></div>`;
            CuboMX.start();

            expect(initSpy).not.toHaveBeenCalled();

            // Add component dynamically
            const container = document.querySelector("#container");
            const newEl = document.createElement("div");
            newEl.setAttribute("mx-data", "dynamic");
            container?.appendChild(newEl);

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(initSpy).toHaveBeenCalledTimes(1);
        });

        it("should call init() for nested components", async () => {
            const parentInitSpy = vi.fn();
            const childInitSpy = vi.fn();

            CuboMX.component("parent", {
                init() {
                    parentInitSpy();
                },
            });

            CuboMX.component("child", {
                init() {
                    childInitSpy();
                },
            });

            document.body.innerHTML = `<div id="container"></div>`;
            CuboMX.start();

            // Add parent with nested child
            const container = document.querySelector("#container");
            const parentEl = document.createElement("div");
            parentEl.setAttribute("mx-data", "parent");
            parentEl.innerHTML = `<div mx-data="child"></div>`;
            container?.appendChild(parentEl);

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(parentInitSpy).toHaveBeenCalledTimes(1);
            expect(childInitSpy).toHaveBeenCalledTimes(1);
        });

        it("should call init() on stores when starting", () => {
            const storeInitSpy = vi.fn();

            CuboMX.store("myStore", {
                value: 0,
                init() {
                    storeInitSpy();
                },
            });

            document.body.innerHTML = `<div mx-data="counter"></div>`;
            CuboMX.component("counter", { count: 0 });

            CuboMX.start();

            expect(storeInitSpy).toHaveBeenCalledTimes(1);
        });

        it("should be able to modify component state in init()", () => {
            CuboMX.component("test", function () {
                return {
                    message: "initial",
                    init() {
                        this.message = "initialized";
                    },
                };
            });

            document.body.innerHTML = `<div mx-data="test()" :text="message"></div>`;
            CuboMX.start();

            const el = document.querySelector("[mx-data='test()']");
            expect(el?.textContent).toBe("initialized");
        });
    });

    describe("destroy() lifecycle hook", () => {
        it("should call destroy() when component is removed from DOM", async () => {
            const destroySpy = vi.fn();

            CuboMX.component("temp", {
                destroy() {
                    destroySpy();
                },
            });

            document.body.innerHTML = `<div id="temp" mx-data="temp"></div>`;
            CuboMX.start();

            expect(destroySpy).not.toHaveBeenCalled();

            // Remove component
            const el = document.querySelector("#temp");
            el?.remove();

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(destroySpy).toHaveBeenCalledTimes(1);
        });

        it("should call destroy() for all removed components", async () => {
            const destroy1Spy = vi.fn();
            const destroy2Spy = vi.fn();

            CuboMX.component("comp1", {
                destroy() {
                    destroy1Spy();
                },
            });

            CuboMX.component("comp2", {
                destroy() {
                    destroy2Spy();
                },
            });

            document.body.innerHTML = `
                <div id="container">
                    <div mx-data="comp1"></div>
                    <div mx-data="comp2"></div>
                </div>
            `;
            CuboMX.start();

            // Remove container (removes both components)
            const container = document.querySelector("#container");
            container?.remove();

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(destroy1Spy).toHaveBeenCalledTimes(1);
            expect(destroy2Spy).toHaveBeenCalledTimes(1);
        });

        it("should call destroy() for nested components when parent is removed", async () => {
            const parentDestroySpy = vi.fn();
            const childDestroySpy = vi.fn();

            CuboMX.component("parent", {
                destroy() {
                    parentDestroySpy();
                },
            });

            CuboMX.component("child", {
                destroy() {
                    childDestroySpy();
                },
            });

            document.body.innerHTML = `
                <div id="parent" mx-data="parent">
                    <div mx-data="child"></div>
                </div>
            `;
            CuboMX.start();

            // Remove parent (should also destroy child)
            const parent = document.querySelector("#parent");
            parent?.remove();

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(parentDestroySpy).toHaveBeenCalledTimes(1);
            expect(childDestroySpy).toHaveBeenCalledTimes(1);
        });

        it("should have access to component state in destroy()", async () => {
            let capturedValue: string | null = null;

            CuboMX.component("test", {
                value: "test-value",
                destroy(this: any) {
                    capturedValue = this.value;
                },
            });

            document.body.innerHTML = `<div id="test" mx-data="test"></div>`;
            CuboMX.start();

            const el = document.querySelector("#test");
            el?.remove();

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(capturedValue).toBe("test-value");
        });

        it("should not call destroy() for elements without mx-data", async () => {
            const destroySpy = vi.fn();

            CuboMX.component("test", {
                destroy() {
                    destroySpy();
                },
            });

            document.body.innerHTML = `
                <div id="container">
                    <div mx-data="test"></div>
                    <div id="no-mx-data">No mx-data</div>
                </div>
            `;
            CuboMX.start();

            // Remove element without mx-data
            const noMxData = document.querySelector("#no-mx-data");
            noMxData?.remove();

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(destroySpy).not.toHaveBeenCalled();
        });

        it("should handle components without destroy() gracefully", async () => {
            CuboMX.component("no-destroy", {
                value: 0,
            });

            document.body.innerHTML = `<div id="test" mx-data="no-destroy"></div>`;
            CuboMX.start();

            // Should not throw error when removing component without destroy()
            const el = document.querySelector("#test");
            expect(() => {
                el?.remove();
            }).not.toThrow();

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver
        });
    });

    describe("init() and destroy() together", () => {
        it("should call init() then destroy() in correct order", async () => {
            const calls: string[] = [];

            CuboMX.component("lifecycle", {
                init() {
                    calls.push("init");
                },
                destroy() {
                    calls.push("destroy");
                },
            });

            document.body.innerHTML = `<div id="container"></div>`;
            CuboMX.start();

            // Add component
            const container = document.querySelector("#container");
            const newEl = document.createElement("div");
            newEl.setAttribute("mx-data", "lifecycle");
            newEl.setAttribute("id", "lifecycle-el");
            container?.appendChild(newEl);

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(calls).toEqual(["init"]);

            // Remove component
            const el = document.querySelector("#lifecycle-el");
            el?.remove();

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(calls).toEqual(["init", "destroy"]);
        });

        it("should handle multiple add/remove cycles", async () => {
            let initCount = 0;
            let destroyCount = 0;

            CuboMX.component("cycle", {
                init() {
                    initCount++;
                },
                destroy() {
                    destroyCount++;
                },
            });

            document.body.innerHTML = `<div id="container"></div>`;
            CuboMX.start();

            const container = document.querySelector("#container");

            // First cycle
            const el1 = document.createElement("div");
            el1.setAttribute("mx-data", "cycle");
            el1.className = "cycle-el";
            container?.appendChild(el1);
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(initCount).toBe(1);
            expect(destroyCount).toBe(0);

            el1.remove();
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(initCount).toBe(1);
            expect(destroyCount).toBe(1);

            // Second cycle
            const el2 = document.createElement("div");
            el2.setAttribute("mx-data", "cycle");
            el2.className = "cycle-el";
            container?.appendChild(el2);
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(initCount).toBe(2);
            expect(destroyCount).toBe(1);

            el2.remove();
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(initCount).toBe(2);
            expect(destroyCount).toBe(2);
        });

        it("should support cleanup logic in destroy() (e.g., timers)", async () => {
            let timerCleared = false;
            let timerHandle: number | null = null;

            CuboMX.component("timer", function () {
                return {
                    tick: 0,
                    init(this: any) {
                        timerHandle = window.setInterval(() => {
                            this.tick = (this.tick || 0) + 1;
                        }, 100);
                    },
                    destroy() {
                        if (timerHandle !== null) {
                            clearInterval(timerHandle);
                            timerCleared = true;
                        }
                    },
                };
            });

            document.body.innerHTML = `<div id="timer" mx-data="timer()"></div>`;
            CuboMX.start();

            expect(timerHandle).not.toBeNull();
            expect(timerCleared).toBe(false);

            const el = document.querySelector("#timer");
            el?.remove();

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(timerCleared).toBe(true);
        });
    });

    describe("Lifecycle hooks with CuboMX.swap()", () => {
        it("should call destroy() when element is replaced via swap", async () => {
            const destroySpy = vi.fn();

            CuboMX.component("replaced", {
                destroy() {
                    destroySpy();
                },
            });

            document.body.innerHTML = `<div id="content" mx-data="replaced">Original</div>`;
            CuboMX.start();

            expect(destroySpy).not.toHaveBeenCalled();

            // Replace element via swap
            CuboMX.swap(`<div id="content">New Content</div>`, [
                { target: "#content:outerHTML" },
            ]);

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(destroySpy).toHaveBeenCalledTimes(1);
        });

        it("should call init() for new component added via swap", async () => {
            const initSpy = vi.fn();

            CuboMX.component("new-comp", {
                init() {
                    initSpy();
                },
            });

            document.body.innerHTML = `<div id="content">Original</div>`;
            CuboMX.start();

            expect(initSpy).not.toHaveBeenCalled();

            // Add new component via swap
            CuboMX.swap(
                `<div id="content" mx-data="new-comp">New Component</div>`,
                [{ target: "#content:outerHTML" }]
            );

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(initSpy).toHaveBeenCalledTimes(1);
        });

        it("should call destroy() on old and init() on new when swapping components", async () => {
            const oldDestroySpy = vi.fn();
            const newInitSpy = vi.fn();

            CuboMX.component("old", {
                destroy() {
                    oldDestroySpy();
                },
            });

            CuboMX.component("new", {
                init() {
                    newInitSpy();
                },
            });

            document.body.innerHTML = `<div id="content" mx-data="old">Old</div>`;
            CuboMX.start();

            CuboMX.swap(`<div id="content" mx-data="new">New</div>`, [
                { target: "#content:outerHTML" },
            ]);

            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for MutationObserver

            expect(oldDestroySpy).toHaveBeenCalledTimes(1);
            expect(newInitSpy).toHaveBeenCalledTimes(1);
        });
    });
});
