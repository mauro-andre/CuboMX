import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX - Universal Scoped Evaluation", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    // Test 1: Local property access for a condition
    it("should resolve properties for mx-show from the local component scope", () => {
        CuboMX.component("myComp", () => ({ isOpen: true }));
        document.body.innerHTML = `
            <div mx-data="myComp()" mx-ref="c1">
                <span mx-show="isOpen">Visible</span>
            </div>
        `;
        CuboMX.start();
        expect(document.querySelector("span").style.display).not.toBe("none");
    });

    // Test 2: Local method call for an event
    it("should call methods from the local component scope for mx-on", () => {
        const spy = vi.fn();
        CuboMX.component("myComp", () => ({ toggle: spy }));
        document.body.innerHTML = `
            <div mx-data="myComp()" mx-ref="c1">
                <button mx-on:click="toggle()"></button>
            </div>
        `;
        CuboMX.start();
        document.querySelector("button").click();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    // Test 3: Global access using `$`
    it("should access global stores/components when using the $ prefix", () => {
        const spy = vi.fn();
        CuboMX.store("myStore", { doWork: spy });
        CuboMX.component("myComp", () => ({}));
        document.body.innerHTML = `
            <div mx-data="myComp()" mx-ref="c1">
                <button mx-on:click="$myStore.doWork()"></button>
            </div>
        `;
        CuboMX.start();
        document.querySelector("button").click();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    // Test 4: Local state definition with mx-attrs
    it("should hydrate an object to the local scope with mx-attrs", () => {
        CuboMX.component("myComp", () => ({ localData: null }));
        document.body.innerHTML = `
            <div mx-data="myComp()" mx-ref="c1">
                <div mx-attrs="localData" data-id="123"></div>
            </div>
        `;
        CuboMX.start();
        expect(CuboMX.c1.localData).toBeDefined();
        expect(CuboMX.c1.localData.dataId).toBe(123);
    });

    // Test 5: Global state definition with mx-attrs and `$`
    it("should hydrate an object to the global scope with mx-attrs and $", () => {
        CuboMX.store("myStore", { globalData: null });
        CuboMX.component("myComp", () => ({}));
        document.body.innerHTML = `
            <div mx-data="myComp()" mx-ref="c1">
                <div mx-attrs="$myStore.globalData" data-id="456"></div>
            </div>
        `;
        CuboMX.start();
        expect(CuboMX.myStore.globalData).toBeDefined();
        expect(CuboMX.myStore.globalData.dataId).toBe(456);
    });

    // Test 6: Global access to a factory instance by its ref
    it("should access a specific factory instance globally via its ref with", () => {
        const spy1 = vi.fn();
        const spy2 = vi.fn();
        CuboMX.component("myComp", () => ({ doWork: spy1 }));
        CuboMX.component("otherComp", () => ({ doWork: spy2 }));

        document.body.innerHTML = `
            <div mx-data="myComp()" mx-ref="c1">
                <!-- This button calls a method on a DIFFERENT component instance -->
                <button mx-on:click="$c2.doWork()"></button>
            </div>
            <div mx-data="otherComp()" mx-ref="c2"></div>
        `;

        CuboMX.start();
        document.querySelector("button").click();

        expect(spy1).not.toHaveBeenCalled();
        expect(spy2).toHaveBeenCalledTimes(1);
    });
});
