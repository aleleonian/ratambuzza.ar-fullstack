
window.currentIndexLightbox = -1;
window.enableLightboxKeyboardNavigation = true;

window.openLightbox = async function (index) {
    const lightboxDiv = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const mediaItems = window.getGalleryItems();
    if (index < 0 || index >= mediaItems.length) return;
    // When openLightbox(index) is called, fire an HTMX request to /media/:id/lightbox-data
    // Use hx-target to inject into a #lightbox-meta container
    const mediaId = mediaItems[index].dataset.mediaId;

    await window.htmxAjaxPromise(
        'GET',
        `/trips/${window.galleryState.tripSlug}/gallery/${mediaId}/lightbox-data`,
        { target: '#lightbox-meta' }
    );

    const meta = document.getElementById('lightbox-metadata').dataset;
    // now according to the data in #lightbox-container i must make some modifications
    // const userLiked = Boolean(Number(document.getElementById('lightbox-meta-userLiked').value));
    const userLiked = window.stringNumberToBoolean(meta.liked);
    const lightboxLikeButton = document.getElementById('lightbox-like-button');
    if (userLiked) {
        lightboxLikeButton.innerHTML = "❤️"
    }
    else {
        lightboxLikeButton.innerHTML = "🤍"
    }
    const itemUrl = meta.mediaUrl;
    document.getElementById('lightbox-download').href = itemUrl;

    if (window.stringNumberToBoolean(meta.mediaOwner) || window.galleryState.currentUserRole === 'admin') {
        document.getElementById('lightbox-delete-button').style.display = 'block';
        document.getElementById('lightbox-edit-tags-button').style.display = 'block';
    }
    else {
        document.getElementById('lightbox-delete-button').style.display = 'none';
        document.getElementById('lightbox-edit-tags-button').style.display = 'none'
    }

    window.currentIndexLightbox = index;
    const link = mediaItems[window.currentIndexLightbox];
    const fullUrl = link.getAttribute('href');
    lightboxImg.src = fullUrl;
    lightboxDiv.classList.add('active');
}
window.openLightboxFromElement = function (trigger) {
    const anchor = trigger.closest('.media-item')?.querySelector('.gallery-item');
    if (!anchor) return;

    const galleryItems = Array.from(document.querySelectorAll('#media-grid .gallery-item'));
    const index = galleryItems.indexOf(anchor);

    if (index === -1) return;

    window.openLightbox(index);
}
window.closeLightbox = function () {
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxDiv = document.getElementById('lightbox');
    lightboxDiv.classList.remove('active');
    lightboxImg.src = '';
}
window.showNextLightbox = function () {
    if (window.enableLightboxKeyboardNavigation) {
        const mediaItems = window.getGalleryItems();
        const nextIndex = (window.currentIndexLightbox + 1) % mediaItems.length;
        window.openLightbox(nextIndex);
    }
}
window.showPrevLightbox = function () {
    if (window.enableLightboxKeyboardNavigation) {

        const mediaItems = window.getGalleryItems();
        const prevIndex = (window.currentIndexLightbox - 1 + mediaItems.length) % mediaItems.length;
        window.openLightbox(prevIndex);
    }
}
window.editTagsLightbox = function () {
    const meta = document.getElementById('lightbox-metadata').dataset;
    const mediaId = meta.mediaId;
    const modal = document.getElementById('lightbox-tag-editor-modal');
    const url = `/trips/${window.galleryState.tripSlug}/gallery/${mediaId}/tags/edit`;

    // Set a one-time event listener for this request
    const listener = () => {
        modal.classList.remove('hidden');
        htmx.off("htmx:afterSwap", listener); // clean up after firing
    };

    htmx.on("htmx:afterSwap", listener);

    // Fire the HTMX request
    try {
        htmx.ajax('GET', url, { target: '#lightbox-tag-editor-modal', swap: 'innerHTML' });
    }
    catch (error) {
        showToast('Error retrieving tags: ' + error, 'error');
    }
}
window.likeToggleLightbox = async function () {
    let meta = document.getElementById('lightbox-metadata').dataset;
    const mediaId = meta.mediaId;
    let url = `/trips/${window.galleryState.tripSlug}/gallery/${mediaId}/like`;
    let options = { target: `#like-button-container-${mediaId}`, swap: 'innerHTML' };
    try {
        debugger;
        await window.htmxAjaxPromise('POST', url, options);
        // now i should reload meta data to repaint the button
        options = { target: `#lightbox-meta` };
        url = `/trips/${window.galleryState.tripSlug}/gallery/${mediaId}/lightbox-data`;
        await window.htmxAjaxPromise('GET', url, options);
        meta = document.getElementById('lightbox-metadata').dataset;
        const userLiked = window.stringNumberToBoolean(meta.liked);
        const lightboxLikeButton = document.getElementById('lightbox-like-button');
        if (!userLiked) {
            lightboxLikeButton.innerHTML = "🤍"
        }
        else {
            lightboxLikeButton.innerHTML = "❤️"
        }
        if (window.galleryState.selectedSortCriteria == window.MOST_LIKES_SORT_CRITERIA) {
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
        }
    } catch (err) {
        showToast('Error toggling like', 'error');
    }
}
window.deleteMediaItemLightbox = async function () {
    if (!confirm('Seguro de borrar este item?')) return false;
    const meta = document.getElementById('lightbox-metadata').dataset;
    const mediaId = meta.mediaId;
    const url = `/trips/${window.galleryState.tripSlug}/gallery/${mediaId}/delete`;
    const options = { target: `#media-item-${mediaId}`, swap: 'outerHTML' };
    try {
        await window.htmxAjaxPromise('DELETE', url, options);
        const mediaItems = window.getGalleryItems();
        if (mediaItems.length === 0) {
            document.getElementById('no-images-message').textContent = 'Nada que ver aquí :/'
        }
        return true;
    }
    catch (error) {
        showToast('Error deleting media item: ' + error, 'error');
        return false;
    }
}