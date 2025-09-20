const cart = {
    items: [],
    total: null,

    init() {
        console.log("Iniciei")
        console.log(this.items);
        console.log(this.total);
    },

    destroy() {
      console.log("Fui destruido")  
    },

    addUn(item) {
        item.qty += 1;
        this.calcTotal(item);
    },

    subUn(item) {
        if (item.qty > 0) {
            item.qty -= 1;
            this.calcTotal(item);
        }
    },

    calcTotal(item) {
        item.total = item.qty * item.price;
        this.total = this.items.reduce((accumulator, currentItem) => {
            return accumulator + currentItem.total;
        }, 0);
        console.log(this.total);
    },
};

export { cart };
