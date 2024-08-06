const ruta = require("express").Router();
const DatabaseController = require("../bd/database-controller.js");
const TableDataValidation = require("../lib/table-data-validation.js");
const DashboardUtilities = require("../lib/dashboard-utilities.js");
const { getRecordVisualizationPayload } = require("../lib/record-visualization.js");
const { externalColumnTypeToSpanish } = require("../lib/single-function-files/external-column-type-to-spanish.js");

async function ensureValidDatabase(request, response, next) {
    try {
        const selectedDatabase = request.params.selectedDatabase;
        const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(selectedDatabase);
        if (databaseIdentifier === null) {
            console.log(databaseIdentifier);
            return next(new Error(`La url ingresada no es válida`));
        }
        const databaseId = databaseIdentifier.id;
        const databaseExists = await DatabaseController.databaseExistsWithId(databaseId);
        if (!databaseExists) {
            console.log("La base de datos indicada no existe");
            return next(new Error(`La base de datos indicada en la URL no existe`));
        }
        next();
    } catch (error) {
        next(error);
    }
}

async function ensureValidTable(request, response, next) {
    try {
        const selectedTable = request.params.selectedTable;
        const tableIdentifier = DashboardUtilities.parseTableIdentifier(selectedTable);
        if (tableIdentifier === null) {
            return next(new Error(`La url ingresada no es válida`));
        }
        const tableInternalName = tableIdentifier.internalName;
        const tableExists = await DatabaseController.tableExists(tableInternalName);
        if (!tableExists) {
            console.log(`Internal name: ${tableInternalName}`);
            console.log(`External name: ${tableIdentifier.externalName}`);
            return next(new Error(`La tabla indicada en la URL no existe`));
        }
        return next();
    } catch (error) {
        return next(error);
    }
}

async function ensureValidColumn(request, response, next) {
    try {
        const selectedTable = request.params.selectedTable;
        const tableIdentifier = DashboardUtilities.parseTableIdentifier(selectedTable);
        const selectedColumn = request.params.selectedColumn;

        await DatabaseController
            .columnExists(tableIdentifier, selectedColumn)
            .then((exists) => {
                if (!exists) return Promise.reject(new Error("The given column doesn't exist in the table"));
                return true;
            });

        return next();
    } catch (error) {
        return next(error);
    }
}

function ensureValidId(request, response, next) {
    const selectedId = Number.parseInt(request.params.selectedId);
    if (Number.isNaN(selectedId) || selectedId <= 0) {
        return next(new Error("The given record id is not valid"));
    }
    return next();
}

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
            recordVisualizationPayload: null,
            dashboardMode: "preview"
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/databases/:selectedDatabase", ensureValidDatabase, async (request, response) => {
    try {
        const dashboardPayload = await DashboardUtilities.getDashboardPayload(request.params.selectedDatabase);

        response.render("dashboard", {
            getUrlForDatabase: DashboardUtilities.getUrlForDatabase,
            getUrlForTable: DashboardUtilities.getUrlForTable,
            dashboardPayload,
            recordVisualizationPayload: null,
            dashboardMode: "tables"
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/databases/:selectedDatabase/:selectedTable", ensureValidDatabase, ensureValidTable, async (request, response, next) => {
    try {
        const dashboardPayload = await DashboardUtilities.getDashboardPayload(request.params.selectedDatabase);
        const recordVisualizationPayload = await getRecordVisualizationPayload(request.params.selectedTable);

        response.render("dashboard", {
            getUrlForDatabase: DashboardUtilities.getUrlForDatabase,
            getUrlForTable: DashboardUtilities.getUrlForTable,
            externalColumnTypeToSpanish,
            dashboardPayload,
            recordVisualizationPayload,
            dashboardMode: "records"
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/new/:selectedDatabase/table", async (request, response, next) => {
    try {
        const dashboardPayload = await DashboardUtilities.getDashboardPayload(request.params.selectedDatabase);
        response.render("crear-tabla", { 
            getUrlForDatabase: DashboardUtilities.getUrlForDatabase,
            getUrlForTable: DashboardUtilities.getUrlForTable,
            dashboardPayload,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/new/database", async (request, response, next) => {
    try {
        await DatabaseController.createDatabase().then((insertionId) => {
            console.log(`The insertion id was: ${insertionId}`);
            response.redirect(`/databases/${insertionId}`);
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.post("/new/:selectedDatabase/table", ensureValidDatabase, async (request, response, next) => {
    try {
        const selectedDatabase = request.params.selectedDatabase;
        const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(selectedDatabase);
        // DatabaseController.getDatabaseId();

        const truthyValue = "on";
        const falsyValue = "none";

        const userData = TableDataValidation.getUserDataFromRequestBody(request, truthyValue, falsyValue);

        let validationResult = await TableDataValidation.validateUserData(userData, truthyValue, falsyValue);
        if (validationResult !== null) {
            console.log(validationResult);
            response.redirect(`/new/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/table`);
            return;
        }

        const enhancedUserData = TableDataValidation.enhanceUserData(userData);
        const tableScheme = TableDataValidation.buildTableScheme(enhancedUserData);

        validationResult = TableDataValidation.validateTableScheme(tableScheme);
        if (validationResult !== null) {
            console.log(validationResult);
            response.redirect(`/new/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/table`);
            return;
        }

        const externalTableName = enhancedUserData.tableName;
        await DatabaseController.createTable(externalTableName, databaseIdentifier, tableScheme);

        console.log("The table was created successfully");

        response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}`);
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/delete/:selectedDatabase", ensureValidDatabase, async (request, response, next) => {
    try {
        const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
        await DatabaseController
            .deleteDatabase(databaseIdentifier.id)
            .then((results) => {
                console.log(results);
                console.log(`The database ${databaseIdentifier.name} was deleted correctly`);
                response.redirect("/databases");
            })
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/delete/:selectedDatabase/:selectedTable", ensureValidDatabase, ensureValidTable, async (request, response, next) => {
    const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    try {

        await DatabaseController.deleteTable(databaseIdentifier, tableIdentifier);

        response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}`);
    } catch (error) {
        // response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/${DashboardUtilities.getUrlForTable(tableIdentifier)}`);
        next(error);
    }
});

ruta.get("/delete/:selectedDatabase/:selectedTable/:selectedColumn", ensureValidDatabase, ensureValidTable, ensureValidColumn, async (request, response, next) => {
    const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    const columnName = request.params.selectedColumn;
    try {
        await DatabaseController
            .deleteColumn(tableIdentifier, columnName);
            
        response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/${DashboardUtilities.getUrlForTable(tableIdentifier)}`);

    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/rename/database", async (request, response, next) => {
    const databaseId = request.query.databaseId;
    const name = request.query.name;

    try {
        DatabaseController
            .renameDatabase(databaseId, name)
            .then(() => {
                response.send({ ok: true, error: null });
            })
            .catch((error) => {
                response.send({ ok: false, error });
            })
            ;
    } catch (error) {
        response.send({ ok: false, error });
        console.log(error);
        next(error);
    }
});

ruta.get("/rename/database/:selectedTable/:selectedColumn", ensureValidTable, ensureValidColumn, async (request, response, next) => {
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    const selectedColumn = request.params.selectedColumn;
    const name = request.query.name;
    try {
        DatabaseController
            .renameColumn(tableIdentifier, selectedColumn, name)
            .then(() => {
                response.send({ ok: true, error: null });
            })
            .catch((error) => {
                response.send({ ok: false, error });
            });
    } catch (error) {
        response.send({ ok: false, error });
        console.log(error);
        next(error);
    }
});

ruta.post("/insert/:selectedDatabase/:selectedTable", ensureValidDatabase, ensureValidTable, async (request, response, next) => {
    const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    const payload = request.body.payload;
    try {
        DatabaseController
            .insertRecord(tableIdentifier.internalName, payload)
            .then(() => {
                response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/${DashboardUtilities.getUrlForTable(tableIdentifier)}`);
            });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/delete-record/:selectedDatabase/:selectedTable/:selectedId", ensureValidDatabase, ensureValidTable, ensureValidId, async (request, response, next) => {
    const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    const selectedId = Number.parseInt(request.params.selectedId);
    
    try {
        DatabaseController
            .deleteRecord(tableIdentifier.internalName, selectedId)
            .then(() => {
                response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/${DashboardUtilities.getUrlForTable(tableIdentifier)}`);
            });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

module.exports = ruta;
