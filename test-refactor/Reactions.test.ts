import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CuboMX, MxComponent } from "../src-refactor/cubomx";

describe("Reactions", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = `
            <div mx-data="myComp">
                <h1 id="greeting" :text="greeting">Hi there</h1>
            </div>
        `;
        const myComp = {
            greeting: null,
        };

        CuboMX.component("myComp", myComp);
        CuboMX.start();
    });

    it("should change DOM after change object attribute", () => {
        CuboMX.myComp.greeting = "Hello World";
        // console.log("No teste: ", CuboMX.myComp);
        const greetingEl = document.querySelector("#greeting")?.textContent;
        // console.log(greetingEl)
    });
});
