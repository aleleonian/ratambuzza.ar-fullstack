function isTouchDevice() {
    // 'coarse' pointer means it's not precise (like a mouse) — i.e. it’s probably a finger.
    return window.matchMedia('(pointer: coarse)').matches;
}

document.body.addEventListener('click', function (e) {
    const overlay = e.target.closest('.overlay');

    // Only care about touch devices and overlay clicks
    if (!overlay || !isTouchDevice()) return;

    // Is this the first tap?
    // If not activated yet, just activate the overlay and block the tap
    if (overlay.dataset.active !== 'true') {
        e.preventDefault();
        e.stopPropagation();
        overlay.dataset.active = 'true';

        // Optional: clear others
        document.querySelectorAll('.overlay[data-active="true"]').forEach(o => {
            if (o !== overlay) o.dataset.active = 'false';
        });

        return;
    }

    // Already active — allow the tap through
});
