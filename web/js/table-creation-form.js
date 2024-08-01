/** @type {HTMLInputElement} */
const columnCountInput = document.getElementById("columnCountInput");

/** @type {HTMLTableElement} */
const table = document.getElementById("tableExample");

/** @type {HTMLTableSectionElement} */
const tableBody = table.querySelector("tbody");

/** @type {HTMLTemplateElement} */
const template = document.getElementById("columnTemplate");

let previousColumnCount = 0;

function updateTableColumnInputs() {
    const currentColumnCount = columnCountInput.valueAsNumber;
    const delta = currentColumnCount - previousColumnCount;

    if (delta == 0) return;

    if (delta > 0) {
        for (let i = 0; i < delta; i++) {
            /** @type {HTMLTemplateElement} */
            const template = document.getElementById("columnTemplate");
            const row = document.importNode(template.content, true);
            const rowIndex = row.querySelector("[data-id='row-index']");
            rowIndex.textContent = previousColumnCount + i + 1;

            setupTypeSelectFunctionality(row);

            tableBody.appendChild(row);
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
    const typeSelect = row.querySelector("select");

    /** @type {HTMLInputElement} */
    const isAutoincrementableCheckbox = row.querySelector("[name='isAutoincrementableArray']");
    const isPrimaryKeyCheckbox = row.querySelector("[name='isPrimaryKeyArray']");

    disableCheckboxWhen(typeSelect, (value) => value != "integer",      isAutoincrementableCheckbox);
    disableCheckboxWhen(typeSelect, (value) => value == "reference",    isPrimaryKeyCheckbox);
    disableCheckboxWhen(typeSelect, (value) => value == "date",         isPrimaryKeyCheckbox);
    disableCheckboxWhen(typeSelect, (value) => value == "decimal",      isPrimaryKeyCheckbox);

    const rowTypeCell = row.querySelector("[data-id='row-type']");
    typeSelect.addEventListener("change", (event) => {
        if (typeSelect.value == "reference") {
            const p = document.createElement("p");
            p.innerText = "Selecciona la tabla que quieras";

            rowTypeCell.appendChild(p);

            // 
        } else {
            rowTypeCell.removeChild(rowTypeCell.lastElementChild);
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
