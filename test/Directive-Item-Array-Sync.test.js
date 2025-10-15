import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

describe('Directive: mx-item Array Proxy with Sub-Array Sync', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const setupComponentWithSubArray = (initialProfiles = []) => {
        CuboMX.component('listManager', {
            items: [],
        });

        const profilePs = initialProfiles.map(p => `<p ::text.array="profiles">${p}</p>`).join('');

        document.body.innerHTML = `
            <div mx-data="listManager">
                <ul id="item-list">
                    <li mx-item="items">
                        <h2 ::text="name"></h2>
                        <div class="profiles">
                            ${profilePs}
                        </div>
                    </li>
                </ul>
            </div>
        `;
    };

    it('should create more sub-elements if data array is larger than template', async () => {
        // Template has 1 <p>, data has 3 profiles.
        setupComponentWithSubArray(['Initial Profile']);
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Act
        CuboMX.listManager.items.add({
            name: 'User A',
            profiles: ['Admin', 'Editor', 'Viewer']
        });
        await vi.runAllTimersAsync();

        // Assert
        const newItem = document.querySelectorAll('#item-list li')[1];
        const profileElements = newItem.querySelectorAll('.profiles p');
        expect(profileElements).toHaveLength(3);
        expect(profileElements[0].textContent).toBe('Admin');
        expect(profileElements[1].textContent).toBe('Editor');
        expect(profileElements[2].textContent).toBe('Viewer');

        const stateItem = CuboMX.listManager.items[1];
        expect(stateItem.profiles).toEqual(['Admin', 'Editor', 'Viewer']);
    });

    it('should remove sub-elements if data array is smaller than template', async () => {
        // Template has 3 <p>, data has 1 profile.
        setupComponentWithSubArray(['P1', 'P2', 'P3']);
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Act
        CuboMX.listManager.items.add({
            name: 'User B',
            profiles: ['Super-Admin']
        });
        await vi.runAllTimersAsync();

        // Assert
        const newItem = document.querySelectorAll('#item-list li')[1];
        const profileElements = newItem.querySelectorAll('.profiles p');
        expect(profileElements).toHaveLength(1);
        expect(profileElements[0].textContent).toBe('Super-Admin');

        const stateItem = CuboMX.listManager.items[1];
        expect(stateItem.profiles).toEqual(['Super-Admin']);
    });

    it('should update all sub-elements if data array has the same size as template', async () => {
        // Template has 2 <p>, data has 2 profiles.
        setupComponentWithSubArray(['Old1', 'Old2']);
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Act
        CuboMX.listManager.items.add({
            name: 'User C',
            profiles: ['New1', 'New2']
        });
        await vi.runAllTimersAsync();

        // Assert
        const newItem = document.querySelectorAll('#item-list li')[1];
        const profileElements = newItem.querySelectorAll('.profiles p');
        expect(profileElements).toHaveLength(2);
        expect(profileElements[0].textContent).toBe('New1');
        expect(profileElements[1].textContent).toBe('New2');

        const stateItem = CuboMX.listManager.items[1];
        expect(stateItem.profiles).toEqual(['New1', 'New2']);
    });

    it('should remove all sub-elements if data array is empty', async () => {
        // Template has 2 <p>, data has 0 profiles.
        setupComponentWithSubArray(['ToDelete1', 'ToDelete2']);
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Act
        CuboMX.listManager.items.add({
            name: 'User D',
            profiles: []
        });
        await vi.runAllTimersAsync();

        // Assert
        const newItem = document.querySelectorAll('#item-list li')[1];
        const profileElements = newItem.querySelectorAll('.profiles p');
        expect(profileElements).toHaveLength(0);

        const stateItem = CuboMX.listManager.items[1];
        expect(stateItem.profiles).toBeNull();
    });

    it('should handle multiple sub-array properties independently', async () => {
        CuboMX.component('manager', { items: [] });
        document.body.innerHTML = `
            <div mx-data="manager">
                <ul id="item-list">
                    <li mx-item="items">
                        <h2 ::text="name"></h2>
                        <div class="profiles">
                            <p ::text.array="profiles">P1</p>
                        </div>
                        <div class="tags">
                            <span ::text.array="tags">T1</span>
                            <span ::text.array="tags">T2</span>
                        </div>
                    </li>
                </ul>
            </div>
        `;
        CuboMX.start();
        await vi.runAllTimersAsync();

        // Act: Add an item where profiles grow and tags shrink
        CuboMX.manager.items.add({
            name: 'Complex Item',
            profiles: ['Admin', 'Editor'],
            tags: ['Urgent']
        });
        await vi.runAllTimersAsync();

        // Assert
        const newItem = document.querySelectorAll('#item-list li')[1];
        const profileElements = newItem.querySelectorAll('.profiles p');
        const tagElements = newItem.querySelectorAll('.tags span');

        expect(profileElements).toHaveLength(2);
        expect(profileElements[0].textContent).toBe('Admin');
        expect(profileElements[1].textContent).toBe('Editor');

        expect(tagElements).toHaveLength(1);
        expect(tagElements[0].textContent).toBe('Urgent');

        const stateItem = CuboMX.manager.items[1];
        expect(stateItem.profiles).toEqual(['Admin', 'Editor']);
        expect(stateItem.tags).toEqual(['Urgent']);
    });
});
