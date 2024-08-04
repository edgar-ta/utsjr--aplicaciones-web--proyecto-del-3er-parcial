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
 * @typedef {Object} DashboardPayload
 * @property {DatabaseIdentifier[]} databases
 */

/**
 * @typedef {Object} DashboardPayloadProperties
 * @property {DatabaseIdentifier} currentDatabase
 * @property {(TableIdentifier[])} currentTables
 */

/**
 * @typedef {DashboardPayload & DashboardPayloadProperties} CompleteSideMenuPayload
 */

/**
 * @typedef {DashboardPayload | CompleteSideMenuPayload} DashboardPayload
 */


/**
 * 
 * @param {string} string 
 * @returns {string[]}
 */
const splitAtLastDash = (string) => {
    const splitIndex = string.lastIndexOf("-");
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
    const [ externalName, internalName ] = splitAtLastDash(urlFragment);
    // supposedly, the length of a uuid (which is what the internal name really is)
    // is exactly 36 characters
    if (internalName.length != 36) {
        return null;
    }
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
    return `${tableIdentifier.externalName}-${tableIdentifier.internalName}`
}

/**
 * 
 * @param {string?} databaseUrl The string that was used in the url to get to the database
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
};
