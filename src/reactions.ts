import { Reaction } from "./types";
import { transition } from "./transition";

interface ReactionHandler extends Reaction {
    newValue: any;
    oldValue: any;
}

const textReaction = (reaction: ReactionHandler) => {
    const { element, newValue } = reaction;
    element.textContent = String(newValue ?? "");
};

const htmlReaction = (reaction: ReactionHandler) => {
    const { element, newValue } = reaction;
    element.innerHTML = String(newValue ?? "");
};

const attributeReaction = (reaction: ReactionHandler) => {
    const { element, attrName, newValue } = reaction;
    if (!attrName) return;

    const isHtmlInputElement = element instanceof HTMLInputElement;
    const hasValueProperty =
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement;

    if (attrName == "value" && hasValueProperty) {
        (
            element as
                | HTMLInputElement
                | HTMLTextAreaElement
                | HTMLSelectElement
        ).value = String(newValue ?? "");
    } else if (attrName === "checked" && isHtmlInputElement) {
        element.checked = Boolean(newValue);
    } else {
        element.setAttribute(attrName, String(newValue ?? ""));
    }
};

const classReaction = (reaction: ReactionHandler) => {
    const { element, newValue } = reaction;
    element.className = "";

    if (Array.isArray(newValue)) {
        element.classList.add(...newValue.filter(Boolean));
    } else if (typeof newValue === "string") {
        element.className = newValue;
    }
};

const showReaction = (reaction: ReactionHandler) => {
    const { element, newValue } = reaction;
    const state = !!newValue; // Ensure boolean

    const transitionName = element.getAttribute("mx-transition");

    if (!transitionName) {
        // No transition, just toggle display
        element.style.display = state ? "" : "none";
    } else {
        // With transition
        if (state) {
            transition(element, transitionName, "enter");
        } else {
            transition(element, transitionName, "leave");
        }
    }
};

const reactionsTypeMap = new Map<string, (reaction: ReactionHandler) => void>([
    ["text", (reaction: ReactionHandler) => textReaction(reaction)],
    ["html", (reaction: ReactionHandler) => htmlReaction(reaction)],
    ["attribute", (reaction: ReactionHandler) => attributeReaction(reaction)],
    ["class", (reaction: ReactionHandler) => classReaction(reaction)],
    ["mx-show", (reaction: ReactionHandler) => showReaction(reaction)], // Add mx-show reaction
]);

const resolveReactions = (reaction: Reaction, newValue: any, oldValue: any) => {
    const { type } = reaction;
    const handler = reactionsTypeMap.get(type);
    if (handler) {
        const reactionHandler: ReactionHandler = {
            newValue,
            oldValue,
            ...reaction,
        };
        handler(reactionHandler);
    }
};

export { resolveReactions };
