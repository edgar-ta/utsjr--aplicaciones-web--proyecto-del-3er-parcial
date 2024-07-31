require("dotenv").config();
class ConexionBD {
  constructor() {
    this.conexion = null;
    this.mysql = require("mysql2/promise");
  }

  async conectar() {
    try {
      this.conexion = await this.mysql.createConnection({
        host: process.env.HOSTMYSQL,
        user: process.env.USERMYSQL,
        password: process.env.PASSWORDMYSQL,
        database: process.env.DATABASEMYSQL,
        port: process.env.PORTMYSQL,
      });
      console.log("Conexion creada a MySQL");
    } catch (error) {
      console.error("Error al crear la conexion " + error);
    }
  }

  async desconectar() {
    if (this.conexion != null) {
      try {
        await this.conexion.end();
        console.log("Conexion cerrada de MySQL");
      } catch (error) {
        console.error("Error al cerrar la conexion");
      }
    }
  }
}

module.exports = ConexionBD;

require("dotenv").config();
class ConexionBD {
  constructor() {
    this.conexion = null;
    this.mysql = require("mysql2/promise");
  }

  async conectar() {
    try {
      this.conexion = await this.mysql.createConnection({
        host: process.env.HOSTMYSQL,
        user: process.env.USERMYSQL,
        password: process.env.PASSWORDMYSQL,
        database: process.env.DATABASEMYSQL,
        port: process.env.PORTMYSQL,
      });
      console.log("Conexion creada a MySQL");
    } catch (error) {
      console.error("Error al crear la conexion " + error);
    }
  }

  async desconectar() {
    if (this.conexion != null) {
      try {
        await this.conexion.end();
        console.log("Conexion cerrada de MySQL");
      } catch (error) {
        console.error("Error al cerrar la conexion");
      }
    }
  }
}

module.exports = ConexionBD;
