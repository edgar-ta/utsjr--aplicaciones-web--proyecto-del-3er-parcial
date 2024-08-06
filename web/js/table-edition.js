function convertToKebabCase(string) {
    return string
        .trim()
        .split(/[\-\s]/)
        .filter(substring => substring.length > 0)
        .map(substring => substring.toLowerCase())
        .join("-")
    ;
}

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

/** @type {NodeListOf<HTMLInputElement>} */
const columnNameInputs = document.querySelectorAll("[data-id='column-name-input']");

const areAllNamesUnique = () => {
    const nameInputs = Array.of(...columnNameInputs.values());
    const names = nameInputs.map(nameInput => nameInput.value.trim());
    const set = new Set(names);
    return set.size === names.length;
};

const areAllNamesIncluded = () => {
    const nameInputs = Array.of(...columnNameInputs.values());
    return nameInputs.every(input => input.value !== "");
};

const validateNameInputs = () => {
    let validity = "correct";
    if (!areAllNamesUnique() || !areAllNamesIncluded()) {
        validity = "incorrect";
    }
    columnNameInputs.forEach(columnNameInput => {
        columnNameInput.setAttribute("data-input-validity", validity);
    });
}

function setupColumnNameInputs(selectedTableUrl) {
    columnNameInputs.forEach(input => {
        const action = createDelayedAction(async () => {
            const previousName = input.getAttribute("data-column-name");
            const currentName = input.value;
    
            if (areAllNamesUnique() && previousName !== currentName) {
                const url = new URL(window.location);
                url.pathname = `/rename/database/${selectedTableUrl}/${previousName}`;
            
                const parameters = new URLSearchParams();
                parameters.set("name", currentName);
            
                url.search = parameters;

                await fetch(url)
                    .then(response => response.json())
                    .then(value => {
                        console.log(value);
                        if (value.ok) {
                            input.setAttribute("data-column-name", currentName);
                        }
                    });
            }
        }, 1_000);
    
        input.addEventListener("input", (event) => {
            console.log(selectedTableUrl);
            action();
            validateNameInputs();
        })
    });
}


/** @type {HTMLButtonElement} */
const insertionButton = document.querySelector("[data-id='insert-record-button']");
insertionButton.addEventListener("click", (event) => {
    const preexistentNewRecord = document.querySelector("[data-id='new-record']");
    const newRecordExists = preexistentNewRecord !== null;
    if (newRecordExists) {
        /** @type {HTMLInputElement} */
        const firstInput = preexistentNewRecord.querySelector("input:not([disabled])");
        firstInput?.focus();
        return;
    }

    /** @type {HTMLDivElement} */
    const newRecordContainer = document.querySelector("[data-id='new-record-container']");

    /** @type {HTMLTemplateElement} */
    const newRecordTemplate = document.querySelector("[data-id='new-record-template']");

    const newRecordFragment = document.importNode(newRecordTemplate.content, true);

    /** @type {HTMLDivElement} */
    const newRecord = newRecordFragment.querySelector("[data-id='new-record']");

    setupNewRecordConstraints(newRecord);

    newRecordContainer.appendChild(newRecordFragment);
});

/**
 * 
 * @returns {number} The id that would correspond to a new record that the user wishes to create
 */
function getNextRecordId() {
    /** @type {HTMLTableElement} */
    const recordsTable = document.querySelector("[data-id='records-table']");
    const recordsTableBody = recordsTable.querySelector("tbody");
    const records = Array.of(...recordsTableBody.querySelectorAll("tr").values());
    if (records.length == 0) {
        return 1; // this value is not really accurante, but it is a good placeholder for most of the time
    }
    const lastRecord = records.at(-1);
    const lastId = Number.parseInt(lastRecord.querySelector("[data-is-primary-key='true']").value);
    return lastId + 1;
}

/**
 * 
 * @param {string} currentValue 
 * @param {string} columnName 
 * @returns {boolean}
 */
function areValuesUnique(currentValue, columnName) {
    /** @type {HTMLTableElement} */
    const recordsTable = document.querySelector("[data-id='records-table']");
    const recordsTableBody = recordsTable.querySelector("tbody");

    const rows = Array.of(...recordsTableBody.querySelectorAll("tr").values());
    for (let row of rows) {
        /** @type {HTMLInputElement[]} */
        const inputs = Array.of(...row.querySelectorAll("data-column-name").values());
        const selectedInput = inputs.find((input) => input.getAttribute("data-column-name") === columnName);
        if (selectedInput === null) continue;
        if (selectedInput.value === currentValue) return false;
    }
    return true;
}

function validateUniqueInputs(validationForm) {
    /** @type {HTMLInputElement[]} */
    const uniqueInputs = Array.of(...validationForm.querySelectorAll("input[data-is-unique='true']").values());
    uniqueInputs.forEach(uniqueInput => {
        const currentValue = uniqueInput.value;
        const columnName = uniqueInput.getAttribute("data-column-name");
        if (!areValuesUnique(currentValue, columnName)) {
            uniqueInput.setCustomValidity("El valor ingresado debe ser único");
        }
    });
}

/**
 * Sets the listeners that ensure the fields marked as unique are valid
 * and also creates an automatic id for the new record; also, makes
 * the 'cancel' button work
 * @param {HTMLDivElement} newRecord 
 */
function setupNewRecordConstraints(newRecord) {
    /** @type {HTMLButtonElement} */
    const cancelButton = newRecord.querySelector("[data-id='cancel-button']");

    cancelButton.addEventListener("click", (event) => {
        const newRecordTitle = document.querySelector("[data-id='new-record-title']");

        newRecord.remove();
        newRecordTitle.remove();
    });

    /** @type {HTMLInputElement} */
    const idInput = newRecord.querySelector("[data-is-primary-key]");
    idInput.value = getNextRecordId();

    /** @type {HTMLButtonElement} */
    const saveButton = newRecord.querySelector("[data-id='save-button']");
    saveButton.addEventListener("click", (event) => {
        const validationForm = newRecord.querySelector("form");
        const inputs = Array.of(...validationForm.querySelectorAll("input").values());

        if (inputs.every(input => input.checkValidity())) {
            validateUniqueInputs(validationForm);
        }

        validationForm.requestSubmit();
    });
}
