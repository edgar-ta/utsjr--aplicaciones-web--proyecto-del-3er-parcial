const ruta = require("express").Router();
const DatabaseController = require("../bd/database-controller");

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
    const databases = await DatabaseController.getDatabases() || [];
    response.render("crear-tabla", { 
        basesDeDatos: databases, 
        baseDeDatosSeleccionada: request.params.selectedDatabase 
    });
});

ruta.post("/new/:selectedDatabase/table", async (request, response) => {
    console.log(request.body);
    response.redirect("/databases");
});

module.exports = ruta;
