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

    it("should expose the composite item object as $item in mx-on events", () => {
        const itemSpy = vi.fn();
        CuboMX.component("cart", { 
            items: [],
            selectItem(item) {
                itemSpy(item);
            }
        });

        document.body.innerHTML = `
            <div mx-data="cart">
                <table>
                    <tr mx-item="items" ::data-id="id" data-id="prod-xyz">
                        <td ::text="name">Coolest Gadget</td>
                        <td>
                            <button mx-on:click="selectItem($item)">Select</button>
                        </td>
                    </tr>
                </table>
            </div>
        `;

        CuboMX.start();

        document.querySelector('button').click();

        expect(itemSpy).toHaveBeenCalledTimes(1);

        // Assert it was called with the complete, populated object
        const expectedItem = {
            id: "prod-xyz",
            name: "Coolest Gadget"
        };
        expect(itemSpy).toHaveBeenCalledWith(expect.objectContaining(expectedItem));
    });

    it('should build a comprehensive, fully reactive composite item', () => {
        CuboMX.component('product', { items: [] });
        document.body.innerHTML = `
            <div mx-data="product">
                <table>
                    <tbody>
                        <tr mx-item="items" ::data-id="id" data-id="PROD-123">
                            <td>
                                <button id="edit-btn" ::class="editBtnClass" class="btn">Edit</button>
                            </td>
                            <td id="desc" ::html="description">Initial <strong>HTML</strong></td>
                            <td id="status" ::text="statusText">Pending</td>
                            <td>
                                <div id="stock" ::class="stockIndicatorClass" class="text-green"></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        CuboMX.start();

        const item = CuboMX.product.items[0];
        const trEl = document.querySelector('tr');
        const btnEl = document.getElementById('edit-btn');
        const descEl = document.getElementById('desc');
        const statusEl = document.getElementById('status');
        const stockEl = document.getElementById('stock');

        // 1. --- Initial Hydration Assertions ---
        expect(item.id).toBe('PROD-123');
        expect(item.editBtnClass).toEqual(['btn']);
        expect(item.description).toBe('Initial <strong>HTML</strong>');
        expect(item.statusText).toBe('Pending');
        expect(item.stockIndicatorClass).toEqual(['text-green']);

        // 2. --- Reactivity Assertions (State -> DOM) ---

        // Test class reactivity (button)
        item.editBtnClass.push('btn-active');
        expect(btnEl.classList.contains('btn-active')).toBe(true);

        // Test class reactivity (stock)
        item.stockIndicatorClass.splice(0, 1, 'text-red');
        expect(stockEl.classList.contains('text-red')).toBe(true);
        expect(stockEl.classList.contains('text-green')).toBe(false);

        // Test HTML reactivity
        item.description = 'Updated <span>HTML</span>';
        expect(descEl.innerHTML).toBe('Updated <span>HTML</span>');

        // Test text reactivity
        item.statusText = 'Shipped';
        expect(statusEl.textContent).toBe('Shipped');

        // Test root element attribute reactivity
        item.id = 'PROD-456';
        expect(trEl.getAttribute('data-id')).toBe('PROD-456');
    });

    it('should handle boolean attributes and checked property within composite items', () => {
        CuboMX.component('formComp', { items: [] });
        document.body.innerHTML = `
            <div mx-data="formComp">
                <div mx-item="items">
                    <input id="check" type="checkbox" ::checked="isActive" checked />
                    <div id="status" ::is-valid="isValid" is-valid></div>
                    <div id="avail" ::is-available="isAvailable" is-available="true"></div>
                </div>
            </div>
        `;

        CuboMX.start();

        const item = CuboMX.formComp.items[0];
        const checkEl = document.getElementById('check');
        const statusEl = document.getElementById('status');
        const availEl = document.getElementById('avail');

        // 1. --- Initial Hydration Assertions ---
        expect(item.isActive).toBe(true);
        expect(item.isValid).toBe(true);
        expect(item.isAvailable).toBe(true);

        // 2. --- Reactivity Assertions (State -> DOM) ---

        // Test 'checked' property
        item.isActive = false;
        expect(checkEl.checked).toBe(false);

        // Test boolean attribute (presence)
        item.isValid = false;
        expect(statusEl.hasAttribute('is-valid')).toBe(false);
        item.isValid = true;
        expect(statusEl.hasAttribute('is-valid')).toBe(true);

        // Test boolean attribute (value)
        item.isAvailable = false;
        expect(availEl.hasAttribute('is-available')).toBe(false);
        item.isAvailable = true;
        expect(availEl.hasAttribute('is-available')).toBe(true);
    });

    it('should provide two-way data binding for value and checked within composite items', () => {
        CuboMX.component('formComp', { items: [] });
        document.body.innerHTML = `
            <div mx-data="formComp">
                <div mx-item="items">
                    <input id="text-input" type="text" ::value="name" value="Initial Name" />
                    <input id="check-input" type="checkbox" ::checked="agreed" />
                </div>
            </div>
        `;

        CuboMX.start();

        const item = CuboMX.formComp.items[0];
        const textInput = document.getElementById('text-input');
        const checkInput = document.getElementById('check-input');

        // 1. --- Initial Hydration (DOM -> State) ---
        expect(item.name).toBe('Initial Name');
        expect(item.agreed).toBe(false);

        // 2. --- Reactivity (State -> DOM) ---
        item.name = 'Set from JS';
        expect(textInput.value).toBe('Set from JS');
        item.agreed = true;
        expect(checkInput.checked).toBe(true);

        // 3. --- Reactivity (DOM -> State) ---
        textInput.value = 'Typed by user';
        textInput.dispatchEvent(new Event('input'));
        expect(item.name).toBe('Typed by user');

        checkInput.click(); // This will trigger a 'change' event
        expect(item.agreed).toBe(false);
    });
});
