import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CuboMX, MxComponent, ItemArrayProxy, ItemProxy, SubArrayProxy } from '../src/CuboMX.js';

interface SubItem extends ItemProxy {
    id: number;
    name: string;
    tags: SubArrayProxy<string>; // SubArrayProxy for reactive sub-arrays
    categories?: SubArrayProxy<string>; // Optional for some tests
}

class ListManagerComponent extends MxComponent {
    items!: ItemArrayProxy<SubItem>;
}

describe('Directive: mx-item Sub-Array Reactivity (TS)', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const setupComponent = async () => {
        CuboMX.component('listManager', () => new ListManagerComponent());
        document.body.innerHTML = `
            <div mx-data="listManager()" mx-ref="listManagerInstance">
                <ul id="item-list">
                    <li mx-item="items" ::data-id="id" data-id="1">
                        <h2 ::text="name">Item 1</h2>
                        <div class="tags">
                            <span ::text.array="tags">TagA</span>
                            <span ::text.array="tags">TagB</span>
                        </div>
                    </li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync(); // Ensure initial hydration is complete
        return (CuboMX.listManagerInstance as ListManagerComponent).items[0];
    };

    it('should add a new element to the DOM when push() is called on a sub-array', async () => {
        const item = await setupComponent();

        expect(item.tags).toEqual(['TagA', 'TagB']);
        let tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(2);

        // Act: Mutate the sub-array
        item.tags.push('TagC');
        await vi.runAllTimersAsync(); // Allow DOM mutations to process

        // Assert: DOM should reflect the change
        tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(3);
        expect(tagElements[2].textContent).toBe('TagC');
        expect(item.tags).toEqual(['TagA', 'TagB', 'TagC']);
    });

    it('should remove an element from the DOM when pop() is called on a sub-array', async () => {
        const item = await setupComponent();

        expect(item.tags).toEqual(['TagA', 'TagB']);
        let tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(2);

        // Act: Mutate the sub-array
        item.tags.pop();
        await vi.runAllTimersAsync();

        // Assert: DOM should reflect the change
        tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(1);
        expect(tagElements[0].textContent).toBe('TagA');
        expect(item.tags).toEqual(['TagA']);
    });

    it('should update DOM elements when splice() is called on a sub-array (remove and add)', async () => {
        const item = await setupComponent();

        expect(item.tags).toEqual(['TagA', 'TagB']);
        let tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(2);

        // Act: Mutate the sub-array (replace TagA with TagX, add TagY)
        item.tags.splice(0, 1, 'TagX', 'TagY');
        await vi.runAllTimersAsync();

        // Assert: DOM should reflect the change
        tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(3);
        expect(tagElements[0].textContent).toBe('TagX');
        expect(tagElements[1].textContent).toBe('TagY');
        expect(tagElements[2].textContent).toBe('TagB');
        expect(item.tags).toEqual(['TagX', 'TagY', 'TagB']);
    });

    it('should clear all elements from the DOM when the sub-array is cleared', async () => {
        const item = await setupComponent();

        expect(item.tags).toEqual(['TagA', 'TagB']);
        let tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(2);

        // Act: Mutate the sub-array
        item.tags.length = 0; // Clear array
        await vi.runAllTimersAsync();

        // Assert: DOM should reflect the change
        tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(0);
        expect(item.tags).toEqual([]);
    });

    it('should handle multiple sub-array properties independently within the same item', async () => {
        class MultiSubArrayComponent extends MxComponent {
            items!: ItemArrayProxy<SubItem>;
        }

        CuboMX.component('listManager', () => new MultiSubArrayComponent());
        document.body.innerHTML = `
            <div mx-data="listManager()" mx-ref="listManagerInstance">
                <ul id="item-list">
                    <li mx-item="items" ::data-id="id" data-id="1">
                        <h2 ::text="name">Item 1</h2>
                        <div class="tags">
                            <span ::text.array="tags">TagA</span>
                        </div>
                        <div class="categories">
                            <b ::text.array="categories">CatX</b>
                        </div>
                    </li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();
        const item = (CuboMX.listManagerInstance as MultiSubArrayComponent).items[0];

        expect(item.tags).toEqual(['TagA']);
        expect(item.categories).toEqual(['CatX']);

        // Mutate tags
        item.tags.push('TagB');
        await vi.runAllTimersAsync();
        let tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(2);
        expect(tagElements[1].textContent).toBe('TagB');
        expect(item.categories).toEqual(['CatX']); // Categories should be unaffected

        // Mutate categories
        item.categories!.pop(); // Use ! because categories is optional
        item.categories!.push('CatY', 'CatZ');
        await vi.runAllTimersAsync();
        let categoryElements = document.querySelectorAll('#item-list li:first-child .categories b');
        expect(categoryElements).toHaveLength(2);
        expect(categoryElements[0].textContent).toBe('CatY');
        expect(categoryElements[1].textContent).toBe('CatZ');
        expect(item.tags).toEqual(['TagA', 'TagB']); // Tags should be unaffected
    });

    it('should convert plain array assignment to reactive SubArrayProxy', async () => {
        const item = await setupComponent();

        expect(item.tags).toEqual(['TagA', 'TagB']);

        // Act: Assign a plain array directly
        item.tags = ['NewTag1', 'NewTag2', 'NewTag3'] as SubArrayProxy<string>;
        await vi.runAllTimersAsync();

        // Assert: DOM should reflect the new array
        let tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(3);
        expect(tagElements[0].textContent).toBe('NewTag1');
        expect(tagElements[1].textContent).toBe('NewTag2');
        expect(tagElements[2].textContent).toBe('NewTag3');

        // Act: Mutate the assigned array
        item.tags.push('NewTag4');
        await vi.runAllTimersAsync();

        // Assert: Should still be reactive
        tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(4);
        expect(tagElements[3].textContent).toBe('NewTag4');
    });

    it('should convert SubArrayProxy to plain array with toArray() method', async () => {
        const item = await setupComponent();

        expect(item.tags).toEqual(['TagA', 'TagB']);

        // Act: Convert to plain array
        const plainArray = item.tags.toArray();

        // Assert: Should be a plain array (not a proxy)
        expect(Array.isArray(plainArray)).toBe(true);
        expect(plainArray).toEqual(['TagA', 'TagB']);
        expect(plainArray === item.tags).toBe(false); // Different reference

        // Act: Mutate the plain array
        plainArray.push('TagC');

        // Assert: Original proxy and DOM should NOT be affected
        expect(plainArray).toEqual(['TagA', 'TagB', 'TagC']);
        expect(item.tags).toEqual(['TagA', 'TagB']); // Unchanged

        let tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(2); // DOM unchanged

        // Act: Mutate the original proxy
        item.tags.push('TagD');
        await vi.runAllTimersAsync();

        // Assert: Proxy and DOM updated, plain array unchanged
        expect(item.tags).toEqual(['TagA', 'TagB', 'TagD']);
        expect(plainArray).toEqual(['TagA', 'TagB', 'TagC']); // Still unchanged

        tagElements = document.querySelectorAll('#item-list li:first-child .tags span');
        expect(tagElements).toHaveLength(3);
    });
});
