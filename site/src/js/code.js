import { codeToHtml } from "shiki";
import { CuboMX } from "cubomx";

const codeBlock = () => ({
    attrs: null,

    async init() {
        const html = await codeToHtml(this.attrs.html, {
            lang: this.attrs.lang,
            theme: "dracula"
        });
        const parser = new DOMParser();
        const el = parser.parseFromString(html, "text/html");
        const code = el.querySelector("code")
        this.attrs.html = code.innerHTML
    },
});

export { codeBlock };
