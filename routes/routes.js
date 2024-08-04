const ruta = require("express").Router();
const { format } = require("mysql2");
const DatabaseController = require("../bd/database-controller");
const TableDataValidation = require("../lib/table-data-validation");
const { v4: uuidv4 } = require("uuid");
const SingletonConnection = require("../bd/singleton-connection");

ruta.get("/", async (request, response) => {
  response.render("index");
});

ruta.get("/databases", async (request, response) => {
    const basesDeDatos = await DatabaseController.getDatabases() || [];

    response.render("dashboard", { basesDeDatos });
});

ruta.get("/databases/:selectedDatabase", async (request, response) => {
    const selectedDatabase = request.params.selectedDatabase;

    const databases = await DatabaseController.getDatabases() || [];
    const tables = await DatabaseController.getTables(selectedDatabase) || [];


    response.render("dashboard", { 
        basesDeDatos: databases, 
        informacionDeTablas: {
            baseDeDatosSeleccionada: selectedDatabase,
            tablas: tables,
        },
    });
});

ruta.get("/databases/:selectedDatabase/:selectedTable", async (request, response) => {
    const selectedDatabase = request.params.selectedDatabase;
    const selectedTable = request.params.selectedTable;

    const databases = await DatabaseController.getDatabases() || [];
    const tables = await DatabaseController.getTables(selectedDatabase) || [];
    const registries = await DatabaseController.getRegistries(selectedTable) || [];
    const schema = await DatabaseController.getSchema(selectedTable);

    response.render("dashboard", {
        basesDeDatos: databases,
        informacionDeTablas: {
            baseDeDatosSeleccionada: selectedDatabase, 
            tablas: tables,
        },
        informacionDeRegistros: {
            tablaSeleccionada: selectedTable,
            registros: registries,
            esquema: schema
        }
    });
});

ruta.get("/new/:selectedDatabase/table", async (request, response) => {
    const selectedDatabase = request.params.selectedDatabase;

    const databases = await DatabaseController.getDatabases() || [];
    const tables = await DatabaseController.getIndexedTablesWithBothNames(selectedDatabase) || [];

    response.render("crear-tabla", { 
        basesDeDatos: databases, 
        tablas: tables,
        baseDeDatosSeleccionada: request.params.selectedDatabase 
    });
});

ruta.post("/new/:selectedDatabase/table", async (request, response, next) => {
    try {
        const selectedDatabase = request.params.selectedDatabase;

        const truthyValue = "on";
        const falsyValue = "none";

        const userData = TableDataValidation.getUserDataFromRequestBody(request, truthyValue, falsyValue);

        console.log("This is the user data");
        console.log(userData);

        let validationResult = await TableDataValidation.validateUserData(userData, truthyValue, falsyValue);
        if (validationResult !== null) {
            console.log(validationResult);
            response.redirect(`/new/${selectedDatabase}/table`);
            console.log("the validation didnt' work");
            return;
        }
        const enhancedUserData = TableDataValidation.enhanceUserData(userData);
        const tableScheme = TableDataValidation.buildTableScheme(enhancedUserData);

        console.log("This is the enhanced user data");
        console.log(enhancedUserData);
        console.log("This is the scheme");
        console.log(tableScheme);

        validationResult = TableDataValidation.validateTableScheme(tableScheme);
        if (validationResult !== null) {
            response.redirect(`/new/${selectedDatabase}/table`);
            console.log(validationResult.message);
            return;
        }

        const foreignKeys = tableScheme.filter(columnObject => columnObject.dataType == "reference");
        const regularColumns = tableScheme.filter(columnObject => columnObject.dataType != "reference");

        const midwayForeignKeys = await Promise.all(foreignKeys.map(async (columnObject) => await DatabaseController.getMidwayReferenceDescriptor(columnObject)));
        const midwayRegularColumns = regularColumns.map(columnObject => TableDataValidation.getMidwayPrimitiveDescriptor(columnObject));

        console.log("These are the midway regular columns");
        console.log(midwayRegularColumns);

        const primitiveColumns = [ ...midwayForeignKeys, ...midwayRegularColumns ];
        primitiveColumns.sort((columnObject) => columnObject.index);

        const primitiveSql = primitiveColumns.map((columnObject) => TableDataValidation.getSqlForPrimitiveColumn(columnObject));
        const referenceSql = midwayForeignKeys.map((columnObject) => TableDataValidation.getSqlForReferenceColumn(columnObject));

        const internalTableName = uuidv4();
        const externalTableName = enhancedUserData.tableName;

        const tableBody = [...primitiveSql, ...referenceSql].join(",\n");

        const databaseId = await DatabaseController.getDatabaseId(selectedDatabase);

        await SingletonConnection.connect();

        const tableRegistrationSql = format(`INSERT INTO tabla VALUES (NULL, ?, ?, ?)`, [databaseId, externalTableName, internalTableName]);
        await SingletonConnection.instance.execute(tableRegistrationSql);
        try {
            console.log("This is the table body");
            console.log(tableBody);
            const tableCreationSql = `CREATE TABLE \`${internalTableName}\` (${tableBody}) ENGINE = InnoDB`;
            await SingletonConnection.instance.execute(tableCreationSql);

        } catch (error) {
            const tableDeletionSql = format(`DELETE FROM tabla WHERE tabla.nombre_interno = ?`, [internalTableName]);
            await SingletonConnection.instance.execute(tableDeletionSql);
            throw error;
        }

        response.redirect(`/databases/${selectedDatabase}`);
    } catch (error) {
        console.log(error);
        next(error);
    }
});

module.exports = ruta;
