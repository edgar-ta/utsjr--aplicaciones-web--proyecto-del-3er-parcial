const { format } = require("mysql2");
const ConexionBD = require("./ConexionBD");
const SingletonConexion = require("./singleton-conexion");

/**
 * @typedef {Object} ColumnDescriptor 
 * @property {string} nombreDeColumna
 * @property {"int" | "double" | "date" | "varchar"} tipoDeDato
 * @property {"PRI" | "UNI" | "MUL" | "" } tipoDeclave
 * @property {1 | 0} esAutoincrementable
 * @property {1 | 0} esNulo
 */

class BasesDeDatosBD extends ConexionBD {
  constructor() {
    super();
  }

  async prueba() {
    try {
      await this.conectar();
    } catch (error) {
      console.error(sql);
    } finally {
      await this.desconectar();
    }
  }

  /**
   * 
   * @returns {Promise<string[]>}
   */
  async obtenerBasesDeDatos() {
    let basesDeDatos = [];
    try {
      const sql = "SELECT nombre FROM base_de_datos;";
      await SingletonConexion.conectar();

      [ basesDeDatos ] = await SingletonConexion.instancia.execute(sql);
      basesDeDatos = basesDeDatos.map(object => object.nombre)

    } catch (error) {
      console.log(error);
    }

    return basesDeDatos;
  }

  /**
   * 
   * @param {string} selectedDatabase 
   * @returns {Promise<string[]>}
   */
  async obtenerTablas(selectedDatabase) {
    const sql = format(`
      SELECT tabla.nombre_externo AS nombre
      FROM tabla 
      INNER JOIN base_de_datos ON tabla.base_de_datos = base_de_datos.id 
      WHERE base_de_datos.nombre = ?`,
      selectedDatabase
    );
  
    let tablas = [];
  
    try {
      await SingletonConexion.conectar();
      
      [ tablas ] = await SingletonConexion.instancia.execute(sql);
      tablas = tablas.map(object => object.nombre);
      
    } catch (error) {
      console.log(error);
    }
  
    return tablas;
  }

  /**
   * 
   * @param {string} selectedTable 
   * @returns {Promise<Object[]>}
   */
  async obtenerRegistros(selectedTable) {
    const sentenciaParaNombreDeTabla = format(`SELECT nombre_interno AS nombreDeTabla FROM tabla WHERE nombre_externo = ?`, selectedTable);
    let registros = [];

    try {
      await SingletonConexion.conectar();

      const [ [ { nombreDeTabla } ] ] = await SingletonConexion.instancia.execute(sentenciaParaNombreDeTabla);
      const sentenciaParaRegistros = `SELECT * FROM \`${nombreDeTabla}\``; // código potencialmente peligroso xd

      [ registros ] = await SingletonConexion.instancia.execute(sentenciaParaRegistros);

    } catch (error) {
      console.log(error);
    }

    return registros;
  }

  /**
   * 
   * @param {string} selectedTable 
   * @returns {Promise<ColumnDescriptor[]>}
   */
  async obtenerEsquema(selectedTable) {
    const sql = format(`
      SELECT 
          information_schema.columns.COLUMN_NAME AS nombreDeColumna, 
          information_schema.columns.DATA_TYPE AS tipoDeDato, 
          information_schema.columns.COLUMN_KEY AS tipoDeClave,
          information_schema.columns.EXTRA = "auto_increment" AS esAutoincrementable,
          information_schema.columns.IS_NULLABLE = "YES" AS esNulo
      FROM information_schema.columns
      INNER JOIN tabla ON tabla.nombre_interno = information_schema.columns.TABLE_NAME
      WHERE tabla.nombre_externo = ?
      ORDER BY ORDINAL_POSITION ASC
      ;
      `, selectedTable
    );

    let esquema = [];

    try {
      await SingletonConexion.conectar();

      [ esquema ] = await SingletonConexion.instancia.execute(sql);

    } catch (error) {
      console.log(error);
    }

    return esquema;
  }


}



module.exports = BasesDeDatosBD;
