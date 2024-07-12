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

app.post("/", (request, response) => {
    response.render("index-response", request.body);
    console.log(request.body);
});

app.use("/web", express.static(path.join(__dirname, "/web")));
