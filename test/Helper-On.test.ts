import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CuboMX, MxComponent, ItemArrayProxy, ItemProxy } from '../src/CuboMX.js';

interface ListItem extends ItemProxy {
    id: number;
}

describe('CuboMX.on() Helper - TS Classes', () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should attach an event listener and provide (el, event, item) to the callback', async () => {
        const clickSpy = vi.fn();

        class ListComponent extends MxComponent {
            items!: ItemArrayProxy<ListItem>;
            
            handleItemClick = clickSpy;

            init() {
                const listItems = this.$el.querySelectorAll('li');
                listItems.forEach(li => {
                    CuboMX.on(li as HTMLElement, 'click', this.handleItemClick);
                });
            }
        }

        CuboMX.component('listComp', new ListComponent());

        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul>
                    <li mx-item="items" ::data-id="id" data-id="1">Item 1</li>
                    <li mx-item="items" ::data-id="id" data-id="2">Item 2</li>
                </ul>
            </div>
        `;

        CuboMX.start();
        await vi.runAllTimersAsync();

        const secondLi = document.querySelectorAll('li')[1];
        secondLi.click();

        expect(clickSpy).toHaveBeenCalledTimes(1);

        const [elArg, eventArg, itemArg] = clickSpy.mock.calls[0];

        expect(elArg).toBe(secondLi);
        expect(eventArg).toBeInstanceOf(MouseEvent);

        const expectedItem = (CuboMX.listComp as ListComponent).items[1];
        expect(itemArg).toBe(expectedItem);
        expect(itemArg.id).toBe(2);
    });

    it('should maintain the correct "this" context inside the callback', async () => {
        let contextInsideCallback: ListComponent | null = null;

        class ListComponent extends MxComponent {
            items!: ItemArrayProxy<ListItem>;
            myProperty: string = 'hello typescript';

            handleItemClick() {
                contextInsideCallback = this;
            }

            init() {
                const listItem = this.$el.querySelector('li')!;
                CuboMX.on(listItem, 'click', this.handleItemClick);
            }
        }

        CuboMX.component('listComp', new ListComponent());

        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul>
                    <li mx-item="items">Item 1</li>
                </ul>
            </div>
        `;

        CuboMX.start();
        await vi.runAllTimersAsync();

        document.querySelector('li')!.click();

        expect(contextInsideCallback).not.toBeNull();
        expect(contextInsideCallback!.myProperty).toBe('hello typescript');
    });

    it('should handle the .prevent modifier', async () => {
        const clickSpy = vi.fn();

        class LinkComponent extends MxComponent {
            handleClick = clickSpy;
            init() {
                const link = this.$el.querySelector('a')!;
                CuboMX.on(link, 'click.prevent', this.handleClick);
            }
        }

        CuboMX.component('linkComp', new LinkComponent());

        document.body.innerHTML = `
            <div mx-data="linkComp">
                <a href="#test">Click me</a>
            </div>
        `;

        CuboMX.start();
        await vi.runAllTimersAsync();

        const link = document.querySelector('a')!;
        const clickEvent = new MouseEvent('click', { cancelable: true, bubbles: true });
        link.dispatchEvent(clickEvent);

        expect(clickSpy).toHaveBeenCalledTimes(1);
        const [, eventArg] = clickSpy.mock.calls[0]; // event is the second argument
        expect(eventArg.defaultPrevented).toBe(true);
    });

    it('should correctly provide el, event, and a defined item from an mx-item context', async () => {
        const comprehensiveSpy = vi.fn();

        class ListComponent extends MxComponent {
            items!: ItemArrayProxy<ListItem>;
            handleClick = comprehensiveSpy;
            init() {
                const listItems = this.$el.querySelectorAll('li');
                listItems.forEach(li => {
                    CuboMX.on(li as HTMLElement, 'click', this.handleClick);
                });
            }
        }

        CuboMX.component('listComp', new ListComponent());

        document.body.innerHTML = `
            <div mx-data="listComp">
                <ul>
                    <li mx-item="items" ::data-id="id" data-id="10"><span>Item 10</span></li>
                    <li mx-item="items" ::data-id="id" data-id="20"><span>Item 20</span></li>
                </ul>
            </div>
        `;

        CuboMX.start();
        await vi.runAllTimersAsync();

        const firstLi = document.querySelector('li')!;
        firstLi.click();

        expect(comprehensiveSpy).toHaveBeenCalledTimes(1);

        const [elArg, eventArg, itemArg] = comprehensiveSpy.mock.calls[0];

        // 1. Test el
        expect(elArg).toBe(firstLi);

        // 2. Test event
        expect(eventArg).toBeInstanceOf(MouseEvent);

        // 3. Test item
        expect(itemArg).toBeDefined();
        expect(itemArg.id).toBe(10);
        expect(itemArg).toBe((CuboMX.listComp as ListComponent).items[0]);
    });
});