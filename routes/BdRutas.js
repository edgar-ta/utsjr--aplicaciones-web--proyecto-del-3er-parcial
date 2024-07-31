const ruta = require("express").Router();
const BasesDeDatosBD = require("../bd/BasesDeDatosBD");

ruta.get("/", async (request, response) => {
  const controladorDeBD = new BasesDeDatosBD();
  await controladorDeBD.prueba();
  response.render("index");
});

ruta.get("/databases", async (request, response) => {
    const controladorDeBD = new BasesDeDatosBD();
    const basesDeDatos = await controladorDeBD.obtenerBasesDeDatos() || [];

    response.render("dashboard", { basesDeDatos });
});

ruta.get("/databases/:selectedDatabase", async (request, response) => {
    const controladorDeBD = new BasesDeDatosBD();
    const baseDeDatosSeleccionada = request.params.selectedDatabase;

    const basesDeDatos = await controladorDeBD.obtenerBasesDeDatos() || [];
    const tablas = await controladorDeBD.obtenerTablas(baseDeDatosSeleccionada) || [];


    response.render("dashboard", { 
        basesDeDatos, 
        informacionDeTablas: {
            baseDeDatosSeleccionada,
            tablas,
        },
    });
});

ruta.get("/databases/:selectedDatabase/:selectedTable", async (request, response) => {
    const controladorDeBD = new BasesDeDatosBD();
    const baseDeDatosSeleccionada = request.params.selectedDatabase;
    const tablaSeleccionada = request.params.selectedTable;

    const basesDeDatos = await controladorDeBD.obtenerBasesDeDatos() || [];
    const tablas = await controladorDeBD.obtenerTablas(baseDeDatosSeleccionada) || [];
    const registros = await controladorDeBD.obtenerRegistros(tablaSeleccionada) || [];
    const esquema = await controladorDeBD.obtenerEsquema(tablaSeleccionada);

    response.render("dashboard", {
        basesDeDatos,
        informacionDeTablas: {
            baseDeDatosSeleccionada, 
            tablas,
        },
        informacionDeRegistros: {
            tablaSeleccionada,
            registros,
            esquema
        }
    });
});

ruta.get("/new/:selectedDatabase/table", async (request, response) => {
    const controladorDeBD = new BasesDeDatosBD();
    const basesDeDatos = await controladorDeBD.obtenerBasesDeDatos() || [];
    response.render("crear-tabla", { basesDeDatos, baseDeDatosSeleccionada: request.params.selectedDatabase });
});

ruta.post("/new/:selectedDatabase/table", async (request, response) => {
    console.log(request.body);
    response.redirect("/databases");
});

module.exports = ruta;

const ruta = require("express").Router();
const BasesDeDatosBD = require("../bd/BasesDeDatosBD");

ruta.get("/", async (request, response) => {
  const controladorDeBD = new BasesDeDatosBD();
  await controladorDeBD.prueba();
  response.render("index");
});

ruta.get("/databases", async (request, response) => {
    const controladorDeBD = new BasesDeDatosBD();
    const basesDeDatos = await controladorDeBD.obtenerBasesDeDatos() || [];

    response.render("dashboard", { basesDeDatos });
});

ruta.get("/databases/:selectedDatabase", async (request, response) => {
    const controladorDeBD = new BasesDeDatosBD();
    const baseDeDatosSeleccionada = request.params.selectedDatabase;

    const basesDeDatos = await controladorDeBD.obtenerBasesDeDatos() || [];
    const tablas = await controladorDeBD.obtenerTablas(baseDeDatosSeleccionada) || [];


    response.render("dashboard", { 
        basesDeDatos, 
        informacionDeTablas: {
            baseDeDatosSeleccionada,
            tablas,
        },
    });
});

ruta.get("/databases/:selectedDatabase/:selectedTable", async (request, response) => {
    const controladorDeBD = new BasesDeDatosBD();
    const baseDeDatosSeleccionada = request.params.selectedDatabase;
    const tablaSeleccionada = request.params.selectedTable;

    const basesDeDatos = await controladorDeBD.obtenerBasesDeDatos() || [];
    const tablas = await controladorDeBD.obtenerTablas(baseDeDatosSeleccionada) || [];
    const registros = await controladorDeBD.obtenerRegistros(tablaSeleccionada) || [];
    const esquema = await controladorDeBD.obtenerEsquema(tablaSeleccionada);

    response.render("dashboard", {
        basesDeDatos,
        informacionDeTablas: {
            baseDeDatosSeleccionada, 
            tablas,
        },
        informacionDeRegistros: {
            tablaSeleccionada,
            registros,
            esquema
        }
    });
});

ruta.get("/new/:selectedDatabase/table", async (request, response) => {
    const controladorDeBD = new BasesDeDatosBD();
    const basesDeDatos = await controladorDeBD.obtenerBasesDeDatos() || [];
    response.render("crear-tabla", { basesDeDatos, baseDeDatosSeleccionada: request.params.selectedDatabase });
});

ruta.post("/new/:selectedDatabase/table", async (request, response) => {
    console.log(request.body);
    response.redirect("/databases");
});

module.exports = ruta;
