const mysql = require("mysql2/promise");

class SingletonConexion {
    /** @type {import("mysql2/typings/mysql/lib/Connection").Connection} */
    static instancia = null;

    static async conectar() {
        if (SingletonConexion.instancia == null) {
            try {
                SingletonConexion.instancia = await mysql.createConnection({
                  host: process.env.HOSTMYSQL,
                  user: process.env.USERMYSQL,
                  password: process.env.PASSWORDMYSQL,
                  database: process.env.DATABASEMYSQL,
                  port: process.env.PORTMYSQL,
                });
                console.log("Conexion CREADA a MySQL");
            } catch (error) {
                console.error("Error al crear la conexion " + error);
            }
        }
    }

    static async desconectar() {
        if (SingletonConexion.instancia != null) {
            try {
              await SingletonConexion.instancia.end();
              console.log("Conexion cerrada de MySQL");
            } catch (error) {
              console.error("Error al cerrar la conexion");
            }
        }
    }
}

module.exports = SingletonConexion;
