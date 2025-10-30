import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

describe('CuboMX - $watchArrayItems', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const setupComponentWithArray = () => {
        CuboMX.component('listManager', {
            items: [],
            mutationSpy: vi.fn(),
            init() {
                this.$watchArrayItems('items', this.mutationSpy);
            },
        });
        document.body.innerHTML = `
            <div mx-data="listManager">
                <ul id="item-list">
                    <li mx-item="items" ::data-id="id" data-id="1">
                        <span ::text="name">Item 1</span>
                    </li>
                </ul>
            </div>
        `;
    };

    it('should call the mutation callback for `add` operations', async () => {
        setupComponentWithArray();
        CuboMX.start();
        await vi.runAllTimersAsync();

        const initialItem = CuboMX.listManager.items[0];
        expect(CuboMX.listManager.mutationSpy).not.toHaveBeenCalled();

        const newItemData = { id: 2, name: 'Item 2' };
        CuboMX.listManager.items.add(newItemData);
        await vi.runAllTimersAsync();

        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(1);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledWith({
            type: 'add',
            item: expect.objectContaining(newItemData),
            index: 1,
            arrayName: 'items',
            componentName: 'listManager',
        });

        // Verify the item is actually in the array and reactive
        expect(CuboMX.listManager.items).toHaveLength(2);
        expect(CuboMX.listManager.items[1].name).toBe('Item 2');
    });

    it('should call the mutation callback for `prepend` operations', async () => {
        setupComponentWithArray();
        CuboMX.start();
        await vi.runAllTimersAsync();

        CuboMX.listManager.mutationSpy.mockClear(); // Clear initial calls if any

        const newItemData = { id: 0, name: 'Item 0' };
        CuboMX.listManager.items.prepend(newItemData);
        await vi.runAllTimersAsync();

        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(1);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledWith({
            type: 'prepend',
            item: expect.objectContaining(newItemData),
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
        });

        expect(CuboMX.listManager.items).toHaveLength(2);
        expect(CuboMX.listManager.items[0].name).toBe('Item 0');
    });

    it('should call the mutation callback for `insert` operations', async () => {
        setupComponentWithArray();
        CuboMX.start();
        await vi.runAllTimersAsync();

        CuboMX.listManager.mutationSpy.mockClear();

        const newItemData = { id: 1.5, name: 'Item 1.5' };
        CuboMX.listManager.items.insert(newItemData, 1);
        await vi.runAllTimersAsync();

        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(1);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledWith({
            type: 'insert',
            item: expect.objectContaining(newItemData),
            index: 1,
            arrayName: 'items',
            componentName: 'listManager',
        });

        expect(CuboMX.listManager.items).toHaveLength(2);
        expect(CuboMX.listManager.items[1].name).toBe('Item 1.5');
    });

    it('should call the mutation callback for `delete` operations', async () => {
        setupComponentWithArray();
        CuboMX.start();
        await vi.runAllTimersAsync();

        CuboMX.listManager.mutationSpy.mockClear();

        const itemToDelete = CuboMX.listManager.items[0];
        CuboMX.listManager.items.delete(0);
        await vi.runAllTimersAsync();

        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(1);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledWith({
            type: 'delete',
            item: expect.objectContaining({ id: 1, name: 'Item 1' }), // The item object before removal
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
        });

        expect(CuboMX.listManager.items).toHaveLength(0);
    });

    it('should call the mutation callback for `update` operations when an item property changes', async () => {
        setupComponentWithArray();
        CuboMX.start();
        await vi.runAllTimersAsync();

        CuboMX.listManager.mutationSpy.mockClear();

        const itemToUpdate = CuboMX.listManager.items[0];
        itemToUpdate.name = 'Updated Item 1'; // Change a property of an existing item
        await vi.runAllTimersAsync();

        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(1);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledWith({
            type: 'update',
            item: expect.objectContaining({ id: 1, name: 'Updated Item 1' }),
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
            propertyName: 'name',
            oldValue: 'Item 1',
            newValue: 'Updated Item 1',
        });

        expect(CuboMX.listManager.items[0].name).toBe('Updated Item 1');
        expect(document.querySelector('#item-list li span').textContent).toBe('Updated Item 1');
    });

    it('should handle multiple array mutations and call callbacks correctly', async () => {
        setupComponentWithArray();
        CuboMX.start();
        await vi.runAllTimersAsync();

        CuboMX.listManager.mutationSpy.mockClear();

        // Add
        CuboMX.listManager.items.add({ id: 2, name: 'Item 2' });
        await vi.runAllTimersAsync();
        // Prepend
        CuboMX.listManager.items.prepend({ id: 0, name: 'Item 0' });
        await vi.runAllTimersAsync();
        // Delete
        CuboMX.listManager.items.delete(1); // Deletes original Item 1
        await vi.runAllTimersAsync();

        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(3);

        // Check specific calls
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'add', item: expect.objectContaining({ id: 2 }) }));
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: 'prepend', item: expect.objectContaining({ id: 0 }) }));
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(3, expect.objectContaining({ type: 'delete', item: expect.objectContaining({ id: 1 }) }));

        expect(CuboMX.listManager.items).toHaveLength(2);
        expect(CuboMX.listManager.items[0].id).toBe(0);
        expect(CuboMX.listManager.items[1].id).toBe(2);
    });

    it('should allow watching different arrays in the same component', async () => {
        const userMutationSpy = vi.fn();
        const productMutationSpy = vi.fn();

        CuboMX.component('multiListManager', {
            users: [],
            products: [],
            init() {
                this.userMutationSpy = userMutationSpy;
                this.productMutationSpy = productMutationSpy;
                this.$watchArrayItems('users', this.userMutationSpy);
                this.$watchArrayItems('products', this.productMutationSpy);
            },
        });
        document.body.innerHTML = `
            <div mx-data="multiListManager">
                <ul id="user-list">
                    <li mx-item="users" ::data-id="id" data-id="u1"></li>
                </ul>
                <ul id="product-list">
                    <li mx-item="products" ::data-id="id" data-id="p1"></li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        CuboMX.multiListManager.userMutationSpy.mockClear();
        CuboMX.multiListManager.productMutationSpy.mockClear();

        // Mutate users array
        CuboMX.multiListManager.users.add({ id: 'u2' });
        await vi.runAllTimersAsync();

        expect(CuboMX.multiListManager.userMutationSpy).toHaveBeenCalledTimes(1);
        expect(CuboMX.multiListManager.userMutationSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'add', arrayName: 'users' }));
        expect(CuboMX.multiListManager.productMutationSpy).not.toHaveBeenCalled();

        // Mutate products array
        CuboMX.multiListManager.products.delete(0);
        await vi.runAllTimersAsync();

        expect(CuboMX.multiListManager.userMutationSpy).toHaveBeenCalledTimes(1); // Still 1
        expect(CuboMX.multiListManager.productMutationSpy).toHaveBeenCalledTimes(1);
        expect(CuboMX.multiListManager.productMutationSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'delete', arrayName: 'products' }));
    });

    it('should call the mutation callback for `update` when an item\'s implicit class property is mutated (add, remove, toggle)', async () => {
        CuboMX.component('listManager', {
            items: [],
            mutationSpy: vi.fn(),
            init() {
                this.$watchArrayItems('items', this.mutationSpy);
            },
        });
        document.body.innerHTML = `
            <div mx-data="listManager">
                <ul id="item-list">
                    <li mx-item="items" class="initial"></li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        CuboMX.listManager.mutationSpy.mockClear();

        const itemToUpdate = CuboMX.listManager.items[0];

        // Test .add()
        itemToUpdate.class.add('active');
        await vi.runAllTimersAsync();
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(1);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(1, {
            type: 'update',
            item: itemToUpdate,
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
            propertyName: 'class',
            oldValue: ['initial'],
            newValue: expect.arrayContaining(['initial', 'active']),
        });

        // Test .toggle() - remove
        itemToUpdate.class.toggle('active');
        await vi.runAllTimersAsync();
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(2);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(2, {
            type: 'update',
            item: itemToUpdate,
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
            propertyName: 'class',
            oldValue: expect.arrayContaining(['initial', 'active']),
            newValue: ['initial'],
        });

        // Test .toggle() - add
        itemToUpdate.class.toggle('highlighted');
        await vi.runAllTimersAsync();
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(3);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(3, {
            type: 'update',
            item: itemToUpdate,
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
            propertyName: 'class',
            oldValue: ['initial'],
            newValue: expect.arrayContaining(['initial', 'highlighted']),
        });

        // Test .remove()
        itemToUpdate.class.remove('initial');
        await vi.runAllTimersAsync();
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(4);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(4, {
            type: 'update',
            item: itemToUpdate,
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
            propertyName: 'class',
            oldValue: expect.arrayContaining(['initial', 'highlighted']),
            newValue: ['highlighted'],
        });
    });
    
    it('should call the mutation callback for `update` when an item\'s explicit class property (::class) is mutated (add, remove, toggle)', async () => {
        CuboMX.component('listManager', {
            items: [],
            mutationSpy: vi.fn(),
            init() {
                this.$watchArrayItems('items', this.mutationSpy);
            },
        });
        document.body.innerHTML = `
            <div mx-data="listManager">
                <ul id="item-list">
                    <li mx-item="items" ::class="itemClasses" class="initial"></li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        CuboMX.listManager.mutationSpy.mockClear();

        const itemToUpdate = CuboMX.listManager.items[0];

        // Test .add()
        itemToUpdate.itemClasses.add('active');
        await vi.runAllTimersAsync();
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(1);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(1, {
            type: 'update',
            item: itemToUpdate,
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
            propertyName: 'itemClasses',
            oldValue: ['initial'],
            newValue: expect.arrayContaining(['initial', 'active']),
        });

        // Test .toggle() - remove
        itemToUpdate.itemClasses.toggle('active');
        await vi.runAllTimersAsync();
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(2);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(2, {
            type: 'update',
            item: itemToUpdate,
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
            propertyName: 'itemClasses',
            oldValue: expect.arrayContaining(['initial', 'active']),
            newValue: ['initial'],
        });

        // Test .toggle() - add
        itemToUpdate.itemClasses.toggle('highlighted');
        await vi.runAllTimersAsync();
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(3);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(3, {
            type: 'update',
            item: itemToUpdate,
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
            propertyName: 'itemClasses',
            oldValue: ['initial'],
            newValue: expect.arrayContaining(['initial', 'highlighted']),
        });

        // Test .remove()
        itemToUpdate.itemClasses.remove('initial');
        await vi.runAllTimersAsync();
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(4);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenNthCalledWith(4, {
            type: 'update',
            item: itemToUpdate,
            index: 0,
            arrayName: 'items',
            componentName: 'listManager',
            propertyName: 'itemClasses',
            oldValue: expect.arrayContaining(['initial', 'highlighted']),
            newValue: ['highlighted'],
        });
    });

    it('should NOT call the mutation callback during initial hydration of existing items', async () => {
        CuboMX.component('listManager', {
            items: [],
            mutationSpy: vi.fn(),
            init() {
                this.$watchArrayItems('items', this.mutationSpy);
            },
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
                    <li mx-item="items" ::data-id="id" data-id="3">
                        <span ::text="name">Item 3</span>
                    </li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        // During initialization, the 3 items are hydrated but should NOT trigger callbacks
        expect(CuboMX.listManager.items).toHaveLength(3);
        expect(CuboMX.listManager.items[0].id).toBe(1);
        expect(CuboMX.listManager.items[1].id).toBe(2);
        expect(CuboMX.listManager.items[2].id).toBe(3);
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(0);
    });

    it('should NOT call the mutation callback during initial hydration of existing items with class properties', async () => {
        CuboMX.component('listManager', {
            items: [],
            mutationSpy: vi.fn(),
            init() {
                this.$watchArrayItems('items', this.mutationSpy);
            },
        });
        document.body.innerHTML = `
            <div mx-data="listManager">
                <ul id="item-list">
                    <li mx-item="items" ::class="itemClasses" class="initial item-1">
                        <span ::text="name">Item 1</span>
                    </li>
                    <li mx-item="items" ::class="itemClasses" class="initial item-2">
                        <span ::text="name">Item 2</span>
                    </li>
                    <li mx-item="items" ::class="itemClasses" class="initial item-3">
                        <span ::text="name">Item 3</span>
                    </li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        // During initialization, the 3 items with class properties are hydrated but should NOT trigger callbacks
        expect(CuboMX.listManager.items).toHaveLength(3);
        expect(CuboMX.listManager.items[0].itemClasses).toBeDefined();
        expect(CuboMX.listManager.items[1].itemClasses).toBeDefined();
        expect(CuboMX.listManager.items[2].itemClasses).toBeDefined();
        expect(CuboMX.listManager.mutationSpy).toHaveBeenCalledTimes(0);
    });

    it('should support adding items with implicit class property (class array)', async () => {
        CuboMX.component('listManager', {
            items: [],
            init() {
                // Empty initial items
            },
        });
        document.body.innerHTML = `
            <div mx-data="listManager">
                <ul id="item-list">
                    <li mx-item="items" ::text="name"></li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Clear the hydrated item
        CuboMX.listManager.items.delete(0);
        await vi.runAllTimersAsync();

        // Add item with implicit class property
        CuboMX.listManager.items.add({
            name: "Item with classes",
            class: ["class1", "class2", "active"]
        });
        await vi.runAllTimersAsync();

        expect(CuboMX.listManager.items).toHaveLength(1);
        const addedItem = CuboMX.listManager.items[0];

        // Verify the item has the class property
        expect(addedItem.class).toBeDefined();
        expect(Array.isArray(addedItem.class)).toBe(true);
        expect(addedItem.class).toEqual(expect.arrayContaining(["class1", "class2", "active"]));

        // Verify DOM has the classes applied
        const itemElement = document.querySelector('#item-list li');
        expect(itemElement.classList.contains('class1')).toBe(true);
        expect(itemElement.classList.contains('class2')).toBe(true);
        expect(itemElement.classList.contains('active')).toBe(true);

        // Verify we can manipulate classes after adding
        addedItem.class.add('new-class');
        await vi.runAllTimersAsync();
        expect(addedItem.class).toEqual(expect.arrayContaining(["class1", "class2", "active", "new-class"]));
        expect(itemElement.classList.contains('new-class')).toBe(true);
    });

    it('should support prepending items with explicit ::class property', async () => {
        CuboMX.component('listManager', {
            items: [],
            init() {
                // Empty initial items
            },
        });
        document.body.innerHTML = `
            <div mx-data="listManager">
                <ul id="item-list">
                    <li mx-item="items" ::class="itemClasses" ::text="name"></li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Clear the hydrated item
        CuboMX.listManager.items.delete(0);
        await vi.runAllTimersAsync();

        // Prepend item with explicit ::class property
        CuboMX.listManager.items.prepend({
            name: "Prepended item",
            itemClasses: ["class3", "prepended"]
        });
        await vi.runAllTimersAsync();

        expect(CuboMX.listManager.items).toHaveLength(1);
        const prependedItem = CuboMX.listManager.items[0];

        // Verify the item has the itemClasses property
        expect(prependedItem.itemClasses).toBeDefined();
        expect(Array.isArray(prependedItem.itemClasses)).toBe(true);
        expect(prependedItem.itemClasses).toEqual(expect.arrayContaining(["class3", "prepended"]));

        // Verify DOM has the classes applied
        const itemElement = document.querySelector('#item-list li');
        expect(itemElement.classList.contains('class3')).toBe(true);
        expect(itemElement.classList.contains('prepended')).toBe(true);

        // Verify we can manipulate classes after prepending
        prependedItem.itemClasses.remove('prepended');
        await vi.runAllTimersAsync();
        expect(Array.from(prependedItem.itemClasses)).toEqual(['class3']);
        expect(itemElement.classList.contains('prepended')).toBe(false);
        expect(itemElement.classList.contains('class3')).toBe(true);
    });
});
