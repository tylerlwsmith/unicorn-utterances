/**
 * This allows items like cards to bind a click event to navigate to a path.
 *
 * Handles:
 * - Left clicks
 * - Middle clicks
 * - Ctrl + Left clicks
 * - Shift + Left clicks
 * - Meta + Left clicks
 *
 *
 * Ignores:
 * - Right clicks (used for context menus)
 * - Alt clicks (used for downloading)
 * - Default prevented events
 * - Nested elements with data-navigation-path
 * - Elements with [data-dont-bind-navigate-click]
 * - <a> tags and <button>s
 */
function isNestedElement(e: MouseEvent) {
	// if the targeted element is nested inside another clickable anchor/button
	let target = e.target as HTMLElement;
	while (target !== e.currentTarget) {
		if (
			target.tagName.toLowerCase() === "a" ||
			target.tagName.toLowerCase() === "button"
		)
			return true;

		// Explicitly don't bind
		if (target.getAttribute("data-dont-bind-navigate-click") !== null)
			return true;

		target = target.parentElement;
	}
	return false;
}

globalThis.handleHrefContainerMouseDown = (e: MouseEvent) => {
	const isMiddleClick = e.button === 1;
	if (!isMiddleClick) return;
	if (e.defaultPrevented) return;
	if (isNestedElement(e)) return;
	e.preventDefault();
};

// Handle middle click button - should open a new tab (cannot be detected via "click" event)
// - prefer the "auxclick" event for this, since it ensures that mousedown/mouseup both occur within the same element
//   otherwise, using "mouseup" would activate on mouseup even when dragging between elements, which should not trigger a click
globalThis.handleHrefContainerAuxClick = (e: MouseEvent) => {
	const href = (e.currentTarget as HTMLElement).dataset.href;

	// only handle middle click events
	if (e.button !== 1) return;

	if (e.defaultPrevented) return;
	if (isNestedElement(e)) return;

	e.preventDefault();
	window.open(href, "_blank");
	return false;
};

globalThis.handleHrefContainerClick = (e: MouseEvent) => {
	const href = (e.currentTarget as HTMLElement).dataset.href;

	if (e.defaultPrevented) return;
	if (isNestedElement(e)) return;

	// only handle left click events
	if (e.button !== 0) return;
	// Download
	if (e.altKey) return;

	e.preventDefault();

	// Open in new tab
	if (e.metaKey || e.ctrlKey || e.shiftKey) {
		window.open(href, "_blank");
		return false;
	}

	// If text is selected, don't activate on mouseup (but ctrl+click should still work)
	const selection = window.getSelection();
	if (
		selection?.toString()?.length &&
		selection.containsNode(e.target as Node, true)
	)
		return;

	window.location.href = href;
};

export function getHrefContainerProps(href: string) {
	if (process?.versions?.node) {
		// if running in NodeJS (Astro), return string props
		return {
			onmousedown: "handleHrefContainerMouseDown(event)",
			onauxclick: "handleHrefContainerAuxClick(event)",
			onclick: "handleHrefContainerClick(event)",
			"data-href": href,
		};
	} else {
		// otherwise, need to return client-side functions
		return {
			onMouseDown: globalThis.handleHrefContainerMouseDown,
			onAuxClick: globalThis.handleHrefContainerAuxClick,
			onClick: globalThis.handleHrefContainerClick,
			"data-href": href,
		};
	}
}
