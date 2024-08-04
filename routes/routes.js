const ruta = require("express").Router();
const DatabaseController = require("../bd/database-controller.js");
const TableDataValidation = require("../lib/table-data-validation.js");
const DashboardUtilities = require("../lib/dashboard-utilities.js");

ruta.get("/", async (request, response) => {
  response.render("index");
});

ruta.get("/databases", async (request, response, next) => {
    try {
        const dashboardPayload = await DashboardUtilities.getDashboardPayload(null);

        response.render("dashboard", {
            getUrlForDatabase: DashboardUtilities.getUrlForDatabase,
            getUrlForTable: DashboardUtilities.getUrlForTable,
            dashboardPayload,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/databases/:selectedDatabase", async (request, response) => {
    try {
        const dashboardPayload = await DashboardUtilities.getDashboardPayload(request.params.selectedDatabase);

        response.render("dashboard", {
            getUrlForDatabase: DashboardUtilities.getUrlForDatabase,
            getUrlForTable: DashboardUtilities.getUrlForTable,
            dashboardPayload,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
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

        let validationResult = await TableDataValidation.validateUserData(userData, truthyValue, falsyValue);
        if (validationResult !== null) {
            console.log(validationResult);
            response.redirect(`/new/${selectedDatabase}/table`);
            return;
        }

        const enhancedUserData = TableDataValidation.enhanceUserData(userData);
        const tableScheme = TableDataValidation.buildTableScheme(enhancedUserData);

        validationResult = TableDataValidation.validateTableScheme(tableScheme);
        if (validationResult !== null) {
            console.log(validationResult);
            response.redirect(`/new/${selectedDatabase}/table`);
            return;
        }

        const externalTableName = enhancedUserData.tableName;
        await DatabaseController.createTable(externalTableName, selectedDatabase, tableScheme);

        console.log("The table was created successfully");

        response.redirect(`/databases/${selectedDatabase}`);
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/delete/:selectedDatabase/:selectedTable", async (request, response, next) => {
    try {
        const selectedDatabase = request.params.selectedDatabase;
        const selectedTable = request.params.selectedTable;

        await DatabaseController.deleteTable(selectedDatabase, selectedTable);

        response.redirect(`/databases/${selectedDatabase}`);
    } catch (error) {
        console.log(error);
        next(error);
    }
});

module.exports = ruta;
