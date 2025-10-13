import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Directive: mx-show with mx-transition", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
        document.head.innerHTML = "";
        // Add the required CSS for the test to have a transition duration
        const style = document.createElement('style');
        style.innerHTML = `
            .transition-test { transition: opacity 150ms; }
            .fade-enter-start, .fade-leave-end { opacity: 0; }
            .fade-enter-end, .fade-leave-start { opacity: 1; }
        `;
        document.head.appendChild(style);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    const setupComponent = () => {
        CuboMX.component("myComp", {
            show: false,
        });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div id="el" class="transition-test" mx-show="show" mx-transition="fade">
                    Hello
                </div>
            </div>
        `;
        CuboMX.start();
        return document.getElementById('el');
    };

    it("should correctly apply classes for the enter transition", async () => {
        const el = setupComponent();

        // Initially hidden by mx-show
        expect(el.style.display).toBe('none');

        // --- Start the enter transition ---
        CuboMX.myComp.show = true;
        await vi.advanceTimersByTimeAsync(0); // Let the watcher react

        // Frame 1: Should be visible and have the starting classes
        expect(el.style.display).toBe('');
        expect(el.classList.contains('fade-enter-start')).toBe(true);
        expect(el.classList.contains('fade-enter-end')).toBe(false);

        // Frame 2: Should swap classes to trigger the animation
        await vi.advanceTimersByTimeAsync(1); // Next frame
        expect(el.classList.contains('fade-enter-start')).toBe(false);
        expect(el.classList.contains('fade-enter-end')).toBe(true);

        // --- Simulate end of transition ---
        el.dispatchEvent(new Event('transitionend'));
        await vi.advanceTimersByTimeAsync(0);

        // Final state: Should be clean of transition classes
        expect(el.classList.contains('fade-enter-start')).toBe(false);
        expect(el.classList.contains('fade-enter-end')).toBe(false);
        expect(el.style.display).toBe('');
    });

    it("should correctly apply classes for the leave transition", async () => {
        const el = setupComponent();
        // Start visible
        CuboMX.myComp.show = true;
        await vi.runAllTimersAsync();
        el.dispatchEvent(new Event('transitionend'));
        await vi.runAllTimersAsync();
        expect(el.style.display).toBe('');

        // --- Start the leave transition ---
        CuboMX.myComp.show = false;
        await vi.advanceTimersByTimeAsync(0); // Let the watcher react

        // Frame 1: Should still be visible and have the starting classes
        expect(el.style.display).toBe('');
        expect(el.classList.contains('fade-leave-start')).toBe(true);
        expect(el.classList.contains('fade-leave-end')).toBe(false);

        // Frame 2: Should swap classes to trigger the animation
        await vi.advanceTimersByTimeAsync(1); // Next frame
        expect(el.classList.contains('fade-leave-start')).toBe(false);
        expect(el.classList.contains('fade-leave-end')).toBe(true);

        // --- Simulate end of transition ---
        el.dispatchEvent(new Event('transitionend'));
        await vi.advanceTimersByTimeAsync(0);

        // Final state: Should be hidden and clean of transition classes
        expect(el.classList.contains('fade-leave-start')).toBe(false);
        expect(el.classList.contains('fade-leave-end')).toBe(false);
        expect(el.style.display).toBe('none');
    });

    it('should cancel a leave transition if an enter transition starts midway', async () => {
        const el = setupComponent();
        // Start visible
        CuboMX.myComp.show = true;
        await vi.runAllTimersAsync();
        el.dispatchEvent(new Event('transitionend'));
        await vi.runAllTimersAsync();

        // Start leaving
        CuboMX.myComp.show = false;
        await vi.advanceTimersByTimeAsync(1);
        expect(el.classList.contains('fade-leave-end')).toBe(true);

        // Before it finishes, start entering again
        CuboMX.myComp.show = true;
        await vi.advanceTimersByTimeAsync(1);

        // Should have switched to enter classes, leave classes should be gone
        expect(el.classList.contains('fade-leave-end')).toBe(false);
        expect(el.classList.contains('fade-enter-end')).toBe(true);
        expect(el.style.display).toBe(''); // Should not be hidden

        // Finish the enter transition
        el.dispatchEvent(new Event('transitionend'));
        await vi.advanceTimersByTimeAsync(0);
        expect(el.classList.contains('transition-test')).toBe(true); // Base class should remain
        expect(el.classList.contains('fade-enter-end')).toBe(false);
    });
});
