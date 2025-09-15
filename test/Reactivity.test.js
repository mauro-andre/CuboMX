import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

describe('CuboMX - Reactivity', () => {

    beforeEach(() => {
        CuboMX.reset();
    });

    it('should trigger a global watcher when a property changes', () => {
        const watcherSpy = vi.fn();
        CuboMX.store('theme', { isDark: false });
        CuboMX.watch('theme.isDark', watcherSpy);

        CuboMX.start();

        CuboMX.theme.isDark = true;

        expect(watcherSpy).toHaveBeenCalledTimes(1);
        expect(watcherSpy).toHaveBeenCalledWith(true, false); // (newValue, oldValue)
    });

    it('should support this.$watch inside a component/store', () => {
        const watcherSpy = vi.fn();

        CuboMX.store('app', {
            status: 'loading',
            init() {
                this.$watch('status', watcherSpy);
            }
        });

        CuboMX.start();

        CuboMX.app.status = 'ready';

        expect(watcherSpy).toHaveBeenCalledTimes(1);
        expect(watcherSpy).toHaveBeenCalledWith('ready', 'loading');
    });

    it('should allow calling global CuboMX.watch from within an init() method', () => {
        const watcherSpy = vi.fn();

        CuboMX.store('theme', { isDark: false });
        CuboMX.component('myComp', {
            init() {
                // Chama a API global de dentro de um hook de ciclo de vida
                CuboMX.watch('theme.isDark', watcherSpy);
            }
        });

        document.body.innerHTML = '<div mx-data="myComp"></div>';

        CuboMX.start();

        // Neste ponto, o init() foi chamado e o watch está ativo.
        // Agora, alteramos a propriedade.
        CuboMX.theme.isDark = true;

        expect(watcherSpy).toHaveBeenCalledTimes(1);
        expect(watcherSpy).toHaveBeenCalledWith(true, false);
    });

    it('should not trigger a watcher if the value is the same', () => {
        const watcherSpy = vi.fn();
        CuboMX.store('theme', { isDark: false });
        CuboMX.watch('theme.isDark', watcherSpy);
        CuboMX.start();

        CuboMX.theme.isDark = false; // Mesmo valor

        expect(watcherSpy).not.toHaveBeenCalled();
    });

    it('should trigger global reactivity for other directives when an mx-attrs property changes', () => {
        CuboMX.component('myComp', { data: null });
        document.body.innerHTML = `
            <div mx-data="my-comp">
                <div mx-attrs:my-comp.data is-active="true"></div>
                <span id="indicator" mx-show="myComp.data.isActive">Visible</span>
            </div>
        `;
        const indicator = document.getElementById('indicator');

        CuboMX.start();

        // Initial state check
        expect(indicator.style.display).not.toBe('none');

        // Change state via mx-attrs object
        CuboMX.myComp.data.isActive = false;

        // Assert that mx-show reacted to the change
        expect(indicator.style.display).toBe('none');
    });
});
