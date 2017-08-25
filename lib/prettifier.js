import { Observer } from './observer';

export * from 'js-beautify';

export const name = 'prettifier';


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

Observer(module.exports);
