import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX.swapTemplate", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
        document.title = "";
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should swap template content into a target selector', () => {
        document.body.innerHTML = `
            <div id="container">Original Content</div>
            <template mx-template="swappable">New Content</template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('swappable', { target: '#container:innerHTML' });

        expect(document.getElementById('container').textContent).toBe('New Content');
    });

    it('should use metadata from template for history when history option is true', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="nav-link" page-title="New Page" data-url="/new-page">
                <h1>New Page</h1>
            </template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('nav-link', { target: '#container', history: true });

        expect(document.title).toBe('New Page');
        expect(pushStateSpy).toHaveBeenCalledWith({ swaps: [], title: 'New Page' }, 'New Page', '/new-page');
    });

    it('should allow options to override template metadata for history', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="nav-link" page-title="Old Title" data-url="/old-path">
                <h1>New Page</h1>
            </template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('nav-link', { 
            target: '#container', 
            history: true, 
            pageTitle: 'Overridden Title', 
            url: '/overridden-path' 
        });

        expect(document.title).toBe('Overridden Title');
        expect(pushStateSpy).toHaveBeenCalledWith({ swaps: [], title: 'Overridden Title' }, 'Overridden Title', '/overridden-path');
    });

    it('should NOT update history if history option is explicitly false', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="nav-link" page-title="New Page" data-url="/new-page">
                <h1>New Page</h1>
            </template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('nav-link', { target: '#container:innerHTML', history: false });

        expect(pushStateSpy).not.toHaveBeenCalled();
        expect(document.title).not.toBe('New Page');
    });

    it('should implicitly update history if history option is omitted and url is present', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="nav-link" page-title="New Page" data-url="/new-page">
                <h1>New Page</h1>
            </template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('nav-link', { target: '#container:innerHTML' });

        expect(document.title).toBe('New Page');
        expect(pushStateSpy).toHaveBeenCalledWith({ swaps: [], title: 'New Page' }, 'New Page', '/new-page');
    });

    it('should do nothing and log an error if template does not exist', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        document.body.innerHTML = `<div id="container">Original</div>`;
        CuboMX.start();

        CuboMX.swapTemplate('non-existent', { target: '#container:innerHTML' });

        expect(document.getElementById('container').textContent).toBe('Original'); // Content should not change
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Template 'non-existent' not found."));
    });

    it('should implicitly enable history when url is passed in options', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `<div id="container"></div><template mx-template="t1">Test</template>`;
        CuboMX.start();

        CuboMX.swapTemplate('t1', {
            target: '#container:innerHTML',
            url: '/implicit-on',
            pageTitle: 'Implicit On'
        });

        expect(document.title).toBe('Implicit On');
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), 'Implicit On', '/implicit-on');
    });

    it('should implicitly disable history when no url is provided', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `<div id="container">Old</div><template mx-template="t2">New</template>`;
        const originalTitle = "Original Title";
        document.title = originalTitle;
        CuboMX.start();

        CuboMX.swapTemplate('t2', { target: '#container:innerHTML' });

        expect(document.getElementById('container').textContent).toBe('New'); // a swap happened
        expect(pushStateSpy).not.toHaveBeenCalled();
        expect(document.title).toBe(originalTitle); // title did not change
    });
});
