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
 * @param {HTMLTableRowElement} row 
 */
function setupTypeSelectFunctionality(row) {
    /** @type {HTMLSelectElement} */
    const columnTypeSelect = row.querySelector("[data-id='column-type-select']");
    const columnTypeCell = row.querySelector("[data-id='column-type-cell']");

    /** @type {HTMLInputElement} */
    const isAutoincrementableCheckbox = row.querySelector("[name='isAutoincrementableArray']");
    const isPrimaryKeyCheckbox = row.querySelector("[name='isPrimaryKeyArray']");
    

    disableCheckboxWhen(columnTypeSelect, (value) => value != "integer",      isAutoincrementableCheckbox);
    disableCheckboxWhen(columnTypeSelect, (value) => value == "reference",    isPrimaryKeyCheckbox);
    disableCheckboxWhen(columnTypeSelect, (value) => value == "date",         isPrimaryKeyCheckbox);
    disableCheckboxWhen(columnTypeSelect, (value) => value == "decimal",      isPrimaryKeyCheckbox);


    columnTypeSelect.addEventListener("change", (event) => {
        let columnReferencedTableForm = row.querySelector("[data-id='column-referenced-table-form']");
        if (columnTypeSelect.value == "reference") {
            if (columnReferencedTableForm === null) {
                const columnReferencedTableFormTemplate = document.querySelector("[data-id='column-referenced-table-form-template']");
                columnReferencedTableForm = document.importNode(columnReferencedTableFormTemplate.content, true);
                columnTypeCell.appendChild(columnReferencedTableForm);
            }
        } else {
            if (columnReferencedTableForm !== null) {
                columnTypeCell.removeChild(columnReferencedTableForm);
            }
        }
    });
}

/**
 * 
 * @param {HTMLSelectElement} select 
 * @param {(string) => boolean} predicate 
 * @param {HTMLInputElement} checkbox 
 */
function disableCheckboxWhen(select, predicate, checkbox) {
    let addedToQueue = false;
    const getDisabledCount = () => Number.parseInt(checkbox.getAttribute("data-disabled-count"));

    select.addEventListener("change", () => {
        /** @type {("checked" | "unchecked")?} */
        const previousState = checkbox.getAttribute("data-previous-state");

        if (previousState === null) {
            checkbox.setAttribute("data-previous-state", checkbox.checked? "checked": "unchecked");
        }

        const value = select.value;

        if (predicate(value)) {
            if (getDisabledCount() == 0) {
                checkbox.setAttribute("disabled", "true");
                checkbox.checked = false;
            }

            if (!addedToQueue) {
                checkbox.setAttribute("data-disabled-count", getDisabledCount() + 1);
                addedToQueue = true;
            }
        } else {
            if (addedToQueue) {
                checkbox.setAttribute("data-disabled-count", getDisabledCount() - 1);
                addedToQueue = false;
            }

            if (getDisabledCount() == 0) {
                const previousState = checkbox.getAttribute("data-previous-state");

                checkbox.removeAttribute("data-previous-state");
                checkbox.removeAttribute("disabled");
                checkbox.checked = previousState == "checked";
            }
        }
    });
};

columnCountInput.addEventListener("input", (event) => updateTableColumnInputs());
updateTableColumnInputs();

// tableCreationForm.addEventListener("submit", (event) => {
//     event.preventDefault();

//     /** @type {NodeListOf<HTMLInputElement>} */
//     const columnNames = tableCreationForm.querySelectorAll("[data-id='column-name']");
//     columnNames.forEach(columnName => {
//         // if (!columnName.checkValidity()) {
//         //     columnName.setCustomValidity("Ingresa el nombre de la columna");
//         // }
//     });
// });
