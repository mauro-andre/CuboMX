import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';
import { MxComponent } from '../src/MxComponent.js';

describe('CuboMX Class-based Components', () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    class TestStore {
        value: string = 'initial';
        init = vi.fn();
        destroy = vi.fn();
        onDOMUpdate = vi.fn();
        changeValue() { this.value = 'changed'; }
    }

    it('should correctly handle class-based stores', async () => {
        const storeInstance = new TestStore();
        CuboMX.store('myStore', storeInstance);
        CuboMX.start();
        await vi.runAllTimersAsync();

        expect(CuboMX.myStore.init).toHaveBeenCalledTimes(1);
        expect(CuboMX.myStore.value).toBe('initial');

        CuboMX.myStore.changeValue();
        expect(CuboMX.myStore.value).toBe('changed');

        window.dispatchEvent(new CustomEvent('cubo:dom-updated'));
        expect(CuboMX.myStore.onDOMUpdate).toHaveBeenCalledTimes(1);

        const destroySpy = CuboMX.myStore.destroy;
        CuboMX.reset();
        expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    class TestSingleton extends MxComponent {
        name: string = 'Singleton';
        init = vi.fn();
        destroy = vi.fn();
        onDOMUpdate = vi.fn();
        changeName() { this.name = 'Singleton Changed'; }
    }

    it('should correctly handle class-based singletons', async () => {
        const singletonInstance = new TestSingleton();
        CuboMX.component('mySingleton', singletonInstance);
        document.body.innerHTML = '<div mx-data="mySingleton" id="singleton-root"></div>';
        CuboMX.start();
        await vi.runAllTimersAsync();

        expect(CuboMX.mySingleton.init).toHaveBeenCalledTimes(1);
        expect(CuboMX.mySingleton.name).toBe('Singleton');

        expect(CuboMX.mySingleton.$el).toBeInstanceOf(HTMLElement);
        expect(CuboMX.mySingleton.$el.id).toBe('singleton-root');

        CuboMX.mySingleton.changeName();
        expect(CuboMX.mySingleton.name).toBe('Singleton Changed');

        CuboMX.mySingleton.onDOMUpdate.mockClear();
        window.dispatchEvent(new CustomEvent('cubo:dom-updated'));
        expect(CuboMX.mySingleton.onDOMUpdate).toHaveBeenCalledTimes(1);

        const destroySpy = CuboMX.mySingleton.destroy;
        document.getElementById('singleton-root')?.remove();
        await vi.runAllTimersAsync();
        expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    class TestFactory extends MxComponent {
        id: number = 0;
        init = vi.fn();
        destroy = vi.fn();
        onDOMUpdate = vi.fn();
        changeId(newId: number) { this.id = newId; }
    }

    it('should correctly handle class-based factories', async () => {
        CuboMX.component('myFactory', () => new TestFactory());
        document.body.innerHTML = `
            <div mx-data="myFactory()" mx-ref="instance1" id="factory-root-1"></div>
            <div mx-data="myFactory()" mx-ref="instance2" id="factory-root-2"></div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        const instance1 = CuboMX.instance1 as TestFactory;
        const instance2 = CuboMX.instance2 as TestFactory;
        expect(instance1.init).toHaveBeenCalledTimes(1);
        expect(instance2.init).toHaveBeenCalledTimes(1);

        expect(instance1).not.toBe(instance2);

        expect(instance1.$el.id).toBe('factory-root-1');
        expect(instance2.$el.id).toBe('factory-root-2');

        instance1.changeId(10);
        expect(instance1.id).toBe(10);
        expect(instance2.id).toBe(0);

        document.getElementById('factory-root-1')?.remove();
        await vi.runAllTimersAsync();
        expect(instance1.destroy).toHaveBeenCalledTimes(1);
        expect(instance2.destroy).not.toHaveBeenCalled();
    });

    it('should correctly use $watch within class-based components', async () => {
        const watcherSpy = vi.fn();
        class WatcherComponent extends MxComponent {
            count: number = 0;
            init() {
                this.$watch('count', watcherSpy);
            }
        }
        CuboMX.component('watcherComp', new WatcherComponent());
        document.body.innerHTML = '<div mx-data="watcherComp"></div>';
        CuboMX.start();
        await vi.runAllTimersAsync();

        CuboMX.watcherComp.count = 1;
        expect(watcherSpy).toHaveBeenCalledTimes(1);
        expect(watcherSpy).toHaveBeenCalledWith(1, 0);
    });

    it('should correctly use $watchArrayItems within class-based components', async () => {
        const arrayWatcherSpy = vi.fn();
        class ArrayWatcherComponent extends MxComponent {
            items: any[] = [];
            init() {
                this.$watchArrayItems('items', arrayWatcherSpy);
            }
        }
        CuboMX.component('arrayWatcherComp', new ArrayWatcherComponent());
        document.body.innerHTML = `
            <div mx-data="arrayWatcherComp">
                <ul id="list">
                    <li mx-item="items" ::text="name">Item 1</li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        arrayWatcherSpy.mockClear();

        CuboMX.arrayWatcherComp.items.add({ name: 'Item 2' });
        await vi.runAllTimersAsync();

        expect(arrayWatcherSpy).toHaveBeenCalledTimes(1);
        expect(arrayWatcherSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'add' }));
    });

    it('should ensure complete independence between factory instances with complex state', async () => {
        class ComplexFactory extends MxComponent {
            count: number = 0;
            config: { enabled: boolean; options: string[] } = {
                enabled: true,
                options: ['option1']
            };
            items: string[] = [];
            metadata: { id: number; name: string } = { id: 0, name: 'default' };

            increment() { this.count++; }
            addOption(opt: string) { this.config.options.push(opt); }
            toggleEnabled() { this.config.enabled = !this.config.enabled; }
            addItem(item: string) { this.items.push(item); }
            updateMetadata(id: number, name: string) {
                this.metadata.id = id;
                this.metadata.name = name;
            }
        }

        CuboMX.component('complexFactory', () => new ComplexFactory());
        document.body.innerHTML = `
            <div mx-data="complexFactory()" mx-ref="inst1" id="complex-1"></div>
            <div mx-data="complexFactory()" mx-ref="inst2" id="complex-2"></div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        const inst1 = CuboMX.inst1 as ComplexFactory;
        const inst2 = CuboMX.inst2 as ComplexFactory;

        expect(inst1.count).toBe(0);
        expect(inst2.count).toBe(0);
        expect(inst1.config.enabled).toBe(true);
        expect(inst2.config.enabled).toBe(true);

        inst1.increment();
        inst1.increment();
        expect(inst1.count).toBe(2);
        expect(inst2.count).toBe(0);

        inst1.addOption('option2');
        inst1.addOption('option3');
        expect(inst1.config.options).toEqual(['option1', 'option2', 'option3']);
        expect(inst2.config.options).toEqual(['option1']);

        inst1.toggleEnabled();
        expect(inst1.config.enabled).toBe(false);
        expect(inst2.config.enabled).toBe(true);

        inst2.addItem('item1');
        inst2.addItem('item2');
        expect(inst2.items).toEqual(['item1', 'item2']);
        expect(inst1.items).toEqual([]);

        inst2.updateMetadata(42, 'custom');
        expect(inst2.metadata).toEqual({ id: 42, name: 'custom' });
        expect(inst1.metadata).toEqual({ id: 0, name: 'default' });

        inst1.addItem('inst1-item');
        inst1.updateMetadata(99, 'inst1-name');
        expect(inst1.items).toEqual(['inst1-item']);
        expect(inst1.metadata).toEqual({ id: 99, name: 'inst1-name' });
        expect(inst2.items).toEqual(['item1', 'item2']);
        expect(inst2.metadata).toEqual({ id: 42, name: 'custom' });

        expect(inst1.$el.id).toBe('complex-1');
        expect(inst2.$el.id).toBe('complex-2');
        expect(inst1.$el).not.toBe(inst2.$el);

        expect(inst1).not.toBe(inst2);
    });
});
