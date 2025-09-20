import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Singleton Component Lifecycle", () => {
    // This is the component definition, as a plain object for a singleton
    const cartSingleton = {
        items: [],
        total: null,

        addUn(item) {
            item.qty += 1;
            this.calcTotal(item);
        },

        subUn(item) {
            if (item.qty > 0) {
                item.qty -= 1;
                this.calcTotal(item);
            }
        },

        calcTotal(item) {
            if (item) {
                item.total = item.qty * item.price;
            }
            this.total = this.items.reduce((accumulator, currentItem) => {
                return accumulator + (currentItem.total || 0);
            }, 0);
        },
    };

    const cartHtml = `
        <div mx-data="cart">
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr id="item1" mx-item="items">
                        <td ::text="description">Gaming Mouse</td>
                        <td>
                            <button class="sub" mx-on:click="subUn($item)">-</button>
                            <span ::text="qty">2</span>
                            <button class="add" mx-on:click="addUn($item)">+</button>
                        </td>
                        <td class="price" ::text:currency="price">$ 19</td>
                        <td class="total" ::text:currency="total">$ 38</td>
                    </tr>
                    <tr id="item2" mx-item="items">
                        <td ::text="description">Gaming Keyboard</td>
                        <td>
                            <button class="sub" mx-on:click="subUn($item)">-</button>
                            <span ::text="qty">2</span>
                            <button class="add" mx-on:click="addUn($item)">+</button>
                        </td>
                        <td class="price" ::text:currency="price">$ 29</td>
                        <td class="total" ::text:currency="total">$ 58</td>
                    </tr>
                </tbody>
            </table>
            <footer>TOTAL: <span id="grandTotal" :text:currency="total">$ 96</span></footer>
        </div>
    `;

    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = cartHtml;
        CuboMX.reset();
        // Registering as a singleton
        CuboMX.component("cart", cartSingleton);
    });

    it('should be destroyed on DOM removal and re-initialized on DOM insertion', async () => {
        CuboMX.start({ locale: 'en-US', currency: 'USD' });

        // 1. Initial state check
        expect(CuboMX.cart).toBeDefined();
        expect(CuboMX.cart.items).toHaveLength(2);

        // 2. Remove the component from the DOM
        const cartElement = document.querySelector('[mx-data="cart"]');
        cartElement.remove();

        // Wait for MutationObserver to process the removal
        await vi.runAllTimersAsync();

        // 3. Assert that the component instance was destroyed
        expect(CuboMX.cart).toBeUndefined();

        // 4. Re-add the component to the DOM
        document.body.innerHTML = cartHtml;

        // Wait for MutationObserver to process the addition
        await vi.runAllTimersAsync();

        // 5. Assert that the component was re-initialized
        expect(CuboMX.cart).toBeDefined();
        expect(CuboMX.cart.items).toHaveLength(2);
        expect(CuboMX.cart.total).toBe(96);
    });
});
