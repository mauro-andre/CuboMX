import { describe, it, expect, beforeEach } from 'vitest';
import { CuboMX } from '../src/CuboMX.js';

describe('CuboMX - mx-item Directive', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        CuboMX.reset();
    });

    it('should hydrate nested arrays within an mx-attrs object', () => {
        CuboMX.component('myComp', { profile: null });
        document.body.innerHTML = `
            <div mx-data="my-comp">
                <div mx-attrs:my-comp.profile user-id="123" name="John Doe">
                    <ul>
                        <li mx-item:my-comp.profile.songs song-id="s1" title="Bohemian Rhapsody">Queen</li>
                        <li mx-item:my-comp.profile.songs song-id="s2" title="Stairway to Heaven">Led Zeppelin</li>
                    </ul>
                </div>
            </div>
        `;

        CuboMX.start();

        const profile = CuboMX.myComp.profile;

        // Assertions for the parent object (from mx-attrs)
        expect(profile).toBeDefined();
        expect(profile.userId).toBe(123);
        expect(profile.name).toBe('John Doe');

        // Assertions for the nested array (from mx-item)
        expect(profile.songs).toBeInstanceOf(Array);
        expect(profile.songs).toHaveLength(2);

        // Assertions for the first item
        expect(profile.songs[0].songId).toBe('s1');
        expect(profile.songs[0].title).toBe('Bohemian Rhapsody');
        expect(profile.songs[0].text).toBe('Queen');

        // Assertions for the second item
        expect(profile.songs[1].songId).toBe('s2');
        expect(profile.songs[1].title).toBe('Stairway to Heaven');
        expect(profile.songs[1].text).toBe('Led Zeppelin');
    });
});
