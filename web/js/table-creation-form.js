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
        const isNullableCheckbox = row.querySelector("[data-id='column-is-nullable']");

        if (button.checked) {
            lockFakeStateOf(isUniqueCheckbox, true);
            lockFakeStateOf(isNullableCheckbox, false);
        } else {
            unlockFakeStateOf(isUniqueCheckbox);
            unlockFakeStateOf(isNullableCheckbox);
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

    const isUniqueCheckbox = row.querySelector("[data-id='column-is-unique']");

    disableCheckboxWhen(columnTypeSelect, (type) => type == "text",         isUniqueCheckbox);

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

function getPreviousStateOf(checkbox) {
    const state = checkbox.getAttribute("data-previous-state");
    if (state === null) return null;
    return state == "checked";
}

function setPreviousStateOf(checkbox, callback) {
    const previousState = getPreviousStateOf(checkbox);
    checkbox.setAttribute("data-previous-state", callback(previousState));
}

function setDisabledCountOf(checkbox, callback) {
    const previousDisabledCount = getDisabledCountOf(checkbox);
    checkbox.setAttribute("data-disabled-count", callback(previousDisabledCount));
}

function lockFakeStateOf(checkbox, fakeState) {
    const count = getDisabledCountOf(checkbox);

    if (count == 0) {
        checkbox.setAttribute("disabled", "true");
        
        if (getPreviousStateOf(checkbox) === null) {
            setPreviousStateOf(checkbox, () => checkbox.checked? "checked": "unchecked");
        }
        
        setDisabledCountOf(checkbox, (value) => value + 1);
    }
    checkbox.checked = fakeState;
}

function unlockFakeStateOf(checkbox) {
    setDisabledCountOf(checkbox, (value) => Math.max(value - 1, 0));

    if (getDisabledCountOf(checkbox) == 0) {
        const previousState = checkbox.getAttribute("data-previous-state");

        checkbox.removeAttribute("data-previous-state");
        checkbox.removeAttribute("disabled");
        if (previousState !== null) {
            checkbox.checked = previousState == "checked";
        }
    }
}

/**
 * 
 * @param {HTMLInputElement} input 
 * @param {(type: import("../../bd/database-controller").ExternalColumnType) => boolean} predicate 
 * @param {HTMLInputElement} checkbox 
 * @param {boolean} [fakeState=false] 
 * @param {string} [event="change"] 
 */
function disableCheckboxWhen(input, predicate, checkbox, fakeState = false, event = "change") {
    let addedToQueue = false;
    const getDisabledCount = () => getDisabledCountOf(checkbox);

    input.addEventListener(event, () => {

        const value = input.value;

        if (predicate(value)) {

            lockFakeStateOf(checkbox, fakeState);

            if (!addedToQueue) {
                checkbox.setAttribute("data-disabled-count", getDisabledCount() + 1);
                addedToQueue = true;
            }
        } else {
            if (addedToQueue) {
                checkbox.setAttribute("data-disabled-count", getDisabledCount() - 1);
                addedToQueue = false;
            }

            unlockFakeStateOf(checkbox);
        }
    });
};

columnCountInput.addEventListener("input", (event) => updateTableColumnInputs());
updateTableColumnInputs();

(() => {
    /** @type {HTMLTableRowElement} */
    const firstRow = tableCreationForm.querySelector("tbody > tr");

    const select = firstRow.querySelector("select");
    select.toggleAttribute("disabled");

    const expectedValues = [ true, false, true, true ];
    /** @type {HTMLInputElement[]} */
    const checkableInputs = Array.of(...firstRow.querySelectorAll("input[type='radio'],input[type='checkbox']").values());
    for (let index = 0; index < checkableInputs.length; index++) {
        const input = checkableInputs[index];
        const value = expectedValues[index];
        input.checked = value;
        input.setAttribute("disabled", "true");
    }
})();

const isInputCorrected = () => tableCreationForm.getAttribute("data-is-input-corrected") == "true";
const setInputAsCorrected = () => tableCreationForm.setAttribute("data-is-input-corrected", "true");

tableCreationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!isInputCorrected()) {
        tableCreationForm.querySelectorAll("input[disabled]").forEach(input => {
            // i don't really care about duplicating unchecked disabled inputs, since they already have the fallback
            // value that prevents them from going unnoticed

            // thus, i just need to duplicate the checked disabled inputs

            if (input.checked) {
                const newInput = document.createElement("input");
                newInput.setAttribute("type", "hidden");
                newInput.setAttribute("name", input.getAttribute("name"));
                newInput.value = "on";
            
                input.insertAdjacentElement("afterend", newInput);
            }
        });
        tableCreationForm.querySelectorAll("select[disabled]").forEach(select => {
            const newInput = document.createElement("input");
            newInput.setAttribute("type", "hidden");
            newInput.setAttribute("name", select.getAttribute("name"));
            newInput.value = select.value;
        
            select.insertAdjacentElement("afterend", newInput);
        });
        setInputAsCorrected();
    }
    
    tableCreationForm.submit();
});
