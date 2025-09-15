import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX - Advanced Hydration", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it("should hydrate an array of primitive values using mx-array and mx-item", () => {
        CuboMX.component("product", {
            tags: null, // A propriedade começa como null para ser hidratada
            ratings: null,
        });

        document.body.innerHTML = `
            <div mx-data="product">
                <ul mx-array:product.tags>
                    <li mx-item="'new-arrival'"></li>
                    <li mx-item="'featured'"></li>
                </ul>
                <div mx-array:product.ratings>
                    <span mx-item="5"></span>
                    <span mx-item="4"></span>
                    <span mx-item="5"></span>
                </div>
            </div>
        `;

        CuboMX.start();

        // Verifica se os arrays foram populados corretamente
        expect(CuboMX.product.tags).toEqual(["new-arrival", "featured"]);
        expect(CuboMX.product.ratings).toEqual([5, 4, 5]);
    });

    it("should hydrate a simple object using mx-obj", () => {
        CuboMX.component("myProduct", {
            myDetails: null, // O objeto começa como null para ser hidratado
        });

        document.body.innerHTML = `
            <div mx-data="my-product">
                <div mx-obj:my-product.my-details 
                     mx-obj:id="123" 
                     mx-obj:sku="'ABC-XYZ'" 
                     mx-obj:is-active="true">
                </div>
            </div>
        `;

        CuboMX.start();

        const expected = { id: 123, sku: "ABC-XYZ", isActive: true };
        expect(CuboMX.myProduct.myDetails).toEqual(expected);
    });

    it("should hydrate an array of objects using mx-array, mx-item and mx-obj", () => {
        CuboMX.component("cart", { items: null });

        document.body.innerHTML = `
            <div mx-data="cart">
                <ul mx-array:cart.items>
                    <li mx-item mx-obj:id="1" mx-obj:name="'Product A'" mx-obj:quantity="2"></li>
                    <li mx-item mx-obj:id="2" mx-obj:name="'Product B'" mx-obj:quantity="1"></li>
                </ul>
            </div>
        `;

        CuboMX.start();

        const expected = [
            { id: 1, name: "Product A", quantity: 2 },
            { id: 2, name: "Product B", quantity: 1 },
        ];

        expect(CuboMX.cart.items).toEqual(expected);
    });

    it("should hydrate a primitive property using mx-prop", () => {
        CuboMX.component("cart", { userId: null });

        document.body.innerHTML = `
            <div mx-data="cart">
                <div mx-prop:cart.user-id="12345"></div>
            </div>
        `;

        CuboMX.start();

        expect(CuboMX.cart.userId).toBe(12345);
    });

    it("should expose an object item as $item in mx-on expressions", () => {
        const itemSpy = vi.fn();
        CuboMX.component("list", { items: [], handleItemClick: itemSpy });

        document.body.innerHTML = `
            <div mx-data="list">
                <ul mx-array:list.items>
                    <li mx-item mx-obj:id="1" mx-obj:name="'A'" mx-on:click="list.handleItemClick($item)"></li>
                    <li mx-item mx-obj:id="2" mx-obj:name="'B'" mx-on:click="list.handleItemClick($item)"></li>
                </ul>
            </div>
        `;

        CuboMX.start();

        const secondItem = document.querySelectorAll("li")[1];
        secondItem.click();

        expect(itemSpy).toHaveBeenCalledTimes(1);
        const expectedItemData = { id: 2, name: "B" };
        expect(itemSpy).toHaveBeenCalledWith(expectedItemData);
    });

    it("should expose a primitive item as $item in mx-on expressions", () => {
        const itemSpy = vi.fn();
        CuboMX.component("list", { tags: [], handleTagClick: itemSpy });

        document.body.innerHTML = `
            <div mx-data="list">
                <ul mx-array:list.tags>
                    <li mx-item="'new'" mx-on:click="list.handleTagClick($item)"></li>
                    <li mx-item="'featured'" mx-on:click="list.handleTagClick($item)"></li>
                </ul>
            </div>
        `;

        CuboMX.start();

        const firstItem = document.querySelector("li");
        firstItem.click();

        expect(itemSpy).toHaveBeenCalledTimes(1);
        expect(itemSpy).toHaveBeenCalledWith("new");
    });
});
