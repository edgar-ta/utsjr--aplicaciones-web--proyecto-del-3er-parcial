const { format } = require("mysql2");
const SingletonConnection = require("./singleton-connection");

/**
 * @typedef {Object} ColumnDescriptor 
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
  SingletonConnection.connect();

  let [ databases ] = await SingletonConnection.instance.query(sql);
  databases = databases.map(object => object.nombre)

  return databases;
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
 * @returns {Promise<ColumnDescriptor[]>}
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


module.exports = {
  getDatabases,
  getRegistries,
  getSchema,
  getTables,
  getTablesWithBothNames,
  getIndexedTablesWithBothNames
}
