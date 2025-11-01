import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("mx-item Directive", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        // vi.restoreAllMocks();
    });

    it('should correctly destroy old items and create new ones after a swap', async () => {
        // 1. Initial Setup
        CuboMX.component('listComp', {
            items: []
        });

        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items" ::text="name">Item 1</li>
                    <li mx-item="items" ::text="name">Item 2</li>
                    <li mx-item="items" ::text="name">Item 3</li>
                    <li mx-item="items" ::text="name">Item 4</li>
                    <li mx-item="items" ::text="name">Item 5</li>
                </ul>
            </div>
        `;

        // 2. Initial Hydration and Assertion
        CuboMX.start();
        expect(CuboMX.listComp.items.length).toBe(5);
        expect(CuboMX.listComp.items[0].name).toBe('Item 1');

        // 3. The Swap Operation
        const newHtml = `
            <ul id="list">
                <li mx-item="items" ::text="name">New 1</li>
                <li mx-item="items" ::text="name">New 2</li>
                <li mx-item="items" ::text="name">New 3</li>
            </ul>
        `;

        CuboMX.swapHTML(newHtml, [{ select: '#list', target: '#list:outerHTML' }]);

        // Add a microtask delay to allow the MutationObserver to run
        await Promise.resolve();

        // 4. Final Assertion
        // The component's items array should now reflect the new reality.
        expect(CuboMX.listComp.items.length).toBe(3);
        expect(CuboMX.listComp.items[0].name).toBe('New 1');
    });

    it('should clear the state array when all item elements are removed', async () => {
        // 1. Initial Setup
        CuboMX.component('listComp', {
            items: []
        });

        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul id="list">
                    <li mx-item="items">Item 1</li>
                    <li mx-item="items">Item 2</li>
                </ul>
            </div>
        `;

        // 2. Initial Hydration and Assertion
        CuboMX.start();
        expect(CuboMX.listComp.items.length).toBe(2);

        // 3. The Swap Operation to an empty list
        const newHtml = '<ul id="list"></ul>';
        CuboMX.swapHTML(newHtml, [{ select: '#list', target: '#list:outerHTML' }]);

        // Add a microtask delay to allow the MutationObserver to run
        await Promise.resolve();

        // 4. Final Assertion
        expect(CuboMX.listComp.items.length).toBe(0);
    });
});
