import { codeToHtml } from "shiki";
import { CuboMX } from "cubomx";

const codeBlock = () => ({
    code: null,

    async init() {
        const html = await codeToHtml(this.code, {
            lang: "javascript",
            theme: "dracula"
        });
        const parser = new DOMParser();
        const el = parser.parseFromString(html, "text/html");
        const code = el.querySelector("code")
        this.code = code.innerHTML
    },
});

export { codeBlock };
