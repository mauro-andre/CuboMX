import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX.getTemplate - Template with Metadata", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it('should return template content and parsed metadata from a <template> tag', () => {
        document.body.innerHTML = `
            <template 
                mx-template="userCard" 
                page-title="User Profile"
                show-header="true"
                user-id="123"
                is-admin
            >
                <p>Hello, {{ name }}</p>
            </template>
        `;

        CuboMX.start();

        const result = CuboMX.getTemplate('userCard');

        expect(result).toBeDefined();
        expect(result.template.trim()).toBe('<p>Hello, {{ name }}</p>');
        expect(result.data).toEqual({
            pageTitle: 'User Profile',
            showHeader: true,
            userId: 123,
            isAdmin: true
        });

        // The original <template> tag should be removed
        expect(document.querySelector('[mx-template="userCard"]')).toBeNull();
    });

    it('should return outerHTML and metadata from a regular element', () => {
        document.body.innerHTML = `
            <div 
                mx-template="productView" 
                data-url="/products/abc"
                is-active
            >
                <h1>{{ productName }}</h1>
            </div>
        `;

        CuboMX.start();

        const result = CuboMX.getTemplate('productView');

        expect(result).toBeDefined();
        expect(result.template.includes('<div ')).toBe(true); // Check it is outerHTML
        expect(result.template.includes('<h1>{{ productName }}</h1>')).toBe(true);
        expect(result.data).toEqual({
            dataUrl: '/products/abc',
            isActive: true
        });

        // The original <div> tag should NOT be removed
        expect(document.querySelector('[mx-template="productView"]')).not.toBeNull();
    });

    it('should return undefined and log an error for a non-existent template', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        document.body.innerHTML = ``;

        CuboMX.start();

        const result = CuboMX.getTemplate('nonExistent');

        expect(result).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Template 'nonExistent' not found."));

        consoleSpy.mockRestore();
    });
});
