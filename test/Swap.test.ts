import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CuboMX, MxComponent } from "../src/cubomx";

describe("CuboMX.swap - Basic operations", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    afterEach(() => {});

    it("should swap content using target without select (uses body)", () => {
        document.body.innerHTML = `<div id="container">Old content</div>`;

        const htmlReceived = `<div id="container">New content</div>`;

        CuboMX.swap(htmlReceived, [{ target: "#container:outerHTML" }]);

        const container = document.querySelector("#container");
        expect(container?.textContent).toBe("New content");
    });

    it("should swap using select and target with same selector", () => {
        document.body.innerHTML = `<div id="widget">Old widget</div>`;

        const htmlReceived = `<div id="widget">New widget</div>`;

        CuboMX.swap(htmlReceived, [
            { select: "#widget:outerHTML", target: "#widget:outerHTML" },
        ]);

        const widget = document.querySelector("#widget");
        expect(widget?.textContent).toBe("New widget");
    });

    it("should swap different source to different target", () => {
        document.body.innerHTML = `
            <div id="source-area"></div>
            <div id="target-area">Old content</div>
        `;

        const htmlReceived = `<div id="new-content">Fresh content</div>`;

        CuboMX.swap(htmlReceived, [
            {
                select: "#new-content:outerHTML",
                target: "#target-area:outerHTML",
            },
        ]);

        expect(document.querySelector("#target-area")).toBeNull();
        expect(document.querySelector("#new-content")?.textContent).toBe(
            "Fresh content"
        );
    });
});

describe("CuboMX.swap - innerHTML vs outerHTML", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should swap innerHTML (replace content only)", () => {
        document.body.innerHTML = `<div id="container" class="box">Old content</div>`;

        const htmlReceived = `<div id="source"><span>New content</span></div>`;

        CuboMX.swap(htmlReceived, [
            { select: "#source:innerHTML", target: "#container:innerHTML" },
        ]);

        const container = document.querySelector("#container");
        expect(container?.className).toBe("box"); // Container still exists
        expect(container?.innerHTML).toBe("<span>New content</span>");
    });

    it("should swap outerHTML (replace entire element)", () => {
        document.body.innerHTML = `<div id="container" class="box">Old content</div>`;

        const htmlReceived = `<section id="new-container" class="card">New content</section>`;

        CuboMX.swap(htmlReceived, [
            {
                select: "#new-container:outerHTML",
                target: "#container:outerHTML",
            },
        ]);

        expect(document.querySelector("#container")).toBeNull();
        expect(document.querySelector("#new-container")?.textContent).toBe(
            "New content"
        );
        expect(document.querySelector("#new-container")?.className).toBe(
            "card"
        );
    });

    it("should use outerHTML source with innerHTML target", () => {
        document.body.innerHTML = `<div id="container">Old</div>`;

        const htmlReceived = `<div id="source"><strong>Bold text</strong></div>`;

        CuboMX.swap(htmlReceived, [
            { select: "#source:outerHTML", target: "#container:innerHTML" },
        ]);

        const container = document.querySelector("#container");
        expect(container?.innerHTML).toContain('<div id="source">');
        expect(container?.innerHTML).toContain("<strong>Bold text</strong>");
    });
});

describe("CuboMX.swap - Insertion modes", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should prepend content (afterbegin)", () => {
        document.body.innerHTML = `
            <ul id="list">
                <li>Item 2</li>
                <li>Item 3</li>
            </ul>
        `;

        const htmlReceived = `<li>Item 1</li>`;

        CuboMX.swap(htmlReceived, [{ target: "#list:afterbegin" }]);

        const list = document.querySelector("#list");
        const items = list?.querySelectorAll("li");
        expect(items?.length).toBe(3);
        expect(items?.[0].textContent).toBe("Item 1");
        expect(items?.[1].textContent).toBe("Item 2");
    });

    it("should append content (beforeend)", () => {
        document.body.innerHTML = `
            <ul id="list">
                <li>Item 1</li>
                <li>Item 2</li>
            </ul>
        `;

        const htmlReceived = `<li>Item 3</li>`;

        CuboMX.swap(htmlReceived, [{ target: "#list:beforeend" }]);

        const list = document.querySelector("#list");
        const items = list?.querySelectorAll("li");
        expect(items?.length).toBe(3);
        expect(items?.[2].textContent).toBe("Item 3");
    });

    it("should insert before element (beforebegin)", () => {
        document.body.innerHTML = `
            <div id="container">
                <h2 id="title">Title</h2>
                <p>Content</p>
            </div>
        `;

        const htmlReceived = `<h1>Main Title</h1>`;

        CuboMX.swap(htmlReceived, [{ target: "#title:beforebegin" }]);

        const container = document.querySelector("#container");
        const firstChild = container?.firstElementChild;
        expect(firstChild?.tagName).toBe("H1");
        expect(firstChild?.textContent).toBe("Main Title");
    });

    it("should insert after element (afterend)", () => {
        document.body.innerHTML = `
            <div id="container">
                <h1>Title</h1>
                <p id="first-paragraph">First paragraph</p>
            </div>
        `;

        const htmlReceived = `<p>Second paragraph</p>`;

        CuboMX.swap(htmlReceived, [{ target: "#first-paragraph:afterend" }]);

        const container = document.querySelector("#container");
        const paragraphs = container?.querySelectorAll("p");
        expect(paragraphs?.length).toBe(2);
        expect(paragraphs?.[1].textContent).toBe("Second paragraph");
    });
});

describe("CuboMX.swap - Multiple operations", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should perform multiple swaps in sequence", () => {
        document.body.innerHTML = `
            <div id="header">Old Header</div>
            <div id="content">Old Content</div>
            <div id="footer">Old Footer</div>
        `;

        const htmlReceived = `
            <div id="new-header">New Header</div>
            <div id="new-content">New Content</div>
            <div id="new-footer">New Footer</div>
        `;

        CuboMX.swap(htmlReceived, [
            { select: "#new-header", target: "#header:outerHTML" },
            { select: "#new-content", target: "#content:outerHTML" },
            { select: "#new-footer", target: "#footer:outerHTML" },
        ]);

        expect(document.querySelector("#new-header")?.textContent).toBe(
            "New Header"
        );
        expect(document.querySelector("#new-content")?.textContent).toBe(
            "New Content"
        );
        expect(document.querySelector("#new-footer")?.textContent).toBe(
            "New Footer"
        );
    });

    it("should handle mixed insertion modes", () => {
        document.body.innerHTML = `
            <div id="widget">
                <h2>Title</h2>
            </div>
            <ul id="notifications"></ul>
        `;

        const htmlReceived = `
            <div id="widget-content"><p>Widget body</p></div>
            <li class="notification">New alert</li>
        `;

        CuboMX.swap(htmlReceived, [
            { select: "#widget-content", target: "#widget:beforeend" },
            { select: ".notification", target: "#notifications:beforeend" },
        ]);

        const widget = document.querySelector("#widget");
        expect(widget?.querySelector("h2")).toBeTruthy();
        expect(widget?.querySelector("#widget-content")).toBeTruthy();

        const notifications = document.querySelector("#notifications");
        expect(notifications?.querySelectorAll("li").length).toBe(1);
    });
});

describe("CuboMX.swap - Multiple targets (same selector)", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should swap content to multiple elements with same selector", () => {
        document.body.innerHTML = `
            <div class="card">Card 1</div>
            <div class="card">Card 2</div>
            <div class="card">Card 3</div>
        `;

        const htmlReceived = `<div class="card">Updated Card</div>`;

        CuboMX.swap(htmlReceived, [
            { select: ".card", target: ".card:outerHTML" },
        ]);

        const cards = document.querySelectorAll(".card");
        expect(cards.length).toBe(3);
        cards.forEach((card) => {
            expect(card.textContent).toBe("Updated Card");
        });
    });

    it("should append to multiple targets", () => {
        document.body.innerHTML = `
            <ul class="list">
                <li>Item A</li>
            </ul>
            <ul class="list">
                <li>Item B</li>
            </ul>
        `;

        const htmlReceived = `<li>New Item</li>`;

        CuboMX.swap(htmlReceived, [{ target: ".list:beforeend" }]);

        const lists = document.querySelectorAll(".list");
        expect(lists[0].querySelectorAll("li").length).toBe(2);
        expect(lists[1].querySelectorAll("li").length).toBe(2);
        expect(lists[0].querySelectorAll("li")[1].textContent).toBe("New Item");
        expect(lists[1].querySelectorAll("li")[1].textContent).toBe("New Item");
    });
});

describe("CuboMX.swap - Edge cases and errors", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should handle target not found gracefully", () => {
        document.body.innerHTML = `<div id="exists">Content</div>`;
        const htmlReceived = `<div id="new">New content</div>`;

        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        expect(() => {
            CuboMX.swap(htmlReceived, [
                { select: "#new", target: "#does-not-exist" },
            ]);
        }).not.toThrow();

        expect(consoleSpy).toHaveBeenCalledWith(
            '[CuboMX] no elements found in current DOM with css selector "#does-not-exist"'
        );
        expect(document.querySelector("#exists")?.textContent).toBe("Content");
        consoleSpy.mockRestore();
    });

    it("should handle source not found gracefully", () => {
        document.body.innerHTML = `<div id="target">Original</div>`;
        const htmlReceived = `<div id="source">Content</div>`;
        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Should not throw, but log an error
        expect(() => {
            CuboMX.swap(htmlReceived, [
                { select: "#non-existent", target: "#target" },
            ]);
        }).not.toThrow();

        expect(consoleSpy).toHaveBeenCalledWith(
            '[CuboMX] Source element "#non-existent" not found in received HTML'
        );
        // Original content should remain
        expect(document.querySelector("#target")?.textContent).toBe("Original");
        consoleSpy.mockRestore();
    });

    it("should handle empty HTML", () => {
        document.body.innerHTML = `<div id="target">Content</div>`;
        const htmlReceived = ``;

        expect(() => {
            CuboMX.swap(htmlReceived, [{ target: "#target:innerHTML" }]);
        }).not.toThrow();

        expect(document.querySelector("#target")?.innerHTML).toBe("");
    });
});

describe("CuboMX.swap - Complex HTML structures", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should swap nested elements correctly", () => {
        document.body.innerHTML = `
            <div id="container">
                <div class="level-1">
                    <div class="level-2">Old content</div>
                </div>
            </div>
        `;

        const htmlReceived = `
            <div class="level-1">
                <div class="level-2">New content</div>
            </div>
        `;

        CuboMX.swap(htmlReceived, [
            { select: ".level-1", target: ".level-1:outerHTML" },
        ]);

        const level2 = document.querySelector(".level-2");
        expect(level2?.textContent).toBe("New content");
    });

    it("should preserve sibling elements", () => {
        document.body.innerHTML = `
            <div id="container">
                <div id="keep-me">Keep this</div>
                <div id="replace-me">Replace this</div>
                <div id="keep-me-too">Keep this too</div>
            </div>
        `;

        const htmlReceived = `<div id="new-content">New content</div>`;

        CuboMX.swap(htmlReceived, [
            { select: "#new-content", target: "#replace-me:outerHTML" },
        ]);

        expect(document.querySelector("#keep-me")?.textContent).toBe(
            "Keep this"
        );
        expect(document.querySelector("#keep-me-too")?.textContent).toBe(
            "Keep this too"
        );
        expect(document.querySelector("#new-content")?.textContent).toBe(
            "New content"
        );
        expect(document.querySelector("#replace-me")).toBeNull();
    });
});

describe("CuboMX.swap - Hybrid select logic", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
    });

    it("should use entire body content when select is omitted and target not found in HTML fragment", () => {
        document.body.innerHTML = `<div id="container">Old content</div>`;

        // HTML fragment without full structure (no <body>, no #container)
        const htmlFragment = `<div class="alert">Success message!</div>`;

        CuboMX.swap(htmlFragment, [{ target: "#container:innerHTML" }]);

        const container = document.querySelector("#container");
        expect(container?.innerHTML).toBe('<div class="alert">Success message!</div>');
    });

    it("should use target as select when omitted and target exists in received HTML", () => {
        document.body.innerHTML = `
            <div id="header">Old Header</div>
            <div id="main">Old Content</div>
        `;

        // Full HTML with matching #main element
        const htmlReceived = `
            <!DOCTYPE html>
            <html>
            <head><title>New Page</title></head>
            <body>
                <div id="header">Keep this header</div>
                <div id="main">New Content from HTML</div>
                <div id="footer">Footer</div>
            </body>
            </html>
        `;

        CuboMX.swap(htmlReceived, [{ target: "#main" }]);

        // Should find #main in received HTML and use it
        const main = document.querySelector("#main");
        expect(main?.textContent).toBe("New Content from HTML");

        // Header should remain unchanged (we only swapped #main)
        const header = document.querySelector("#header");
        expect(header?.textContent).toBe("Old Header");
    });
});

describe("CuboMX.swap - Integration with new components", () => {
    beforeEach(() => {
        CuboMX.reset();
    });

    it("should initialize a new component with hydrated state when swapped into the DOM", async () => {
        // 1. Arrange: Set up initial DOM and start CuboMX to activate the MutationObserver
        document.body.innerHTML = `<div id="container"></div>`;

        const swappedComp = {
            id: null,
            name: null,
            css: [],
        };
        CuboMX.component("swappedComp", swappedComp);
        CuboMX.start();

        // This is the new HTML that will be swapped in
        const htmlReceived = `
            <div mx-data="swappedComp" data-id="123" :data-id="id" class="swapped-class" :class="css">
                <h1 :text="name">Swapped Component Title</h1>
            </div>
        `;

        // 2. Act: Swap the new HTML into the container
        CuboMX.swap(htmlReceived, [{ target: "#container:innerHTML" }]);

        // Yield to the event loop to allow the MutationObserver to run
        await new Promise((resolve) => setTimeout(resolve, 0));

        // 3. Assert: Check if the component was initialized and hydrated
        // Check if component is globally accessible
        expect(CuboMX.swappedComp).toBeDefined();

        // Check if $el is correctly assigned
        const el = document.querySelector('[mx-data="swappedComp"]');
        expect(CuboMX.swappedComp.$el).toBe(el);

        // Check if state was hydrated from the new HTML
        expect(CuboMX.swappedComp.id).toBe(123);
        expect(CuboMX.swappedComp.name).toBe("Swapped Component Title");
        expect(CuboMX.swappedComp.css).toEqual(["swapped-class"]);

        // 4. Assert: Check if the new component is reactive
        CuboMX.swappedComp.name = "Updated Title";
        expect(el?.querySelector("h1")?.textContent).toBe("Updated Title");

        CuboMX.swappedComp.id = 456;
        expect(el?.getAttribute("data-id")).toBe("456");

        CuboMX.swappedComp.css.add("active");
        expect(el?.classList.contains("active")).toBe(true);
    });
});
