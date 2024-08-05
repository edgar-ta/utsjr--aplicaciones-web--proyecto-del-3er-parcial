DROP DATABASE IF EXISTS proyecto_del_parcial_3;
CREATE DATABASE proyecto_del_parcial_3;
USE proyecto_del_parcial_3;

DROP TABLE IF EXISTS base_de_datos;
CREATE TABLE base_de_datos (
	id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    PRIMARY KEY(id)
)
ENGINE = InnoDB
;

DROP TABLE IF EXISTS tabla;
CREATE TABLE tabla (
	id INT NOT NULL AUTO_INCREMENT,
    base_de_datos INT NOT NULL,
    nombre_externo VARCHAR(200) NOT NULL,
    nombre_interno VARCHAR(36) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(base_de_datos) REFERENCES base_de_datos(id)
		ON UPDATE RESTRICT
        ON DELETE RESTRICT
)
ENGINE = InnoDB
;

INSERT INTO base_de_datos VALUES (NULL, "Base de datos 1"), (NULL, "Base de datos 2");
INSERT INTO tabla VALUES 
	(NULL, 1, "Algo xd", "abc1"),
    (NULL, 1, "Algo mas xd", "abc2")
;

DROP TABLE IF EXISTS abc1;
CREATE TABLE abc1 (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    valor TEXT NOT NULL
)
ENGINE = InnoDB
;

INSERT INTO abc1 VALUES (NULL, "a"), (NULL, "b"), (NULL, "c");

DROP TABLE IF EXISTS abc2;
CREATE TABLE abc2 (
	id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    valor TEXT NOT NULL
)
ENGINE = InnoDB
;

INSERT INTO abc2 VALUES (NULL, "a"), (NULL, "b"), (NULL, "c"), (NULL, "d"), (NULL, "e"), (NULL, "f");

SELECT 
    information_schema.columns.COLUMN_NAME AS nombreDeColumna, 
    information_schema.columns.DATA_TYPE AS tipoDeDato, 
    information_schema.columns.COLUMN_KEY AS claveDeColumna,
    information_schema.columns.EXTRA AS datosExtra
FROM information_schema.columns
INNER JOIN tabla ON tabla.nombre_interno = information_schema.columns.TABLE_NAME
ORDER BY ORDINAL_POSITION ASC
;

SELECT nombre_interno AS nombreDeTabla FROM tabla WHERE nombre_externo = "Algo xd";

SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE INFORMATION_SCHEMA.TABLE_CONSTRAINTS.TABLE_NAME = "tabla" LIMIT 100;

-- constraint_name, constraint_type and table_name




SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE LIMIT 50;

SELECT 
	information_schema.key_column_usage.referenced_column_name,
    information_schema.key_column_usage.referenced_table_name
FROM information_schema.key_column_usage
WHERE 
	information_schema.key_column_usage.column_name = 'base_de_datos' AND
    information_schema.key_column_usage.table_name = 'tabla'
    ;

-- constraint_name, column_name, referenced_table_name and referenced_column_name


SELECT 
	information_schema.columns.COLUMN_NAME AS name, 
	information_schema.columns.DATA_TYPE AS dataType, 
	information_schema.columns.COLUMN_KEY = "PRI" AS isPrimaryKey,
	information_schema.columns.COLUMN_key = "UNI" as isUnique,
	information_schema.columns.EXTRA = "auto_increment" AS isAutoincrementable,
	information_schema.columns.IS_NULLABLE = "YES" AS isNullable,
    information_schema.columns.COLUMN_NAME IN (
		SELECT DISTINCT (information_schema.key_column_usage.column_name)
		FROM information_schema.key_column_usage
		INNER JOIN information_schema.table_constraints
		ON information_schema.key_column_usage.constraint_name = information_schema.table_constraints.constraint_name
		WHERE 
			information_schema.key_column_usage.table_name = 'tabla' AND 
			information_schema.table_constraints.constraint_type = "FOREIGN KEY"
    ) AS isForeignKey
FROM information_schema.columns
WHERE information_schema.columns.TABLE_NAME = 'tabla'
ORDER BY ORDINAL_POSITION ASC;


SELECT DISTINCT (information_schema.key_column_usage.column_name)
FROM information_schema.key_column_usage
INNER JOIN information_schema.table_constraints
ON information_schema.key_column_usage.constraint_name = information_schema.table_constraints.constraint_name
WHERE 
	information_schema.key_column_usage.table_name = '93ea89c7-633b-42ac-8bbe-ff792761efbc' AND 
    information_schema.table_constraints.constraint_type = "FOREIGN KEY"
;















SELECT * FROM information_schema.columns LIMIT 10;


SELECT 
	information_schema.columns.column_name AS columnName,
    information_schema.columns.table_name AS tableName,
    information_schema.key_column_usage.referenced_table_name AS referencedTableName,
    information_schema.key_column_usage.referenced_column_name AS referencedColumnName,
    information_schema.table_constraints.constraint_type AS constraintType
FROM information_schema.columns
INNER JOIN information_schema.key_column_usage
ON information_schema.key_column_usage.column_name = information_schema.columns.column_name
INNER JOIN information_schema.table_constraints 
ON information_schema.table_constraints.constraint_name = information_schema.key_column_usage.constraint_name
WHERE information_schema.columns.table_name = '93ea89c7-633b-42ac-8bbe-ff792761efbc';

SELECT 
	INFORMATION_SCHEMA.COLUMNS.COLUMN_NAME, 
    INFORMATION_SCHEMA.COLUMNS.TABLE_NAME,
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE.referenced_table,
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE.referenced_column_name,
    INFORMATION_SCHEMA.TABLE_CONSTRAINTS.constraint_type
FROM INFORMATION_SCHEMA.COLUMNS
LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE
ON INFORMATION_SCHEMA.KEY_COLUMN_USAGE.column_name = INFORMATION_SCHEMA.COLUMNS.column_name
LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS
ON INFORMATION_SCHEMA.TABLE_CONSTRAINTS.constraint_name = INFORMATION_SCHEMA.KEY_COLUMN_USAGE.constraint_name
WHERE INFORMATION_SCHEMA.COLUMNS.table_name = 'abc1';
;

SELECT 
  tabla.nombre_externo AS nombreExterno,
  tabla.nombre_interno AS nombreInterno
FROM tabla 
INNER JOIN base_de_datos ON tabla.base_de_datos = base_de_datos.id
INNER JOIN information_schema.columns ON tabla.nombre_interno = information_schema.columns.TABLE_NAME
WHERE information_schema.columns.COLUMN_KEY = "PRI"
;

      SELECT 
        information_schema.key_column_usage.referenced_table_name AS referencedTable,
        information_schema.key_column_usage.referenced_column_name AS referencedColumn
      FROM information_schema.key_column_usage
      WHERE 
        information_schema.key_column_usage.column_name = 'aaaafa' AND
        information_schema.key_column_usage.table_name = '93ea89c7-633b-42ac-8bbe-ff792761efbc' AND
        NOT isnull(information_schema.key_column_usage.referenced_table_name)
        ;

















