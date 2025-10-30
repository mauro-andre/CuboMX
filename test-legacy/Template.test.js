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

    it('should register a template from a regular element using its outerHTML and not remove it', () => {
        document.body.innerHTML = `
            <div id="component-source" mx-template="fromDiv">
                <p>Hello, {{ name }}!</p>
            </div>
        `;

        CuboMX.start();

        // Assert that the source element was NOT removed from the DOM
        const sourceElement = document.getElementById('component-source');
        expect(sourceElement).not.toBeNull();

        // Render the template with some data
        const renderedHtml = CuboMX.renderTemplate('fromDiv', { name: 'CuboMX' });

        // Create a temporary element to inspect the rendered output
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = renderedHtml;
        const renderedElement = tempDiv.firstElementChild;

        // Assert that the rendered HTML is the outerHTML of the original element
        expect(renderedElement.id).toBe('component-source');
        expect(renderedElement.getAttribute('mx-template')).toBe('fromDiv');
        expect(renderedElement.querySelector('p').textContent).toBe('Hello, CuboMX!');
    });
});
