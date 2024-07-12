/** @type {HTMLInputElement} */
const columnCountInput = document.getElementById("columnCountInput");

/** @type {HTMLTableElement} */
const table = document.getElementById("tableExample");

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

            // const row = document.createElement("tr");
            //     const td1 = document.createElement("td");
            //         const input1 = document.createElement("input", { required: true, type: "text" });
            //     td1.appendChild(input1);
            // row.appendChild(td1);
    
            // const td2 = document.createElement("td");
            //     const select = document.createElement("select");
            //         const option1 = document.createElement("option", { value: "int" });
            //             option1.textContent = "INT";
            //         select.appendChild(option1);
            //         const option2 = document.createElement("option", { value: "varchar" });
            //             option2.textContent = "VARCHAR";
            //         select.appendChild(option2);
            //         const option3 = document.createElement("option", { value: "date" });
            //             option3.textContent = "DATE";
            //         select.appendChild(option3);
            //         const option4 = document.createElement("option", { value: "double" });
            //             option4.textContent = "DOUBLE";
            //         select.appendChild(option4);
            //     td2.appendChild(select);
            // row.appendChild(td2);
            
            // const td3 = document.createElement("td");
            //     const input2 = document.createElement("input", { type: "number" });
            //     td3.appendChild(input2);
            // row.appendChild(td3);
    
            table.querySelector("tbody").appendChild(document.importNode(template.content, true));
        }
    } else {
        for (let i = 0; i < -delta; i++) {
            table.querySelector("tbody").lastChild.remove();
        }
        console.log(`Updating the table with a negative delta of ${delta}`);
    }

    previousColumnCount = currentColumnCount;
    console.log(`Updating the table creating form with a delta of ${delta}`);
}

columnCountInput.addEventListener("input", (event) => updateTableColumnInputs());

updateTableColumnInputs();
