import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

describe('CuboMX Refactor - DOM Mutation Lifecycle', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
        vi.useFakeTimers();
    });

    it('should ONLY call init() on components added to DOM after start()', async () => {
        const initialInitSpy = vi.fn();
        const dynamicInitSpy = vi.fn();
        CuboMX.component('initialComp', { init: initialInitSpy });
        CuboMX.component('dynamicComp', { init: dynamicInitSpy });

        // 1. Inicia com um componente já no DOM
        document.body.innerHTML = '<div mx-data="initialComp"></div>';
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Verificação de sanidade: o init do primeiro componente foi chamado 1 vez
        expect(initialInitSpy).toHaveBeenCalledTimes(1);

        // 2. Adiciona dinamicamente um novo componente
        const div = document.createElement('div');
        div.setAttribute('mx-data', 'dynamicComp');
        document.body.appendChild(div);
        await vi.runAllTimersAsync();

        // 3. A asserção principal: o init do NOVO componente foi chamado
        expect(dynamicInitSpy).toHaveBeenCalledTimes(1);

        // 4. A asserção de robustez: o init do componente INICIAL NÃO foi chamado de novo
        expect(initialInitSpy).toHaveBeenCalledTimes(1);
    });

    it('should ONLY call destroy() on components removed from DOM', async () => {
        const destroySpyToRemove = vi.fn();
        const destroySpyToKeep = vi.fn(); // Este não deve ser chamado
        CuboMX.component('compToRemove', { destroy: destroySpyToRemove });
        CuboMX.component('compToKeep', { destroy: destroySpyToKeep });

        // 1. Inicia com dois componentes no DOM
        const divToRemove = document.createElement('div');
        divToRemove.setAttribute('mx-data', 'compToRemove');
        const divToKeep = document.createElement('div');
        divToKeep.setAttribute('mx-data', 'compToKeep');
        document.body.append(divToRemove, divToKeep);
        
        CuboMX.start();
        await vi.runAllTimersAsync();
        
        // 2. Remove apenas UM dos elementos
        document.body.removeChild(divToRemove);
        await vi.runAllTimersAsync();

        // 3. A asserção principal: o destroy do componente removido foi chamado
        expect(destroySpyToRemove).toHaveBeenCalledTimes(1);

        // 4. A asserção de robustez: o destroy do outro componente NÃO foi chamado
        expect(destroySpyToKeep).not.toHaveBeenCalled();
    });

    it('should bind directives on new elements that are not components themselves', async () => {
        // 1. Setup a store with a null property and a method.
        CuboMX.store('testStore', { 
            spanAttrs: null,
            changeText() {
                this.spanAttrs.text = 'Clicked';
            }
        });
        CuboMX.start();

        // 2. Dynamically add a new chunk of HTML using mx-attrs.
        const newContent = document.createElement('div');
        newContent.innerHTML = `
            <span mx-attrs="$testStore.spanAttrs">Hello</span>
            <button mx-on:click="$testStore.changeText()"></button>
        `;
        document.body.appendChild(newContent);
        await vi.runAllTimersAsync();

        const span = document.querySelector('span');
        const button = document.querySelector('button');
        const attrs = CuboMX.testStore.spanAttrs;

        // 3. Assert that hydration worked and directives are reactive.
        expect(attrs).toBeDefined();
        expect(attrs.text).toBe('Hello');
        expect(span.textContent).toBe('Hello');

        // 4. Simulate a click that changes the state.
        button.click();

        // 5. Assert that the change was reflected in the DOM.
        expect(attrs.text).toBe('Clicked');
        expect(span.innerText).toBe('Clicked');
    });

    it('should re-evaluate directives when child content is replaced', async () => {
        // 1. Initial Setup
        CuboMX.component('myComp', { myVar: null });
        const parentDiv = document.createElement('div');
        parentDiv.setAttribute('mx-data', 'myComp');
        parentDiv.innerHTML = `<div id="child" mx-attrs:my-prop="$myComp.myVar" my-prop="value1"></div>`;
        document.body.appendChild(parentDiv);

        CuboMX.start();
        await vi.runAllTimersAsync();

        // 2. Initial Assertion
        expect(CuboMX.myComp.myVar).toBe('value1');

        // 3. Replace the child element
        parentDiv.innerHTML = `<div id="child" mx-attrs:my-prop="$myComp.myVar" my-prop="value2"></div>`;
        await vi.runAllTimersAsync();

        // 4. Final Assertion
        expect(CuboMX.myComp.myVar).toBe('value2');
    });
});
