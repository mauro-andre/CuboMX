import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("History Navigation (popstate)", () => {
    beforeEach(() => {
        // Reset CuboMX and the DOM before each test
        CuboMX.reset();
        document.body.innerHTML = "";
        document.title = "";

        // Start CuboMX to ensure the popstate listener is active
        CuboMX.start();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should restore both title and DOM content on back navigation after swapHTML', () => {
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

        // 1. Set initial state
        const initialTitle = 'Initial Page';
        const initialContent = 'Old Content';
        document.title = initialTitle;
        document.body.innerHTML = `<div id="content">${initialContent}</div>`;

        // 2. Define the new state
        const newHtml = '<div id="content">New Content</div>';
        const strategies = [{ select: '#content', target: '#content' }];
        const options = { history: true, targetUrl: '/page-2' };

        // 3. Perform the forward navigation
        CuboMX.swapHTML(newHtml, strategies, options);
        const newTitle = 'New Page';
        document.title = newTitle;

        // 4. Assert that the forward navigation was successful
        expect(document.getElementById('content').textContent).toBe('New Content');
        expect(document.title).toBe(newTitle);
        expect(replaceStateSpy).toHaveBeenCalledOnce();

        // 5. Simulate the "back" button press
        const savedState = replaceStateSpy.mock.calls[0][0];
        const popStateEvent = new PopStateEvent('popstate', { state: savedState });
        window.dispatchEvent(popStateEvent);

        // 6. Assert that the state was restored
        expect(document.title).toBe(initialTitle);
        expect(document.getElementById('content').textContent).toBe(initialContent);
    });
});
