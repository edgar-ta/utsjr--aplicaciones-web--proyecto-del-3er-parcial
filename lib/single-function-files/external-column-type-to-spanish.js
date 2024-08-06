
/** @param {import("../../bd/database-controller").ExternalColumnType} type */
function externalColumnTypeToSpanish(type) {
    switch (type) {
        case "integer": return "Entero";
        case "decimal": return "Decimal";
        case "date": return "Fecha";
        case "text": return "Texto";
        case "reference": return "Referencia";
    }
}

module.exports = {
    externalColumnTypeToSpanish
};
