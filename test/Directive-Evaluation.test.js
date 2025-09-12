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
});
