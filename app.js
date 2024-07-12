const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3_000;

app.set("view engine", "ejs");

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/databases/new", (_, response) => {
    response.render("crear-tabla");
});

app.post("/", (request, response) => {
});

app.use("/web", express.static(path.join(__dirname, "/web")));
