import { transition } from "./transition";
const textReaction = (reaction) => {
    const { element, newValue } = reaction;
    element.textContent = String(newValue ?? "");
};
const htmlReaction = (reaction) => {
    const { element, newValue } = reaction;
    element.innerHTML = String(newValue ?? "");
};
const attributeReaction = (reaction) => {
    const { element, attrName, newValue } = reaction;
    if (!attrName)
        return;
    const isHtmlInputElement = element instanceof HTMLInputElement;
    const hasValueProperty = element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement;
    if (attrName == "value" && hasValueProperty) {
        element.value = String(newValue ?? "");
    }
    else if (attrName === "checked" && isHtmlInputElement) {
        element.checked = Boolean(newValue);
    }
    else {
        element.setAttribute(attrName, String(newValue ?? ""));
    }
};
const classReaction = (reaction) => {
    const { element, newValue } = reaction;
    element.className = "";
    if (Array.isArray(newValue)) {
        element.classList.add(...newValue.filter(Boolean));
    }
    else if (typeof newValue === "string") {
        element.className = newValue;
    }
};
const showReaction = (reaction) => {
    const { element, newValue } = reaction;
    const state = !!newValue; // Ensure boolean
    const transitionName = element.getAttribute("mx-transition");
    if (!transitionName) {
        // No transition, just toggle display
        element.style.display = state ? "" : "none";
    }
    else {
        // With transition
        if (state) {
            transition(element, transitionName, "enter");
        }
        else {
            transition(element, transitionName, "leave");
        }
    }
};
const reactionsTypeMap = new Map([
    ["text", (reaction) => textReaction(reaction)],
    ["html", (reaction) => htmlReaction(reaction)],
    ["attribute", (reaction) => attributeReaction(reaction)],
    ["class", (reaction) => classReaction(reaction)],
    ["mx-show", (reaction) => showReaction(reaction)], // Add mx-show reaction
]);
const resolveReactions = (reaction, newValue, oldValue) => {
    const { type } = reaction;
    const handler = reactionsTypeMap.get(type);
    if (handler) {
        const reactionHandler = {
            newValue,
            oldValue,
            ...reaction,
        };
        handler(reactionHandler);
    }
};
export { resolveReactions };
