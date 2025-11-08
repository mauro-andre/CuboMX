import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX } from "../src/cubomx";
import { h } from "preact";

describe("CuboMX.swap - JSX/VNode support", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
        CuboMX.start();
    });

    it("should swap JSX element into the DOM", async () => {
        document.body.innerHTML = `<div id="container">Old content</div>`;

        const jsx = <div id="container">New content from JSX</div>;

        await CuboMX.swap(jsx, [{ target: "#container:outerHTML" }]);

        const container = document.querySelector("#container");
        expect(container?.textContent).toBe("New content from JSX");
    });

    it("should swap complex JSX structure", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        const jsx = (
            <article>
                <header>
                    <h1>Article Title</h1>
                    <p>By John Doe</p>
                </header>
                <section>
                    <p>Article content goes here.</p>
                </section>
            </article>
        );

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }]);

        expect(document.querySelector("article")).toBeTruthy();
        expect(document.querySelector("h1")?.textContent).toBe("Article Title");
        expect(document.querySelector("section p")?.textContent).toBe(
            "Article content goes here."
        );
    });

    it("should swap JSX with CuboMX directives", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        CuboMX.component("userCard", {
            name: null,
            email: null,
        });

        const jsx = (
            <div mx-data="userCard" className="user-card">
                <h2 mx-bind:text="name">John Doe</h2>
                <p mx-bind:text="email">john@example.com</p>
            </div>
        );

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }]);

        // Check if component was hydrated
        expect(CuboMX.userCard).toBeDefined();
        expect(CuboMX.userCard.name).toBe("John Doe");
        expect(CuboMX.userCard.email).toBe("john@example.com");

        // Test reactivity
        CuboMX.userCard.name = "Jane Smith";
        expect(document.querySelector("h2")?.textContent).toBe("Jane Smith");
    });

    it("should render functional component with props", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        interface CardProps {
            title: string;
            description: string;
        }

        const Card = ({ title, description }: CardProps) => (
            <div className="card">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        );

        const jsx = <Card title="Welcome" description="This is a card" />;

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }]);

        const card = document.querySelector(".card");
        expect(card).toBeTruthy();
        expect(card?.querySelector("h3")?.textContent).toBe("Welcome");
        expect(card?.querySelector("p")?.textContent).toBe("This is a card");
    });

    it("should render JSX with list items", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        const items = ["Apple", "Banana", "Orange"];

        const jsx = (
            <ul>
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        );

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }]);

        const listItems = document.querySelectorAll("li");
        expect(listItems.length).toBe(3);
        expect(listItems[0].textContent).toBe("Apple");
        expect(listItems[1].textContent).toBe("Banana");
        expect(listItems[2].textContent).toBe("Orange");
    });

    it("should render JSX with CuboMX event directives", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        const counterComponent: { count: number; increment: () => void } = {
            count: 0,
            increment() {
                this.count++;
            },
        };
        CuboMX.component("counter", counterComponent);

        // Note: Using custom attributes for CuboMX directives
        // JSX doesn't support @click syntax, so we use string attributes
        const jsx = (
            <div mx-data="counter">
                <button {...{ "@click": "increment()" }}>
                    Count: <span mx-bind:text="count">0</span>
                </button>
            </div>
        );

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }]);

        // Check if component was initialized
        const counter = CuboMX.counter as { count: number; increment: () => void };
        expect(counter.count).toBe(0);

        const button = document.querySelector("button");
        expect(button?.textContent).toContain("Count:");
    });

    it("should handle nested components", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        const Header = () => <h1>My App</h1>;
        const Content = () => <p>Main content here</p>;
        const Footer = () => <footer>© 2024</footer>;

        const App = () => (
            <div className="app">
                <Header />
                <Content />
                <Footer />
            </div>
        );

        await CuboMX.swap(<App />, [{ target: "#container:innerHTML" }]);

        expect(document.querySelector("h1")?.textContent).toBe("My App");
        expect(document.querySelector("p")?.textContent).toBe(
            "Main content here"
        );
        expect(document.querySelector("footer")?.textContent).toBe("© 2024");
    });

    it("should render JSX with CSS classes", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        const jsx = (
            <div className="card card-large active">
                <h2 className="card-title">Title</h2>
            </div>
        );

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }]);

        const card = document.querySelector(".card");
        expect(card?.classList.contains("card-large")).toBe(true);
        expect(card?.classList.contains("active")).toBe(true);
        expect(card?.querySelector("h2")?.classList.contains("card-title")).toBe(
            true
        );
    });

    it("should render JSX with custom attributes", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        const jsx = (
            <div data-testid="custom-element" data-value="123" aria-label="Label">
                Custom element
            </div>
        );

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }]);

        const element = document.querySelector("[data-testid='custom-element']");
        expect(element?.getAttribute("data-value")).toBe("123");
        expect(element?.getAttribute("aria-label")).toBe("Label");
    });

    it("should render JSX fragment", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        const jsx = (
            <>
                <h1>Title</h1>
                <p>Paragraph 1</p>
                <p>Paragraph 2</p>
            </>
        );

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }]);

        expect(document.querySelector("h1")?.textContent).toBe("Title");
        const paragraphs = document.querySelectorAll("p");
        expect(paragraphs.length).toBe(2);
    });

    it("should combine JSX with data preprocessing", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        const jsx = (
            <div>
                <h1 mx-bind:text="userName">Default Name</h1>
                <p mx-bind:text="userEmail">default@example.com</p>
            </div>
        );

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }], {
            data: {
                userName: "Alice",
                userEmail: "alice@example.com",
            },
        });

        expect(document.querySelector("h1")?.textContent).toBe("Alice");
        expect(document.querySelector("p")?.textContent).toBe(
            "alice@example.com"
        );
    });

    it("should render conditional JSX content", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        const showMessage = true;

        const jsx = (
            <div>
                {showMessage && <p>Message is visible</p>}
                {!showMessage && <p>Message is hidden</p>}
            </div>
        );

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }]);

        const paragraphs = document.querySelectorAll("p");
        expect(paragraphs.length).toBe(1);
        expect(paragraphs[0].textContent).toBe("Message is visible");
    });

    it("should handle inline styles in JSX", async () => {
        document.body.innerHTML = `<div id="container"></div>`;

        const jsx = (
            <div style={{ color: "red", fontSize: "20px", fontWeight: "bold" }}>
                Styled text
            </div>
        );

        await CuboMX.swap(jsx, [{ target: "#container:innerHTML" }]);

        const div = document.querySelector("#container > div") as HTMLElement;
        expect(div?.style.color).toBe("red");
        expect(div?.style.fontSize).toBe("20px");
        expect(div?.style.fontWeight).toBe("bold");
    });

    it("should swap JSX to multiple targets", async () => {
        document.body.innerHTML = `
            <div class="card">Card 1</div>
            <div class="card">Card 2</div>
            <div class="card">Card 3</div>
        `;

        const jsx = (
            <div className="card updated">
                <h3>Updated Card</h3>
            </div>
        );

        await CuboMX.swap(jsx, [{ target: ".card:outerHTML" }]);

        const cards = document.querySelectorAll(".card");
        expect(cards.length).toBe(3);
        cards.forEach((card) => {
            expect(card.classList.contains("updated")).toBe(true);
            expect(card.querySelector("h3")?.textContent).toBe("Updated Card");
        });
    });

    it("should work with both JSX and HTML string in same swap", async () => {
        document.body.innerHTML = `
            <div id="header">Old header</div>
            <div id="content">Old content</div>
        `;

        // First swap: JSX to header
        const jsxHeader = <div id="header">JSX Header</div>;
        await CuboMX.swap(jsxHeader, [{ target: "#header:outerHTML" }]);

        // Second swap: HTML string to content
        const htmlContent = '<div id="content">HTML Content</div>';
        await CuboMX.swap(htmlContent, [{ target: "#content:outerHTML" }]);

        expect(document.querySelector("#header")?.textContent).toBe(
            "JSX Header"
        );
        expect(document.querySelector("#content")?.textContent).toBe(
            "HTML Content"
        );
    });
});

describe("CuboMX - JSX Helper Functions", () => {
    beforeEach(() => {
        CuboMX.reset();
        document.body.innerHTML = "";
        CuboMX.start();
    });

    it("should export isVNode helper", async () => {
        const { isVNode } = await import("../src/jsx-helpers");

        expect(isVNode(<div>Test</div>)).toBe(true);
        expect(isVNode("<div>Test</div>")).toBe(false);
        expect(isVNode(null)).toBe(false);
        expect(isVNode(undefined)).toBe(false);
        expect(isVNode({ type: "div", props: {} })).toBe(true);
    });

    it("should export renderVNodeToString helper", async () => {
        const { renderVNodeToString } = await import("../src/jsx-helpers");

        const jsx = <div className="test">Hello World</div>;
        const html = await renderVNodeToString(jsx);

        expect(html).toContain('class="test"');
        expect(html).toContain("Hello World");
    });
});
