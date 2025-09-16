import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX - Template System", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it('should register templates with mx-template and remove them from the DOM', () => {
        document.body.innerHTML = `
            <template mx-template="myAlert">
                <div class="alert">Hello</div>
            </template>
            <div>Other content</div>
        `;

        CuboMX.start();

        // Assert that the template element was removed from the DOM
        expect(document.querySelector('[mx-template="myAlert"]')).toBeNull();
    });

    it('should render a registered template with data', () => {
        document.body.innerHTML = `
            <template mx-template="myAlert">
                <div class="alert-{{style}}">{{message}}</div>
            </template>
        `;

        CuboMX.start();

        const renderedHtml = CuboMX.renderTemplate('myAlert', { 
            style: 'success', 
            message: 'Operation successful!' 
        });

        // Create a temporary element to inspect the result
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = renderedHtml;

        const alertDiv = tempDiv.firstElementChild;
        expect(alertDiv.classList.contains('alert-success')).toBe(true);
        expect(alertDiv.textContent).toBe('Operation successful!');
    });

    it('should return an empty string and log an error for a non-existent template', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        document.body.innerHTML = ``;

        CuboMX.start();

        const renderedHtml = CuboMX.renderTemplate('nonExistentTemplate', {});

        expect(renderedHtml).toBe('');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Template 'nonExistentTemplate' not found"));

        consoleSpy.mockRestore();
    });

    it('should process templates added dynamically after start()', async () => {
        CuboMX.start();

        const newTemplate = document.createElement('template');
        newTemplate.setAttribute('mx-template', 'dynamicAlert');
        newTemplate.innerHTML = `<div>{{text}}</div>`;
        document.body.appendChild(newTemplate);

        // Allow MutationObserver to run
        await new Promise(resolve => setTimeout(resolve, 0));

        const renderedHtml = CuboMX.renderTemplate('dynamicAlert', { text: 'Dynamic!' });
        expect(renderedHtml.trim()).toBe('<div>Dynamic!</div>');
        expect(document.querySelector('[mx-template="dynamicAlert"]')).toBeNull();
    });
});
