const express = require("express");
const session = require('express-session');
const path = require("path");
const routes = require("./routes/routes");
const SingletonConexion = require("./bd/singleton-connection");

const app = express();
const port = process.env.PORT || 3_000;
const dotenv = require("dotenv");

dotenv.config();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
// Configuración de sesiones
app.use(session({
    secret: 'tu-secreto', // Cambia esto a algo más seguro
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Cambia a true si usas HTTPS
}));
const server = app.listen(port, async () => {
    console.log(`http://localhost:${port}`);

    SingletonConexion.connect();
});
// Middleware para agregar `username` a `res.locals` en todas las rutas
app.use((req, res, next) => {
    if (req.session && req.session.user) {
        res.locals.username = req.session.user.username; // Agrega el username a `res.locals`
    } else {
        res.locals.username = null; // No hay usuario en sesión
    }
    next();
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

app.use((error, request, response, next) => {
    response.status(500);
    response.render("error", { error });
});
