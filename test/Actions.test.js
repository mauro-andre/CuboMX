import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX Actions", () => {
    beforeEach(() => {
        CuboMX.reset();
        // Start is needed to process actions via the global API
        CuboMX.start();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should update browser history and document title with pushUrl action', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.title = 'Old Title';

        const newUrl = '/new-page';
        const newTitle = 'New Page Title';

        CuboMX.actions([{ action: 'pushUrl', url: newUrl, title: newTitle }]);

        expect(pushStateSpy).toHaveBeenCalledWith({ title: newTitle }, newTitle, newUrl);
        expect(document.title).toBe(newTitle);
    });

    it('should update browser history without changing title if title is not provided', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        const originalTitle = 'Original Title';
        document.title = originalTitle;

        const newUrl = '/another-page';

        CuboMX.actions([{ action: 'pushUrl', url: newUrl }]);

        // The title in the state and argument should be the original document title
        expect(pushStateSpy).toHaveBeenCalledWith({ title: originalTitle }, originalTitle, newUrl);
        expect(document.title).toBe(originalTitle);
    });

    it('should restore document.title on back navigation after a pushUrl action', () => {
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        document.title = 'Initial Title';

        // Navigate forward
        CuboMX.actions([{ action: 'pushUrl', url: '/page-2', title: 'Page Two' }]);
        expect(document.title).toBe('Page Two');

        // The state of the initial page should have been saved via replaceState
        const savedState = replaceStateSpy.mock.calls[0][0];

        // Simulate "back" button press by dispatching the event with the saved state
        const popStateEvent = new PopStateEvent('popstate', { state: savedState });
        window.dispatchEvent(popStateEvent);

        // Assert title was restored
        expect(document.title).toBe('Initial Title');
    });

    it('should restore document.title on back navigation after a swapHTML call with history', () => {
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        document.body.innerHTML = `<div id="content">Old</div>`;
        document.title = 'Initial Swap Title';

        // Navigate forward using swapHTML
        CuboMX.swapHTML('<div id="content">New</div>', [], { history: true, targetUrl: '/new-swap' });
        
        // In a real scenario, the new title would either be in the swapped content or set by another action.
        // We set it manually here to simulate the state change.
        document.title = 'New Swap Title';

        // The state of the initial page should have been saved
        const savedState = replaceStateSpy.mock.calls[0][0];

        // Simulate "back" button press
        const popStateEvent = new PopStateEvent('popstate', { state: savedState });
        window.dispatchEvent(popStateEvent);

        // Assert title was restored
        expect(document.title).toBe('Initial Swap Title');
    });
});
