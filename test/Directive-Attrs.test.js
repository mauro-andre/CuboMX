import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

describe('CuboMX - mx-attrs Directive', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
    });

    it('should two-way bind element attributes, text, and html to an object', () => {
        // 1. Setup
        CuboMX.component('myComp', { myAttrs: null });
        document.body.innerHTML = `
            <div mx-data="my-comp">
                <a id="test-el" 
                   mx-attrs:my-comp.my-attrs 
                   href="/um/path" 
                   class="text-class active" 
                   data-id="123"><span>Um texto</span></a>
            </div>
        `;
        const el = document.getElementById('test-el');

        // 2. Initialize
        CuboMX.start();

        // 3. Hydration Assertions (DOM -> State)
        const attrs = CuboMX.myComp.myAttrs;
        expect(attrs).toBeDefined();
        expect(attrs.href).toBe('/um/path');
        expect(attrs.dataId).toBe('123'); // Changed from data-id to dataId
        expect(attrs.class).toEqual(['text-class', 'active']);
        expect(attrs.text).toBe('Um texto');
        expect(attrs.html).toBe('<span>Um texto</span>');

        // 4. Reactivity Assertions (State -> DOM)
        
        // Attribute
        attrs.href = '/novo/path';
        expect(el.getAttribute('href')).toBe('/novo/path');

        // camelCase to kebab-case attribute
        attrs.ariaLabel = 'An accessible label';
        expect(el.getAttribute('aria-label')).toBe('An accessible label');

        // Text
        attrs.text = 'Novo texto';
        expect(el.innerText).toBe('Novo texto');
        
        // HTML
        attrs.html = '<strong>Negrito</strong>';
        expect(el.innerHTML).toBe('<strong>Negrito</strong>');

        // Class (add)
        attrs.class.push('nova-classe');
        expect(el.classList.contains('text-class')).toBe(true);
        expect(el.classList.contains('active')).toBe(true);
        expect(el.classList.contains('nova-classe')).toBe(true);

        // Class (remove)
        attrs.class.splice(1, 1); // remove 'active'
        expect(el.classList.contains('text-class')).toBe(true);
        expect(el.classList.contains('active')).toBe(false);
        expect(el.classList.contains('nova-classe')).toBe(true);
    });

    it('should have text hydrated before init() is called and remain reactive', () => {
        let initialTextCorrect = false;
        
        CuboMX.component('myComp', {
            myAttrs: null,
            init() {
                // Use textContent and trim for a more robust comparison in jsdom
                initialTextCorrect = (this.myAttrs.text === this.$el.textContent.trim());
            }
        });

        document.body.innerHTML = `
            <div mx-data="my-comp">
                <div id="test-el" mx-attrs:my-comp.my-attrs>Texto Inicial</div>
            </div>
        `;
        const el = document.getElementById('test-el');

        CuboMX.start();

        // 1. Hydration Assertion (checked via init)
        expect(initialTextCorrect).toBe(true);
        expect(CuboMX.myComp.myAttrs.text).toBe('Texto Inicial');

        // 2. Reactivity Assertion
        CuboMX.myComp.myAttrs.text = 'Texto Alterado';
        expect(el.innerText).toBe('Texto Alterado');
    });

    it('should provide two-way binding for input value, like mx-model', () => {
        CuboMX.component('myComp', { myAttrs: null });
        document.body.innerHTML = `
            <div mx-data="my-comp">
                <input id="test-el" mx-attrs:my-comp.my-attrs value="Texto inicial">
            </div>
        `;
        const el = document.getElementById('test-el');

        CuboMX.start();
        const attrs = CuboMX.myComp.myAttrs;

        // 1. Hydration Assertion (DOM -> State)
        expect(attrs.value).toBe('Texto inicial');

        // 2. Reactivity Assertion (State -> DOM)
        attrs.value = 'Alterado pelo estado';
        expect(el.value).toBe('Alterado pelo estado');

        // 3. Reactivity Assertion (DOM -> State)
        el.value = 'Digitado pelo usuário';
        el.dispatchEvent(new Event('input'));
        expect(attrs.value).toBe('Digitado pelo usuário');
    });
});
