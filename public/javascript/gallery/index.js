// TODO: save this in the localStorage and not globally
import './events.js';
import '../lightbox/index.js';
import './mobile-overlay.js';

// gallery globals
const DEFAULT_TAG_ID = -1;
const DEFAULT_AUTHOR = -1;
const DEFAULT_SORT_CRITERIA = -1;
const CLOSED = false;

const DEFAULT_FILTER_DIV_STATE = CLOSED;

window.galleryState = window.galleryState || {};

Object.assign(window.galleryState, {
    selectedTagId: DEFAULT_TAG_ID,
    selectedAuthor: DEFAULT_AUTHOR,
    selectedSortCriteria: DEFAULT_SORT_CRITERIA,
    filterDivState: DEFAULT_FILTER_DIV_STATE,
});


window.htmxAjaxPromise = function (method, url, options = {}) {
    return new Promise((resolve, reject) => {
        const targetSelector = options.target;
        if (!targetSelector) {
            reject(new Error("htmxAjaxPromise requires a { target } option"));
            return;
        }

        try {
            const listener = (evt) => {
                const req = evt.detail?.requestConfig;
                if (req?.verb.toUpperCase() === method.toUpperCase() && req.path === url) {
                    document.body.removeEventListener('htmx:afterRequest', listener);
                    resolve(evt);
                }
            };

            document.body.addEventListener('htmx:afterRequest', listener);
            htmx.ajax(method, url, options);
        } catch (err) {
            reject(err);
        }
    });
}

window.getGalleryItems = function () {
    return Array.from(document.querySelectorAll('.gallery-item'));
}

window.stringNumberToBoolean = function (stringNumber) {
    return Boolean(Number(stringNumber));
}
