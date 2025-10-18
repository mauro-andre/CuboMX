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

    it('should preserve object identity for class-based singletons', async () => {
        class IdentitySingleton extends MxComponent {
            value = 'original';
        }

        const singletonInstance = new IdentitySingleton();
        CuboMX.component('identitySingleton', singletonInstance);
        document.body.innerHTML = '<div mx-data="identitySingleton"></div>';

        CuboMX.start();
        await vi.runAllTimersAsync();

        // With the correct implementation, the proxy wraps the original instance.
        // Changes to the original instance should be reflected through the proxy.
        singletonInstance.value = 'changed from outside';

        // This assertion will fail with the current cloning implementation,
        // but will pass once the singleton logic is corrected to use the original instance.
        expect(CuboMX.identitySingleton.value).toBe('changed from outside');
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

    it('should execute singleton class methods from DOM events', async () => {
        class Counter extends MxComponent {
            count: number = 0;
            incrementCalled = vi.fn();
            decrementCalled = vi.fn();

            increment() {
                this.incrementCalled();
                this.count++;
            }

            decrement() {
                this.decrementCalled();
                this.count--;
            }

            reset() {
                this.count = 0;
            }
        }

        CuboMX.component('counter', new Counter());
        document.body.innerHTML = `
            <div mx-data="counter">
                <button id="inc-btn" mx-on:click="increment()">+</button>
                <button id="dec-btn" mx-on:click="decrement()">-</button>
                <button id="reset-btn" mx-on:click="reset()">Reset</button>
                <span id="count" ::text="count">0</span>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        expect(CuboMX.counter.count).toBe(0);

        const incBtn = document.getElementById('inc-btn')!;
        const decBtn = document.getElementById('dec-btn')!;
        const resetBtn = document.getElementById('reset-btn')!;

        incBtn.click();
        expect(CuboMX.counter.incrementCalled).toHaveBeenCalledTimes(1);
        expect(CuboMX.counter.count).toBe(1);

        incBtn.click();
        incBtn.click();
        expect(CuboMX.counter.incrementCalled).toHaveBeenCalledTimes(3);
        expect(CuboMX.counter.count).toBe(3);

        decBtn.click();
        expect(CuboMX.counter.decrementCalled).toHaveBeenCalledTimes(1);
        expect(CuboMX.counter.count).toBe(2);

        resetBtn.click();
        expect(CuboMX.counter.count).toBe(0);
    });

    it('should execute factory class methods from DOM events independently', async () => {
        class Toggle extends MxComponent {
            isOn: boolean = false;
            toggleCalled = vi.fn();
            turnOnCalled = vi.fn();
            turnOffCalled = vi.fn();

            toggle() {
                this.toggleCalled();
                this.isOn = !this.isOn;
            }

            turnOn() {
                this.turnOnCalled();
                this.isOn = true;
            }

            turnOff() {
                this.turnOffCalled();
                this.isOn = false;
            }
        }

        CuboMX.component('toggle', () => new Toggle());
        document.body.innerHTML = `
            <div mx-data="toggle()" mx-ref="toggle1">
                <button id="toggle1-btn" mx-on:click="toggle()">Toggle 1</button>
                <button id="on1-btn" mx-on:click="turnOn()">On</button>
                <button id="off1-btn" mx-on:click="turnOff()">Off</button>
            </div>
            <div mx-data="toggle()" mx-ref="toggle2">
                <button id="toggle2-btn" mx-on:click="toggle()">Toggle 2</button>
                <button id="on2-btn" mx-on:click="turnOn()">On</button>
                <button id="off2-btn" mx-on:click="turnOff()">Off</button>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        const toggle1 = CuboMX.toggle1 as Toggle;
        const toggle2 = CuboMX.toggle2 as Toggle;

        expect(toggle1.isOn).toBe(false);
        expect(toggle2.isOn).toBe(false);

        document.getElementById('toggle1-btn')!.click();
        expect(toggle1.toggleCalled).toHaveBeenCalledTimes(1);
        expect(toggle1.isOn).toBe(true);
        expect(toggle2.isOn).toBe(false);
        expect(toggle2.toggleCalled).not.toHaveBeenCalled();

        document.getElementById('toggle2-btn')!.click();
        expect(toggle2.toggleCalled).toHaveBeenCalledTimes(1);
        expect(toggle2.isOn).toBe(true);
        expect(toggle1.isOn).toBe(true);

        document.getElementById('off1-btn')!.click();
        expect(toggle1.turnOffCalled).toHaveBeenCalledTimes(1);
        expect(toggle1.isOn).toBe(false);
        expect(toggle2.isOn).toBe(true);

        document.getElementById('on2-btn')!.click();
        expect(toggle2.turnOnCalled).toHaveBeenCalledTimes(1);
        expect(toggle2.isOn).toBe(true);

        document.getElementById('off2-btn')!.click();
        expect(toggle2.isOn).toBe(false);
        expect(toggle1.isOn).toBe(false);
    });

    it('should handle methods with parameters from DOM events', async () => {
        class Calculator extends MxComponent {
            result: number = 0;
            addCalled = vi.fn();
            multiplyCalled = vi.fn();

            add(value: number) {
                this.addCalled(value);
                this.result += value;
            }

            multiply(factor: number) {
                this.multiplyCalled(factor);
                this.result *= factor;
            }

            clear() {
                this.result = 0;
            }
        }

        CuboMX.component('calc', new Calculator());
        document.body.innerHTML = `
            <div mx-data="calc">
                <button id="add5-btn" mx-on:click="add(5)">Add 5</button>
                <button id="add10-btn" mx-on:click="add(10)">Add 10</button>
                <button id="mult2-btn" mx-on:click="multiply(2)">Multiply by 2</button>
                <button id="clear-btn" mx-on:click="clear()">Clear</button>
                <span id="result" ::text="result">0</span>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        expect(CuboMX.calc.result).toBe(0);

        document.getElementById('add5-btn')!.click();
        expect(CuboMX.calc.addCalled).toHaveBeenCalledWith(5);
        expect(CuboMX.calc.result).toBe(5);

        document.getElementById('add10-btn')!.click();
        expect(CuboMX.calc.addCalled).toHaveBeenCalledWith(10);
        expect(CuboMX.calc.result).toBe(15);

        document.getElementById('mult2-btn')!.click();
        expect(CuboMX.calc.multiplyCalled).toHaveBeenCalledWith(2);
        expect(CuboMX.calc.result).toBe(30);

        document.getElementById('clear-btn')!.click();
        expect(CuboMX.calc.result).toBe(0);
    });

    it('should allow factory methods to access $el from DOM events', async () => {
        class Panel extends MxComponent {
            isExpanded: boolean = false;
            elementAccessCalled = vi.fn();

            toggleExpand() {
                this.isExpanded = !this.isExpanded;
                this.elementAccessCalled(this.$el.id);
            }

            getTitle() {
                return this.$el.querySelector('h3')?.textContent || '';
            }
        }

        CuboMX.component('panel', () => new Panel());
        document.body.innerHTML = `
            <div mx-data="panel()" mx-ref="panel1" id="panel-1">
                <h3>Panel 1</h3>
                <button id="toggle-panel1" mx-on:click="toggleExpand()">Toggle</button>
            </div>
            <div mx-data="panel()" mx-ref="panel2" id="panel-2">
                <h3>Panel 2</h3>
                <button id="toggle-panel2" mx-on:click="toggleExpand()">Toggle</button>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        const panel1 = CuboMX.panel1 as Panel;
        const panel2 = CuboMX.panel2 as Panel;

        expect(panel1.isExpanded).toBe(false);
        expect(panel2.isExpanded).toBe(false);

        document.getElementById('toggle-panel1')!.click();
        expect(panel1.elementAccessCalled).toHaveBeenCalledWith('panel-1');
        expect(panel1.isExpanded).toBe(true);
        expect(panel2.isExpanded).toBe(false);

        document.getElementById('toggle-panel2')!.click();
        expect(panel2.elementAccessCalled).toHaveBeenCalledWith('panel-2');
        expect(panel2.isExpanded).toBe(true);

        expect(panel1.getTitle()).toBe('Panel 1');
        expect(panel2.getTitle()).toBe('Panel 2');
    });
});
