const mysql = require("mysql2/promise");

class SingletonConnection {
    /** @type {import("mysql2").Pool} */
    static instance = null;

    static connect() {
        if (SingletonConnection.instance == null) {
            try {
                SingletonConnection.instance = mysql.createPool({
                  host: process.env.HOSTMYSQL,
                  user: process.env.USERMYSQL,
                  password: process.env.PASSWORDMYSQL,
                  database: process.env.DATABASEMYSQL,
                  port: process.env.PORTMYSQL,
                });
                console.log("Conexion CREADA a MySQL");
            } catch (error) {
                console.error("Error al crear la conexion " + error);
                throw error;
            }
        }
    }

    static disconnect() {
        if (SingletonConnection.instance != null) {
            try {
              SingletonConnection.instance.end();
              console.log("Conexion cerrada de MySQL");
            } catch (error) {
              console.error("Error al cerrar la conexion");
            }
        }
    }
}

module.exports = SingletonConnection;
