// TODO: save this in the localStorage and not globally
import './events.js';
import './lightbox.js';
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


window.getGalleryItems = function () {
    return Array.from(document.querySelectorAll('.gallery-item'));
}

window.stringNumberToBoolean = function (stringNumber) {
    return Boolean(Number(stringNumber));
}
