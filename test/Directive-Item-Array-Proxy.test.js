import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

describe('Directive: mx-item Array Proxy', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const setupBasicList = () => {
        CuboMX.component('listManager', {
            items: [],
        });
        document.body.innerHTML = `
            <div mx-data="listManager">
                <ul id="item-list">
                    <li mx-item="items" ::data-id="id" data-id="1">
                        <span ::text="name">Item 1</span>
                    </li>
                    <li mx-item="items" ::data-id="id" data-id="2">
                        <span ::text="name">Item 2</span>
                    </li>
                </ul>
            </div>
        `;
    };

    it('should hydrate items and convert the target property into a proxy with methods', async () => {
        setupBasicList();
        CuboMX.start();
        await vi.runAllTimersAsync();

        const itemsProxy = CuboMX.listManager.items;

        // Assert initial hydration is correct
        expect(itemsProxy.length).toBe(2);
        expect(itemsProxy[0].name).toBe('Item 1');
        expect(itemsProxy[1].id).toBe(2);

        // Assert it has the new methods
        expect(typeof itemsProxy.add).toBe('function');
        expect(typeof itemsProxy.prepend).toBe('function');
        expect(typeof itemsProxy.insert).toBe('function');
        expect(typeof itemsProxy.delete).toBe('function');
    });

    it('should add a new item to the end of the list using add()', async () => {
        setupBasicList();
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Act
        CuboMX.listManager.items.add({ id: 3, name: 'Item 3' });
        await vi.runAllTimersAsync();

        // Assert DOM
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems).toHaveLength(3);
        expect(listItems[2].getAttribute('data-id')).toBe('3');
        expect(listItems[2].querySelector('span').textContent).toBe('Item 3');

        // Assert State
        const stateItems = CuboMX.listManager.items;
        expect(stateItems.length).toBe(3);
        expect(stateItems[2].name).toBe('Item 3');
    });

    it('should add a new item to the beginning of the list using prepend()', async () => {
        setupBasicList();
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Act
        CuboMX.listManager.items.prepend({ id: 0, name: 'Item 0' });
        await vi.runAllTimersAsync();

        // Assert DOM
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems).toHaveLength(3);
        expect(listItems[0].getAttribute('data-id')).toBe('0');
        expect(listItems[0].querySelector('span').textContent).toBe('Item 0');

        // Assert State
        const stateItems = CuboMX.listManager.items;
        expect(stateItems.length).toBe(3);
        expect(stateItems[0].name).toBe('Item 0');
    });

    it('should add a new item at a specific position using insert()', async () => {
        setupBasicList();
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Act
        CuboMX.listManager.items.insert({ id: '1.5', name: 'Item 1.5' }, 1);
        await vi.runAllTimersAsync();

        // Assert DOM
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems).toHaveLength(3);
        expect(listItems[1].getAttribute('data-id')).toBe('1.5');
        expect(listItems[1].querySelector('span').textContent).toBe('Item 1.5');

        // Assert State
        const stateItems = CuboMX.listManager.items;
        expect(stateItems.length).toBe(3);
        expect(stateItems[1].name).toBe('Item 1.5');
        expect(stateItems[0].name).toBe('Item 1');
        expect(stateItems[2].name).toBe('Item 2');
    });

    it('should remove an item from a specific position using delete()', async () => {
        setupBasicList();
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Initial state
        expect(document.querySelectorAll('#item-list li')).toHaveLength(2);
        expect(CuboMX.listManager.items.length).toBe(2);

        // Act
        CuboMX.listManager.items.delete(0);
        await vi.runAllTimersAsync();

        // Assert DOM
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems).toHaveLength(1);
        expect(listItems[0].getAttribute('data-id')).toBe('2'); // The second item is now the first

        // Assert State
        const stateItems = CuboMX.listManager.items;
        expect(stateItems.length).toBe(1);
        expect(stateItems[0].name).toBe('Item 2');
    });

    it('should create fully reactive items when using proxy methods', async () => {
        setupBasicList();
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Act: Add a new item
        CuboMX.listManager.items.add({ id: 99, name: 'Reactive Item' });
        await vi.runAllTimersAsync();

        // Assert length after add
        expect(CuboMX.listManager.items.length).toBe(3);

        // Get the newly added item from the state
        const newItem = CuboMX.listManager.items[2];
        expect(newItem.name).toBe('Reactive Item');

        // Act: Change a property on the new item
        newItem.name = 'Changed Reactively';

        // Assert: The DOM should update
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems[2].querySelector('span').textContent).toBe('Changed Reactively');
    });

    it('should handle multiple item arrays independently', async () => {
        CuboMX.component('manager', { users: [], products: [] });
        document.body.innerHTML = `
            <div mx-data="manager">
                <ul id="user-list">
                    <li mx-item="users" ::data-id="id" data-id="u1">
                        <span ::text="name">User 1</span>
                    </li>
                </ul>
                <ul id="product-list">
                    <li mx-item="products" ::data-id="id" data-id="p1">
                        <span ::text="name">Product 1</span>
                    </li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        // --- Test User List ---
        CuboMX.manager.users.add({ id: 'u2', name: 'User 2' });
        await vi.runAllTimersAsync();

        expect(document.querySelectorAll('#user-list li')).toHaveLength(2);
        expect(document.querySelectorAll('#product-list li')).toHaveLength(1);
        expect(CuboMX.manager.users.length).toBe(2);
        expect(CuboMX.manager.products.length).toBe(1);
        expect(CuboMX.manager.users[1].name).toBe('User 2');

        // --- Test Product List ---
        CuboMX.manager.products.prepend({ id: 'p0', name: 'Product 0' });
        await vi.runAllTimersAsync();

        expect(document.querySelectorAll('#user-list li')).toHaveLength(2);
        expect(document.querySelectorAll('#product-list li')).toHaveLength(2);
        expect(CuboMX.manager.users.length).toBe(2);
        expect(CuboMX.manager.products.length).toBe(2);
        expect(CuboMX.manager.products[0].name).toBe('Product 0');
    });

    it('should return undefined when trying to delete an out-of-bounds index', async () => {
        setupBasicList();
        CuboMX.start();
        await vi.runAllTimersAsync();

        const result = CuboMX.listManager.items.delete(99);
        await vi.runAllTimersAsync();

        expect(result).toBeUndefined();
        expect(document.querySelectorAll('#item-list li')).toHaveLength(2);
        expect(CuboMX.listManager.items.length).toBe(2);
    });
});
