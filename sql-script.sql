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
