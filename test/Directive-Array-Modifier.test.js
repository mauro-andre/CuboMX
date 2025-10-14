import { describe, it, expect, beforeEach, vi } from "vitest";
import { CuboMX } from "../src/CuboMX.js";

describe("Directive Modifier: .array", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CuboMX.reset();
    });

    // Test for mx-item:
    it("should collect attribute values into an array using mx-item:prop.array", () => {
        CuboMX.component("listComp", { items: [] });
        document.body.innerHTML = `
            <div mx-data="listComp">
                <div mx-item="items">
                    <h2 ::text="name">Item 1</h2>
                    <p mx-item:data-id.array="ids" data-id="a"></p>
                    <p mx-item:data-id.array="ids" data-id="b"></p>
                </div>
            </div>
        `;
        CuboMX.start();
        const item = CuboMX.listComp.items[0];
        expect(item.ids).toEqual(['a', 'b']);
    });

    // Test for :: shorthand
    it("should collect attribute values into an array using ::prop.array shorthand", () => {
        CuboMX.component("listComp", { items: [] });
        document.body.innerHTML = `
            <div mx-data="listComp">
                <div mx-item="items">
                    <h2 ::text="name">Item 2</h2>
                    <span ::data-tag.array="tags" data-tag="tag1"></span>
                    <span ::data-tag.array="tags" data-tag="tag2"></span>
                    <span ::data-tag.array="tags" data-tag="tag3"></span>
                </div>
            </div>
        `;
        CuboMX.start();
        const item = CuboMX.listComp.items[0];
        expect(item.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    // Test for mx-bind:
    it("should collect attribute values into an array using mx-bind:prop.array", () => {
        CuboMX.component("myComp", { collectedIds: [] });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div mx-bind:data-id.array="collectedIds" data-id="id1"></div>
                <div mx-bind:data-id.array="collectedIds" data-id="id2"></div>
            </div>
        `;
        CuboMX.start();
        expect(CuboMX.myComp.collectedIds).toEqual(['id1', 'id2']);
    });

    // Test for : shorthand
    it("should collect attribute values into an array using :prop.array shorthand", () => {
        CuboMX.component("myComp", { collectedValues: [] });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <span :data-value.array="collectedValues" data-value="10"></span>
                <span :data-value.array="collectedValues" data-value="20"></span>
            </div>
        `;
        CuboMX.start();
        // Note: parseValue will convert these to numbers
        expect(CuboMX.myComp.collectedValues).toEqual([10, 20]);
    });

    // Test with user's specific HTML
    it("should correctly hydrate the user's mpc-profile-id example", () => {
        CuboMX.component("wordList", { mcpWords: [] });
        document.body.innerHTML = `
            <div mx-data="wordList">
                <div mx-item="mcpWords" class="assessment-mcp-word">
                    <h2 ::text="name">CONTROLE</h2>
                    <div class="assessment-mcp-profiles">
                        <p ::mpc-profile-id.array="profileIds" mpc-profile-id="id_dom"></p>
                        <p ::mpc-profile-id.array="profileIds" mpc-profile-id="id_org"></p>
                    </div>
                </div>
                <div mx-item="mcpWords" class="assessment-mcp-word">
                    <h2 ::text="name">ADAPTABILIDADE</h2>
                    <div class="assessment-mcp-profiles">
                        <p ::mpc-profile-id.array="profileIds" mpc-profile-id="id_est"></p>
                    </div>
                </div>
            </div>
        `;
        CuboMX.start();
        const words = CuboMX.wordList.mcpWords;
        expect(words).toHaveLength(2);
        expect(words[0].name).toBe("CONTROLE");
        expect(words[0].profileIds).toEqual(["id_dom", "id_org"]);
        expect(words[1].name).toBe("ADAPTABILIDADE");
        expect(words[1].profileIds).toEqual(["id_est"]);
    });
    
    it('should not create property if no elements are found', () => {
        CuboMX.component("myComp", { collectedIds: null });
        document.body.innerHTML = `<div mx-data="myComp"></div>`;
        CuboMX.start();
        expect(CuboMX.myComp.collectedIds).toBeNull();
    });

    it('should log an error if the target property is not an array', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        CuboMX.component("myComp", { collectedIds: 'not an array' });
        document.body.innerHTML = `
            <div mx-data="myComp">
                <div :data-id.array="collectedIds" data-id="id1"></div>
            </div>
        `;
        CuboMX.start();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("is not an array"));
        consoleSpy.mockRestore();
    });
});
