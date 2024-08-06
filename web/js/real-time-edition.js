function createDelayedAction(callback, minimumDelay) {
    /** @type {number?} */
    let handler = null;

    return function() {
        if (handler !== null) {
            clearTimeout(handler);
        }
        handler = setTimeout(() => {
            callback();
            handler = null;
        }, minimumDelay);
    }
}


