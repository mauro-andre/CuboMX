import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX-refactor.js';

describe('CuboMX - Lifecycle Hooks', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
    });

    it('should call onDOMUpdate on all active proxies after a DOM update event', () => {
        const storeHook = vi.fn();
        const componentHook = vi.fn();

        CuboMX.store('myStore', {
            onDOMUpdate: storeHook
        });

        CuboMX.component('myComp', {
            onDOMUpdate: componentHook
        });

        document.body.innerHTML = '<div mx-data="myComp"></div>';

        CuboMX.start();

        // Spies should not have been called yet
        expect(storeHook).not.toHaveBeenCalled();
        expect(componentHook).not.toHaveBeenCalled();

        // Simulate a DOM update event, as dispatched by request() or swapHTML()
        window.dispatchEvent(new CustomEvent('cubo:dom-updated'));

        // Now they should have been called
        expect(storeHook).toHaveBeenCalledTimes(1);
        expect(componentHook).toHaveBeenCalledTimes(1);
    });

    it('should expose this.$el inside component methods', () => {
        let initEl = null;
        let customMethodEl = null;

        const compDef = {
            init() {
                initEl = this.$el;
            },
            checkEl() {
                customMethodEl = this.$el;
            }
        };

        CuboMX.component('myComp', compDef);
        document.body.innerHTML = '<div mx-data="myComp" class="test-div"></div>';
        const div = document.querySelector('.test-div');

        CuboMX.start();

        // Check from init()
        expect(initEl).toBeInstanceOf(HTMLElement);
        expect(initEl).toBe(div);

        // Check from a custom method
        CuboMX.myComp.checkEl();
        expect(customMethodEl).toBeInstanceOf(HTMLElement);
        expect(customMethodEl).toBe(div);
    });
});
