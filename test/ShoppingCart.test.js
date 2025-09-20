import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Shopping Cart Integration Test", () => {
    const cartComponent = {
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

    beforeEach(() => {
        document.body.innerHTML = `
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
                        <tr id="item1">
                            <td ::text="description">Gaming Mouse</td>
                            <td>
                                <button class="sub">-</button>
                                <span ::text="qty">2</span>
                                <button class="add">+</button>
                            </td>
                            <td class="price" ::text:currency="price">$ 19</td>
                            <td class="total" ::text:currency="total">$ 38</td>
                        </tr>
                        <tr id="item2">
                            <td ::text="description">Gaming Keyboard</td>
                            <td>
                                <button class="sub">-</button>
                                <span ::text="qty">2</span>
                                <button class="add">+</button>
                            </td>
                            <td class="price" ::text:currency="price">$ 29</td>
                            <td class="total" ::text:currency="total">$ 58</td>
                        </tr>
                    </tbody>
                </table>
                <footer>TOTAL: <span id="grandTotal" :text:currency="total">$ 96</span></footer>
            </div>
        `;
        CuboMX.reset();
        CuboMX.component("cart", cartComponent);
    });

    it('should immediately re-format currency values on hydration', () => {
        // Use en-US for predictable formatting ($XX.XX)
        CuboMX.start({ locale: 'en-US', currency: 'USD' });

        const item1Price = document.querySelector('#item1 .price');
        const item1Total = document.querySelector('#item1 .total');
        const grandTotal = document.querySelector('#grandTotal');

        // Assert that values were parsed correctly into the state
        expect(CuboMX.cart.items[0].price).toBe(19);
        expect(CuboMX.cart.items[0].total).toBe(38);
        expect(CuboMX.cart.total).toBe(96);

        // Assert that DOM was immediately updated with the formatted value
        expect(item1Price.textContent).toBe('$19.00');
        expect(item1Total.textContent).toBe('$38.00');
        expect(grandTotal.textContent).toBe('$96.00');
    });

    it('should update item total and grand total upon quantity change', () => {
        CuboMX.start({ locale: 'en-US', currency: 'USD' });

        const item1AddBtn = document.querySelector('#item1 .add');
        const item1Qty = document.querySelector('#item1 span');
        const item1Total = document.querySelector('#item1 .total');
        const grandTotal = document.querySelector('#grandTotal');

        // Check initial state
        expect(item1Qty.textContent).toBe('2');
        expect(item1Total.textContent).toBe('$38.00');
        expect(grandTotal.textContent).toBe('$96.00');

        // --- Act ---
        // Monkey-patch the component methods to add the event listeners
        const item1Proxy = CuboMX.cart.items[0];
        item1AddBtn.addEventListener('click', () => CuboMX.cart.addUn(item1Proxy));
        item1AddBtn.click();

        // --- Assert ---
        // item1: qty becomes 3, price is 19, total becomes 57
        // item2: total is still 58
        // grand total: 57 + 58 = 115

        expect(item1Qty.textContent).toBe('3');
        expect(item1Total.textContent).toBe('$57.00');
        expect(grandTotal.textContent).toBe('$115.00');
    });
});
