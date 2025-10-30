import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CuboMX, MxComponent, ItemArrayProxy, ItemProxy } from '../src/CuboMX.js';

// Type definitions for components and items
interface TestItem extends ItemProxy {
    id: number | string;
    name: string;
}

class ListManagerComponent extends MxComponent {
    items!: ItemArrayProxy<TestItem>;
}

class ManagerComponent extends MxComponent {
    users!: ItemArrayProxy<TestItem>;
    products!: ItemArrayProxy<TestItem>;
}

class OuterComponent extends MxComponent {
    items!: ItemArrayProxy<TestItem>;
}

class InnerComponent extends MxComponent {
    items!: ItemArrayProxy<TestItem>;
}


describe('Directive: mx-item Array Proxy (TS)', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
    });

    const setupBasicList = () => {
        CuboMX.component('listManager', () => new ListManagerComponent());
        document.body.innerHTML = `
            <div mx-data="listManager()" mx-ref="listManager">
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

        const itemsProxy = (CuboMX.listManager as ListManagerComponent).items;

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

        // Act
        await (CuboMX.listManager as ListManagerComponent).items.add({ id: 3, name: 'Item 3' });

        // Assert DOM
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems).toHaveLength(3);
        expect(listItems[2].getAttribute('data-id')).toBe('3');
        expect(listItems[2].querySelector('span')!.textContent).toBe('Item 3');

        // Assert State
        const stateItems = (CuboMX.listManager as ListManagerComponent).items;
        expect(stateItems.length).toBe(3);
        expect(stateItems[2].name).toBe('Item 3');
    });

    it('should add a new item to the beginning of the list using prepend()', async () => {
        setupBasicList();
        CuboMX.start();

        // Act
        await (CuboMX.listManager as ListManagerComponent).items.prepend({ id: 0, name: 'Item 0' });

        // Assert DOM
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems).toHaveLength(3);
        expect(listItems[0].getAttribute('data-id')).toBe('0');
        expect(listItems[0].querySelector('span')!.textContent).toBe('Item 0');

        // Assert State
        const stateItems = (CuboMX.listManager as ListManagerComponent).items;
        expect(stateItems.length).toBe(3);
        expect(stateItems[0].name).toBe('Item 0');
    });

    it('should add a new item at a specific position using insert()', async () => {
        setupBasicList();
        CuboMX.start();

        // Act
        await (CuboMX.listManager as ListManagerComponent).items.insert({ id: '1.5', name: 'Item 1.5' }, 1);

        // Assert DOM
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems).toHaveLength(3);
        expect(listItems[1].getAttribute('data-id')).toBe('1.5');
        expect(listItems[1].querySelector('span')!.textContent).toBe('Item 1.5');

        // Assert State
        const stateItems = (CuboMX.listManager as ListManagerComponent).items;
        expect(stateItems.length).toBe(3);
        expect(stateItems[1].name).toBe('Item 1.5');
        expect(stateItems[0].name).toBe('Item 1');
        expect(stateItems[2].name).toBe('Item 2');
    });

    it('should remove an item from a specific position using delete()', async () => {
        setupBasicList();
        CuboMX.start();

        const items = (CuboMX.listManager as ListManagerComponent).items;
        // Initial state
        expect(document.querySelectorAll('#item-list li')).toHaveLength(2);
        expect(items.length).toBe(2);

        // Act
        await items.delete(0);

        // Assert DOM
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems).toHaveLength(1);
        expect(listItems[0].getAttribute('data-id')).toBe('2'); // The second item is now the first

        // Assert State
        expect(items.length).toBe(1);
        expect(items[0].name).toBe('Item 2');
    });

    it('should create fully reactive items when using proxy methods', async () => {
        setupBasicList();
        CuboMX.start();

        const items = (CuboMX.listManager as ListManagerComponent).items;

        // Act: Add a new item
        await items.add({ id: 99, name: 'Reactive Item' });

        // Assert length after add
        expect(items.length).toBe(3);

        // Get the newly added item from the state
        const newItem = items[2];
        expect(newItem.name).toBe('Reactive Item');

        // Act: Change a property on the new item
        newItem.name = 'Changed Reactively';

        // Assert: The DOM should update after a tick
        await new Promise(resolve => setTimeout(resolve, 0));
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems[2].querySelector('span')!.textContent).toBe('Changed Reactively');
    });

    it('should handle multiple item arrays independently', async () => {
        CuboMX.component('manager', () => new ManagerComponent());
        document.body.innerHTML = `
            <div mx-data="manager()" mx-ref="manager">
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

        const manager = CuboMX.manager as ManagerComponent;

        // --- Test User List ---
        await manager.users.add({ id: 'u2', name: 'User 2' });

        expect(document.querySelectorAll('#user-list li')).toHaveLength(2);
        expect(document.querySelectorAll('#product-list li')).toHaveLength(1);
        expect(manager.users.length).toBe(2);
        expect(manager.products.length).toBe(1);
        expect(manager.users[1].name).toBe('User 2');

        // --- Test Product List ---
        await manager.products.prepend({ id: 'p0', name: 'Product 0' });

        expect(document.querySelectorAll('#user-list li')).toHaveLength(2);
        expect(document.querySelectorAll('#product-list li')).toHaveLength(2);
        expect(manager.users.length).toBe(2);
        expect(manager.products.length).toBe(2);
        expect(manager.products[0].name).toBe('Product 0');
    });

    it('should return null when trying to delete an out-of-bounds index', async () => {
        setupBasicList();
        CuboMX.start();

        const result = await (CuboMX.listManager as ListManagerComponent).items.delete(99);

        expect(result).toBeNull();
        expect(document.querySelectorAll('#item-list li')).toHaveLength(2);
        expect((CuboMX.listManager as ListManagerComponent).items.length).toBe(2);
    });

    it('should remove an item from the list by its object reference using remove()', async () => {
        setupBasicList();
        CuboMX.start();

        const items = (CuboMX.listManager as ListManagerComponent).items;
        const itemToRemove = items[0];
        expect(document.querySelectorAll('#item-list li')).toHaveLength(2);
        expect(items.length).toBe(2);

        // Act
        const deletedItem = await items.remove(itemToRemove);

        // Assert DOM
        const listItems = document.querySelectorAll('#item-list li');
        expect(listItems).toHaveLength(1);
        expect(listItems[0].getAttribute('data-id')).toBe('2'); // The second item is now the first

        // Assert State
        expect(items.length).toBe(1);
        expect(items[0].name).toBe('Item 2');

        // Assert return value
        expect(deletedItem).toBe(itemToRemove);
    });
});

describe('Directive: mx-item Array Proxy with Nested Components (TS)', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();

        // Outer component is a singleton
        CuboMX.component('outerComp', new OuterComponent());
        // Inner component is a factory to get its own instance
        CuboMX.component('innerComp', () => new InnerComponent());
        document.body.innerHTML = `
            <div mx-data="outerComp">
                <div mx-data="innerComp()" mx-ref="inner">
                    <ul id="nested-item-list">
                        <li mx-item="items" ::data-id="id" data-id="nested-1">
                            <span ::text="name">Nested Item 1</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;
        CuboMX.start();
    });

    it('should hydrate items into the nearest component scope (inner)', async () => {
        const outerItems = (CuboMX.outerComp as OuterComponent).items; // Access singleton by name
        const innerItems = (CuboMX.inner as InnerComponent).items;   // Access factory by ref

        // Assert that the item was added to the inner component's array
        expect(innerItems.length).toBe(1);
        expect(innerItems[0].name).toBe('Nested Item 1');
        expect(innerItems[0].id).toBe('nested-1');

        // Assert that the outer component's array was NOT affected
        expect(outerItems).toBeFalsy(); // It's not even initialized as a proxy

        // Assert proxy methods exist on the correct array
        expect(typeof innerItems.add).toBe('function');
    });

    it('should add a new item to the inner component list using add()', async () => {
        const inner = CuboMX.inner as InnerComponent;
        const outer = CuboMX.outerComp as OuterComponent;

        // Act
        await inner.items.add({ id: 'nested-2', name: 'Nested Item 2' });

        // Assert DOM
        const listItems = document.querySelectorAll('#nested-item-list li');
        expect(listItems).toHaveLength(2);
        expect(listItems[1].getAttribute('data-id')).toBe('nested-2');
        expect(listItems[1].querySelector('span')!.textContent).toBe('Nested Item 2');

        // Assert State
        expect(inner.items.length).toBe(2);
        expect(inner.items[1].name).toBe('Nested Item 2');
        expect(outer.items).toBeFalsy(); // Outer scope remains untouched
    });

    it('should remove an item from the inner component list using delete()', async () => {
        const inner = CuboMX.inner as InnerComponent;
        const outer = CuboMX.outerComp as OuterComponent;

        // Initial state
        expect(document.querySelectorAll('#nested-item-list li')).toHaveLength(1);
        expect(inner.items.length).toBe(1);

        // Act
        await inner.items.delete(0);

        // Assert DOM
        const listItems = document.querySelectorAll('#nested-item-list li');
        expect(listItems).toHaveLength(0);

        // Assert State
        expect(inner.items.length).toBe(0);
        expect(outer.items).toBeFalsy(); // Outer scope remains untouched
    });
});