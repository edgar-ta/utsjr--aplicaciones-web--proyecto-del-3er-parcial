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

app.use((req, res, next) => {
    res.locals.username = req.session.user ? req.session.user.username : null;
    res.locals.role = req.session.user ? req.session.user.role : null;
    next();
});
const server = app.listen(port, async () => {
    console.log(`http://localhost:${port}`);

    SingletonConexion.connect();
});

app.use("/web", express.static(path.join(__dirname, "/web")));

app.use("/", routes);

app.use((error, request, response, next) => {
    response.status(500);
    response.render("error", { error });
});
// Configuración del middleware global

app.on("SIGINT", async () => {
    server.close(async () => {
        console.log("Cerrando la conexión");
       await SingletonConexion.disconnect();
       process.exit(0);
    });
})

