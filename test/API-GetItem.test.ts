import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX, MxComponent, ItemProxy, ItemArrayProxy } from "../src/CuboMX.js";

// Define a specific item type for this test
interface TestItem extends ItemProxy<TestComponent> {
    id: number;
    name: string;
}

class TestComponent extends MxComponent {
    items!: ItemArrayProxy<TestItem>;
}

describe("CuboMX.getItem() API (TS)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    const setupComponent = () => {
        CuboMX.component("myComp", () => new TestComponent());
        document.body.innerHTML = `
            <div mx-data="myComp()" mx-ref="instance">
                <ul>
                    <li mx-item="items" ::data-id="id" data-id="100" ::text="name">Item 1</li>
                    <li mx-item="items" ::data-id="id" data-id="200" ::text="name">Item 2</li>
                </ul>
            </div>
        `;
        CuboMX.start();
    };

    it("should return a correctly typed item proxy when using generics", () => {
        setupComponent();
        const secondLi = document.querySelector("li:nth-child(2)") as HTMLElement;

        // Use the generic parameter to get a strongly-typed return value
        const item = CuboMX.getItem<TestItem>(secondLi);

        expect(item).not.toBeNull();

        // TypeScript now allows direct access to properties of TestItem without casting
        expect(item?.id).toBe(200);
        expect(item?.name).toBe("Item 2");

        // Verify it's the same instance as the one in the state array
        const comp = CuboMX.instance as TestComponent;
        expect(item).toBe(comp.items[1]);
    });

    it("should return a base ItemProxy if no generic is provided", () => {
        setupComponent();
        const firstLi = document.querySelector("li:nth-child(1)") as HTMLElement;

        // Call without generics
        const item = CuboMX.getItem(firstLi);

        expect(item).not.toBeNull();
        // We can still access properties, but without type safety on `id`
        expect((item as TestItem).id).toBe(100);
    });
});
