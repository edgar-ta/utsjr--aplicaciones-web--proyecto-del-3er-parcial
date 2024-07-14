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
	(NULL, 1, "Algo xd", ""),
    (NULL, 1, "Algo mas xd", "")
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
