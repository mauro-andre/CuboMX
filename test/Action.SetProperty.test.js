import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

// Mocking global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Action: setProperty', () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = '';
        mockFetch.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    async function runRequestWithAction(action) {
        const actions = JSON.stringify([action]);
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            text: () => Promise.resolve(''),
            headers: new Headers({ 'X-Cubo-Actions': actions }),
            url: '/test'
        });
        await CuboMX.request({ url: '/test' });
    }

    it('should set a property on a store', async () => {
        CuboMX.store('myStore', { value: 'initial' });
        CuboMX.start();

        expect(CuboMX.myStore.value).toBe('initial');

        await runRequestWithAction({
            action: 'setProperty',
            property: 'myStore.value',
            value: 'updated'
        });

        expect(CuboMX.myStore.value).toBe('updated');
    });

    it('should set a property on a singleton component', async () => {
        document.body.innerHTML = '<div mx-data="mySingleton"></div>';
        CuboMX.component('mySingleton', { value: 'initial' });
        CuboMX.start();

        expect(CuboMX.mySingleton.value).toBe('initial');

        await runRequestWithAction({
            action: 'setProperty',
            property: 'mySingleton.value',
            value: 'updated'
        });

        expect(CuboMX.mySingleton.value).toBe('updated');
    });

    it('should set a property on a factory component instance via mx-ref', async () => {
        document.body.innerHTML = '<div mx-data="myFactory()" mx-ref="myInstance"></div>';
        CuboMX.component('myFactory', () => ({ value: 'initial' }));
        CuboMX.start();

        expect(CuboMX.myInstance.value).toBe('initial');

        await runRequestWithAction({
            action: 'setProperty',
            property: 'myInstance.value',
            value: 'updated'
        });

        expect(CuboMX.myInstance.value).toBe('updated');
    });
});
