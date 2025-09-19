import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("CuboMX - mx-item Directive", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    it("should hydrate nested arrays within an mx-bind object", () => {
        CuboMX.component("myComp", { profile: null });
        document.body.innerHTML = `
            <div mx-data="my-comp">
                <div mx-bind="$myComp.profile" user-id="123" name="John Doe">
                    <ul>
                        <li mx-item="$myComp.profile.songs" song-id="s1" title="Bohemian Rhapsody">Queen</li>
                        <li mx-item="$myComp.profile.songs" song-id="s2" title="Stairway to Heaven">Led Zeppelin</li>
                    </ul>
                </div>
            </div>
        `;

        CuboMX.start();

        const profile = CuboMX.myComp.profile;

        // Assertions for the parent object (from mx-bind)
        expect(profile).toBeDefined();
        expect(profile.userId).toBe(123);
        expect(profile.name).toBe("John Doe");

        // Assertions for the nested array (from mx-item)
        expect(profile.songs).toBeInstanceOf(Array);
        expect(profile.songs).toHaveLength(2);

        // Assertions for the first item
        expect(profile.songs[0].songId).toBe("s1");
        expect(profile.songs[0].title).toBe("Bohemian Rhapsody");
        expect(profile.songs[0].text).toBe("Queen");

        // Assertions for the second item
        expect(profile.songs[1].songId).toBe("s2");
        expect(profile.songs[1].title).toBe("Stairway to Heaven");
        expect(profile.songs[1].text).toBe("Led Zeppelin");
    });

    it("should work independently to hydrate an array", () => {
        CuboMX.component("myComp", { songs: null });
        document.body.innerHTML = `
            <div mx-data="my-comp">
                <ul>
                    <li mx-item="$myComp.songs" song-id="s1">Song 1</li>
                    <li mx-item="$myComp.songs" song-id="s2">Song 2</li>
                </ul>
            </div>
        `;

        CuboMX.start();

        const songs = CuboMX.myComp.songs;
        expect(songs).toBeInstanceOf(Array);
        expect(songs).toHaveLength(2);
        expect(songs[0].songId).toBe("s1");
        expect(songs[1].text).toBe("Song 2");
    });

    it("should expose the reactive item object as $item in mx-on events", () => {
        const itemSpy = vi.fn();
        CuboMX.component("myComp", {
            songs: null,
            selectSong(item) {
                itemSpy(item);
            },
        });
        document.body.innerHTML = `
            <div mx-data="my-comp">
                <ul>
                    <li mx-item="$myComp.songs" song-id="s1" mx-on:click="$myComp.selectSong($item)">Song 1</li>
                    <li mx-item="$myComp.songs" song-id="s2" mx-on:click="$myComp.selectSong($item)">Song 2</li>
                </ul>
            </div>
        `;

        CuboMX.start();

        const secondItemEl = document.querySelectorAll("li")[1];
        secondItemEl.click();

        // 1. Assert the spy was called
        expect(itemSpy).toHaveBeenCalledTimes(1);

        // 2. Assert it was called with the correct reactive object
        const secondSongObject = CuboMX.myComp.songs[1];
        expect(itemSpy).toHaveBeenCalledWith(secondSongObject);

        // 3. Assert that the passed item is reactive
        const passedItem = itemSpy.mock.calls[0][0];
        passedItem.text = "New Song Title";
        expect(secondItemEl.innerText).toBe("New Song Title");
    });
});
