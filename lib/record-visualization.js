/**
 * @typedef {Object} RecordVisualizationPayload
 * @property {import("./dashboard-utilities").TableIdentifier} currentTable
 * @property {import("../bd/database-controller").OutgoingColumnDescriptor[]} schema
 * @property {Object[]} records
 */

const { getTableIdentifier, getSchema, getRecords } = require("../bd/database-controller");
const { parseTableIdentifier } = require("./dashboard-utilities");

/**
 * @param {string} selectedTable A valid table URL
 * @returns {Promise<RecordVisualizationPayload>}
 */
async function getRecordVisualizationPayload(selectedTable) {
    const tableIdentifier = parseTableIdentifier(selectedTable);

    const currentTable = await getTableIdentifier(tableIdentifier.internalName);
    const schema = await getSchema(currentTable.internalName);
    const records = await getRecords(currentTable.internalName);

    return {
        currentTable,
        schema,
        records
    };
}

module.exports = {
    getRecordVisualizationPayload
};
