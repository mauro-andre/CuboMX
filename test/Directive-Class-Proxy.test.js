import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe('Reactive Class Proxy', () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = '';
    });

    it('should hydrate a component property as a reactive proxy via :class', () => {
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <div id="test-el" class="initial existing" :class="myClasses"></div>
            </div>
        `;

        CuboMX.component('myComponent', { myClasses: null });
        CuboMX.start();

        const component = CuboMX.myComponent;
        const el = document.getElementById('test-el');

        // Assert property is a proxy with helper methods
        expect(typeof component.myClasses).not.toBe('string');
        expect(Array.isArray(component.myClasses)).toBe(true);
        expect(typeof component.myClasses.add).toBe('function');
        expect(typeof component.myClasses.remove).toBe('function');
        expect(typeof component.myClasses.toggle).toBe('function');
        expect(component.myClasses).toHaveLength(2);

        // Test .add() method (including idempotency)
        component.myClasses.add('added');
        component.myClasses.add('initial'); // Should not add a duplicate
        expect(component.myClasses).toHaveLength(3);
        expect(el.className).toBe('initial existing added');

        // Test .remove() method
        component.myClasses.remove('existing');
        expect(component.myClasses).toHaveLength(2);
        expect(el.className).toBe('initial added');

        // Test .toggle() method
        component.myClasses.toggle('initial'); // Should remove
        component.myClasses.toggle('toggled'); // Should add
        expect(component.myClasses).toHaveLength(2);
        expect(el.className).toBe('added toggled');
    });

    it('should hydrate an item property as a reactive proxy via ::class', () => {
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <ul>
                    <li mx-item="items" class="item-1 existing" ::class="itemClasses">Item 1</li>
                </ul>
            </div>
        `;

        CuboMX.component('myComponent', { items: [] });
        CuboMX.start();

        const item = CuboMX.myComponent.items[0];
        const el = document.querySelector('li');

        // Assert property is a proxy with helper methods
        expect(typeof item.itemClasses).not.toBe('string');
        expect(Array.isArray(item.itemClasses)).toBe(true);
        expect(typeof item.itemClasses.add).toBe('function');
        expect(typeof item.itemClasses.remove).toBe('function');
        expect(typeof item.itemClasses.toggle).toBe('function');
        expect(item.itemClasses).toHaveLength(2);

        // Test .add() method (including idempotency)
        item.itemClasses.add('added');
        item.itemClasses.add('item-1'); // Should not add a duplicate
        expect(item.itemClasses).toHaveLength(3);
        expect(el.className).toBe('item-1 existing added');

        // Test .remove() method
        item.itemClasses.remove('existing');
        expect(item.itemClasses).toHaveLength(2);
        expect(el.className).toBe('item-1 added');

        // Test .toggle() method
        item.itemClasses.toggle('item-1'); // Should remove
        item.itemClasses.toggle('toggled'); // Should add
        expect(item.itemClasses).toHaveLength(2);
        expect(el.className).toBe('added toggled');
    });
});
