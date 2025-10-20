import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX, MxComponent, ItemArrayProxy, ItemProxy } from "../src/CuboMX.js";

// Define a more specific item type for testing
interface TestItem extends ItemProxy {
    id: number;
    component: TestComponent | TestStore; // The owner can be a component or a store
    variable: string;
    componentName: string;
}

// A class-based component
class TestComponent extends MxComponent {
    items: ItemArrayProxy<TestItem> = null!;
}

// A class-based store
class TestStore {
    products: ItemArrayProxy<TestItem> = null!;
    init() {}
}

describe("mx-item: Injected Metadata (TS)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    describe("With Class-based Singleton", () => {
        it("should inject component instance, variable name, and component name", () => {
            const myComp = new TestComponent();
            CuboMX.component("myComp", myComp);
            document.body.innerHTML = `
                <div mx-data="myComp">
                    <div mx-item="items" ::data-id="id" data-id="1"></div>
                </div>
            `;
            CuboMX.start();

            const item = myComp.items[0];
            expect(item).toBeDefined();
            expect(item.id).toBe(1);
            // The injected component should be the proxy, which is what CuboMX.myComp is
            expect(item.component).toBe(CuboMX.myComp);
            expect(item.variable).toBe("items");
            expect(item.componentName).toBe("myComp");
        });
    });

    describe("With Class-based Factory", () => {
        it("should inject component instance, variable name, and component name", () => {
            CuboMX.component("myFactory", () => new TestComponent());
            document.body.innerHTML = `
                <div mx-data="myFactory()" mx-ref="instance1">
                    <div mx-item="items" ::data-id="id" data-id="2"></div>
                </div>
            `;
            CuboMX.start();

            const instance = CuboMX.instance1 as TestComponent;
            const item = instance.items[0];

            expect(item).toBeDefined();
            expect(item.id).toBe(2);
            expect(item.component).toBe(CuboMX.instance1);
            expect(item.variable).toBe("items");
            expect(item.componentName).toBe("instance1");
        });
    });

    describe("With Class-based Store", () => {
        it("should inject store instance, variable name, and component name", () => {
            const myStore = new TestStore();
            CuboMX.store("myStore", myStore);
            document.body.innerHTML = `
                <div mx-item="$myStore.products" ::data-id="id" data-id="3"></div>
            `;
            CuboMX.start();

            const item = myStore.products[0];

            expect(item).toBeDefined();
            expect(item.id).toBe(3);
            expect(item.component).toBe(CuboMX.myStore);
            expect(item.variable).toBe("products");
            expect(item.componentName).toBe("myStore");
        });
    });
});