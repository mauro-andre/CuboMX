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
});
