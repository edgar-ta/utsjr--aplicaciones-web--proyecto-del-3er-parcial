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
            tableBody.appendChild(document.importNode(template.content, true));
        }
    } else {
        for (let i = 0; i < -delta; i++) {
            tableBody.removeChild(tableBody.lastElementChild);
        }
        console.log(`Updating the table with a negative delta of ${delta}`);
    }

    previousColumnCount = currentColumnCount;
    console.log(`Updating the table creating form with a delta of ${delta}`);
}

columnCountInput.addEventListener("input", (event) => updateTableColumnInputs());

updateTableColumnInputs();
