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

    it('should NOT update history if history option is false or omitted', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="nav-link" page-title="New Page" data-url="/new-page">
                <h1>New Page</h1>
            </template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('nav-link', { target: '#container' }); // history: false is default

        expect(pushStateSpy).not.toHaveBeenCalled();
        expect(document.title).not.toBe('New Page');
    });

    it('should do nothing and log an error if template does not exist', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        document.body.innerHTML = `<div id="container">Original</div>`;
        CuboMX.start();

        CuboMX.swapTemplate('non-existent', { target: '#container' });

        expect(document.getElementById('container').textContent).toBe('Original'); // Content should not change
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Template 'non-existent' not found."));
    });

    it('should use data-* attributes from metadata as a fallback', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="nav-link" data-page-title="Data Attr Page" data-url="/data-attr-page">
                <h1>From Data Attr</h1>
            </template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('nav-link', { target: '#container', history: true });

        expect(document.title).toBe('Data Attr Page');
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), 'Data Attr Page', '/data-attr-page');
    });
});
