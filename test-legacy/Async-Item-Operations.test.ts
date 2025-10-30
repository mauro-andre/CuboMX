import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CuboMX, MxComponent, ItemArrayProxy, ItemProxy } from "../src/CuboMX.js";

interface TestItem extends ItemProxy<TestComponent> {
    name: string;
}

class TestComponent extends MxComponent {
    items!: ItemArrayProxy<TestItem>;
}

describe("Async ItemArrayProxy Operations (TS)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    afterEach(() => {
    });

    const setupComponent = () => {
        CuboMX.component("listComp", () => new TestComponent());
        document.body.innerHTML = `
            <div mx-data="listComp()" mx-ref="instance">
                <ul>
                    <li mx-item="items" ::text="name">Initial</li>
                </ul>
            </div>
        `;
        CuboMX.start();
    };

    it("should correctly type the return value of awaited add()", async () => {
        setupComponent();
        const items = (CuboMX.instance as TestComponent).items;

        // The type of newItem should be inferred as TestItem
        const newItem: TestItem = (await items.add({ name: "Added" }))!;

        expect(newItem).toBeDefined();
        expect(newItem.name).toBe("Added");
        expect(items.length).toBe(2);
    });

    it("should correctly type the return value of awaited delete()", async () => {
        setupComponent();
        const items = (CuboMX.instance as TestComponent).items;
        const itemToDelete = items[0];

        // The type of deletedItem should be inferred as TestItem
        const deletedItem: TestItem = (await items.delete(0))!;

        expect(deletedItem).toBe(itemToDelete);
        expect(items.length).toBe(0);
    });

    it("should handle chained async operations correctly", async () => {
        setupComponent();
        const items = (CuboMX.instance as TestComponent).items;

        const item1 = await items.add({ name: "Item 1" });
        expect(items.length).toBe(2);

        const item2 = await items.add({ name: "Item 2" });
        expect(items.length).toBe(3);

        await items.delete(1); // Delete Item 1
        expect(items.length).toBe(2);

        expect(items[0].name).toBe("Initial");
        expect(items[1].name).toBe("Item 2");
    });

    it('should handle clear() and subsequent add() operations correctly with classes', async () => {
        // Setup with 2 initial items
        CuboMX.component("listComp", () => new TestComponent());
        document.body.innerHTML = `
            <div mx-data="listComp()" mx-ref="instance">
                <ul id="list">
                    <li mx-item="items" ::text="name">Item 1</li>
                    <li mx-item="items" ::text="name">Item 2</li>
                </ul>
            </div>
        `;
        CuboMX.start();
        const items = (CuboMX.instance as TestComponent).items;
        const listEl = document.getElementById('list')!;

        expect(items.length).toBe(2);
        expect(listEl.children.length).toBe(2);

        // Add one more
        await items.add({ name: "Item 3" });
        expect(items.length).toBe(3);
        expect(listEl.children.length).toBe(3);
        expect(listEl.lastElementChild!.textContent).toBe("Item 3");

        // Clear all
        await items.clear();
        expect(items.length).toBe(0);
        expect(listEl.children.length).toBe(0);

        // Add again to ensure template is preserved
        const finalItem: TestItem | null = await items.add({ name: "Final Item" });
        expect(items.length).toBe(1);
        expect(listEl.children.length).toBe(1);
        expect(listEl.firstElementChild!.textContent).toBe("Final Item");
        expect(finalItem!.name).toBe("Final Item");
    });

    it('should correctly report array .length after initial hydration', () => {
        CuboMX.component("myComp", () => new TestComponent());
        document.body.innerHTML = `
            <div mx-data="myComp()" mx-ref="instance">
                <ul>
                    <li mx-item="items">Item 1</li>
                    <li mx-item="items">Item 2</li>
                    <li mx-item="items">Item 3</li>
                </ul>
            </div>
        `;
        CuboMX.start();

        const comp = CuboMX.instance as TestComponent;
        expect(comp.items.length).toBe(3);
    });

    it('should update length correctly through clear and add cycles', async () => {
        class TempComponent extends MxComponent {
            items!: ItemArrayProxy<ItemProxy>;
        }
        CuboMX.component("myComp", () => new TempComponent());
        document.body.innerHTML = `
            <div mx-data="myComp()" mx-ref="instance">
                <ul>
                    <li mx-item="items">Item 1</li>
                    <li mx-item="items">Item 2</li>
                </ul>
            </div>
        `;
        CuboMX.start();
        const items = (CuboMX.instance as TempComponent).items;

        // 1. Assert initial length
        expect(items.length).toBe(2);

        // 2. Clear and assert length is 0
        await items.clear();
        expect(items.length).toBe(0);

        // 3. Add and assert length is 1
        await items.add({ name: 'New Item' });
        expect(items.length).toBe(1);
    });
});
