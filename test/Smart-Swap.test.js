import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

describe('CuboMX - Smart Swap Logic via swapHTML', () => {
    let consoleWarnSpy;

    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    it('Priority 1: Should obey explicit strategies when provided', () => {
        // Arrange
        document.body.innerHTML = '<div id="target">Original</div>';
        const responseHtml = '<div id="source">Explicit Swap</div>';
        // Default strategy is outerHTML, so #target will be replaced by #source
        const strategies = [{ select: '#source', target: '#target' }];

        // Act
        CuboMX.swapHTML(responseHtml, strategies);

        // Assert
        expect(document.getElementById('target')).toBeNull(); // The old element is gone
        const newElement = document.getElementById('source');
        expect(newElement).not.toBeNull(); // The new element is present
        expect(newElement.textContent).toBe('Explicit Swap');
        expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('Priority 2: Should smart swap a partial when its root element ID matches', () => {
        // Arrange
        document.body.innerHTML = '<div id="content"><p>Old content</p><span>Keep me</span></div>';
        const responseHtml = '<div id="content"><h2>New content</h2><span>Keep me</span></div>';

        // Act: Pass null strategies to trigger smart swap
        CuboMX.swapHTML(responseHtml, null);

        // Assert: The content of #content should have been morphed
        expect(document.querySelector('#content > h2')).not.toBeNull();
        expect(document.querySelector('#content > p')).toBeNull();
        expect(document.querySelector('#content > span').textContent).toBe('Keep me');
    });

    it('Priority 3: Should smart swap the body when a full HTML document is received', () => {
        // Arrange
        document.body.innerHTML = '<p>Old Body</p>';
        const responseHtml = '<!DOCTYPE html><html><body><h1>New Body</h1></body></html>';

        // Act: Pass null strategies to trigger smart swap
        CuboMX.swapHTML(responseHtml, null);

        // Assert: The body should have been morphed
        expect(document.querySelector('body > h1')).not.toBeNull();
        expect(document.querySelector('body > p')).toBeNull();
    });

    it('Fallback: Should log a warning if a partial is unidentifiable and no strategies are given', () => {
        // Arrange
        document.body.innerHTML = '<div id="original">Original</div>';
        const originalContent = document.body.innerHTML;
        const responseHtml = '<div>Unidentifiable partial</div>'; // No ID

        // Act: Pass null strategies to trigger smart swap
        CuboMX.swapHTML(responseHtml, null);

        // Assert
        // 1. The DOM remains unchanged
        expect(document.body.innerHTML).toBe(originalContent);
        // 2. A warning was logged to the console
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Smart swap failed'));
    });
});