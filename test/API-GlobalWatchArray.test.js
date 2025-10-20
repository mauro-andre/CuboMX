import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX.watchArrayItems() API", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    const setupComponent = () => {
        CuboMX.component("myComp", { items: [] });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <ul>
                    <li mx-item="items">Item 1</li>
                </ul>
            </div>
        `;
    };

    it("should call the callback when an item is added", async () => {
        setupComponent();
        const watcherSpy = vi.fn();
        CuboMX.watchArrayItems('myComp.items', watcherSpy);
        CuboMX.start();

        const newItem = await CuboMX.myComp.items.add({ name: "Item 2" });

        expect(watcherSpy).toHaveBeenCalledOnce();
        expect(watcherSpy).toHaveBeenCalledWith({
            type: 'add',
            item: newItem,
            index: 1,
            arrayName: 'items',
            componentName: 'myComp',
        });
    });

    it("should call the callback when an item is deleted", async () => {
        setupComponent();
        const watcherSpy = vi.fn();
        CuboMX.watchArrayItems('myComp.items', watcherSpy);
        CuboMX.start();

        const itemToDelete = CuboMX.myComp.items[0];
        await CuboMX.myComp.items.delete(0);

        expect(watcherSpy).toHaveBeenCalledOnce();
        expect(watcherSpy).toHaveBeenCalledWith({
            type: 'delete',
            item: itemToDelete,
            index: 0,
            arrayName: 'items',
            componentName: 'myComp',
        });
    });

    it("should call the callback when an item is updated", async () => {
        setupComponent();
        const watcherSpy = vi.fn();
        CuboMX.watchArrayItems('myComp.items', watcherSpy);
        CuboMX.start();

        const itemToUpdate = CuboMX.myComp.items[0];
        itemToUpdate.text = "Updated Name";

        // Wait for the update to process
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(watcherSpy).toHaveBeenCalledOnce();
        expect(watcherSpy).toHaveBeenCalledWith({
            type: 'update',
            item: itemToUpdate,
            index: 0,
            arrayName: 'items',
            componentName: 'myComp',
            propertyName: 'text',
            oldValue: 'Item 1',
            newValue: 'Updated Name',
        });
    });

    it("should call the callback when the array is cleared", async () => {
        setupComponent();
        const watcherSpy = vi.fn();
        CuboMX.watchArrayItems('myComp.items', watcherSpy);
        CuboMX.start();

        const clearedItems = [...CuboMX.myComp.items];
        await CuboMX.myComp.items.clear();

        expect(watcherSpy).toHaveBeenCalledOnce();
        expect(watcherSpy).toHaveBeenCalledWith({
            type: 'clear',
            clearedItems: clearedItems,
            arrayName: 'items',
            componentName: 'myComp',
        });
    });
});
