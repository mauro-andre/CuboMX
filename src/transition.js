const transition = (el, name, type) => {
    const enterStartClass = `${name}-enter-start`;
    const enterEndClass = `${name}-enter-end`;
    const leaveStartClass = `${name}-leave-start`;
    const leaveEndClass = `${name}-leave-end`;
    // Clear any previous transition timeouts or handlers
    if (el.__mx_transition_timeout__) {
        clearTimeout(el.__mx_transition_timeout__);
        el.__mx_transition_timeout__ = undefined; // Clear custom property
    }
    if (el.__mx_transition_handler__) {
        el.removeEventListener("transitionend", el.__mx_transition_handler__);
        el.__mx_transition_handler__ = undefined; // Clear custom property
    }
    const runTransition = (startClasses, endClasses, finalAction) => {
        // Ensure element is visible before starting enter transition
        if (type === "enter") {
            el.style.display = ""; // Let CSS determine display type
        }
        // Remove all transition-related classes before adding new ones
        el.classList.remove(enterStartClass, enterEndClass, leaveStartClass, leaveEndClass);
        el.classList.add(...startClasses);
        // Use requestAnimationFrame for better performance and to ensure classes are applied
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Double rAF to ensure repaint
                el.classList.remove(...startClasses);
                el.classList.add(...endClasses);
                const onEnd = () => {
                    el.classList.remove(...endClasses);
                    el.removeEventListener("transitionend", onEnd);
                    el.__mx_transition_handler__ = undefined;
                    if (finalAction)
                        finalAction();
                };
                // Add event listener for transition end
                el.addEventListener("transitionend", onEnd);
                el.__mx_transition_handler__ = onEnd;
                // Fallback for transitions that don't trigger transitionend (e.g., display: none)
                // Or if transition duration is 0
                el.__mx_transition_timeout__ = setTimeout(() => {
                    if (el.__mx_transition_handler__) {
                        // Only run if transitionend hasn't fired
                        onEnd();
                    }
                }, parseFloat(getComputedStyle(el).transitionDuration) * 1000 + 50); // Add a small buffer
            });
        });
    };
    if (type === "enter") {
        runTransition([enterStartClass], [enterEndClass], null);
    }
    else {
        // leave
        runTransition([leaveStartClass], [leaveEndClass], () => {
            el.style.display = "none";
        });
    }
};
export { transition };
