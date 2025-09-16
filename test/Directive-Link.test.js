import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';
import { request } from '../src/request.js';

// Mock the entire request module
vi.mock('../src/request.js', () => ({
    request: vi.fn(() => Promise.resolve({ ok: true })),
    swapHTML: vi.fn(),
    processActions: vi.fn(),
}));

describe('CuboMX - mx-link Directive', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
        vi.clearAllMocks(); // Clear mocks before each test
    });

    it('should prevent default navigation and call the request function with correct parameters', () => {
        // Arrange: Set up the DOM with the mx-link directive
        document.body.innerHTML = '<a href="/test-page" mx-link>Test Link</a>';
        const link = document.querySelector('a');
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

        // Initialize CuboMX to bind the directives
        CuboMX.start();

        // Act: Dispatch a click event on the link
        link.dispatchEvent(clickEvent);

        // Assert:
        // 1. The default browser navigation was prevented
        expect(clickEvent.defaultPrevented).toBe(true);

        // 2. The mocked request function was called exactly once
        expect(request).toHaveBeenCalledTimes(1);

        // 3. The mocked request function was called with the expected payload
        expect(request).toHaveBeenCalledWith({
            url: '/test-page',
            pushUrl: true,
            history: true
        });
    });

    it('should do nothing if the element is not a link with href', () => {
        // Arrange: Set up the DOM with the mx-link directive on a div
        document.body.innerHTML = '<div mx-link>Not a link</div>';
        const div = document.querySelector('div');

        CuboMX.start();

        // Act: Click the div
        div.click();

        // Assert: The mocked request function should not have been called
        expect(request).not.toHaveBeenCalled();
    });
});