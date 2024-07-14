const ConectarBD = require("./ConexionBD");

class ProductoBD extends ConectarBD{
    constructor(){
        super();
    }
    async Prueba(){
        try {
            await this.conctarMySql();
            await this.cerrarConexion();
        } catch (error) {
            console.error(sql);
        }
    }
}
module.exports=ProductoBD;