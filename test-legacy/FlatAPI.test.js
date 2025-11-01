import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

describe('CuboMX Refactor - Flat API & Component Registration', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        if (CuboMX.reset) CuboMX.reset();
    });

    it('should expose stores directly on the CuboMX object', () => {
        CuboMX.store('theme', { isDark: false });
        CuboMX.start();
        expect(CuboMX.theme).toBeDefined();
        expect(CuboMX.theme.isDark).toBe(false);
    });

    it('should expose singletons (components without `()`) directly on the CuboMX object', () => {
        CuboMX.component('user', { name: 'Mauro' });
        document.body.innerHTML = '<div mx-data="user"></div>';
        CuboMX.start();
        expect(CuboMX.user).toBeDefined();
        expect(CuboMX.user.name).toBe('Mauro');
    });

    it('should expose factories with mx-ref directly on the CuboMX object by their ref name', () => {
        CuboMX.component('form', () => ({ email: '' }));
        document.body.innerHTML = '<div mx-data="form()" mx-ref="contactForm"></div>';
        CuboMX.start();
        expect(CuboMX.contactForm).toBeDefined();
        expect(CuboMX.contactForm.email).toBe('');
    });

    it('should generate and set an mx-ref for anonymous factories', () => {
        CuboMX.component('form', () => ({ email: 'test@test.com' }));
        const div = document.createElement('div');
        div.setAttribute('mx-data', 'form()');
        document.body.appendChild(div);

        // Antes de iniciar, o elemento não tem mx-ref
        expect(div.hasAttribute('mx-ref')).toBe(false);

        CuboMX.start();

        // Depois de iniciar, o CuboMX deve ter adicionado o atributo
        expect(div.hasAttribute('mx-ref')).toBe(true);
        const generatedRef = div.getAttribute('mx-ref');
        expect(generatedRef).toBeDefined();
        
        // E o proxy deve estar acessível globalmente com esse nome gerado
        expect(CuboMX[generatedRef]).toBeDefined();
        expect(CuboMX[generatedRef].email).toBe('test@test.com');
    });

    it('should call init() on all new components and stores AFTER they are all created', () => {
        const initSpyStore = vi.fn();
        const initSpySingleton = vi.fn();
        const initSpyFactory = vi.fn();

        // Um componente que tentará acessar outro em seu init
        const userSingleton = {
            init() {
                initSpySingleton();
                // Isso não deve falhar, pois o proxy contactForm já deve existir
                expect(CuboMX.contactForm).toBeDefined();
            }
        };

        CuboMX.store('theme', { init: initSpyStore });
        CuboMX.component('user', userSingleton);
        CuboMX.component('form', () => ({ init: initSpyFactory }));

        document.body.innerHTML = `
            <div mx-data="user"></div>
            <div mx-data="form()" mx-ref="contactForm"></div>
        `;

        CuboMX.start();

        expect(initSpyStore).toHaveBeenCalled();
        expect(initSpySingleton).toHaveBeenCalled();
        expect(initSpyFactory).toHaveBeenCalled();
    });
});
