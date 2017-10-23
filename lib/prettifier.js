import jsBeautify from 'js-beautify';
import { Observer } from './observer';

export const __name = 'prettifier';

export const css = jsBeautify.css;
export const html = jsBeautify.html;
export const js = jsBeautify.js;

/** Used for escape and unescape HTML. */
const escElement = document.createElement('textarea');


/**
 * Escapes HTML.
 * Used for pretty formatting HTML, CSS and JS to prepare for syntax highlighting.
 * @param {String} html - Valid HTML syntax
 */
export function escapeHTML(html) {
    escElement.textContent = html;
    return escElement.innerHTML;
}

/**
 * Unescapes HTML.
 * @param {String} html - Valid HTML syntax,
 */
export function unescapeHTML(html) {
    escElement.innerHTML = html;
    return escElement.textContent;
}

const O = Observer();

export const on = O.on;
export const one = O.one;
export const off = O.off;
export const trigger = O.trigger;
