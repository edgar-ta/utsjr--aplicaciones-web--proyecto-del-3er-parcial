function convertToKebabCase(string) {
    return string
        .trim()
        .split(/[\-\s]/)
        .filter(substring => substring.length > 0)
        .map(substring => substring.toLowerCase())
        .join("-")
    ;
}


/** @type {HTMLInputElement} */
const databaseNameInput = document.querySelector("[data-id='database-name-input']");
const databaseId = document.querySelector("[data-database-id]").getAttribute("data-database-id");

/** @type {HTMLLinkElement} */
const currentDatabaseLink = document.querySelector("[data-current-database-anchor]").previousElementSibling;

const urlEdition = createDelayedAction(() => {
    const url = new URL(window.location);
    const name = convertToKebabCase(databaseNameInput.value);
    const pathname = `/databases/${name}-${databaseId}`;
    url.pathname = pathname;

    currentDatabaseLink.href = url.toString();
    currentDatabaseLink.innerText = databaseNameInput.value;

    window.history.replaceState({}, "", url);
}, 50);

const tableUpdate = createDelayedAction(async () => {
    const url = new URL(window.location);
    url.pathname = "/rename/database";

    const parameters = new URLSearchParams();
    parameters.set("databaseId", databaseId);
    parameters.set("name", databaseNameInput.value);

    url.search = parameters;

    await fetch(url).then(response => response.json()).then(value => console.log(value));
}, 1_000);

databaseNameInput.addEventListener("input", (event) => {
    urlEdition();
    tableUpdate();
});

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

