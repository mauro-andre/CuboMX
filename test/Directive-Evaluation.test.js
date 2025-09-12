import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX-refactor.js';

describe('CuboMX - Directive Evaluation', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
    });

    it('should initialize and reactively update mx-text', () => {
        CuboMX.component('counter', { value: 0 });

        // O span agora tem um conteúdo inicial que deve ser sobrescrito
        document.body.innerHTML = '<div mx-data="counter"><span mx-text="counter.value">original HTML</span></div>';

        CuboMX.start();

        const span = document.querySelector('span');
        
        // 1. Verifica se o conteúdo original foi SOBRESCRITO pelo estado inicial
        expect(span.innerText).toBe('0');

        // 2. Muda o estado
        CuboMX.counter.value = 5;

        // 3. Verifica se o DOM reagiu à mudança
        expect(span.innerText).toBe('5');
    });

    it('should initialize and reactively update mx-show', () => {
        CuboMX.component('modal', { isOpen: false });

        document.body.innerHTML = `
            <div mx-data="modal">
                <div mx-show="modal.isOpen" style="display: block;">Modal Content</div>
            </div>
        `;

        CuboMX.start();

        const modalContent = document.querySelector('div[mx-show]');

        // 1. Verifica se o elemento está escondido inicialmente (display: none)
        expect(modalContent.style.display).toBe('none');

        // 2. Muda o estado para exibir o elemento
        CuboMX.modal.isOpen = true;

        // 3. Verifica se o elemento voltou a ter seu display original
        expect(modalContent.style.display).toBe('block');

        // 4. Muda o estado para esconder novamente
        CuboMX.modal.isOpen = false;

        // 5. Verifica se foi escondido de novo
        expect(modalContent.style.display).toBe('none');
    });

    it('should correctly toggle visibility for elements with display: flex', () => {
        CuboMX.component('container', { isVisible: false });

        document.body.innerHTML = `
            <div mx-data="container">
                <div mx-show="container.isVisible" style="display: flex;">Flex Content</div>
            </div>
        `;

        CuboMX.start();

        const flexContent = document.querySelector('div[mx-show]');

        // 1. Initial state: should be hidden
        expect(flexContent.style.display).toBe('none');

        // 2. Change state to visible
        CuboMX.container.isVisible = true;

        // 3. Check if it's now display: flex
        expect(flexContent.style.display).toBe('flex');

        // 4. Change state to hidden again
        CuboMX.container.isVisible = false;

        // 5. Check if it's hidden again
        expect(flexContent.style.display).toBe('none');
    });

    it('should reactively update boolean attributes like :disabled', () => {
        CuboMX.component('form', { isLoading: true });
        document.body.innerHTML = '<div mx-data="form"><button :disabled="form.isLoading">Submit</button></div>';
        CuboMX.start();
        const button = document.querySelector('button');

        expect(button.hasAttribute('disabled')).toBe(true);

        CuboMX.form.isLoading = false;
        expect(button.hasAttribute('disabled')).toBe(false);
    });

    it('should reactively update standard attributes like :href', () => {
        CuboMX.component('user', { id: 123 });
        document.body.innerHTML = '<div mx-data="user"><a :href="`/users/${user.id}`">Profile</a></div>';
        CuboMX.start();
        const link = document.querySelector('a');

        expect(link.getAttribute('href')).toBe('/users/123');

        CuboMX.user.id = 456;
        expect(link.getAttribute('href')).toBe('/users/456');
    });

    it('should intelligently toggle classes for :class without affecting static ones', () => {
        CuboMX.component('status', { isActive: true, isError: false });
        document.body.innerHTML = `
            <div mx-data="status">
                <div class="static" :class="[status.isActive && 'active', status.isError && 'error'].filter(Boolean).join(' ')"></div>
            </div>
        `;
        CuboMX.start();
        const div = document.querySelector('.static');

        expect(div.classList.contains('static')).toBe(true);
        expect(div.classList.contains('active')).toBe(true);
        expect(div.classList.contains('error')).toBe(false);

        // Change one property
        CuboMX.status.isError = true;
        expect(div.classList.contains('static')).toBe(true);
        expect(div.classList.contains('active')).toBe(true);
        expect(div.classList.contains('error')).toBe(true);

        // Change another property
        CuboMX.status.isActive = false;
        expect(div.classList.contains('static')).toBe(true);
        expect(div.classList.contains('active')).toBe(false);
        expect(div.classList.contains('error')).toBe(true);
    });

    it('should handle mx-on:click events', () => {
        const clickHandler = vi.fn();
        CuboMX.component('buttonComp', { handleClick: clickHandler });
        document.body.innerHTML = `
            <div mx-data="buttonComp">
                <button mx-on:click="buttonComp.handleClick()"></button>
            </div>
        `;
        CuboMX.start();
        const button = document.querySelector('button');

        button.click();
        expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it('should expose $el and $event to mx-on expressions', () => {
        let receivedEl = null;
        let receivedEvent = null;
        CuboMX.component('buttonComp', {
            handleClick(el, evt) {
                receivedEl = el;
                receivedEvent = evt;
            }
        });
        document.body.innerHTML = `
            <div mx-data="buttonComp">
                <button mx-on:click="buttonComp.handleClick($el, $event)"></button>
            </div>
        `;
        CuboMX.start();
        const button = document.querySelector('button');

        button.click();
        expect(receivedEl).toBe(button);
        expect(receivedEvent).toBeInstanceOf(Event);
    });

    it('should handle the .prevent modifier', () => {
        CuboMX.component('formComp', {});
        document.body.innerHTML = `
            <form mx-data="formComp" mx-on:submit.prevent="() => {}">
                <button type="submit"></button>
            </form>
        `;
        CuboMX.start();
        const form = document.querySelector('form');
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        
        form.dispatchEvent(submitEvent);

        expect(submitEvent.defaultPrevented).toBe(true);
    });

    it('should handle the .stop modifier', () => {
        const parentHandler = vi.fn();
        CuboMX.component('eventComp', {});
        // Register the spy on the global object so the expression can find it
        CuboMX.parentHandler = parentHandler;

        document.body.innerHTML = `
            <div mx-on:click="parentHandler()" mx-data="eventComp">
                <button mx-on:click.stop="() => {}"></button>
            </div>
        `;

        CuboMX.start();
        const button = document.querySelector('button');

        button.click();
        expect(parentHandler).not.toHaveBeenCalled();
    });

    it('should handle two-way data binding with mx-model', () => {
        CuboMX.component('form', { username: 'Mauro' });
        document.body.innerHTML = `
            <div mx-data="form">
                <input type="text" mx-model="form.username">
                <span mx-text="form.username"></span>
            </div>
        `;
        CuboMX.start();
        const input = document.querySelector('input');
        const span = document.querySelector('span');

        // 1. Initial state check
        expect(input.value).toBe('Mauro');
        expect(span.innerText).toBe('Mauro');

        // 2. Programmatic state change should update input and span
        CuboMX.form.username = 'Andre';
        expect(input.value).toBe('Andre');
        expect(span.innerText).toBe('Andre');

        // 3. User input should update state and other bindings (span)
        input.value = 'Cubo';
        input.dispatchEvent(new Event('input')); // Simulate input event
        
        expect(CuboMX.form.username).toBe('Cubo');
        expect(span.innerText).toBe('Cubo');
    });
});
