// TODO: save this in the localStorage and not globally
import './events.js';

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


// const galleryState = {
//     selectedTagId: DEFAULT_TAG_ID,
//     selectedAuthor: DEFAULT_AUTHOR,
//     selectedSortCriteria: DEFAULT_SORT_CRITERIA,
//     filterDivState: DEFAULT_FILTER_DIV_STATE,
// };

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

window.stringToBoolean = function (string) {
    return Boolean(string);
}


// Events:

// This listener is for the form inside like - button - gallery.ejs
// document.body.addEventListener('submit', async function (e) {
//     if (!e.target.matches('.like-form')) return;
//     e.preventDefault();
//     const form = e.target;

//     try {
//         const response = await fetch(form.action, {
//             method: 'POST',
//             headers: { 'HX-Request': 'true' }
//         });

//         if (!response.ok) throw new Error('Failed to like');

//         if (galleryState.selectedSortCriteria == MOST_LIKES_SORT_CRITERIA) {
//             // Like sorting is active → reload the grid
//             const params = new URLSearchParams();
//             if (galleryState.selectedTagId && galleryState.selectedTagId !== "-1") params.append('tag', galleryState.selectedTagId);
//             if (galleryState.selectedAuthor && galleryState.selectedAuthor !== "-1") params.append('author', galleryState.selectedAuthor);
//             if (galleryState.selectedSortCriteria && galleryState.selectedSortCriteria !== "-1") params.append('sort', galleryState.selectedSortCriteria);

//             const galleryUrl = `/trips/<%= currentOrUpcomingTrip.slug %>/gallery?` + params.toString();

//             htmx.ajax('GET', galleryUrl, {
//                 target: '#media-grid',
//                 swap: 'innerHTML'
//             });
//         } else {
//             // Like sorting NOT active → only update this button
//             const html = await response.text();
//             form.outerHTML = html;
//         }
//     } catch (err) {
//         showToast('Error al dar like', 'error');
//         console.error(err);
//     }
// });