import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe('Directive :class Binding', () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = '';
    });

    it('should hydrate the bound property as a reactive classList proxy', () => {
        // Setup: Bind a div's class to a component property `myClasses`
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <div id="test-el" class="initial existing" :class="myClasses"></div>
            </div>
        `;

        CuboMX.component('myComponent', {
            myClasses: null // Start with null to let CuboMX hydrate it from the DOM
        });

        CuboMX.start();

        const component = CuboMX.myComponent;
        const el = document.getElementById('test-el');

        // 1. Assert that the property is hydrated as an array-like proxy, not a string.
        // This is the core of the test. It will fail if `myClasses` is a string.
        expect(typeof component.myClasses).not.toBe('string');
        expect(Array.isArray(component.myClasses)).toBe(true);
        expect(component.myClasses).toHaveLength(2);
        expect(component.myClasses).toContain('initial');
        expect(component.myClasses).toContain('existing');

        // 2. Assert that mutating the proxy array updates the DOM's classList.
        // This would throw an error if `myClasses` were a string.
        component.myClasses.push('added-from-state');
        expect(el.classList.contains('added-from-state')).toBe(true);
        expect(el.className).toBe('initial existing added-from-state');

        // 3. Assert that removing an item from the proxy also updates the DOM.
        component.myClasses.splice(1, 1); // Remove 'existing'
        expect(el.classList.contains('existing')).toBe(false);
        expect(el.className).toBe('initial added-from-state');

        // 4. Assert that re-assigning the property with a new array also updates the DOM.
        component.myClasses = ['a', 'b'];
        expect(el.className).toBe('a b');
    });
});
