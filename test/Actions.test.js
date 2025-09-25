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

        expect(pushStateSpy).toHaveBeenCalledWith({}, newTitle, newUrl);
        expect(document.title).toBe(newTitle);
    });

    it('should update browser history without changing title if title is not provided', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        const originalTitle = 'Original Title';
        document.title = originalTitle;

        const newUrl = '/another-page';

        CuboMX.actions([{ action: 'pushUrl', url: newUrl }]);

        expect(pushStateSpy).toHaveBeenCalledWith({}, '', newUrl);
        expect(document.title).toBe(originalTitle);
    });
});
