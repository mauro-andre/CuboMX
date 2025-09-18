import { CuboMX } from "cubomx";

const themeHandler = {
    theme: null,

    init() {
        this.theme = localStorage.getItem("theme");
        if (!this.theme) {
            this.theme = "dark";
            localStorage.setItem("theme", this.theme);
        }
        this._setTheme();
    },

    changeTheme(el) {
        const theme = this.theme == "dark" ? "light" : "dark";
        console.log(theme);
        CuboMX.actions([
            { action: "removeClass", selector: "html", class: this.theme },
            { action: "addClass", selector: "html", class: theme },
        ]);
        this.theme = theme;
        localStorage.setItem("theme", this.theme);
    },

    _setTheme() {
        localStorage.setItem("theme", this.theme);
        CuboMX.actions([
            { action: "addClass", selector: "html", class: this.theme },
        ]);
    },

    // _getSystemTheme() {
    //     return window.matchMedia("(prefers-color-scheme: dark)").matches
    //         ? "dark"
    //         : "light";
    // },

    // _loadThemeFromLocalStorage() {
    //     const theme = localStorage.getItem("theme");
    // },
};

export { themeHandler };
