const { format, escape } = require("mysql2");
const DatabaseController = require("../bd/database-controller.js");

/**
 * @template K
 * @param {K[]} dubiousList 
 * @param {K[]} validList 
 * @returns {boolean}
 */
function listIsComposedOf(dubiousList, validList) {
    return dubiousList.every(element => validList.includes(element));
}

/**
 * @template K
 * @param {K[]} array 
 * @param {K} truthyValue 
 * @returns {boolean[]}
 */
function castToBoolean(array, truthyValue) {
    return array.map(element => element === truthyValue);
}

/**
 * @template K
 * @param {K[] | K} list 
 * @param {K} truthyValue 
 * @returns {K[]}
 */
function collapseInverseDuplicates(list, truthyValue = "on") {
    if (Array.isArray(list)) {
        list.reverse();
        let i = 0;
        while (i < list.length) {
            const element = list[i];
            if (element === truthyValue) {
                const nextElement = list[i + 1];
                if (nextElement === truthyValue) {
                    throw new Error(`Wrong format of inverse duplicates: truthy value after truthy value. \nlist = ${list}`);
                }
                list.splice(i + 1, 1);
            }
            i++;
        }
        list.reverse();
        return list;
    }
    return [ list ];
}

/**
 * @template K
 * @param {K[]} array 
 * @param {K} truthyValue 
 * @returns {boolean}
 */
function canCollapseInverseDuplicates(array, truthyValue = "on") {
    if (array.length <= 1) return true;
    let i = array.length - 1;
    while (i > 0) {
        const currentElement = array[i];
        if (currentElement == truthyValue) {
            const previousElement = array[i - 1];
            if (previousElement == truthyValue) {
                return false;
            }
            i--;
        }
        i--;
    }
    return true;
}

/**
 * @template K
 * @param {K[]} array 
 * @param {K} truthyValue 
 * @returns {number}
 */
function countItemsAfterCollapse(array, truthyValue = "on") {
    const length = array.length;
    const truthyValuesLength = array.filter(element => element == truthyValue).length;
    return length - truthyValuesLength;
}

/**
 * @template K
 * @param {K | K[]} elementOrArray 
 * @returns {K[]}
 */
function ensureArray(elementOrArray) {
    if (Array.isArray(elementOrArray)) return elementOrArray;
    if (elementOrArray === undefined) return [];
    return [ elementOrArray ];
}

/**
 * @param {{ 
 *  tableName: string,
 *  columnCount: number,
 *  nameArray: string[],
 *  dataTypeArray: import("../bd/database-controller").ExternalColumnType[],
 *  referencedTableArray: string[],
 *  isPrimaryKeyArray: boolean[],
 *  isNullableArray: boolean[],
 *  isUniqueArray: boolean[],
 *  isAutoincrementableArray: boolean[],
 * }} param0
 * @returns {import("../bd/database-controller").IncomingColumnDescriptor[]}
 */
function buildTableScheme({
    columnCount,
    nameArray,
    dataTypeArray,
    referencedTableArray,
    isPrimaryKeyArray,
    isNullableArray,
    isUniqueArray,
    isAutoincrementableArray
}) {
    let referencedTableIndex = 0;
    /** @type {import("../bd/database-controller").IncomingColumnDescriptor[]} */
    const scheme = [];
    for (let index = 0; index < columnCount; index++) {
        const name = nameArray[index];
        const dataType = dataTypeArray[index];
        /** @type {string?} */
        let referencedTable = referencedTableArray[index];
        const isPrimaryKey = isPrimaryKeyArray[index];
        const isNullable = isNullableArray[index];
        const isUnique = isUniqueArray[index];
        const isAutoincrementable = isAutoincrementableArray[index];

        if (dataType == "reference") {
            referencedTable = referencedTableArray[referencedTableIndex];
            referencedTableIndex++;
        } else {
            referencedTable = null;
        }

        /** @type {import("../bd/database-controller").IncomingColumnDescriptor} */
        const columnObject = {
            index,
            name,
            dataType,
            referencedTableId: referencedTable,
            isPrimaryKey,
            isNullable,
            isUnique,
            isAutoincrementable
        };
        scheme.push(columnObject);
    }
    return scheme;
}

/**
 * @template K
 */
class Validator {
    /** @type {(K) => Error?} */
    callback;

    /** @type {Validator} */
    nextValidator;

    constructor(callback = () => null, nextValidator = null) {
        this.callback = callback;
        this.nextValidator = nextValidator;
    }

    /**
     * 
     * @param {keyof K} key 
     * @param {string} comparisonValue 
     * @param {string} [message=""] 
     * @returns {Validator<K>}
     */
    assertEquals(key, comparisonValue, message = "") {
        this.#setLastValidator((originalValue) => originalValue[key] === comparisonValue? null: new Error(message));
        return this;
    }

    /**
     * 
     * @param {keyof K} key 
     * @param {string} comparisonValue 
     * @param {string} message 
     * @returns 
     */
    assertNotEquals(key, comparisonValue, message) {
        this.#setLastValidator((originalValue) => originalValue[key] !== comparisonValue? null: new Error(message));
        return this;
    }

    /**
     * 
     * @param {keyof K} key 
     * @param {string} message 
     * @returns {Validator<K>}
     */
    assertNotNull(key, message) {
        return this.assertNotEquals(key, null, message);
    }
    /**
     * 
     * @param {keyof K} key 
     * @param {string} message 
     * @returns {Validator<K>}
     */
    assertNull(key, message) {
        return this.assertEquals(key, null, message);
    }

    /**
     * 
     * @param {keyof K} key 
     * @param {string} message 
     * @returns {Validator<K>}
     */
    assertTrue(key, message) {
        return this.assertEquals(key, true, message);
    }

    /**
     * 
     * @param {keyof K} key 
     * @param {string} message 
     * @returns {Validator<K>}
     */
    assertFalse(key, message) {
        return this.assertEquals(key, false, message);
    }

    /**
     * 
     * @param {(value: K) => boolean} predicate 
     * @param {(value: Validator<K>) => Validator<K>} callback 
     * @returns {Validator<K>}
     */
    callIf(predicate, callback) {
        this.#setLastValidator((value) => {
            if (predicate(value)) {
                return callback(new Validator()).call(value);
            }
            return null;
        });
        return this;
    }

    #setLastValidator(validatorCallback) {
        let currentValidator = this;
        while (currentValidator.nextValidator !== null) {
            currentValidator = currentValidator.nextValidator;
        }
        currentValidator.nextValidator = new Validator(validatorCallback);
    }

    /**
     * 
     * @param {K} value 
     * @returns {Error?}
     */
    call(value) {
        const result = this.callback(value);
        if (result === null && this.nextValidator !== null) {
            return this.nextValidator.call(value);
        }
        return result;
    }
}

/**
 * 
 * @param {import("../bd/database-controller").IncomingColumnDescriptor} columnObject 
 * @returns {Error?}
 */
function validateTableColumn(columnObject) {
    /** @type {Validator<import("../bd/database-controller").IncomingColumnDescriptor>} */
    const validator = new Validator();
    switch (columnObject.dataType) {
        case "integer": {
            validator
                .assertNull("referencedTableId", "Una columna de tipo entero no puede referenciar otra tabla (quizás deberías usar una columna de tipo referencia)")
                .callIf((__) => __.isPrimaryKey, (__) => __.assertTrue("isUnique", "Una columna de tipo entero que además es clave primaria debe ser única"))
        };
        break;
        case "decimal": {
            validator
                .assertNull("referencedTableId", "Una columna de tipo decimal no puede referenciar otra tabla")
                .assertFalse("isPrimaryKey", "El decimal no puede ser clave primaria")
                .assertFalse("isAutoincrementable", "El decimal no puede ser autoincrementable")
        };
        break;
        case "date": {
            validator
                .assertNull("referencedTableId", "Una columna de tipo fecha no puede referenciar otra tabla")
                .assertFalse("isPrimaryKey", "Una columna de tipo fecha no puede ser una clave primaria")
                .assertFalse("isAutoincrementable", "Una columna de tipo fecha no puede ser autoincrementable");
        };
        break;
        case "text": {
            validator
                .assertNull("referencedTableId", "Una columna de tipo texto no puede referenciar otra tabla (quizás deberías usar una columna de tipo referencia)")
                .callIf((__) => __.isPrimaryKey, (__) => __.assertTrue("isUnique", "Una columna de tipo texto que además es clave primaria debe ser única"))
                .assertFalse("isAutoincrementable", "Una columna de tipo texto no puede ser autoincrementable");
        }
        break;
        case "reference": {
            validator
                .assertNotNull("referencedTableId", "Una columna de tipo referencia forzosamente debe referenciar otra tabla")
                .assertFalse("isPrimaryKey", "Una columna de tipo referencia no puede ser una clave primaria")
                .assertFalse("isAutoincrementable", "Una columna de tipo fecha no puede ser autoincrementable");
            ;
        };
        break;
    }
    return validator.call(columnObject);
}

/**
 * 
 * @param {import("../bd/database-controller").IncomingColumnDescriptor[]} scheme 
 * @returns {Error?}
 */
function validateTableScheme(scheme) {
    for (let columnObject of scheme) {
        const result = validateTableColumn(columnObject);
        if (result != null) {
            return result;
        }
    }
    return null;
}


/**
 * 
 * @param {any} request 
 * @returns { { 
 *  tableName: string,
 *  columnCount: number,
 *  nameArray: string[],
 *  dataTypeArray: import("../bd/database-controller").ExternalColumnType[],
 *  referencedTableArray: string[],
 *  isPrimaryKeyArray: string[],
 *  isNullableArray: string[],
 *  isUniqueArray: string[],
 *  isAutoincrementableArray: string[],
 * } }
 */
function getUserDataFromRequestBody(request) {
    /** @type {string} */
    let tableName = request.body.tableName;

    /** @type {number} */
    let columnCount = Number.parseInt(request.body.columnCount);

    /** @type {string[]} */
    let nameArray = ensureArray(request.body.nameArray);
    
    /** @type {import("../bd/database-controller").ExternalColumnType[]} */
    let dataTypeArray = ensureArray(request.body.dataTypeArray);
    
    /** @type {string[]} */
    let referencedTableArray = ensureArray(request.body.referencedTableArray);

    /** @type {string[]} */
    let isPrimaryKeyArray = ensureArray(request.body.isPrimaryKeyArray);

    /** @type {string[]} */
    let isNullableArray = ensureArray(request.body.isNullableArray);

    /** @type {string[]} */
    let isUniqueArray = ensureArray(request.body.isUniqueArray);

    /** @type {string[]} */
    let isAutoincrementableArray = ensureArray(request.body.isAutoincrementableArray);

    return {
        tableName,
        columnCount,
        nameArray,
        dataTypeArray,
        referencedTableArray,
        isPrimaryKeyArray,
        isNullableArray,
        isUniqueArray,
        isAutoincrementableArray,
    };
}

/**
 * 
 * @param {{ 
 *  tableName: string,
 *   columnCount: number,
 *   nameArray: string[],
 *   dataTypeArray: import("../bd/database-controller").ExternalColumnType[],
 *   referencedTableArray: string[],
 *   isPrimaryKeyArray: string[],
 *   isNullableArray: string[],
 *   isUniqueArray: string[],
 *   isAutoincrementableArray: string[],
 * } } param0 
 * @param {string} [truthyValue="on"] 
 * @param {string} [falsyValue="none"] 
 * @returns {Promise<Error>}
 */
async function validateUserData({
        columnCount,
        nameArray,
        dataTypeArray,
        referencedTableArray,
        isPrimaryKeyArray,
        isNullableArray,
        isUniqueArray,
        isAutoincrementableArray
    },
    truthyValue = "on",
    falsyValue = "none"
    ) {
    if (Number.isNaN(columnCount) || columnCount < 1 || columnCount > 30) {
        return new Error(`Wrong column count value: ${request.body.columnCount}`);
    }

    if ( [ nameArray, dataTypeArray ].some(array => array.length != columnCount) ) {
        return new Error(`Wrong number of columns in request`);
    }

    if ( [ isPrimaryKeyArray, isNullableArray, isUniqueArray, isAutoincrementableArray ].some(array => countItemsAfterCollapse(array) != columnCount) ) {
        return new Error(`Wrong number of checkboxes/radio buttons in request`);
    }

    if ( [ isPrimaryKeyArray, isNullableArray, isUniqueArray, isAutoincrementableArray ].some(array => !listIsComposedOf(array, [ truthyValue, falsyValue ])) ) {
        return new Error(`The binary values lists contain values other than '${truthyValue}' or '${falsyValue}'`);
    }

    if (!listIsComposedOf(dataTypeArray, [ "date", "decimal", "integer", "reference", "text" ])) {
        return new Error("The list of data types contains an invalid value");
    }

    if ((await Promise.all(referencedTableArray.map(async (internalTableName) => await DatabaseController.tableExists(internalTableName)))).some(element => element === false)) {
        return new Error("The list of referenced tables includes an invalid id");
    }

    if (referencedTableArray.length != dataTypeArray.filter(element => element == "reference").length) {
        return new Error("The number of columns of type referenced doesn't match the number of table references given");
    }

    if ([ isPrimaryKeyArray, isNullableArray, isUniqueArray, isAutoincrementableArray ].some(array => !canCollapseInverseDuplicates(array))) {
        return new Error("One of the arrays of checkboxes/radio buttons doesn't follow the appropriate format");
    }
    
    if (isPrimaryKeyArray.filter(element => element === truthyValue).length != 1) {
        return new Error("There must be exactly one primary key per table");
    }

    return null;
}


/**
 * 
 * @param {{ 
*   tableName: string,
*   columnCount: number,
*   nameArray: string[],
*   dataTypeArray: import("../bd/database-controller").ExternalColumnType[],
*   referencedTableArray: string[],
*   isPrimaryKeyArray: boolean[],
*   isNullableArray: boolean[],
*   isUniqueArray: boolean[],
*   isAutoincrementableArray: boolean[],
* } } param0 
* @param {string} [truthyValue="on"] 
* @param {string} [falsyValue="none"] 
*/
function enhanceUserData({
        tableName,
        columnCount,
        nameArray,
        dataTypeArray,
        referencedTableArray,
        isPrimaryKeyArray,
        isNullableArray,
        isUniqueArray,
        isAutoincrementableArray
   },
   truthyValue = "on",
   ) {
    return {
        tableName,
        columnCount,
        nameArray,
        dataTypeArray,
        referencedTableArray,
        isPrimaryKeyArray: castToBoolean(collapseInverseDuplicates(isPrimaryKeyArray, truthyValue), truthyValue),
        isNullableArray: castToBoolean(collapseInverseDuplicates(isNullableArray, truthyValue), truthyValue),
        isUniqueArray: castToBoolean(collapseInverseDuplicates(isUniqueArray, truthyValue), truthyValue),
        isAutoincrementableArray: castToBoolean(collapseInverseDuplicates(isAutoincrementableArray, truthyValue), truthyValue),
    };
}


module.exports = {
    listIsComposedOf,
    collapseInverseDuplicates,
    ensureArray,
    buildTableScheme,
    validateTableScheme,
    validateUserData,
    getUserDataFromRequestBody,
    enhanceUserData
};
