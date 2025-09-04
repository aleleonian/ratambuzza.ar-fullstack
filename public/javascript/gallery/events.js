window.MOST_LIKES_SORT_CRITERIA = 1;

// This listener is for the form inside like - button - gallery.ejs
document.body.addEventListener('submit', async function (e) {
    if (!e.target.matches('.like-form')) return;
    e.preventDefault();
    const form = e.target;

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            headers: { 'HX-Request': 'true' }
        });

        if (!response.ok) throw new Error('Failed to like');

        if (window.galleryState.selectedSortCriteria == MOST_LIKES_SORT_CRITERIA) {
            // Like sorting is active → reload the grid
            const params = new URLSearchParams();
            if (window.galleryState.selectedTagId && window.galleryState.selectedTagId !== "-1") params.append('tag', window.galleryState.selectedTagId);
            if (window.galleryState.selectedAuthor && window.galleryState.selectedAuthor !== "-1") params.append('author', window.galleryState.selectedAuthor);
            if (window.galleryState.selectedSortCriteria && window.galleryState.selectedSortCriteria !== "-1") params.append('sort', window.galleryState.selectedSortCriteria);

            const galleryUrl = `/trips/${window.galleryState.tripSlug}/gallery?` + params.toString();

            htmx.ajax('GET', galleryUrl, {
                target: '#media-grid',
                swap: 'innerHTML'
            });
        } else {
            // Like sorting NOT active → only update this button
            const html = await response.text();
            form.outerHTML = html;
        }
    } catch (err) {
        showToast('Error al dar like', 'error');
        console.error(err);
    }
});

// tags-updated event handling
document.body.addEventListener('tags-updated', (e) => {
    const { updatedTags } = e.detail;
    // if tags were updated either on the hover menu or the lightbox
    // then we must update the pill-filters
    let url = `/trips/${window.galleryState.tripSlug}/gallery/filter-pills`;
    let options = { target: `#filter-pills`, swap: 'innerHTML' };
    htmx.ajax('GET', url, options);

    // HTMX load new filtered media
    // window.galleryState.selectedTagId & window.galleryState.selectedAuthor & window.galleryState.selectedSortCriteria are global variables
    // if the tags were updated, then we might need to update the media items
    // that are being filtered (if window.galleryState.selectedTagId != -1)

    const updatedTagSet = new Set(updatedTags.map(t => t.toLowerCase()));

    // selectedTagName is a global var holding the current filter, like 'food'
    if (window.galleryState.selectedTagId !== -1) {
        const selectedTagPill = document.querySelector(`.tag-pill[data-tag="${window.galleryState.selectedTagId}"]`);
        const selectedTagName = selectedTagPill?.textContent?.trim()?.toLowerCase?.();

        if (!updatedTagSet.has(selectedTagName.toLowerCase())) {
            console.log(`Tag '${selectedTagName}' removed from tags, refreshing grid`);

            const params = new URLSearchParams();
            if (window.galleryState.selectedTagId && window.galleryState.selectedTagId !== "-1") params.append('tag', window.galleryState.selectedTagId);
            if (window.galleryState.selectedAuthor && window.galleryState.selectedAuthor !== "-1") params.append('author', window.galleryState.selectedAuthor);
            if (window.galleryState.selectedSortCriteria && window.galleryState.selectedSortCriteria !== "-1") params.append('sort', window.galleryState.selectedSortCriteria);

            const galleryUrl = `/trips/${window.galleryState.tripSlug}/gallery?` + params.toString();
            htmx.ajax('GET', galleryUrl, {
                target: '#media-grid',
                swap: 'innerHTML'
            });
        }
    }
});

// lightbox stuff
document.body.addEventListener('htmx:afterSwap', function (e) {

    const isTagEditorSwap = e.target.id?.startsWith?.('tag-editor-');
    if (!isTagEditorSwap) return;

    const mediaId = e.target.dataset.mediaId;
    if (!mediaId) return;

    const current = document.getElementById('lightbox-metadata');
    if (!current) return;

    // let's update the lightbox meta data for the media item that is
    // actually being viewed and not another one.
    // only refresh lightbox metadata if the swap came from editing tags
    if (current.dataset.mediaId === mediaId) {
        htmx.ajax('GET', `/trips/${window.galleryState.tripSlug}/gallery/${mediaId}/lightbox-data`, {
            target: '#lightbox-meta'
        });
        const dialog = document.getElementById('lightbox-tag-editor-modal');
        dialog.classList.add('hidden');

        // ✅ Re-enable lightbox keyboard nav now that tag editor is gone
        window.enableLightboxKeyboardNavigation = true;
    }
});

// after the tags were edited, either in the hover menu or lightbox
// fire tags-updated event to we can re-fetch the filter-pills
document.body.addEventListener('htmx:afterSwap', function (evt) {
    const el = evt.target;
    const updatedTagList = el.querySelector('.tag-list.just-updated');
    if (updatedTagList) {
        const tagsJson = updatedTagList.dataset.tags;
        const updatedTags = JSON.parse(tagsJson || '[]');
        // const mediaId = updatedTagList.dataset.mediaId;
        document.body.dispatchEvent(new CustomEvent('tags-updated', { detail: { updatedTags } }));
    }
});

// Re-apply active class after filter-pills update
// Update DOM after adding or removing tags
// related to tags-updated
// htmx:afterSettle is the safest place to touch the DOM after a swap. It guarantees:
document.body.addEventListener('htmx:afterSettle', (evt) => {
    if (evt.target.id === 'filter-pills') {
        if (window.galleryState.filterDivState) {
            console.log('Restoring active pills:', window.galleryState.selectedTagId, window.galleryState.selectedAuthor, window.galleryState.selectedSortCriteria);

            const filters = document.getElementsByClassName('filter-container')[0];
            filters.classList.toggle('hidden');
        }
        const activeTagPill = document.querySelector(`.sorting-pill[data-tag="${window.galleryState.selectedTagId}"]`);
        if (activeTagPill) {
            activeTagPill.classList.add('active');
        }
        const activeAuthorPill = document.querySelector(`.sorting-pill[data-author="${window.galleryState.selectedAuthor}"]`);
        if (activeAuthorPill) {
            activeAuthorPill.classList.add('active');
        }
        const activeSortPill = document.querySelector(`.sort-pill[data-sort="${window.galleryState.selectedSortCriteria}"]`);
        if (activeSortPill) {
            activeSortPill.classList.add('active');
        }
    }
});