const { format } = require("mysql2");
const { v4: uuidv4 } = require("uuid");

const SingletonConnection = require("./singleton-connection.js");
const TableCreationUtilities = require("../lib/table-creation-utilities.js");
const convertToKebabCase = require("../lib/single-function-files/convert-to-kebab-case.js");

/**
 * @typedef {"integer" | "decimal" | "date" | "text" | "reference" } ExternalColumnType
 * 
 */

/**
 * @typedef { "int" | "float" | "date" | "text" } MidwayColumnType
 */


/**
 * @typedef {Object} IncomingColumnDescriptor
* @property {number} index
* @property {string} name
* @property {ExternalColumnType} dataType
* @property {string?} referencedTableId
* @property {boolean} isPrimaryKey
* @property {boolean} isNullable
* @property {boolean} isUnique
* @property {boolean} isAutoincrementable
*/


/**
 * @typedef {Object} MidwayPrimitiveColumnDescriptor
 * @property {number} index
 * @property {string} name
 * @property {MidwayColumnType} dataType
 * @property {boolean} isPrimaryKey
 * @property {boolean} isNullable
 * @property {boolean} isUnique
 * @property {boolean} isAutoincrementable
 * 
 */

/**
 * @typedef {Object} MidwayReferenceColumnDescriptorProperties
 * @property {string} referencedTableId
 * @property {string} referencedTableColumn
 * @typedef {MidwayPrimitiveColumnDescriptor & MidwayReferenceColumnDescriptorProperties} MidwayReferenceColumnDescriptor
 */

/**
 * @typedef {MidwayPrimitiveColumnDescriptor | MidwayReferenceColumnDescriptor} MidwayColumnDescriptor
 * 
 */

/**
 * @typedef {Object} OutgoingColumnDescriptor_ 
 * @property {string} nombreDeColumna
 * @property {"int" | "double" | "date" | "varchar"} tipoDeDato
 * @property {"PRI" | "UNI" | "MUL" | "" } tipoDeclave
 * @property {1 | 0} esAutoincrementable
 * @property {1 | 0} esNulo
 */

/**
 * 
 * @returns {Promise<string[]>}
 */
 async function getDatabases() {
  const sql = "SELECT nombre FROM base_de_datos;";
  await SingletonConnection.connect();

  let [ databases ] = await SingletonConnection.instance.query(sql);
  databases = databases.map(object => object.nombre)

  return databases;
}

/**
 * 
 * @param {string} selectedDatabase 
 * @returns {Promise<number>}
 */
async function getDatabaseId(selectedDatabase) {
  const sql = format("SELECT base_de_datos.id AS id FROM base_de_datos WHERE base_de_datos.nombre = ?", selectedDatabase);
  SingletonConnection.connect();

  let [ [ { id } ]  ] = await SingletonConnection.instance.query(sql);

  return id;

}


/**
 * 
 * @param {number} selectedDatabase 
 * @returns {import("../lib/dashboard-utilities.js").DatabaseIdentifier[]}
 */
async function getDatabaseIdentifiers() {
  await SingletonConnection.connect();
  const sql = format(`SELECT base_de_datos.nombre AS name, base_de_datos.id AS id FROM base_de_datos`);

  /** @type {{ name: string, id: string }[][]} */
  const [ rawData ] = await SingletonConnection.instance.execute(sql);

  return rawData.map(datum => {
    const kebabCaseName = convertToKebabCase(datum.name);
    const id = Number.parseInt(datum.id);
    return {
      name: datum.name,
      kebabCaseName,
      id
    }
  });
}

/**
 * 
 * @param {string} selectedDatabase 
 * @returns {Promise<string[]>}
 */
 async function getTables(selectedDatabase) {
  const sql = format(`
    SELECT tabla.nombre_externo AS nombre
    FROM tabla 
    INNER JOIN base_de_datos ON tabla.base_de_datos = base_de_datos.id 
    WHERE base_de_datos.nombre = ?
    ORDER BY tabla.nombre_externo
    `,
    selectedDatabase
  );

  await SingletonConnection.connect();
  
  let [ tables ] = await SingletonConnection.instance.query(sql);
  tables = tables.map(object => object.nombre);
  
  return tables;
}

/**
 * 
 * @param {string} selectedDatabase 
 * @returns {Promise<{ nombreInterno: string, nombreExterno: string }>}
 */
async function getTablesWithBothNames(selectedDatabase) {
  const sql = format(`
    SELECT 
      tabla.nombre_externo AS nombreExterno,
      tabla.nombre_interno AS nombreInterno
    FROM tabla 
    INNER JOIN base_de_datos ON tabla.base_de_datos = base_de_datos.id 
    WHERE base_de_datos.nombre = ?
    ORDER BY tabla.nombre_externo
    `,
    selectedDatabase
  );

  await SingletonConnection.connect();

  return (await SingletonConnection.instance.query(sql))[0];
}

/**
 * 
 * @param {import("../lib/dashboard-utilities.js").DatabaseIdentifier} selectedDatabase 
 * @returns {Promise<import("../lib/dashboard-utilities.js").TableIdentifier[]>}
 */
async function getTableIdentifiers(selectedDatabase) {
  const sql = format(`
    SELECT 
      tabla.nombre_externo AS externalName,
      tabla.nombre_interno AS internalName
    FROM tabla 
    WHERE tabla.base_de_datos = ?
    ORDER BY tabla.nombre_externo
    `,
    selectedDatabase.id
  );

  await SingletonConnection.connect();

  return (await SingletonConnection.instance.query(sql))[0];
}

/**
 * Gets both the internal and external names of the tables
 * in the given database that have a primary key; the query
 * works under the assumption that every table has at most
 * one primary key, which means that, if the functionality
 * to have multiple primary keys is added in the future, the query
 * should be changed, making sure to add a group and having clause
 * such as the following:
 * ```
 * GROUP BY tabla.nombre_externo, tabla.nombre_interno
 * HAVING COUNT(*) > 0
 * ```
 * 
 * @param {string} selectedDatabase 
 * @returns {Promise<{ nombreInterno: string, nombreExterno: string }>}
 */
async function getIndexedTablesWithBothNames(selectedDatabase) {
  const sql = format(`
    SELECT 
      tabla.nombre_externo AS nombreExterno,
      tabla.nombre_interno AS nombreInterno
    FROM tabla 
    INNER JOIN base_de_datos ON tabla.base_de_datos = base_de_datos.id
    INNER JOIN information_schema.columns ON tabla.nombre_interno = information_schema.columns.TABLE_NAME
    WHERE information_schema.columns.COLUMN_KEY = "PRI" AND base_de_datos.nombre = ?
    `,
    selectedDatabase
  );

  await SingletonConnection.connect();

  return (await SingletonConnection.instance.query(sql))[0];
}

/**
 * 
 * @param {string} selectedTable 
 * @returns {Promise<Object[]>}
 */
 async function getRegistries(selectedTable) {
  const tableNameStatement = format(`SELECT nombre_interno AS nombreDeTabla FROM tabla WHERE nombre_externo = ?`, selectedTable);

  await SingletonConnection.connect();

  const [ [ { nombreDeTabla: tableName } ] ] = await SingletonConnection.instance.query(tableNameStatement);
  const registriesStatement = `SELECT * FROM \`${tableName}\``; // código potencialmente peligroso xd

  const [ registros ] = await SingletonConnection.instance.query(registriesStatement);

  return registros;
}

/**
 * 
 * @param {string} selectedTable 
 * @returns {Promise<OutgoingColumnDescriptor_[]>}
 */
 async function getSchema(selectedTable) {
  const sql = format(`
    SELECT 
        information_schema.columns.COLUMN_NAME AS nombreDeColumna, 
        information_schema.columns.DATA_TYPE AS tipoDeDato, 
        information_schema.columns.COLUMN_KEY AS tipoDeClave,
        information_schema.columns.EXTRA = "auto_increment" AS esAutoincrementable,
        information_schema.columns.IS_NULLABLE = "YES" AS esNulo
    FROM information_schema.columns
    INNER JOIN tabla ON tabla.nombre_interno = information_schema.columns.TABLE_NAME
    WHERE tabla.nombre_externo = ?
    ORDER BY ORDINAL_POSITION ASC
    ;
    `, selectedTable
  );

  await SingletonConnection.connect();

  let [ schema ] = await SingletonConnection.instance.execute(sql);

  return schema;
}

/**
 * 
 * @param {string} internalTableName 
 * @returns {Promise<boolean>}
 */
async function tableExists(internalTableName) {
  const sql = format(`
    SELECT COUNT(*) AS count
    FROM tabla 
    WHERE tabla.nombre_interno = ?
    `,
    internalTableName
  );
  await SingletonConnection.connect();

  let [ [ { count } ] ] = await SingletonConnection.instance.execute(sql);

  return count > 0;
}

/**
 * 
 * @param {string} internalTableName 
 */
async function deleteTable(internalTableName) {
  const sql = format(
    `DELETE FROM tabla WHERE tabla.nombre_interno = ?`, 
    [internalTableName]
  );

  await SingletonConnection.connect();

  await SingletonConnection.instance.execute(sql);
}

/**
 * 
 * @param {string} externalTableName 
 * @param {string} selectedDatabase 
 * @param {IncomingColumnDescriptor[]} tableScheme 
 */
async function createTable(externalTableName, selectedDatabase, tableScheme) {
  const foreignKeys = tableScheme
    .filter(columnObject => columnObject.dataType == "reference");
  const regularColumns = tableScheme
    .filter(columnObject => columnObject.dataType != "reference");

  const midwayForeignKeys = await Promise.all(foreignKeys
      .map(async (columnObject) => await TableCreationUtilities.getMidwayReferenceDescriptor(columnObject)));
  const midwayRegularColumns = regularColumns
    .map(columnObject => TableCreationUtilities.getMidwayPrimitiveDescriptor(columnObject));

  const primitiveColumns = [ ...midwayForeignKeys, ...midwayRegularColumns ];
  primitiveColumns.sort((columnObject) => columnObject.index);

  const primitiveSql = primitiveColumns
      .map((columnObject) => TableCreationUtilities.getSqlForPrimitiveColumn(columnObject));
  const referenceSql = midwayForeignKeys.map((columnObject) => TableCreationUtilities
      .getSqlForReferenceColumn(columnObject));

  const internalTableName = uuidv4();
  const tableBody = [...primitiveSql, ...referenceSql].join(",\n");
  const databaseId = await getDatabaseId(selectedDatabase);

  await SingletonConnection.connect();

  const tableRegistrationSql = format(
    `INSERT INTO tabla VALUES (NULL, ?, ?, ?)`, 
    [databaseId, externalTableName, internalTableName]
  );

  await SingletonConnection.instance.execute(tableRegistrationSql);

  try {
    const tableCreationSql = `CREATE TABLE \`${internalTableName}\` (${tableBody}) ENGINE = InnoDB`;
    await SingletonConnection.instance.execute(tableCreationSql);

  } catch (error) {
    await deleteTable(internalTableName);
    throw error;
  }
}

async function deleteTable(selectedDatabase, selectedTable) {
  const databaseId = await getDatabaseId(selectedDatabase);

  await SingletonConnection.connect();
  const sql = format(`
    DELETE FROM tabla WHERE tabla.base_de_datos = ? AND tabla.nombre_externo = ?
    `,
    [ databaseId, selectedTable ]
  );
  await SingletonConnection.instance.execute(sql);
}

module.exports = {
  getDatabases,
  getDatabaseId,
  getRegistries,
  getSchema,
  getTables,
  getTablesWithBothNames,
  getIndexedTablesWithBothNames,
  getTableIdentifiers,
  getDatabaseIdentifiers,
  tableExists,
  createTable,
  deleteTable,
}
