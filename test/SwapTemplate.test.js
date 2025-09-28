import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX.swapTemplate", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
        document.title = "";
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should swap template content into a target selector', () => {
        document.body.innerHTML = `
            <div id="container">Original Content</div>
            <template mx-template="swappable">New Content</template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('swappable', { target: '#container:innerHTML' });

        expect(document.getElementById('container').textContent).toBe('New Content');
    });

    it('should use metadata from template for history when history option is true', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="nav-link" page-title="New Page" data-url="/new-page">
                <h1>New Page</h1>
            </template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('nav-link', { target: '#container', history: true });

        expect(document.title).toBe('New Page');
        expect(pushStateSpy).toHaveBeenCalledWith({ swaps: [], title: 'New Page' }, 'New Page', '/new-page');
    });

    it('should allow options to override template metadata for history', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="nav-link" page-title="Old Title" data-url="/old-path">
                <h1>New Page</h1>
            </template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('nav-link', { 
            target: '#container', 
            history: true, 
            pageTitle: 'Overridden Title', 
            url: '/overridden-path' 
        });

        expect(document.title).toBe('Overridden Title');
        expect(pushStateSpy).toHaveBeenCalledWith({ swaps: [], title: 'Overridden Title' }, 'Overridden Title', '/overridden-path');
    });

    it('should NOT update history if history option is explicitly false', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="nav-link" page-title="New Page" data-url="/new-page">
                <h1>New Page</h1>
            </template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('nav-link', { target: '#container:innerHTML', history: false });

        expect(pushStateSpy).not.toHaveBeenCalled();
        expect(document.title).not.toBe('New Page');
    });

    it('should implicitly update history if history option is omitted and url is present', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="nav-link" page-title="New Page" data-url="/new-page">
                <h1>New Page</h1>
            </template>
        `;
        CuboMX.start();

        CuboMX.swapTemplate('nav-link', { target: '#container:innerHTML' });

        expect(document.title).toBe('New Page');
        expect(pushStateSpy).toHaveBeenCalledWith({ swaps: [], title: 'New Page' }, 'New Page', '/new-page');
    });

    it('should do nothing and log an error if template does not exist', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        document.body.innerHTML = `<div id="container">Original</div>`;
        CuboMX.start();

        CuboMX.swapTemplate('non-existent', { target: '#container:innerHTML' });

        expect(document.getElementById('container').textContent).toBe('Original'); // Content should not change
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Template 'non-existent' not found."));
    });

    it('should implicitly enable history when url is passed in options', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `<div id="container"></div><template mx-template="t1">Test</template>`;
        CuboMX.start();

        CuboMX.swapTemplate('t1', {
            target: '#container:innerHTML',
            url: '/implicit-on',
            pageTitle: 'Implicit On'
        });

        expect(document.title).toBe('Implicit On');
        expect(pushStateSpy).toHaveBeenCalledWith(expect.any(Object), 'Implicit On', '/implicit-on');
    });

    it('should implicitly disable history when no url is provided', () => {
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        document.body.innerHTML = `<div id="container">Old</div><template mx-template="t2">New</template>`;
        const originalTitle = "Original Title";
        document.title = originalTitle;
        CuboMX.start();

        CuboMX.swapTemplate('t2', { target: '#container:innerHTML' });

        expect(document.getElementById('container').textContent).toBe('New'); // a swap happened
        expect(pushStateSpy).not.toHaveBeenCalled();
        expect(document.title).toBe(originalTitle); // title did not change
    });

    it('should initialize a component with the provided initial state', async () => {
        const stateComp = () => ({
            title: 'Default Title',
            active: false
        });
        CuboMX.component('stateComp', stateComp);
    
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="state-template">
                <div mx-data="stateComp()" mx-ref="myInstance">
                    <h1 :text="title">Template Title</h1>
                    <span mx-show="active">Active</span>
                </div>
            </template>
        `;
        CuboMX.start();
    
        CuboMX.swapTemplate('state-template', {
            target: '#container:innerHTML',
            state: {
                stateComp: {
                    title: 'Initial State Title',
                    active: true
                }
            }
        });

        await new Promise(resolve => setTimeout(resolve, 0));
    
        const h1 = document.querySelector('#container h1');
        const span = document.querySelector('#container span');
    
        expect(h1.textContent).toBe('Initial State Title');
        expect(span.style.display).not.toBe('none');
        expect(CuboMX.myInstance.title).toBe('Initial State Title');
        expect(CuboMX.myInstance.active).toBe(true);
    });

    it('should apply the same initial state to all instances of the same component type', async () => {
        const itemComp = () => ({ value: 0 });
        CuboMX.component('itemComp', itemComp);
    
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="list-template">
                <div mx-data="itemComp()">
                    <span :text="value"></span>
                </div>
                <div mx-data="itemComp()">
                    <span :text="value"></span>
                </div>
            </template>
        `;
        CuboMX.start();
    
        CuboMX.swapTemplate('list-template', {
            target: '#container:innerHTML',
            state: {
                itemComp: { value: 99 }
            }
        });

        await new Promise(resolve => setTimeout(resolve, 0));
    
        const spans = document.querySelectorAll('#container span');
        expect(spans.length).toBe(2);
        expect(spans[0].textContent).toBe('99');
        expect(spans[1].textContent).toBe('99');
    });

    it('should apply correct initial state to different components in the same template', async () => {
        CuboMX.component('compA', () => ({ text: 'Default A' }));
        CuboMX.component('compB', () => ({ text: 'Default B' }));
    
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="mixed-template">
                <div mx-data="compA()"><p :text="text"></p></div>
                <div mx-data="compB()"><h3 :text="text"></h3></div>
            </template>
        `;
        CuboMX.start();
    
        CuboMX.swapTemplate('mixed-template', {
            target: '#container:innerHTML',
            state: {
                compA: { text: 'State for A' },
                compB: { text: 'State for B' }
            }
        });

        await new Promise(resolve => setTimeout(resolve, 0));
    
        const p = document.querySelector('#container p');
        const h3 = document.querySelector('#container h3');
    
        expect(p.textContent).toBe('State for A');
        expect(h3.textContent).toBe('State for B');
    });

    it('should create a reactive class proxy when initializing state for a :class binding', async () => {
        CuboMX.component('alert', () => ({
            alertClasses: null,
            text: 'Default text'
        }));
    
        document.body.innerHTML = `
            <div id="container"></div>
            <template mx-template="alert-template">
                <div mx-data="alert()" mx-ref="myAlert" :class="alertClasses">
                    <p :text="text"></p>
                </div>
            </template>
        `;
        CuboMX.start();
    
        CuboMX.swapTemplate('alert-template', {
            target: '#container:innerHTML',
            state: {
                alert: {
                    alertClasses: ['alert', 'alert-success'],
                    text: 'Success!'
                }
            }
        });
    
        await new Promise(resolve => setTimeout(resolve, 0));
    
        const alertComp = CuboMX.myAlert;
        const divEl = document.querySelector('#container div');
        const pEl = document.querySelector('#container p');
    
        expect(pEl.textContent).toBe('Success!');

        expect(alertComp.alertClasses).toBeDefined();
        expect(Array.isArray(alertComp.alertClasses)).toBe(true);
        expect(typeof alertComp.alertClasses.add).toBe('function');
        expect(typeof alertComp.alertClasses.remove).toBe('function');

        expect(divEl.classList.contains('alert')).toBe(true);
        expect(divEl.classList.contains('alert-success')).toBe(true);

        alertComp.alertClasses.remove('alert-success');
        alertComp.alertClasses.add('alert-warning');

        expect(divEl.classList.contains('alert-success')).toBe(false);
        expect(divEl.classList.contains('alert-warning')).toBe(true);
    });
});
