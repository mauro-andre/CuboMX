import { CuboMX } from "cubomx";

const nav = {
    links: [],
    currentPage: null,

    init() {
        this._resolveActive();
        this.$watch("currentPage", () => {
            this._resolveActive();
            CuboMX.actions([
                {
                    action: "setTextContent",
                    selector: "title",
                    text: this.currentPage,
                },
            ]);
        });
    },

    _resolveActive() {
        this.links.forEach((item) => {
            item.title == this.currentPage
                ? item.addClass("active")
                : item.removeClass("active");
        });
    },

    async goToPage(item) {
        try {
            await CuboMX.request({
                url: item.href,
                pushUrl: true,
                history: true,
                strategies: [
                    { select: "#main-content", target: "#main-content" },
                ],
            });
        } catch (error) {
            console.log(error);
        }
    },
};

export { nav };
