import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX, MxComponent } from "../src-refactor/cubomx";

describe("Directive mx-item with Singleton", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should hydrate a simple array of objects", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <ul>
                    <li mx-item="items" ::data-id="id" data-id="1">
                        <span ::text="name">Item 1</span>
                    </li>
                    <li mx-item="items" ::data-id="id" data-id="2">
                        <span ::text="name">Item 2</span>
                    </li>
                </ul>
            </div>
        `;

        const listComponent = {
            items: [],
        };

        CuboMX.component("listComponent", listComponent);
        CuboMX.start();

        const items = CuboMX.listComponent.items;
        expect(items).toBeInstanceOf(Array);
        expect(items.length).toBe(2);
        expect(items[0].id).toBe(1);
        expect(items[0].name).toBe("Item 1");
        expect(items[1].id).toBe(2);
        expect(items[1].name).toBe("Item 2");
    });

    it("should parse various data types for item properties", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <ul>
                    <li mx-item="items"
                        ::data-id="id" data-id="10"
                        ::data-active="active" data-active="true"
                        ::data-price="price" data-price="99.99"
                        >
                        <span ::text="name">First Item</span>
                    </li>
                </ul>
            </div>
        `;

        const listComponent = {
            items: [],
        };

        CuboMX.component("listComponent", listComponent);
        CuboMX.start();

        const item = CuboMX.listComponent.items[0];
        expect(item.name).toBe("First Item");
        expect(item.id).toBe(10);
        expect(item.active).toBe(true);
        expect(item.price).toBe(99.99);
    });

    it("should handle multiple item properties on the same element", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <ul>
                    <li mx-item="items" 
                        ::data-id="id" data-id="1"
                        ::data-sku="sku" data-sku="A-123"
                        ::text="name">
                        My Product
                    </li>
                </ul>
            </div>
        `;

        const listComponent = {
            items: [],
        };

        CuboMX.component("listComponent", listComponent);
        CuboMX.start();

        const item = CuboMX.listComponent.items[0];
        expect(item.id).toBe(1);
        expect(item.sku).toBe("A-123");
        expect(item.name).toBe("My Product");
    });
});

describe("Directive mx-item with Class Component", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should hydrate items into a class component property", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <ul>
                    <li mx-item="items" ::data-id="id" data-id="101" ::text="name">Class Item</li>
                </ul>
            </div>
        `;

        class ListComponent extends MxComponent {
            items: any[] = [];
        }

        CuboMX.component("listComponent", new ListComponent());
        CuboMX.start();

        const items = CuboMX.listComponent.items;
        expect(items).toBeInstanceOf(Array);
        expect(items.length).toBe(1);
        expect(items[0].id).toBe(101);
        expect(items[0].name).toBe("Class Item");
    });
});

describe("Directive mx-item with Global Store", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should hydrate items into a global store array", () => {
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <ul>
                    <li mx-item="$myStore.items" ::data-id="id" data-id="202">
                        <span ::text="name">Store Item</span>
                    </li>
                </ul>
            </div>
        `;

        const myStore = {
            items: [],
        };
        const myComponent = {};

        CuboMX.store("myStore", myStore);
        CuboMX.component("myComponent", myComponent);
        CuboMX.start();

        const items = CuboMX.myStore.items;
        expect(items).toBeInstanceOf(Array);
        expect(items.length).toBe(1);
        expect(items[0].id).toBe(202);
        expect(items[0].name).toBe("Store Item");
    });
});
