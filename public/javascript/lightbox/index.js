let lightboxItems = [];
let currentIndex = 0;

function initLightbox(options = {}) {
    currentIndex = 0;

    if (options.customButtons && options.customButtons.length > 0) {
        options.customButtons.forEach(customButton => {
            if (document.getElementById(customButton.buttonId)) {
                document.getElementById(customButton.buttonId).addEventListener(customButton.eventType, customButton.handler);
            }
        })
    }
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('lightbox-next').addEventListener('click', showNextLightbox);
    document.getElementById('lightbox-prev').addEventListener('click', showPrevLightbox);

    document.addEventListener('keydown', (e) => {
        const lb = document.getElementById('lightbox');
        if (lb.classList.contains('hidden')) return;
        if (e.key === 'ArrowRight') showNextLightbox();
        if (e.key === 'ArrowLeft') showPrevLightbox();
        if (e.key === 'Escape') closeLightbox();
    });

    document.getElementById('lightbox').addEventListener('click', (e) => {
        if (e.target.id === 'lightbox') closeLightbox();
    });
}

function showLightboxImage(item) {
    const img = document.getElementById('lightbox-img');

    // Show spinner immediately
    showSpinner();
    img.classList.add('hidden');

    // Remove previous load/error handlers just in case
    img.onload = null;
    img.onerror = null;

    // Add new handlers
    img.onload = () => {
        hideSpinner();
        img.classList.remove('hidden');
    };

    img.onerror = () => {
        hideSpinner();
        console.error("Failed to load image:", item.url);
        // optionally show a placeholder or error state
    };

    // Trigger loading
    img.src = item.url;
}


function openLightbox(index, items = null) {
    if (items) {
        lightboxItems = items;
    }
    currentIndex = index;
    const item = lightboxItems[currentIndex];
    showLightboxImage(item);
    document.getElementById('lightbox-download').href = item.url;
    document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.add('hidden');
}

function showNextLightbox() {
    if (lightboxItems.length < 2) return;
    currentIndex = (currentIndex + 1) % lightboxItems.length;
    openLightbox(currentIndex);
}

function showPrevLightbox() {
    if (lightboxItems.length < 2) return;
    currentIndex = (currentIndex - 1 + lightboxItems.length) % lightboxItems.length;
    openLightbox(currentIndex);
}
