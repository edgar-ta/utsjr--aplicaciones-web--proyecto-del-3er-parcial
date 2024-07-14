const ruta = require("express").Router();
const ProductoBD = require("../bd/ProductoBD");

ruta.get("/", async(req,res)=>{
    const productobd= new ProductoBD();
    await productobd.Prueba();
    res.render("crearbase");
});

module.exports=ruta;