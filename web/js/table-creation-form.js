/** @type {HTMLInputElement} */
const columnCountInput = document.getElementById("columnCountInput");

/** @type {HTMLTableElement} */
const table = document.getElementById("tableExample");

/** @type {HTMLTableSectionElement} */
const tableBody = table.querySelector("tbody");

/** @type {HTMLTemplateElement} */
const template = document.getElementById("columnTemplate");

/** @type {HTMLFormElement} */
const tableCreationForm = document.querySelector("[data-id='table-creation-form']");

let previousColumnCount = 0;

function updateTableColumnInputs() {
    const currentColumnCount = columnCountInput.valueAsNumber;
    const delta = currentColumnCount - previousColumnCount;

    if (delta == 0) return;

    if (delta > 0) {
        for (let i = 0; i < delta; i++) {
            /** @type {HTMLTemplateElement} */
            const template = document.querySelector("[data-id='column-template']");
            const fragment = document.importNode(template.content, true);
            const row = fragment.querySelector("tr");
            const columnIndexCell = row.querySelector("[data-id='column-index-cell']");
            columnIndexCell.textContent = previousColumnCount + i + 1;

            setupTypeSelectFunctionality(row);

            tableBody.appendChild(fragment);
        }
    } else {
        for (let i = 0; i < -delta; i++) {
            tableBody.removeChild(tableBody.lastElementChild);
        }
    }

    previousColumnCount = currentColumnCount;
}

/**
 * 
 * @param {HTMLInputElement} input 
 */
function setupValidationOnInput(input) {
    input.addEventListener("input", (event) => {
        if (input.checkValidity()) {
            input.parentElement.setAttribute("data-input-validity", "correct");
        }

        if (input.value == input.defaultValue) {
            input.parentElement.removeAttribute("data-input-validity");
        }
    });

    input.addEventListener("focusout", (event) => {
        if (!input.checkValidity()) {
            input.parentElement.setAttribute("data-input-validity", "incorrect");
        }
    });
}

/**
 * 
 */
function validateIsPrimaryKeyGroup() {
    /** @type {NodeListOf<HTMLInputElement>} */
    const allRadioButtons = tableCreationForm.querySelectorAll("[data-id='column-is-primary-key']");
    allRadioButtons.forEach(button => {
        const row = button.parentElement.parentElement;
        /** @type {HTMLInputElement} */
        const isUniqueCheckbox = row.querySelector("[data-id='column-is-unique']");
        if (button.checked) {
            lockFakeStateOf(isUniqueCheckbox, true);
        } else {
            unlockFakeStateOf(isUniqueCheckbox);
        }
    });
}

/**
 * 
 * @param {HTMLTableRowElement} row 
 */
function setupTypeSelectFunctionality(row) {
    /** @type {HTMLSelectElement} */
    const columnTypeSelect = row.querySelector("[data-id='column-type-select']");
    const columnTypeCell = row.querySelector("[data-id='column-type-cell']");

    /** @type {HTMLInputElement} */
    const isPrimaryKeyRadioButton = row.querySelector("[data-id='column-is-primary-key']");

    /** @type {HTMLInputElement} */
    const isAutoincrementableCheckbox = row.querySelector("[data-id='column-is-autoincrementable']");

    disableCheckboxWhen(columnTypeSelect, (value) => value != "integer",      isAutoincrementableCheckbox);
    disableCheckboxWhen(columnTypeSelect, (value) => value == "reference",    isPrimaryKeyRadioButton);
    disableCheckboxWhen(columnTypeSelect, (value) => value == "date",         isPrimaryKeyRadioButton);
    disableCheckboxWhen(columnTypeSelect, (value) => value == "decimal",      isPrimaryKeyRadioButton);

    isPrimaryKeyRadioButton.addEventListener("change", () => validateIsPrimaryKeyGroup());

    columnTypeSelect.addEventListener("change", (event) => {
        let columnReferencedTableForm = row.querySelector("[data-id='column-referenced-table-form']");
        if (columnTypeSelect.value == "reference") {
            if (columnReferencedTableForm === null) {
                const columnReferencedTableFormTemplate = document.querySelector("[data-id='column-referenced-table-form-template']");
                columnReferencedTableForm = document.importNode(columnReferencedTableFormTemplate.content, true);

                const columnReferencedTableSelect = columnReferencedTableForm.querySelector("[data-id='column-referenced-table-select']");
                setupValidationOnInput(columnReferencedTableSelect);

                columnTypeCell.appendChild(columnReferencedTableForm);
            }
        } else {
            if (columnReferencedTableForm !== null) {
                columnTypeCell.removeChild(columnReferencedTableForm);
            }
        }
    });

    columnTypeSelect.addEventListener("change", () => validateIsPrimaryKeyGroup());

    /** @type {NodeListOf<HTMLInputElement>} */
    const inputs = row.querySelectorAll("input");
    inputs.forEach(input => setupValidationOnInput(input));
}

function getDisabledCountOf(checkbox) {
    const count = checkbox.getAttribute("data-disabled-count");
    if (count === null) return 0;
    return Number.parseInt(count);
}

function setDisabledCountOf(checkbox, callback) {
    const previousDisabledCount = getDisabledCountOf(checkbox);
    checkbox.setAttribute("data-disabled-count", callback(previousDisabledCount));
}

function lockFakeStateOf(checkbox, fakeState, increaseDisabledCount = true) {
    const count = getDisabledCountOf(checkbox);
    if (count == 0) {
        checkbox.setAttribute("data-disabled", "true");
        checkbox.setAttribute("data-previous-state", checkbox.checked? "checked": "unchecked");

        if (increaseDisabledCount) {
            setDisabledCountOf(checkbox, (value) => value + 1);
        }

        checkbox.checked = fakeState;
    }
}

function unlockFakeStateOf(checkbox, decreaseDisabledCount = true) {
    if (decreaseDisabledCount) {
        setDisabledCountOf(checkbox, (value) => Math.max(value - 1, 0));
    }

    if (getDisabledCountOf(checkbox) == 0) {
        const previousState = checkbox.getAttribute("data-previous-state");

        checkbox.removeAttribute("data-previous-state");
        checkbox.removeAttribute("data-disabled");
        if (previousState !== null) {
            checkbox.checked = previousState == "checked";
        }
    }
}

/**
 * 
 * @param {HTMLInputElement} input 
 * @param {(string) => boolean} predicate 
 * @param {HTMLInputElement} checkbox 
 * @param {boolean} [fakeState=false] 
 * @param {string} [event="change"] 
 */
function disableCheckboxWhen(input, predicate, checkbox, fakeState = false, event = "change") {
    let addedToQueue = false;
    const getDisabledCount = () => getDisabledCountOf(checkbox);

    input.addEventListener(event, () => {

        /** @type {("checked" | "unchecked")?} */
        const previousState = checkbox.getAttribute("data-previous-state");

        if (previousState === null) {
            checkbox.setAttribute("data-previous-state", checkbox.checked? "checked": "unchecked");
        }

        const value = input.value;

        if (predicate(value)) {
            lockFakeStateOf(checkbox, false, false);

            if (!addedToQueue) {
                checkbox.setAttribute("data-disabled-count", getDisabledCount() + 1);
                addedToQueue = true;
            }
        } else {
            if (addedToQueue) {
                checkbox.setAttribute("data-disabled-count", getDisabledCount() - 1);
                addedToQueue = false;
            }

            unlockFakeStateOf(checkbox, false);
        }
    });
};

columnCountInput.addEventListener("input", (event) => updateTableColumnInputs());
updateTableColumnInputs();

