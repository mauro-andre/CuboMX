import { CuboMX } from './src/CuboMX.js';

// Setup
document.body.innerHTML = `
    <div mx-data="listManager">
        <ul id="item-list">
            <li mx-item="items" ::class="itemClasses" ::text="name"></li>
        </ul>
    </div>
`;

CuboMX.component('listManager', {
    items: [],
    init() {
        console.log('init called');
    },
});

CuboMX.start();

// Delete the initial hydrated item
CuboMX.listManager.items.delete(0);

// Prepend item with explicit ::class property
CuboMX.listManager.items.prepend({
    name: "Prepended item",
    itemClasses: ["class3", "prepended"]
});

setTimeout(() => {
    const prependedItem = CuboMX.listManager.items[0];
    console.log('prependedItem:', prependedItem);
    console.log('prependedItem.itemClasses:', prependedItem.itemClasses);
    console.log('prependedItem.itemClasses (array check):', Array.isArray(prependedItem.itemClasses));

    const itemElement = document.querySelector('#item-list li');
    console.log('itemElement:', itemElement);
    console.log('itemElement.classList:', Array.from(itemElement.classList));
    console.log('itemElement.className:', itemElement.className);
}, 100);
