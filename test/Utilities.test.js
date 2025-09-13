import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

// Mocking global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CuboMX Utilities', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        mockFetch.mockClear();
        vi.spyOn(window.history, 'pushState');
        vi.spyOn(window.history, 'replaceState');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // --- Tests for renderTemplate ---
    describe('renderTemplate', () => {
        it('should replace simple placeholders', () => {
            const template = 'Hello, {{ name }}!';
            const data = { name: 'CuboMX' };
            expect(CuboMX.renderTemplate(template, data)).toBe('Hello, CuboMX!');
        });

        it('should resolve nested object paths', () => {
            const template = 'Welcome, {{ user.profile.firstName }}.';
            const data = { user: { profile: { firstName: 'Mauro' } } };
            expect(CuboMX.renderTemplate(template, data)).toBe('Welcome, Mauro.');
        });

        it('should handle missing data gracefully', () => {
            const template = 'Value: {{ a.b.c }}.';
            const data = { a: {} };
            expect(CuboMX.renderTemplate(template, data)).toBe('Value: .');
        });

        it('should remove Jinja-style comments and statements', () => {
            const template = '{# This is a comment #}Hello, {% if user %} {{ user.name }} {% endif %}!';
            const data = { user: { name: 'Andre' } };
            expect(CuboMX.renderTemplate(template, data)).toBe('Hello,  Andre !');
        });
    });

    // --- Tests for swapHTML ---
    describe('swapHTML', () => {
        it('should perform innerHTML swap correctly', () => {
            document.body.innerHTML = '<div id="target">Original</div>';
            const sourceHtml = '<div id="source"><p>New Content</p></div>';
            // Corrected: Specify innerHTML for the source as well
            const strategies = [{ select: '#source:innerHTML', target: '#target:innerHTML' }];
            
            CuboMX.swapHTML(sourceHtml, strategies);
            
            expect(document.getElementById('target').innerHTML).toBe('<p>New Content</p>');
        });

        it('should perform outerHTML swap correctly', () => {
            document.body.innerHTML = '<div id="target">Original</div>';
            const sourceHtml = '<div id="source" class="swapped">New Element</div>';
            const strategies = [{ select: '#source', target: '#target:outerHTML' }];

            CuboMX.swapHTML(sourceHtml, strategies);

            expect(document.getElementById('target')).toBeNull();
            // Corrected: Check for the existence and content of the new element
            const swappedEl = document.querySelector('.swapped');
            expect(swappedEl).not.toBeNull();
            expect(swappedEl.textContent).toBe('New Element');
        });

        it('should update browser history when specified', () => {
            document.body.innerHTML = '<div id="target"></div>';
            const sourceHtml = '<div id="source"></div>';
            const strategies = [{ select: '#source', target: '#target' }];
            const options = { targetUrl: '/new-page', history: true };

            CuboMX.swapHTML(sourceHtml, strategies, options);

            expect(window.history.pushState).toHaveBeenCalledWith({ swaps: [] }, "", "/new-page");
        });
    });

    // --- Tests for actions (processActions) ---
    describe('actions', () => {
        it('should add and remove classes', () => {
            document.body.innerHTML = '<div id="el" class="initial"></div>';
            const el = document.getElementById('el');

            CuboMX.actions([{ action: 'addClass', selector: '#el', class: 'added' }]);
            expect(el.classList.contains('added')).toBe(true);

            CuboMX.actions([{ action: 'removeClass', selector: '#el', class: 'initial' }]);
            expect(el.classList.contains('initial')).toBe(false);
        });

        it('should set attributes', () => {
            document.body.innerHTML = '<button id="btn"></button>';
            const btn = document.getElementById('btn');

            CuboMX.actions([{ action: 'setAttribute', selector: '#btn', attribute: 'disabled', value: '' }]);
            expect(btn.hasAttribute('disabled')).toBe(true);
        });

        it('should dispatch events', () => {
            document.body.innerHTML = '<div id="el"></div>';
            const el = document.getElementById('el');
            const spy = vi.fn();
            el.addEventListener('custom-event', spy);

            CuboMX.actions([{ action: 'dispatchEvent', selector: '#el', event: 'custom-event' }]);
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    // --- Tests for request ---
    describe('request', () => {
        it('should make a GET request and swap content based on headers', async () => {
            document.body.innerHTML = '<div id="content"></div>';
            const responseHtml = '<div id="new">Updated</div>';
            // Corrected: Specify innerHTML for the target to avoid replacing the container
            const strategies = JSON.stringify([{ select: '#new', target: '#content:innerHTML' }]);
            
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: () => Promise.resolve(responseHtml),
                headers: new Headers({ 'X-Swap-Strategies': strategies }),
                url: '/test'
            });

            await CuboMX.request({ url: '/test' });

            expect(mockFetch).toHaveBeenCalledWith('/test', expect.any(Object));
            expect(document.getElementById('content').innerHTML).toContain('Updated');
        });

        it('should process actions from headers', async () => {
            document.body.innerHTML = '<div id="el"></div>';
            const actions = JSON.stringify([{ action: 'addClass', selector: '#el', class: 'processed' }]);

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: () => Promise.resolve(''),
                headers: new Headers({ 'X-Cubo-Actions': actions }),
                url: '/test'
            });

            await CuboMX.request({ url: '/test' });

            expect(document.getElementById('el').classList.contains('processed')).toBe(true);
        });

        it('should handle redirects via X-Redirect header', async () => {
            // Mocking window.location.href
            const originalLocation = window.location;
            delete window.location;
            window.location = { href: '' };

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                headers: new Headers({ 'X-Redirect': '/new-location' }),
            });

            await CuboMX.request({ url: '/redirect' });

            expect(window.location.href).toBe('/new-location');

            // Restore original window.location
            window.location = originalLocation;
        });

        it('should toggle loading classes on specified selectors', async () => {
            document.body.innerHTML = '<button id="btn">Submit</button>';
            const btn = document.getElementById('btn');

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: () => Promise.resolve(''),
                headers: new Headers(),
                url: '/test'
            });

            const requestPromise = CuboMX.request({ url: '/test', loadingSelectors: ['#btn'] });

            // Immediately after calling, the class should be added
            expect(btn.classList.contains('x-request')).toBe(true);

            await requestPromise;

            // After the request is complete, the class should be removed
            expect(btn.classList.contains('x-request')).toBe(false);
        });
    });
});
