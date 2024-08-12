const mysql = require('mysql2/promise');

class SingletonConexion {
    /** @type {import("mysql2").Pool} */
    static instance = null;

    static async connect() {
        if (SingletonConexion.instance == null) {
            try {
                SingletonConexion.instance = mysql.createPool({
                    host: process.env.HOSTMYSQL,
                    user: process.env.USERMYSQL,
                    password: process.env.PASSWORDMYSQL,
                    database: process.env.DATABASEMYSQL,
                    port: process.env.PORTMYSQL,
                    waitForConnections: true,
                    connectionLimit: 10,
                    queueLimit: 0
                });
                console.log('Conexión CREADA a MySQL');
            } catch (error) {
                console.error('Error al crear la conexión ' + error);
                throw error;
            }
        }
        return SingletonConexion.instance;
    }

    static async disconnect() {
        if (SingletonConexion.instance != null) {
            try {
                await SingletonConexion.instance.end();
                console.log('Conexión cerrada de MySQL');
            } catch (error) {
                console.error('Error al cerrar la conexión');
            }
        }
    }
}

module.exports = SingletonConexion;
