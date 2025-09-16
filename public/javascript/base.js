window.htmxAjaxPromise = function (method, url, options = {}) {
    return new Promise((resolve, reject) => {
        // const targetSelector = options.target;
        // if (!targetSelector) {
        //     reject(new Error("htmxAjaxPromise requires a { target } option"));
        //     return;
        // }

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

window.showToast = function (message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast-container');
    toast.innerText = message;

    // Set background color based on type
    const colors = {
        success: '#4caf50',  // Green
        error: '#f44336',  // Red
        warning: '#ff9800',  // Orange
        info: '#2196f3'   // Blue
    };
    toast.style.backgroundColor = colors[type] || colors.info;

    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}