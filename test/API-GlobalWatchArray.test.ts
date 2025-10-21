import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX, MxComponent, ItemArrayProxy, ItemProxy, MxArrayMutation } from "../src/CuboMX.js";

interface TestItem extends ItemProxy<TestComponent> {
    name: string;
}

class TestComponent extends MxComponent {
    items!: ItemArrayProxy<TestItem>;
}

describe("CuboMX.watchArrayItems() API (TS)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    const setupComponent = () => {
        CuboMX.component("myComp", () => new TestComponent());
        document.body.innerHTML = `
            <div mx-data="myComp()" mx-ref="instance">
                <ul>
                    <li mx-item="items" ::text="name">Item 1</li>
                </ul>
            </div>
        `;
    };

    it("should receive a correctly typed mutation object", async () => {
        setupComponent();
        const watcherSpy = vi.fn();

        // The generic here ensures the mutation object is strongly typed
        CuboMX.watchArrayItems<TestItem>('instance.items', watcherSpy);
        CuboMX.start();

        const comp = CuboMX.instance as TestComponent;
        const newItem = await comp.items.add({ name: "Item 2" });

        expect(watcherSpy).toHaveBeenCalledOnce();
        const mutation: MxArrayMutation<TestItem> = watcherSpy.mock.calls[0][0];

        expect(mutation.type).toBe('add');
        
        // Type-safe access to properties based on the type
        if (mutation.type === 'add') {
            expect(mutation.item.name).toBe("Item 2");
            expect(mutation.item).toBe(newItem);
        }
    });
});
