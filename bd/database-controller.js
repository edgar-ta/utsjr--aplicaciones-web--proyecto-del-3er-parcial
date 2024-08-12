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
 * @typedef {Object} OutgoingPrimitiveColumnDescriptor
 * @property {number} index
 * @property {string} name
 * @property {ExternalColumnType} dataType
 * @property {boolean} isPrimaryKey
 * @property {boolean} isNullable
 * @property {boolean} isUnique
 * @property {boolean} isAutoincrementable
 * @property {boolean} isForeignKey
 * 
 */

/**
 * @typedef {Object} OutgoingReferenceColumnDescriptorProperties
 * @property {import("../lib/dashboard-utilities.js").TableIdentifier} referencedTable
 * @property {import("../lib/dashboard-utilities.js").RecordIdentifier[]} validValues
 * @typedef {OutgoingPrimitiveColumnDescriptor & OutgoingReferenceColumnDescriptorProperties} OutgoingReferenceColumnDescriptor
 */

/**
 * @typedef {OutgoingPrimitiveColumnDescriptor | OutgoingReferenceColumnDescriptor} OutgoingColumnDescriptor
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
  await SingletonConnection.connect();

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
 * 
 * @param {string} tableInternalName 
 * @returns {Promise<import("../lib/dashboard-utilities.js").TableIdentifier>}
 */
async function getTableIdentifier(tableInternalName) {
  const sql = format(`
    SELECT 
      tabla.nombre_externo AS externalName,
      tabla.nombre_interno AS internalName
    FROM tabla 
    WHERE tabla.nombre_interno = ?
    `,
    [tableInternalName]
  );

  await SingletonConnection.connect();
  const [ [ tableIdentifier ] ] = await SingletonConnection.instance.query(sql);

  return tableIdentifier;

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
 * @param {import("../lib/dashboard-utilities.js").TableIdentifier} internalTableName 
 * @returns {Promise<Object[]>}
 */
 async function getRecords(internalTableName) {
  const registriesStatement = format(`SELECT * FROM ??`, [internalTableName]);

  const [ records ] = await SingletonConnection.instance.query(registriesStatement);

  return records;
}

/**
 * 
 * @param {string} tableInternalName 
 * @returns {Promise<OutgoingColumnDescriptor[]>}
 */
 async function getSchema(tableInternalName) {
  // /** @type {OutgoingColumnDescriptor} */
  // const something = {};
  // something.;

  // const sql = format(`
  //   SELECT 
  //     information_schema.columns.COLUMN_NAME AS name, 
  //     information_schema.columns.DATA_TYPE AS dataType, 
  //     information_schema.columns.COLUMN_KEY = "PRI" AS isPrimaryKey,
  //     information_schema.columns.COLUMN_key = "UNI" as isUnique,
  //     information_schema.columns.EXTRA = "auto_increment" AS isAutoincrementable,
  //     information_schema.columns.IS_NULLABLE = "YES" AS isNullable,
  //       information_schema.columns.COLUMN_NAME IN (
  //       SELECT DISTINCT (information_schema.key_column_usage.column_name)
  //       FROM information_schema.key_column_usage
  //       INNER JOIN information_schema.table_constraints
  //       ON information_schema.key_column_usage.constraint_name = information_schema.table_constraints.constraint_name
  //       WHERE 
  //         information_schema.key_column_usage.table_name = ? AND 
  //         information_schema.table_constraints.constraint_type = "FOREIGN KEY"
  //     ) AS isForeignKey
  //   FROM information_schema.columns
  //   WHERE information_schema.columns.TABLE_NAME = ?
  //   ORDER BY ORDINAL_POSITION ASC;
  //   `, [tableInternalName, tableInternalName]
  // );
  const sql = format(`
    SELECT 
      information_schema.columns.COLUMN_NAME AS name, 
      information_schema.columns.DATA_TYPE AS dataType, 
      information_schema.columns.COLUMN_KEY = "PRI" AS isPrimaryKey,
      information_schema.columns.COLUMN_key = "UNI" as isUnique,
      information_schema.columns.EXTRA = "auto_increment" AS isAutoincrementable,
      information_schema.columns.IS_NULLABLE = "YES" AS isNullable
    FROM information_schema.columns
    WHERE information_schema.columns.TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION ASC;
    `, [tableInternalName, tableInternalName]
  );

  await SingletonConnection.connect();

  /** @type {{name: string, dataType: string, isPrimaryKey: number, isUnique: number, isAutoincrementable: number, isNullable: number, isForeignKey: number}[][]} */
  let [ schema ] = await SingletonConnection.instance.execute(sql);

  let indexedSchema = schema.map(({ name, dataType, isPrimaryKey, isUnique, isAutoincrementable, isNullable, isForeignKey }, index) => {
    const coalescedDataType = TableCreationUtilities.coalesceSqlToColumnType(dataType);
    const [ booleanIsPrimaryKey, booleanIsUnique, booleanIsAutoincrementable, booleanIsNullable, booleanIsForeignKey ]
      = [ isPrimaryKey, isUnique, isAutoincrementable, isNullable, isForeignKey ].map(value => value == 1? true: false);
    return {
      index,
      name,
      dataType: coalescedDataType,
      isPrimaryKey: booleanIsPrimaryKey,
      isUnique: booleanIsUnique,
      isAutoincrementable: booleanIsAutoincrementable,
      isNullable: booleanIsNullable,
      isForeignKey: booleanIsForeignKey,
    }
  });

  /** @type {OutgoingColumnDescriptor[]} */
  const primitiveColumns = indexedSchema.filter(columnObject => !columnObject.isForeignKey);
  /** @type {OutgoingColumnDescriptor[]} */
  const referenceColumns = indexedSchema.filter(columnObject =>  columnObject.isForeignKey);

  // /** @type {OutgoingColumnDescriptor[]} */
  // const resolvedReferenceColumns = await Promise.all(referenceColumns.map(async (columnObject) => {
  //   // referenced table and valid values for reference

  //   console.log("The column name is");
  //   console.log(columnObject.name);

  //   console.log("The table is");
  //   console.log(tableInternalName);

  //   const referencedColumnAndTableSql = format(`
  //     SELECT 
  //       information_schema.key_column_usage.referenced_table_name AS referencedTable,
  //       information_schema.key_column_usage.referenced_column_name AS referencedColumn
  //     FROM information_schema.key_column_usage
  //     WHERE 
  //       information_schema.key_column_usage.column_name = ? AND
  //       information_schema.key_column_usage.table_name = ? AND
  //       NOT isnull(information_schema.key_column_usage.referenced_table_name)
  //     `, [columnObject.name, tableInternalName]
  //   );

  //   /** @type {{ referencedTable: string, referencedColumn: string }[][]} */
  //   const [ [ { referencedTable, referencedColumn } ] ] = await SingletonConnection.instance.execute(referencedColumnAndTableSql);
    
  //   console.log("The referenced table is");
  //   console.log(referencedTable);

  //   console.log("The referenced column is");
  //   console.log(referencedColumn);

  //   const referencedTableIdentifier = await getTableIdentifier(referencedTable);
  //   const sql = format(`SELECT * FROM ??`, [referencedTable]);

  //   /** @type {Object[]} */
  //   const [ validValues ] = await SingletonConnection.instance.execute(sql);

  //   /** @type {import("../lib/dashboard-utilities.js").RecordIdentifier[]} */
  //   const recordIdentifers = validValues.map(value => ({ id: value[referencedColumn], representation: value.toString() }))

  //   return {
  //     ...columnObject,
  //     referencedTable: referencedTableIdentifier,
  //     validValues: recordIdentifers
  //   };
  // }));

  return [  ...primitiveColumns, ...referenceColumns ].sort((a, b) => a.index - b.index);
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
    [internalTableName]
  );
  await SingletonConnection.connect();

  let [ [ { count } ] ] = await SingletonConnection.instance.execute(sql);

  return count > 0;
}

/**
 * 
 * @param {number} databaseId 
 * @returns {Promise<boolean>}
 */
async function databaseExistsWithId(databaseId) {
  const sql = format(`
    SELECT COUNT(*) AS count
    FROM base_de_datos 
    WHERE base_de_datos.id = ?
    `,
    databaseId
  );
  await SingletonConnection.connect();

  let [ [ { count } ] ] = await SingletonConnection.instance.execute(sql);

  return count > 0;
}

/**
 * 
 * @param {string} internalTableName 
 */
async function deleteTableWithInternalName(internalTableName) {
  const sql = format(
    `DELETE FROM tabla WHERE tabla.nombre_interno = ?`, 
    [internalTableName]
  );

  await SingletonConnection.connect();

  await SingletonConnection.instance.execute(sql);
}

/**
 * @returns {Promise<number>}
 */
async function createDatabase() {
  await SingletonConnection.connect();
  return SingletonConnection.instance
    .execute("SELECT MAX(base_de_datos.id) AS lastId FROM base_de_datos")
    .then((results) => {
      const [ [ { lastId } ] ] = results;
      let name = `Base de datos número ${lastId}`;
      if (lastId === null) {
        name = "Nueva base de datos";
      }
      const sql = format("INSERT INTO base_de_datos VALUES (NULL, ?)", [name]);
      return SingletonConnection.instance.execute(sql);
    })
    .then(([ { insertId } ]) => insertId);
  ;
}

/**
 * @param {number} databaseId 
 * @returns {Promise}
 */
async function deleteDatabase(databaseId) {
  await SingletonConnection.connect();
  const sql = format("SELECT tabla.nombre_interno AS internalName, tabla.id AS id FROM tabla WHERE tabla.base_de_datos = ?", [ databaseId ]);
  return SingletonConnection.instance.execute(sql).then(([ records ]) => {
    return Promise.all(records.map(async ({ internalName, id }) => {
      const dropSql = format(`DROP TABLE ??`, [ internalName ]);
      const deleteSql = format(`DELETE FROM tabla WHERE tabla.id = ?`, [id]);
      return SingletonConnection.instance.execute(dropSql).then(() => SingletonConnection.instance.execute(deleteSql));
    }));
  })
  .then(() => {
    const sql = format("DELETE FROM base_de_datos WHERE base_de_datos.id = ?", [ databaseId ]);
    return SingletonConnection.instance.execute(sql);
  })
  ;
}

/**
 * 
 * @param {string} databaseId 
 * @param {string} name 
 * @returns {Promise}
 */
async function renameDatabase(databaseId, name) {
  const sql = format(`UPDATE base_de_datos SET base_de_datos.nombre = ? WHERE base_de_datos.id = ?`, [ name, databaseId ]);
  await SingletonConnection.connect();
  return SingletonConnection.instance.execute(sql);
}

/**
 * 
 * @param {import("../lib/dashboard-utilities.js").TableIdentifier} tableIdentifier 
 * @param {string} columnName 
 * @param {string} name 
 */
async function renameColumn(tableIdentifier, columnName, name) {
  const sql = format(`ALTER TABLE ?? RENAME COLUMN ?? TO ??`, [ tableIdentifier.internalName, columnName, name ]);
  await SingletonConnection.connect();
  return SingletonConnection.instance.execute(sql);
}

/**
 * 
 * @param {string} externalTableName 
 * @param {import("../lib/dashboard-utilities.js").DatabaseIdentifier} databaseIdentifier 
 * @param {IncomingColumnDescriptor[]} tableScheme 
 */
async function createTable(externalTableName, databaseIdentifier, tableScheme) {
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

  await SingletonConnection.connect();

  const tableRegistrationSql = format(
    `INSERT INTO tabla VALUES (NULL, ?, ?, ?)`, 
    [databaseIdentifier.id, externalTableName, internalTableName]
  );

  await SingletonConnection.instance.execute(tableRegistrationSql);

  try {
    const tableCreationSql = `CREATE TABLE \`${internalTableName}\` (${tableBody}) ENGINE = InnoDB`;
    await SingletonConnection.instance.execute(tableCreationSql);

  } catch (error) {
    await deleteTableWithInternalName(internalTableName);
    throw error;
  }
}


/**
 * 
 * @param {import("../lib/dashboard-utilities.js").TableIdentifier} tableIdentifier 
 * @param {string} columnName 
 * @returns {Promise<boolean>}
 */
async function columnExists(tableIdentifier, columnName) {
  await SingletonConnection.connect();
  const sql = format(
    `SELECT COUNT(*) AS count 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_name = ? AND column_name = ?
    `,
    [ tableIdentifier.internalName, columnName ]
  );
  return SingletonConnection.instance.execute(sql).then(([ [ { count } ] ]) => count > 0);
}

/**
 * @param {import("../lib/dashboard-utilities.js").TableIdentifier} tableIdentifier 
 * @param {string} columnName 
 */
async function columnIsPrimaryKey(tableIdentifier, columnName) {
  await SingletonConnection.connect();
  const sql = format(
    `SELECT column_key AS columnKey
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE 
      table_name = ? AND 
      column_name = ?
    `, 
    [ tableIdentifier.internalName, columnName ]
  );
  return SingletonConnection.instance
    .execute(sql)
    .then(([ [ { columnKey } ] ]) => columnKey === "PRI")
    ;
}

/**
 * 
 * @param {import("../lib/dashboard-utilities.js").TableIdentifier} tableIdentifier 
 * @param {string} columnName 
 * @returns {Promise}
 */
async function deleteColumn(tableIdentifier, columnName) {
  await SingletonConnection.connect();
  return columnIsPrimaryKey(tableIdentifier, columnName)
    .then((isPrimaryKey) => {
      if (isPrimaryKey) return Promise.reject(new Error("The column to delete was a primary key"));
      let sql = format(`ALTER TABLE ?? DROP COLUMN ??`, [ tableIdentifier.internalName, columnName ]);
      return SingletonConnection.instance.execute(sql);
    })
    ;
  // const sql = format(`
  //   SELECT 
  //     column_name AS columnName,
  //     column_key AS columnKey
  //   FROM INFORMATION_SCHEMA.COLUMNS 
  //   WHERE 
  //     table_name = ? AND 
  //     ordinal_position = ? 
  //   `,
  //   [ tableIdentifier.internalName, columnName ]
  // );
  // return SingletonConnection.instance.execute(sql)
  //   .then(([ [ { columnName, columnKey } ] ]) => {
  //     if (columnKey === "PRI") return Promise.reject(new Error("The column to delete was a primary key"));
  //     let sql = format(`ALTER TABLE ?? DROP COLUMN ??`, [ tableIdentifier.internalName, columnName ]);
  //     return SingletonConnection.instance.execute(sql);
  //   })
  // ;
}

/**
 * 
 * @param {import("../lib/dashboard-utilities.js").DatabaseIdentifier} databaseIdentifier 
 * @param {import("../lib/dashboard-utilities.js").TableIdentifier} tableIdentifier 
 */
async function deleteTable(databaseIdentifier, tableIdentifier) {
  await SingletonConnection.connect();

  const tableDeletionSql = format(`DROP TABLE ??`, [tableIdentifier.internalName]);
  await SingletonConnection.instance.execute(tableDeletionSql);

  const recordDeletionSql = format(`DELETE FROM tabla WHERE tabla.base_de_datos = ? AND tabla.nombre_interno = ?`,
    [ databaseIdentifier.id, tableIdentifier.internalName ]
  );
  await SingletonConnection.instance.execute(recordDeletionSql);
}

/**
 * 
 * @param {string} tableInternalName 
 * @param {string[]} payload
 * @returns {Promise} 
 */
async function insertRecord(tableInternalName, payload) {
  await SingletonConnection.connect();

  let sql = format(`INSERT INTO ?? VALUES (NULL, ?)`, [ tableInternalName ]);
  sql = format(sql, [ payload ]);
  console.log(sql);

  return SingletonConnection.instance.execute(sql);
}

/**
 * 
 * @param {string} tableInternalName 
 * @param {number} id
 * @returns {Promise} 
 */
async function deleteRecord(tableInternalName, id) {
  await SingletonConnection.connect();

  const tableIdSql = format(`
    SELECT information_schema.columns.column_name AS columnName
    FROM information_schema.columns 
    WHERE 
      information_schema.columns.table_name = ? AND 
      information_schema.columns.column_key = 'PRI'
    `,
    [tableInternalName]
  );

  return SingletonConnection.instance
    .execute(tableIdSql)
    .then(([ [ { columnName } ] ]) => {
      let sql = format(`DELETE FROM ?? WHERE ?? = ?`, [ tableInternalName ]);
      sql = format(sql, [ columnName ]);
      sql = format(sql, [ id ]);
      return SingletonConnection.instance.execute(sql);
    })
}

/**
 * 
 * @param {string} tableInternalName 
 * @param {number} id 
 * @param {(string?)[]} payload 
 */
async function updateRecord(tableInternalName, id, payload) {
  await SingletonConnection.connect();
  const sql = format(`
    SELECT information_schema.columns.column_name AS columnName
    FROM information_schema.columns
    WHERE
      information_schema.columns.table_name = ?
    ORDER BY information_schema.columns.ordinal_position
    `,
    [tableInternalName]
  );

  const [ _, ...cleanPayload ] = payload;

  return SingletonConnection.instance
    .execute(sql)
    .then(([ columnNames ]) => {
      const [ primaryKeyName, ...cleanColumnNames ] = columnNames.map(object => object.columnName);
      // this code is potentionally dangerous, since it assumes the primary
      // key of a table is always the first column

      if (cleanColumnNames.length != cleanPayload.length) {
        return Promise.reject(new Error(`Wrong number of fields given for the specified table (given ${cleanPayload.length}; expected ${cleanColumnNames.length})`));
      }

      const zipObject = {};
      for (let i = 0; i < cleanColumnNames.length; i++) {
        const key = cleanColumnNames[i];
        const value = cleanPayload[i];
        zipObject[key] = value;
      }

      let sql = format("UPDATE ?? SET ? WHERE ?? = ?", [ tableInternalName ]);
      sql = format(sql, [zipObject]);
      sql = format(sql, [ primaryKeyName ]);
      sql = format(sql, [ id ]);

      return SingletonConnection.instance.execute(sql);
    })
    ;
}

/**
 * 
 * @param {string} tableInternalName 
 * @param {ExternalColumnType} selectedType
 * @returns {Promise} 
 */
async function addColumn(tableInternalName, selectedType) {
  await SingletonConnection.connect();

  const newColumnName = `Nueva columna ${uuidv4()}`;
  const coalescedType = TableCreationUtilities.coalesceColumnToSqlType(selectedType);

  let sql = format(`ALTER TABLE ?? ADD COLUMN ?? ${coalescedType}`, [  ]);
  sql = format(sql, [ tableInternalName ]);
  sql = format(sql, [ newColumnName ]);

  return SingletonConnection.instance
    .execute(sql)
    ;
}


module.exports = {
  getDatabases,
  getDatabaseId,
  getRecords,
  getSchema,
  getTables,
  getTablesWithBothNames,
  getIndexedTablesWithBothNames,
  getTableIdentifiers,
  getTableIdentifier,
  getDatabaseIdentifiers,
  columnExists,
  columnIsPrimaryKey,
  tableExists,
  updateRecord,
  createTable,
  createDatabase,
  deleteTable,
  deleteDatabase,
  deleteRecord,
  deleteColumn,
  databaseExistsWithId,
  renameDatabase,
  renameColumn,
  insertRecord,
  addColumn
}
