const express = require("express");
const path = require("path");
const routes = require("./routes/BdRutas");
const SingletonConexion = require("./bd/singleton-conexion");

const app = express();
const port = process.env.PORT || 3_000;

app.set("view engine", "ejs");

const server = app.listen(port, async () => {
    console.log(`http://localhost:${port}`);

    await SingletonConexion.conectar();
});

process.once("SIGINT", async () => {
    server.close(async () => {
        console.log("Cerrando la conexión");
        await SingletonConexion.desconectar();
    });
});

app.on("SIGINT", async () => {
    server.close(async () => {
        console.log("Cerrando la conexión");
        await SingletonConexion.desconectar();
    });
})

app.use("/web", express.static(path.join(__dirname, "/web")));

app.use("/", routes);
