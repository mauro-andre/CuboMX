import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Async ItemArrayProxy Operations (JS)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    afterEach(() => {
    });

    const setupComponent = () => {
        CuboMX.component("listComp", {
            items: [],
        });
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul>
                    <li mx-item="items" ::text="name">Initial</li>
                </ul>
            </div>
        `;
        CuboMX.start();
    };

    it("should update array length immediately after awaited add()", async () => {
        setupComponent();
        const items = CuboMX.listComp.items;
        expect(items.length).toBe(1);

        await items.add({ name: "Added" });

        expect(items.length).toBe(2);
        expect(items[1].name).toBe("Added");
    });

    it("should return the new item proxy from awaited add()", async () => {
        setupComponent();
        const items = CuboMX.listComp.items;

        const newItem = await items.add({ name: "Added" });

        expect(newItem).toBeDefined();
        expect(newItem.name).toBe("Added");
        expect(items[1]).toBe(newItem); // Ensure the returned item is the one in the array
    });

    it("should update array length immediately after awaited prepend()", async () => {
        setupComponent();
        const items = CuboMX.listComp.items;
        expect(items.length).toBe(1);

        await items.prepend({ name: "Prepended" });

        expect(items.length).toBe(2);
        expect(items[0].name).toBe("Prepended");
    });

    it("should update array length immediately after awaited insert()", async () => {
        setupComponent();
        await CuboMX.listComp.items.add({ name: "End" }); // Initial, End
        const items = CuboMX.listComp.items;
        expect(items.length).toBe(2);

        await items.insert({ name: "Inserted" }, 1);

        expect(items.length).toBe(3);
        expect(items[1].name).toBe("Inserted");
    });

    it("should update array length immediately after awaited delete()", async () => {
        setupComponent();
        const items = CuboMX.listComp.items;
        expect(items.length).toBe(1);

        await items.delete(0);

        expect(items.length).toBe(0);
    });

    it("should return the deleted item proxy from awaited delete()", async () => {
        setupComponent();
        const items = CuboMX.listComp.items;
        const itemToDelete = items[0];

        const deletedItem = await items.delete(0);

        expect(deletedItem).toBe(itemToDelete);
    });

    it("should not update array length immediately for non-awaited calls", async () => {
        setupComponent();
        const items = CuboMX.listComp.items;
        expect(items.length).toBe(1);

        items.add({ name: "Added" }); // Not awaited

        // Immediately after, length should NOT have changed
        expect(items.length).toBe(1);

        // After timers run, it should be updated
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(items.length).toBe(2);
    });

    it('should handle clear() and subsequent add() operations correctly', async () => {
        // Setup with 2 initial items
        CuboMX.component("listComp", { items: [] });
        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items" ::text="name">Item 1</li>
                    <li mx-item="items" ::text="name">Item 2</li>
                </ul>
            </div>
        `;
        CuboMX.start();
        const items = CuboMX.listComp.items;
        const listEl = document.getElementById('list');

        expect(items.length).toBe(2);
        expect(listEl.children.length).toBe(2);

        // Add one more
        await items.add({ name: "Item 3" });
        expect(items.length).toBe(3);
        expect(listEl.children.length).toBe(3);
        expect(listEl.lastElementChild.textContent).toBe("Item 3");

        // Clear all
        await items.clear();
        expect(items.length).toBe(0);
        expect(listEl.children.length).toBe(0);

        // Add again to ensure template is preserved
        await items.add({ name: "Final Item" });
        expect(items.length).toBe(1);
        expect(listEl.children.length).toBe(1);
        expect(listEl.firstElementChild.textContent).toBe("Final Item");

    });

    it('should correctly report array .length after initial hydration', () => {
        CuboMX.component("myComp", { items: [] });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <ul>
                    <li mx-item="items">Item 1</li>
                    <li mx-item="items">Item 2</li>
                    <li mx-item="items">Item 3</li>
                </ul>
            </div>
        `;
        CuboMX.start();

        // The main assertion
        expect(CuboMX.myComp.items.length).toBe(3);
    });

    it('should update length correctly through clear and add cycles', async () => {
        CuboMX.component("myComp", { items: [] });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <ul>
                    <li mx-item="items">Item 1</li>
                    <li mx-item="items">Item 2</li>
                </ul>
            </div>
        `;
        CuboMX.start();
        const items = CuboMX.myComp.items;

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
