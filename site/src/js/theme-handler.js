import { CuboMX } from "cubomx";

const themeHandler = {
    init() {
        const storageTheme = localStorage.getItem("theme");
        if (!storageTheme) {
            const theme = this._getSystemTheme();
            localStorage.setItem("theme", theme);
        }
        console.log(theme);
    },

    changeTheme(el) {
        console.log(el);
    },

    _getSystemTheme() {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    },

    // _loadThemeFromLocalStorage() {
    //     const theme = localStorage.getItem("theme");
    // },
};

export { themeHandler };
