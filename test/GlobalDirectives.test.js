import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

// Configura o ambiente de teste
global.Node = window.Node;
vi.useFakeTimers();

describe('CuboMX Global Directives', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
        vi.clearAllTimers();
    });

    it('should call a store method from mx-on when outside a component', async () => {
        // 1. Cria uma função "espiã" (spy) para sabermos se o método foi chamado.
        const methodSpy = vi.fn();

        // 2. Define e registra o store, usando o spy como o método.
        const testStore = {
            myMethod: methodSpy,
        };
        CuboMX.store('testStore', testStore);

        // 3. Define o HTML sem nenhum componente mx-data.
        document.body.innerHTML = `
            <button mx-on:click="$stores.testStore.myMethod()"></button>
        `;

        // 4. Inicia o framework e aguarda a conclusão da inicialização.
        CuboMX.start();
        await vi.runAllTimersAsync();

        // 5. Encontra o botão e simula um clique.
        const button = document.querySelector('button');
        button.click();

        // 6. Verifica se a função espiã foi chamada.
        expect(methodSpy).toHaveBeenCalled();
        expect(methodSpy).toHaveBeenCalledTimes(1);
    });

    it('should call a store method from mx-on when INSIDE a component', async () => {
        // 1. Cria uma função "espiã" (spy).
        const methodSpy = vi.fn();

        // 2. Define e registra o store.
        const testStore = {
            myMethod: methodSpy,
        };
        CuboMX.store('testStore', testStore);

        // 3. Define um componente "dummy" apenas para criar o contexto.
        CuboMX.component('dummyComponent', {});

        // 4. Define o HTML com o botão DENTRO de um componente mx-data.
        document.body.innerHTML = `
            <div mx-data="dummyComponent">
                <button mx-on:click="$stores.testStore.myMethod()"></button>
            </div>
        `;

        // 5. Inicia o framework e aguarda a inicialização.
        CuboMX.start();
        await vi.runAllTimersAsync();

        // 6. Encontra o botão e simula um clique.
        const button = document.querySelector('button');
        button.click();

        // 7. Verifica se a função espiã foi chamada (este teste deve passar).
        expect(methodSpy).toHaveBeenCalled();
        expect(methodSpy).toHaveBeenCalledTimes(1);
    });
});
