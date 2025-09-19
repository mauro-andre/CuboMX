import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX - Composite Item Hydration (`mx-item` v2)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it("should hydrate a composite object into a local array using mx-item:", () => {
        CuboMX.component("cart", { items: [] });
        document.body.innerHTML = `
            <div mx-data="cart">
                <table>
                    <tr mx-item="items" mx-item:data-id="id" data-id="prod-123">
                        <td mx-item:text="name">Cool Mouse</td>
                        <td mx-item:text="price">$99.99</td>
                    </tr>
                </table>
            </div>
        `;

        CuboMX.start();

        expect(CuboMX.cart.items).toHaveLength(1);
        const item = CuboMX.cart.items[0];
        expect(item.id).toBe("prod-123");
        expect(item.name).toBe("Cool Mouse");
        expect(item.price).toBe("$99.99");
    });

    it("should hydrate multiple composite objects into a global array", () => {
        CuboMX.store("globalCart", { products: [] });
        document.body.innerHTML = `
            <div mx-data="dummy">
                <table>
                    <tr mx-item="$globalCart.products" mx-item:data-sku="sku" data-sku="A1">
                        <td mx-item:text="description">First Item</td>
                    </tr>
                    <tr mx-item="$globalCart.products" mx-item:data-sku="sku" data-sku="B2">
                        <td mx-item:text="description">Second Item</td>
                    </tr>
                </table>
            </div>
        `;
        CuboMX.component("dummy", {});
        CuboMX.start();

        const products = CuboMX.globalCart.products;
        expect(products).toHaveLength(2);
        expect(products[0].sku).toBe("A1");
        expect(products[0].description).toBe("First Item");
        expect(products[1].sku).toBe("B2");
        expect(products[1].description).toBe("Second Item");
    });

    it("should hydrate a composite object using the :: shorthand", () => {
        CuboMX.component("cart", { items: [] });
        document.body.innerHTML = `
            <div mx-data="cart">
                <table>
                    <tr mx-item="items" ::data-id="id" data-id="prod-abc">
                        <td ::text="name">Cool Keyboard</td>
                        <td ::text="price">$150.00</td>
                    </tr>
                </table>
            </div>
        `;

        CuboMX.start();

        expect(CuboMX.cart.items).toHaveLength(1);
        const item = CuboMX.cart.items[0];
        expect(item.id).toBe("prod-abc");
        expect(item.name).toBe("Cool Keyboard");
        expect(item.price).toBe("$150.00");
    });

    it("should do nothing if :: is used without a parent mx-item", () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        CuboMX.component("myComp", { name: 'Initial' });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <span ::text="name">This should not bind</span>
            </div>
        `;

        CuboMX.start();

        expect(CuboMX.myComp.name).toBe('Initial');
        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("should correctly parse values for numbers and booleans", () => {
        CuboMX.component("productSpec", { specs: [] });
        document.body.innerHTML = `
            <div mx-data="productSpec">
                <ul>
                    <li mx-item="specs" ::data-id="id" data-id="123">
                        <span ::data-stock="stock" data-stock="500"></span>
                        <span ::data-available="available" data-available="true"></span>
                    </li>
                </ul>
            </div>
        `;

        CuboMX.start();

        expect(CuboMX.productSpec.specs).toHaveLength(1);
        const spec = CuboMX.productSpec.specs[0];
        expect(spec.id).toBe(123);
        expect(spec.stock).toBe(500);
        expect(spec.available).toBe(true);
    });
});
