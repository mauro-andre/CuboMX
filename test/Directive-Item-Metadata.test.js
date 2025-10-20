import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("mx-item: Injected Metadata (JS)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    // --- Singleton Scenarios ---
    describe("With Singleton Component", () => {
        beforeEach(() => {
            CuboMX.component("mySingleton", {
                items: [],
                data: { nestedItems: [] }
            });
        });

        it("should inject component, variable, and componentName for a direct property", () => {
            document.body.innerHTML = `
                <div mx-data="mySingleton">
                    <div mx-item="items"></div>
                </div>
            `;
            CuboMX.start();
            const item = CuboMX.mySingleton.items[0];
            expect(item.component).toBe(CuboMX.mySingleton);
            expect(item.variable).toBe("items");
            expect(item.componentName).toBe("mySingleton");
        });

        it("should inject component, variable, and componentName for a nested property", () => {
            document.body.innerHTML = `
                <div mx-data="mySingleton">
                    <div mx-item="data.nestedItems"></div>
                </div>
            `;
            CuboMX.start();
            const item = CuboMX.mySingleton.data.nestedItems[0];
            expect(item.component).toBe(CuboMX.mySingleton);
            expect(item.variable).toBe("nestedItems");
            expect(item.componentName).toBe("mySingleton");
        });
    });

    // --- Factory Scenarios ---
    describe("With Factory Component", () => {
        beforeEach(() => {
            CuboMX.component("myFactory", () => ({
                items: [],
            }));
        });

        it("should inject instance, variable, and componentName for a factory with mx-ref", () => {
            document.body.innerHTML = `
                <div mx-data="myFactory()" mx-ref="instance1">
                    <div mx-item="items"></div>
                </div>
            `;
            CuboMX.start();
            const item = CuboMX.instance1.items[0];
            expect(item.component).toBe(CuboMX.instance1);
            expect(item.variable).toBe("items");
            expect(item.componentName).toBe("instance1");
        });
    });

    // --- Global Store Scenarios ---
    describe("With Global Store", () => {
        beforeEach(() => {
            CuboMX.store("myStore", {
                products: [],
            });
        });

        it("should inject store, variable, and componentName for a global array", () => {
            document.body.innerHTML = `<div mx-item="$myStore.products"></div>`;
            CuboMX.start();
            const item = CuboMX.myStore.products[0];
            expect(item.component).toBe(CuboMX.myStore);
            expect(item.variable).toBe("products");
            expect(item.componentName).toBe("myStore");
        });
    });

    // --- Cross-Component Scenarios ---
    describe("With Cross-Component Access", () => {
        beforeEach(() => {
            CuboMX.component("mySingleton", { singletonItems: [] });
            CuboMX.component("myFactory", () => ({ factoryItems: [] }));
        });

        it("should inject singleton and its name when accessed from a factory", () => {
            document.body.innerHTML = `
                <div mx-data="mySingleton"></div>
                <div mx-data="myFactory()" mx-ref="instance1">
                    <div mx-item="$mySingleton.singletonItems"></div>
                </div>
            `;
            CuboMX.start();
            const item = CuboMX.mySingleton.singletonItems[0];
            expect(item.component).toBe(CuboMX.mySingleton);
            expect(item.variable).toBe("singletonItems");
            expect(item.componentName).toBe("mySingleton");
        });

        it("should inject factory instance and its name when accessed from a singleton", () => {
            document.body.innerHTML = `
                <div mx-data="myFactory()" mx-ref="instance1"></div>
                <div mx-data="mySingleton">
                    <div mx-item="$instance1.factoryItems"></div>
                </div>
            `;
            CuboMX.start();
            const item = CuboMX.instance1.factoryItems[0];
            expect(item.component).toBe(CuboMX.instance1);
            expect(item.variable).toBe("factoryItems");
            expect(item.componentName).toBe("instance1");
        });
    });
});