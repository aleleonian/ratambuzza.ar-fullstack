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