const express = require("express");
const path = require("path");
const routes = require("./routes/routes");
const SingletonConexion = require("./bd/singleton-connection");

const app = express();
const port = process.env.PORT || 3_000;
const dotenv = require("dotenv");

dotenv.config();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const server = app.listen(port, async () => {
    console.log(`http://localhost:${port}`);

    SingletonConexion.connect();
});

process.once("SIGINT", async () => {
    server.close(async () => {
        console.log("Cerrando la conexión");
        SingletonConexion.disconnect();
    });
});

app.on("SIGINT", async () => {
    server.close(async () => {
        console.log("Cerrando la conexión");
        SingletonConexion.disconnect();
    });
})

app.use("/web", express.static(path.join(__dirname, "/web")));

app.use("/", routes);
