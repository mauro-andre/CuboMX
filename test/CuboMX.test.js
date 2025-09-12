import { describe, it, expect, beforeEach, vi } from 'vitest';
// O caminho foi ajustado para sair da pasta /test e entrar em /src
import { CuboMX } from '../src/CuboMX.js';

// Corrige o erro "ReferenceError: Node is not defined" no ambiente JSDOM
global.Node = window.Node;

// Mock para funções de tempo, se necessário no futuro
vi.useFakeTimers();

describe('CuboMX Core Directives', () => {

    beforeEach(() => {
        // Limpa o DOM e reseta o estado interno do CuboMX antes de cada teste
        document.body.innerHTML = '';
        CuboMX.reset(); // Usa a nova função de reset
        vi.clearAllTimers();
    });

    it('should initialize and render state with mx-text', async () => {
        // 1. Define o HTML do nosso "mundo" para este teste
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <span mx-text="message"></span>
            </div>
        `;

        // 2. Define e registra o componente do teste
        const myComponent = {
            message: 'Hello World'
        };
        CuboMX.component('myComponent', myComponent);

        // 3. Inicia o framework para escanear o DOM virtual
        CuboMX.start();

        // Força a execução de promises pendentes para garantir que a inicialização assíncrona complete
        await vi.runAllTimersAsync();

        // 4. Busca o elemento no JSDOM e verifica o resultado
        const span = document.querySelector('span');
        expect(span.innerText).toBe('Hello World');
    });

    it('should react to state changes', async () => {
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <span mx-text="message"></span>
            </div>
        `;

        const myComponent = {
            message: 'Initial'
        };
        CuboMX.component('myComponent', myComponent);
        CuboMX.start();
        await vi.runAllTimersAsync();

        const span = document.querySelector('span');
        expect(span.innerText).toBe('Initial');

        // Altera o estado do componente diretamente
        CuboMX.myComponent.message = 'Updated';

        // Verifica se a diretiva mx-text reagiu à mudança
        expect(span.innerText).toBe('Updated');
    });

    it('should handle user events with mx-on:click', async () => {
        document.body.innerHTML = `
            <div mx-data="myComponent">
                <button mx-on:click="changeMessage()"></button>
                <span mx-text="message"></span>
            </div>
        `;

        const myComponent = {
            message: 'Initial',
            changeMessage() {
                this.message = 'Clicked!';
            }
        };
        CuboMX.component('myComponent', myComponent);
        CuboMX.start();
        await vi.runAllTimersAsync();

        const button = document.querySelector('button');
        const span = document.querySelector('span');

        expect(span.innerText).toBe('Initial');

        // Simula o clique do usuário no botão
        button.click();
        await vi.runAllTimersAsync();

        // Verifica se o estado e o DOM foram atualizados
        expect(span.innerText).toBe('Clicked!');
    });
});
