const DatabaseController = require("../bd/database-controller.js");
const convertToKebabCase = require("./single-function-files/convert-to-kebab-case.js");

/**
 * @typedef {Object} TableIdentifier
 * @property {string} internalName
 * @property {string} externalName
 */

/**
 * @typedef {Object} DatabaseIdentifier
 * @property {string} name
 * @property {string} kebabCaseName
 * @property {number} id
 */

/**
 * @typedef {Object} RecordIdentifier
 * @property {string} representation
 * @property {number} id
 */


/**
 * @typedef {Object} BasicDashboardPayload
 * @property {DatabaseIdentifier[]} databases
 */

/**
 * @typedef {Object} CompleteDashboardPayloadProperties
 * @property {DatabaseIdentifier} currentDatabase
 * @property {(TableIdentifier[])} currentTables
 */

/**
 * @typedef { BasicDashboardPayload & CompleteDashboardPayloadProperties} CompleteDashboardPayload
 */

/**
 * @typedef { BasicDashboardPayload | CompleteDashboardPayload } DashboardPayload
 */


/**
 * 
 * @param {string} string 
 * @returns {string[]}
 */
const splitAtLastDash = (string) => {
    const splitIndex = string.lastIndexOf("-");
    if (splitIndex === -1) return [ "", string ];
    return [ string.slice(0, splitIndex), string.slice(splitIndex + 1) ];
};

/**
 * 
 * @param {string?} urlFragment 
 * @returns {DatabaseIdentifier?}
 */
function parseDatabaseIdentifier(urlFragment) {
    if (urlFragment === null) return null;
    const [ name, tentativeId ] = splitAtLastDash(urlFragment);
    const kebabCaseName = convertToKebabCase(name);
    const id = Number.parseInt(tentativeId);
    if (Number.isNaN(id)) {
        return null;
    }
    return { name, kebabCaseName, id };
}

/**
 * 
 * @param {string} urlFragment 
 * @returns {TableIdentifier?}
 */
function parseTableIdentifier(urlFragment) {
    const minimumIdLength = 36;
    if (urlFragment.length < minimumIdLength) {
        return null;
    }
    const length = urlFragment.length;
    const internalName = urlFragment.substring(length - minimumIdLength);
    const externalName = urlFragment.substring(0, length - minimumIdLength - 1);
    return { externalName, internalName };
}

/**
 * 
 * @param {DatabaseIdentifier} databaseIdentifier 
 * @returns {string}
 */
function getUrlForDatabase(databaseIdentifier) {
    return `${databaseIdentifier.kebabCaseName}-${databaseIdentifier.id}`
}

/**
 * 
 * @param {TableIdentifier} tableIdentifier 
 * @returns {string}
 */
function getUrlForTable(tableIdentifier) {
    return `${convertToKebabCase(tableIdentifier.externalName)}-${tableIdentifier.internalName}`
}

/**
 * 
 * @param {string?} databaseUrl A valid string to use in the URL to fetch a database
 * @returns {Promise<DashboardPayload>}
 */
async function getDashboardPayload(databaseUrl) {
    const databases = await DatabaseController.getDatabaseIdentifiers();
    const givenIdentifier = parseDatabaseIdentifier(databaseUrl);
    if (givenIdentifier === null) {
        return {
            databases,
            currentDatabase: null,
            currentTables: null
        };
    }
    const currentDatabase = databases.find(database => database.id == givenIdentifier.id);
    if (currentDatabase === undefined) {
        return {
            databases,
            currentDatabase: null,
            currentTables: null
        };
    }
    const currentTables = await DatabaseController.getTableIdentifiers(currentDatabase);
    return {
        databases,
        currentDatabase,
        currentTables
    };
}

module.exports = {
    getDashboardPayload,
    convertToKebabCase,
    getUrlForDatabase,
    getUrlForTable,
    parseDatabaseIdentifier,
    parseTableIdentifier
};
