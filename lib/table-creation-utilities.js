const { format } = require("mysql2");

const SingletonConnection = require("../bd/singleton-connection.js");

/**
 * 
 * @param {import("../bd/database-controller").ExternalColumnType} dataType 
 * @returns {import("../bd/database-controller").MidwayColumnType}
 */
function coalesceColumnToSqlType(dataType) {
    switch (dataType) {
        case "integer": return "int";
        case "decimal": return "float";
        case "date": return "date";
        case "text": return "text";
        case "reference":
            throw new Error("This function can't resolve the type of a reference");
    }
}

/**
 * @param {import("../bd/database-controller").IncomingColumnDescriptor} columnObject 
 * @returns {import("../bd/database-controller").MidwayPrimitiveColumnDescriptor}
 */
function getMidwayPrimitiveDescriptor(columnObject) {
    const currentType = columnObject.dataType;
    if (columnObject.dataType == "reference") {
        throw new Error("This function can't resolve the type of a reference");
    }

    /** @type {import("../bd/database-controller").MidwayColumnType} */
    const newType = coalesceColumnToSqlType(currentType);

    const copy = { ...columnObject };
    copy.dataType = newType;
    return copy;
}

/**
 * @param {import("../bd/database-controller").MidwayPrimitiveColumnDescriptor} columnObject 
 * @returns {string}
 */
function getSqlForPrimitiveColumn(columnObject) {
    const isNullableString = columnObject.isNullable? "": " NOT NULL";
    const isUniqueString = columnObject.isUnique? " UNIQUE": "";
    const isPrimaryKeyString = columnObject.isPrimaryKey? " PRIMARY KEY": "";
    const isAutoincrementableString = columnObject.isAutoincrementable? " AUTO_INCREMENT": "";

    return format(`?? ${columnObject.dataType}${isNullableString}${isUniqueString}${isPrimaryKeyString}${isAutoincrementableString}`, columnObject.name);
}

/**
 * 
 * @param {import("../bd/database-controller").MidwayReferenceColumnDescriptor} columnObject 
 * @returns {string}
 */
function getSqlForReferenceColumn(columnObject) {
    let sql = format(
        `FOREIGN KEY (??) REFERENCES ?? (??)
            ON UPDATE RESTRICT
            ON DELETE RESTRICT`, 
        columnObject.name);
    sql = format(sql, columnObject.referencedTableId);
    sql = format(sql, columnObject.referencedTableColumn);
    return sql;
}


/**
 * 
 * @param {import("../bd/database-controller").IncomingColumnDescriptor} columnObject 
 * @returns {Promise<import("../bd/database-controller").MidwayReferenceColumnDescriptor>}
 */
async function getMidwayReferenceDescriptor(columnObject) {
    const sql = format(`
        SELECT 
            information_schema.columns.DATA_TYPE AS dataType, 
            information_schema.columns.COLUMN_NAME as referencedTableColumn
        FROM information_schema.columns 
        WHERE 
        information_schema.columns.TABLE_NAME = ? AND 
        information_schema.columns.COLUMN_KEY = 'PRI'
        ;
        `, columnObject.referencedTableId
    );

    await SingletonConnection.connect();

    const [ [ { dataType, referencedTableColumn } ] ] = await SingletonConnection.instance.execute(sql);

    const { index, isAutoincrementable, isNullable, isPrimaryKey, isUnique, name, referencedTableId } = columnObject;

    return {
        index,
        dataType,
        isAutoincrementable,
        isNullable,
        isPrimaryKey,
        isUnique,
        name,
        referencedTableColumn,
        referencedTableId
    };
}

module.exports = {
    getMidwayPrimitiveDescriptor,
    getMidwayReferenceDescriptor,
    getSqlForPrimitiveColumn,
    getSqlForReferenceColumn,
    coalesceColumnToSqlType
};