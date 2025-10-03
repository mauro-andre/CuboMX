import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Watcher Lifecycle", () => {
    beforeEach(() => {
        // Reset CuboMX and the DOM before each test
        CuboMX.reset();
        document.body.innerHTML = "";
        // Use fake timers to control MutationObserver and setTimeout
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Restore real timers
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("should destroy internal component watchers ($watch) when the component is removed from the DOM", async () => {
        // 1. Setup a spy and a component that uses it in a watcher
        const watcherCallback = vi.fn();

        const leakyComp = {
            someProp: "initial",
            init() {
                this.$watch("someProp", watcherCallback);
            },
        };

        CuboMX.component("leakyComp", leakyComp);

        // 2. First Load: Add the component, start CuboMX, and trigger the watcher
        document.body.innerHTML = '<div mx-data="leakyComp"></div>';
        CuboMX.start();
        await vi.runAllTimersAsync(); // Let init() run

        CuboMX.leakyComp.someProp = "first change";

        // 3. Assert the watcher was called once
        expect(watcherCallback).toHaveBeenCalledTimes(1);
        expect(watcherCallback).toHaveBeenCalledWith("first change", "initial");

        // 4. Re-load: Remove the component, wait for destroy, then add it back
        document.body.innerHTML = "";
        await vi.runAllTimersAsync(); // Let MutationObserver process removal and run destroy logic

        document.body.innerHTML = '<div mx-data="leakyComp"></div>';
        await vi.runAllTimersAsync(); // Let MutationObserver process addition and run init logic again

        // 5. Second Change: Trigger the watcher on the new component instance
        CuboMX.leakyComp.someProp = "second change";

        // 6. Final Assertion: The watcher should only have been called one more time.
        // If the bug exists, the old watcher was not cleaned up, and this will be called twice,
        // making the total call count 3 instead of 2.
        expect(watcherCallback).toHaveBeenCalledTimes(2);
        expect(watcherCallback).toHaveBeenLastCalledWith("second change", "initial");
    });
});
