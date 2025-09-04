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

        if (galleryState.selectedSortCriteria == MOST_LIKES_SORT_CRITERIA) {
            // Like sorting is active → reload the grid
            const params = new URLSearchParams();
            if (galleryState.selectedTagId && galleryState.selectedTagId !== "-1") params.append('tag', galleryState.selectedTagId);
            if (galleryState.selectedAuthor && galleryState.selectedAuthor !== "-1") params.append('author', galleryState.selectedAuthor);
            if (galleryState.selectedSortCriteria && galleryState.selectedSortCriteria !== "-1") params.append('sort', galleryState.selectedSortCriteria);

            const galleryUrl = `/trips/${galleryState.tripSlug}/gallery?` + params.toString();

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