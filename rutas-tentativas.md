# Rutas tentativas


```
/			Ruta principal (landing page)

/about-us		Una sección para hablar sobre nosotros xd

/app			Para la aplicación como tal;
			debería haber un formulario
			de inicio de sesión

/app/log-in		Para validar el inicio de sesión;
			de tipo post

/app/log-out		Para cerrar sesión

/app/sign-in		Para registrar un nuevo usuario;
			de tipo get

/app/sign-in		Para validar el nuevo usuario;
			de tipo post

/app/:sign-out		Para eliminar la cuenta de un usuario

/app/:user		La bandeja de entrada el usuario
			(es decir, la lista de sus 
			bases de datos, y tablas y así)


```

## Bases de Datos

```

/app/:user/view/:database		Ver una base de datos en
					particular

/app/:user/create/:database		Para crear una nueva base de datos

/app/:user/create/:database		Para validar la nueva base de datos

/app/:user/edit/:database		Para validar la edición de la base de datos;
					se me ocurre que la edición se pueda llevar a cabo
					directamente en la página de la visualización de la
					base de datos

/app/:user/delete/:database		Eliminar una base de datos

```

## Tablas

```
/app/:user/view/:database/:table	Ver una tabla en 
					particular

/app/:user/create/:database/:table	Similar a la ruta de las bases de datos;
					aquí se crearía una nueva tabla

/app/:user/create/:database/:table	Similar a la ruta de las bases de datos; de tipo post

/app/:user/edit/:database/:table	Similar a la ruta de las bases de datos

/app/:user/delete/:database/:table	Similar a la ruta de las bases de datos
```

## Registros

```
/app/:user/create/:database/:table/:record	Similar a la ruta de las bases de datos; de tipo post

/app/:user/edit/:database/:table/:record	Similar a la ruta de las bases de datos

/app/:user/edit-all/:database/:table/:record	Similar a la ruta de las bases de datos, pero sirve
						para editar múltiples registros al mismo tiempo

/app/:user/delete/:database/:table/:record	Similar a la ruta de las bases de datos

/app/:user/delete-all/:database/:table/:record	Similar a la ruta de las bases de datos, pero sirve para 
						eliminar múltiples registros al mismo tiempo
```