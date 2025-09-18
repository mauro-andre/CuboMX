import { CuboMX } from "cubomx";

const themeHandler = {
    theme: null,
    sunIcon: null,
    moonIcon: null,
    content: null,

    init() {
        this.sunIcon = CuboMX.renderTemplate("sunOutlineIcon");
        this.moonIcon = CuboMX.renderTemplate("moonOutlineIcon");
        this.theme = localStorage.getItem("theme");
        if (!this.theme) {
            this.theme = "dark";
            localStorage.setItem("theme", this.theme);
        }
        this._setTheme();
    },

    changeTheme(el) {
        const theme = this.theme == "dark" ? "light" : "dark";
        CuboMX.actions([
            { action: "removeClass", selector: "html", class: this.theme },
            { action: "addClass", selector: "html", class: theme },
        ]);
        this.theme = theme;
        localStorage.setItem("theme", this.theme);
        this._setIcon();
    },

    _setTheme() {
        localStorage.setItem("theme", this.theme);
        CuboMX.actions([
            { action: "addClass", selector: "html", class: this.theme },
        ]);
        this._setIcon();
    },

    _setIcon() {
        this.content.html = this.theme == "dark" ? this.moonIcon : this.sunIcon;
    },
};

export { themeHandler };
