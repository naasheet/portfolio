/**
 * Replace an element's text without swapping out the text node React rendered, so React's
 * own reference stays valid. Used by effects that rewrite text every frame (count-up,
 * scramble) instead of going through React state.
 */
export function writeText(el: HTMLElement, text: string): void {
  const node = el.firstChild;
  if (node && node.nodeType === Node.TEXT_NODE && node === el.lastChild) {
    node.nodeValue = text;
  } else {
    el.textContent = text;
  }
}
