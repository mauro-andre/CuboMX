import { describe, it, expect, beforeEach } from "vitest";
import { CuboMX } from "../src-refactor/cubomx";

beforeEach(() => {
    CuboMX.reset();
});

describe("mx-item Reactivity - Text Binding", () => {
    it("should update text in multiple elements when properties change", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <div mx-item="users">
                    <h2 id="name" ::text="fullName">John Doe</h2>
                    <p id="bio" ::text="biography">Software Developer</p>
                    <span id="age" ::text="age">30</span>
                </div>
            </div>
        `;

        CuboMX.component("listComponent", { users: [] });
        CuboMX.start();

        const user = CuboMX.listComponent.users[0];

        // Mudar nome
        user.fullName = "Jane Smith";
        expect(document.querySelector("#name")?.textContent).toBe("Jane Smith");
        expect(document.querySelector("#bio")?.textContent).toBe(
            "Software Developer"
        ); // Outros não mudam
        expect(document.querySelector("#age")?.textContent).toBe("30");

        // Mudar bio
        user.biography = "UX Designer";
        expect(document.querySelector("#name")?.textContent).toBe("Jane Smith");
        expect(document.querySelector("#bio")?.textContent).toBe("UX Designer");
        expect(document.querySelector("#age")?.textContent).toBe("30");

        // Mudar age
        user.age = 25;
        expect(document.querySelector("#name")?.textContent).toBe("Jane Smith");
        expect(document.querySelector("#bio")?.textContent).toBe("UX Designer");
        expect(document.querySelector("#age")?.textContent).toBe("25");
    });

    it("should handle multiple items independently", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <div mx-item="users">
                    <span class="name" ::text="name">User 1</span>
                    <span class="email" ::text="email">user1@test.com</span>
                </div>
                <div mx-item="users">
                    <span class="name" ::text="name">User 2</span>
                    <span class="email" ::text="email">user2@test.com</span>
                </div>
                <div mx-item="users">
                    <span class="name" ::text="name">User 3</span>
                    <span class="email" ::text="email">user3@test.com</span>
                </div>
            </div>
        `;

        CuboMX.component("listComponent", { users: [] });
        CuboMX.start();

        const users = CuboMX.listComponent.users;

        // Mudar apenas o segundo item
        users[1].name = "Updated User 2";
        users[1].email = "updated@test.com";

        const names = document.querySelectorAll(".name");
        const emails = document.querySelectorAll(".email");

        expect(names[0].textContent).toBe("User 1"); // Não mudou
        expect(names[1].textContent).toBe("Updated User 2"); // Mudou
        expect(names[2].textContent).toBe("User 3"); // Não mudou

        expect(emails[0].textContent).toBe("user1@test.com");
        expect(emails[1].textContent).toBe("updated@test.com");
        expect(emails[2].textContent).toBe("user3@test.com");
    });
});

describe("mx-item Reactivity - HTML Binding", () => {
    it("should update innerHTML when html property changes", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <div mx-item="posts">
                    <h3 id="title" ::text="title">Post Title</h3>
                    <div id="content" ::html="htmlContent"><p>Original content</p></div>
                    <span id="author" ::text="author">John</span>
                </div>
            </div>
        `;

        CuboMX.component("listComponent", { posts: [] });
        CuboMX.start();

        const post = CuboMX.listComponent.posts[0];

        // Mudar HTML
        post.htmlContent = "<p>New <strong>bold</strong> content</p>";
        expect(document.querySelector("#content")?.innerHTML).toBe(
            "<p>New <strong>bold</strong> content</p>"
        );

        // Outros elementos não mudam
        expect(document.querySelector("#title")?.textContent).toBe(
            "Post Title"
        );
        expect(document.querySelector("#author")?.textContent).toBe("John");
    });
});

describe("mx-item Reactivity - Attribute Binding", () => {
    it("should update attributes when properties change", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <div mx-item="products">
                    <span id="name" ::text="name">Product</span>
                    <img id="image" ::src="imageUrl" ::alt="imageAlt" src="" alt="">
                    <a id="link" ::href="url" ::title="linkTitle" href="" title="">Link</a>
                </div>
            </div>
        `;

        CuboMX.component("listComponent", { products: [] });
        CuboMX.start();

        const product = CuboMX.listComponent.products[0];

        // Mudar atributos da imagem
        product.imageUrl = "https://example.com/product.jpg";
        product.imageAlt = "Product Image";

        const img = document.querySelector("#image");
        expect(img?.getAttribute("src")).toBe(
            "https://example.com/product.jpg"
        );
        expect(img?.getAttribute("alt")).toBe("Product Image");

        // Mudar atributos do link
        product.url = "https://example.com/product";
        product.linkTitle = "View Product";

        const link = document.querySelector("#link");
        expect(link?.getAttribute("href")).toBe("https://example.com/product");
        expect(link?.getAttribute("title")).toBe("View Product");

        // Texto não muda
        expect(document.querySelector("#name")?.textContent).toBe("Product");
    });

    it("should update input value property", () => {
        document.body.innerHTML = `
            <div mx-data="formComponent">
                <div mx-item="fields">
                    <label id="label" ::text="label">Name</label>
                    <input id="input" ::value="inputValue" value="initial">
                </div>
            </div>
        `;

        CuboMX.component("formComponent", { fields: [] });
        CuboMX.start();

        const field = CuboMX.formComponent.fields[0];

        field.inputValue = "New Value";
        const input = document.querySelector("#input") as HTMLInputElement;
        expect(input.value).toBe("New Value");
    });

    it("should update checkbox checked property", () => {
        document.body.innerHTML = `
            <div mx-data="todoComponent">
                <div mx-item="tasks">
                    <span id="title" ::text="title">Task 1</span>
                    <input id="checkbox" type="checkbox" ::checked="done">
                </div>
            </div>
        `;

        CuboMX.component("todoComponent", { tasks: [] });
        CuboMX.start();

        const task = CuboMX.todoComponent.tasks[0];
        const checkbox = document.querySelector(
            "#checkbox"
        ) as HTMLInputElement;

        task.done = true;
        expect(checkbox.checked).toBe(true);

        task.done = false;
        expect(checkbox.checked).toBe(false);
    });
});

describe("mx-item Reactivity - Class Binding", () => {
    it("should update classes when property changes", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <div mx-item="cards">
                    <div id="card" ::class="classes" class="old classes">
                        <h3 id="title" ::text="title">Card Title</h3>
                    </div>
                </div>
            </div>
        `;

        CuboMX.component("listComponent", { cards: [] });
        CuboMX.start();

        const card = CuboMX.listComponent.cards[0];
        const cardEl = document.querySelector("#card");

        // Mudar classes (array)
        card.classes = ["card", "active", "highlighted"];
        expect(cardEl?.className).toBe("card active highlighted");

        // Mudar classes (string)
        card.classes = "card disabled";
        expect(cardEl?.className).toBe("card disabled");

        // Título não muda
        expect(document.querySelector("#title")?.textContent).toBe(
            "Card Title"
        );
    });
});

describe("mx-item Reactivity - Complex Scenarios", () => {
    it("should handle deeply nested elements", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <article mx-item="articles">
                    <header>
                        <h2 id="title" ::text="title">Article Title</h2>
                        <div class="meta">
                            <span id="author" ::text="author">John Doe</span>
                            <time id="date" ::text="date">2024-01-01</time>
                        </div>
                    </header>
                    <section>
                        <p id="excerpt" ::text="excerpt">Article excerpt...</p>
                    </section>
                    <footer>
                        <a id="link" ::href="url" href="">Read more</a>
                    </footer>
                </article>
            </div>
        `;

        CuboMX.component("listComponent", { articles: [] });
        CuboMX.start();

        const article = CuboMX.listComponent.articles[0];

        // Mudar propriedades em elementos profundamente aninhados
        article.title = "New Title";
        article.author = "Jane Smith";
        article.date = "2024-12-31";
        article.excerpt = "New excerpt text";
        article.url = "https://example.com/article";

        expect(document.querySelector("#title")?.textContent).toBe("New Title");
        expect(document.querySelector("#author")?.textContent).toBe(
            "Jane Smith"
        );
        expect(document.querySelector("#date")?.textContent).toBe("2024-12-31");
        expect(document.querySelector("#excerpt")?.textContent).toBe(
            "New excerpt text"
        );
        expect(document.querySelector("#link")?.getAttribute("href")).toBe(
            "https://example.com/article"
        );
    });

    it("should handle multiple properties on the same element", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <div mx-item="items">
                    <div id="box"
                        ::data-id="id"
                        ::data-active="active"
                        ::class="classes"
                        data-id="" data-active="" class="">
                        <span id="name" ::text="name">Item</span>
                    </div>
                </div>
            </div>
        `;

        CuboMX.component("listComponent", { items: [] });
        CuboMX.start();

        const item = CuboMX.listComponent.items[0];
        const box = document.querySelector("#box");

        // Mudar várias propriedades
        item.id = "123";
        item.active = "true";
        item.classes = ["box", "active"];
        item.name = "Updated Item";

        expect(box?.getAttribute("data-id")).toBe("123");
        expect(box?.getAttribute("data-active")).toBe("true");
        expect(box?.className).toBe("box active");
        expect(document.querySelector("#name")?.textContent).toBe(
            "Updated Item"
        );
    });

    it("should handle rapid successive updates", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <div mx-item="counters">
                    <span id="count" ::text="count">0</span>
                    <span id="label" ::text="label">Counter</span>
                </div>
            </div>
        `;

        CuboMX.component("listComponent", { counters: [] });
        CuboMX.start();

        const counter = CuboMX.listComponent.counters[0];

        // Múltiplas atualizações rápidas
        counter.count = 1;
        counter.count = 2;
        counter.count = 3;
        counter.label = "Updated";

        expect(document.querySelector("#count")?.textContent).toBe("3");
        expect(document.querySelector("#label")?.textContent).toBe("Updated");
    });

    it("should preserve $el reference", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <div mx-item="items" class="item-container">
                    <span ::text="name">Item Name</span>
                </div>
            </div>
        `;

        CuboMX.component("listComponent", { items: [] });
        CuboMX.start();

        const item = CuboMX.listComponent.items[0];

        // $el deve apontar para o elemento raiz do mx-item
        expect(item.$el).toBeDefined();
        expect(item.$el.tagName).toBe("DIV");
        expect(item.$el.classList.contains("item-container")).toBe(true);

        // Mudar propriedade e verificar que $el ainda existe
        item.name = "Updated";
        expect(item.$el).toBeDefined();
        expect(item.$el.classList.contains("item-container")).toBe(true);
    });
});

describe("mx-item Reactivity - Edge Cases", () => {
    it("should handle null and undefined values", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <div mx-item="items">
                    <span id="text" ::text="value">Initial</span>
                </div>
            </div>
        `;

        CuboMX.component("listComponent", { items: [] });
        CuboMX.start();

        const item = CuboMX.listComponent.items[0];

        item.value = null;
        expect(document.querySelector("#text")?.textContent).toBe("");

        item.value = undefined;
        expect(document.querySelector("#text")?.textContent).toBe("");

        item.value = "Back to text";
        expect(document.querySelector("#text")?.textContent).toBe(
            "Back to text"
        );
    });

    it("should handle numeric and boolean values", () => {
        document.body.innerHTML = `
            <div mx-data="listComponent">
                <div mx-item="items">
                    <span id="number" ::text="count">0</span>
                    <span id="boolean" ::text="isActive">false</span>
                </div>
            </div>
        `;

        CuboMX.component("listComponent", { items: [] });
        CuboMX.start();

        const item = CuboMX.listComponent.items[0];

        item.count = 42;
        expect(document.querySelector("#number")?.textContent).toBe("42");

        item.isActive = true;
        expect(document.querySelector("#boolean")?.textContent).toBe("true");
    });
});
