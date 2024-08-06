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
 * @param {string} columnName 
 * @returns {string[]}
 */
function getRecordValues(columnName) {
    const records = getRecords();
    const recordsValues = records.map(record => {
        const allInputs = record.querySelectorAll("input");
        for (let input of allInputs) {
            const currentColumnName = input.getAttribute("data-column-name");
            if (currentColumnName === columnName) {
                return input.value;
            }
        }
    }).filter(value => value !== undefined);
    return recordsValues;
}

/**
 * Checks that the given value along with the values of the columns
 * in the records table with the given column name are all unique among
 * themselves
 * @param {string?} currentValue 
 * @param {string} columnName 
 * @returns {boolean}
 */
function areValuesUnique(currentValue, columnName) {
    const recordsValues = getRecordValues(columnName);
    if (currentValue !== null) {
        recordsValues.push(currentValue);
    }

    const expectedSize = recordsValues.length;
    const realSize = new Set(recordsValues).size;

    return expectedSize === realSize;
}

/**
 * 
 * @param {HTMLFormElement} validationForm 
 */
function validateUniqueInputsInNewRecord(validationForm) {
    /** @type {HTMLInputElement[]} */
    const uniqueInputs = Array.of(...validationForm.querySelectorAll("input[data-is-unique='true']").values());
    uniqueInputs.forEach(uniqueInput => {
        const currentValue = uniqueInput.value;
        const columnName = uniqueInput.getAttribute("data-column-name");
        const uniqueRecordValues = new Set(getRecordValues(columnName));

        const previousSize = uniqueRecordValues.size;

        uniqueRecordValues.add(currentValue);
        const currentSize = uniqueRecordValues.size;

        // TODO
        if (previousSize !== currentSize) {
            uniqueInput.setCustomValidity("");
            console.log("El valor es único");
        } else {
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
        
        validateUniqueInputsInNewRecord(validationForm);
        inputs.every(input => input.checkValidity());

        validationForm.requestSubmit();
    });
}

/**
 * Adds visual hints to indicate when an input's value in the records table is wrong
 * @param {HTMLInputElement} input 
 * @returns {boolean} Whether the input is valid or not
 */
function checkInputValidity(input) {
    let isValid = input.checkValidity();
    const inputContainer = input.parentElement;

    if (input.getAttribute("data-is-unique") === "true") {
        const isUnique = areValuesUnique(null, input.getAttribute("data-column-name"));
        isValid = isValid && isUnique;
    }

    input.setAttribute("data-is-valid", isValid);

    if (!isValid) {
        const validationMessage = input.validationMessage;
        inputContainer.setAttribute("data-validation-message", validationMessage);
    } else {
        inputContainer.removeAttribute("data-validation-message");
    }

    return isValid;
}

function checkRecordEdited(record) {
    if (isRecordEdited(record)) {
        record.setAttribute("data-is-edited", "true");
    } else {
        record.removeAttribute("data-is-edited", "false");
    }
}

function getRecords() {
    /** @type {HTMLTableElement} */
    const recordsTable = document.querySelector("[data-id='records-table']");
    const recordsTableBody = recordsTable.querySelector("tbody");
    const records = Array.of(...recordsTableBody.querySelectorAll("tr").values());
    return records;
}


/**
 * 
 * @param {HTMLTableRowElement} record 
 * @returns {HTMLInputElement[]}
 */
function getEditableInputs(record) {
    return Array.of(...record.querySelectorAll("input:not([disabled])").values());
}

/**
 * 
 * @param {HTMLTableRowElement} record 
 * @returns {HTMLInputElement[]}
 */
function getAllInputs(record) {
    return Array.of(...record.querySelectorAll("input").values());
}

/**
 * 
 * @param {HTMLTableRowElement} record 
 */
function isRecordEdited(record) {
    const editableInputs = getEditableInputs(record);
    return editableInputs.some((input) => input.value != input.getAttribute("value"));
}

function setupRecordConstraints() {
    const records = getRecords();

    records.forEach(record => {
        /** @type {HTMLInputElement[]} */
        const editableInputs = getEditableInputs(record);
        editableInputs.forEach(input => {
            input.addEventListener("input", (event) => {
                checkInputValidity(input);
                checkRecordEdited(record);
            });
        });

        /** @type {HTMLButtonElement} */
        const undoChangesButton = record.querySelector("[data-id='undo-changes-button']");
        undoChangesButton.addEventListener("click", (event) => {
            editableInputs.forEach(input => {
                input.value = input.getAttribute("value");
                record.removeAttribute("data-is-edited");
                checkInputValidity(input);
            });
        });

        /** @type {HTMLButtonElement} */
        const saveChangesButtton = record.querySelector("[data-id='save-changes-button']");
        saveChangesButtton.addEventListener("click", (event) => {
            let alreadyFocused = false;
            let isValid = true;

            editableInputs.forEach(input => {
                checkInputValidity(input);
                if (!input.checkValidity()) {
                    if (!alreadyFocused) {
                        input.focus();
                        alreadyFocused = true;
                    }

                    isValid = false;
                }
            });

            if (isValid) {
                console.log("Sending the form");

                /** @type {HTMLFormElement} */
                const updateForm = record.querySelector("[data-id='update-form']");
                const inputs = getAllInputs(record);

                if (updateForm.firstElementChild === null) {
                    inputs.forEach(input => {
                        const hiddenInput = document.createElement("input");
                        hiddenInput.setAttribute("type", "hidden");
                        hiddenInput.setAttribute("name", "payload");
                        hiddenInput.setAttribute("value", input.value);
    
                        updateForm.appendChild(hiddenInput);
                    });
                }

                updateForm.submit();
            }
        });
    });
}

(() => {
    getRecords().forEach(record => {
        checkRecordEdited(record);
        getEditableInputs(record).forEach(input => checkInputValidity(input));
    });

    /** @type {HTMLButtonElement} */
    const newColumnButton = document.querySelector("[data-id='new-column-button']");
    newColumnButton.addEventListener("click", () => {
        newColumnButton.toggleAttribute("data-open");
    });

    newColumnButton.addEventListener("focusout", () => {
        newColumnButton.removeAttribute("data-open");
    });
})();
