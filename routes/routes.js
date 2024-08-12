const ruta = require("express").Router();
const DatabaseController = require("../bd/database-controller.js");
const TableDataValidation = require("../lib/table-data-validation.js");
const DashboardUtilities = require("../lib/dashboard-utilities.js");
const bcrypt = require('bcryptjs');
const { getRecordVisualizationPayload } = require("../lib/record-visualization.js");
const { externalColumnTypeToSpanish } = require("../lib/single-function-files/external-column-type-to-spanish.js");
const SingletonConexion = require('../bd/singleton-connection.js'); // Asegúrate de que la ruta sea correcta

async function ensureValidDatabase(request, response, next) {
    try {
        const selectedDatabase = request.params.selectedDatabase;
        const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(selectedDatabase);
        if (databaseIdentifier === null) {
            console.log(databaseIdentifier);
            return next(new Error(`La url ingresada no es válida`));
        }
        const databaseId = databaseIdentifier.id;
        const databaseExists = await DatabaseController.databaseExistsWithId(databaseId);
        if (!databaseExists) {
            console.log("La base de datos indicada no existe");
            return next(new Error(`La base de datos indicada en la URL no existe`));
        }
        next();
    } catch (error) {
        next(error);
    }
}

async function ensureValidTable(request, response, next) {
    try {
        const selectedTable = request.params.selectedTable;
        const tableIdentifier = DashboardUtilities.parseTableIdentifier(selectedTable);
        if (tableIdentifier === null) {
            return next(new Error(`La url ingresada no es válida`));
        }
        const tableInternalName = tableIdentifier.internalName;
        const tableExists = await DatabaseController.tableExists(tableInternalName);
        if (!tableExists) {
            console.log(`Internal name: ${tableInternalName}`);
            console.log(`External name: ${tableIdentifier.externalName}`);
            return next(new Error(`La tabla indicada en la URL no existe`));
        }
        return next();
    } catch (error) {
        return next(error);
    }
}

async function ensureValidColumn(request, response, next) {
    try {
        const selectedTable = request.params.selectedTable;
        const tableIdentifier = DashboardUtilities.parseTableIdentifier(selectedTable);
        const selectedColumn = request.params.selectedColumn;

        await DatabaseController
            .columnExists(tableIdentifier, selectedColumn)
            .then((exists) => {
                if (!exists) return Promise.reject(new Error("The given column doesn't exist in the table"));
                return true;
            });

        return next();
    } catch (error) {
        return next(error);
    }
}

function ensureValidId(request, response, next) {
    const selectedId = Number.parseInt(request.params.selectedId);
    if (Number.isNaN(selectedId) || selectedId <= 0) {
        return next(new Error("The given record id is not valid"));
    }
    return next();
}

function ensureValidType(request, response, next) {
    /** @type {import("../bd/database-controller.js").ExternalColumnType} */
    const selectedType = request.params.selectedType;

    /** @type {import("../bd/database-controller.js").ExternalColumnType[]} */
    const validTypes = [ "integer", "decimal", "date", "text" ];
    if (!validTypes.includes(selectedType)) {
        return next(new Error("The specified type is not recognized"));
    }
    return next();
}
// Middleware para agregar `username` y `role` a `res.locals` en todas las rutas
ruta.use((req, res, next) => {
    console.log("req.session:", req.session);
    if (req.session && req.session.user) {
        res.locals.username = req.session.user.username; // Agrega el username a `res.locals`
        res.locals.role = req.session.user.role; // Agrega el role a `res.locals`
    } else {
        res.locals.username = null; // No hay usuario en sesión
        res.locals.role = null; // No hay rol
    }
    next();
});

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); // Usuario autenticado, continuar con la solicitud
    } else {
        res.redirect('/login'); // Usuario no autenticado, redirigir al login
    }
};
ruta.get("/", async (request, response) => {
  response.render("login");
});
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.redirect('/login');
    }
};
// Ruta para mostrar los usuarios y gestionar accesos
ruta.get('/access', isAdmin, async (req, res, next) => {
    try {
        const connection = await SingletonConexion.connect();
        const [users] = await connection.query('SELECT id, username, role FROM users');
        await SingletonConexion.disconnect();
        res.render('access', { users });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// Ruta para actualizar el rol de un usuario
ruta.post('/access/:id', isAdmin, async (req, res, next) => {
    try {
        const userId = req.params.id;
        const newRole = req.body.role;

        const connection = await SingletonConexion.connect();
        await connection.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
    } catch (error) {
        console.log(error);
        next(error);
    }
    // No cierres la conexión aquí si quieres mantener el pool abierto
});
ruta.get("/databases", async (request, response, next) => {
    try {
        console.log(response.locals.role);
        const dashboardPayload = await DashboardUtilities.getDashboardPayload(null);

        response.render("dashboard", {
            getUrlForDatabase: DashboardUtilities.getUrlForDatabase,
            getUrlForTable: DashboardUtilities.getUrlForTable,
            dashboardPayload,
            recordVisualizationPayload: null,
            dashboardMode: "preview"
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/databases/:selectedDatabase", ensureValidDatabase, async (request, response) => {
    try {
        const dashboardPayload = await DashboardUtilities.getDashboardPayload(request.params.selectedDatabase);

        response.render("dashboard", {
            getUrlForDatabase: DashboardUtilities.getUrlForDatabase,
            getUrlForTable: DashboardUtilities.getUrlForTable,
            dashboardPayload,
            recordVisualizationPayload: null,
            dashboardMode: "tables"
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/databases/:selectedDatabase/:selectedTable", ensureValidDatabase, ensureValidTable, async (request, response, next) => {
    try {
        const dashboardPayload = await DashboardUtilities.getDashboardPayload(request.params.selectedDatabase);
        const recordVisualizationPayload = await getRecordVisualizationPayload(request.params.selectedTable);

        response.render("dashboard", {
            getUrlForDatabase: DashboardUtilities.getUrlForDatabase,
            getUrlForTable: DashboardUtilities.getUrlForTable,
            externalColumnTypeToSpanish,
            dashboardPayload,
            recordVisualizationPayload,
            dashboardMode: "records"
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/new/:selectedDatabase/table", async (request, response, next) => {
    try {
        const dashboardPayload = await DashboardUtilities.getDashboardPayload(request.params.selectedDatabase);
        response.render("crear-tabla", { 
            getUrlForDatabase: DashboardUtilities.getUrlForDatabase,
            getUrlForTable: DashboardUtilities.getUrlForTable,
            dashboardPayload,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/new/database", async (request, response, next) => {
    try {
        await DatabaseController.createDatabase().then((insertionId) => {
            console.log(`The insertion id was: ${insertionId}`);
            response.redirect(`/databases/${insertionId}`);
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.post("/new/:selectedDatabase/table", ensureValidDatabase, async (request, response, next) => {
    try {
        const selectedDatabase = request.params.selectedDatabase;
        const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(selectedDatabase);
        // DatabaseController.getDatabaseId();

        const truthyValue = "on";
        const falsyValue = "none";

        const userData = TableDataValidation.getUserDataFromRequestBody(request, truthyValue, falsyValue);

        let validationResult = await TableDataValidation.validateUserData(userData, truthyValue, falsyValue);
        if (validationResult !== null) {
            console.log(validationResult);
            response.redirect(`/new/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/table`);
            return;
        }

        const enhancedUserData = TableDataValidation.enhanceUserData(userData);
        const tableScheme = TableDataValidation.buildTableScheme(enhancedUserData);

        validationResult = TableDataValidation.validateTableScheme(tableScheme);
        if (validationResult !== null) {
            console.log(validationResult);
            response.redirect(`/new/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/table`);
            return;
        }

        const externalTableName = enhancedUserData.tableName;
        await DatabaseController.createTable(externalTableName, databaseIdentifier, tableScheme);

        console.log("The table was created successfully");

        response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}`);
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/delete/:selectedDatabase", ensureValidDatabase, async (request, response, next) => {
    try {
        const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
        await DatabaseController
            .deleteDatabase(databaseIdentifier.id)
            .then((results) => {
                console.log(results);
                console.log(`The database ${databaseIdentifier.name} was deleted correctly`);
                response.redirect("/databases");
            })
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/delete/:selectedDatabase/:selectedTable", ensureValidDatabase, ensureValidTable, async (request, response, next) => {
    const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    try {

        await DatabaseController.deleteTable(databaseIdentifier, tableIdentifier);

        response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}`);
    } catch (error) {
        // response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/${DashboardUtilities.getUrlForTable(tableIdentifier)}`);
        next(error);
    }
});

ruta.get("/delete/:selectedDatabase/:selectedTable/:selectedColumn", ensureValidDatabase, ensureValidTable, ensureValidColumn, async (request, response, next) => {
    const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    const columnName = request.params.selectedColumn;
    try {
        await DatabaseController
            .deleteColumn(tableIdentifier, columnName);
            
        response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/${DashboardUtilities.getUrlForTable(tableIdentifier)}`);

    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/rename/database", async (request, response, next) => {
    const databaseId = request.query.databaseId;
    const name = request.query.name;

    try {
        DatabaseController
            .renameDatabase(databaseId, name)
            .then(() => {
                response.send({ ok: true, error: null });
            })
            .catch((error) => {
                response.send({ ok: false, error });
            })
            ;
    } catch (error) {
        response.send({ ok: false, error });
        console.log(error);
        next(error);
    }
});

ruta.get("/rename/database/:selectedTable/:selectedColumn", ensureValidTable, ensureValidColumn, async (request, response, next) => {
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    const selectedColumn = request.params.selectedColumn;
    const name = request.query.name;
    try {
        DatabaseController
            .renameColumn(tableIdentifier, selectedColumn, name)
            .then(() => {
                response.send({ ok: true, error: null });
            })
            .catch((error) => {
                response.send({ ok: false, error });
            });
    } catch (error) {
        response.send({ ok: false, error });
        console.log(error);
        next(error);
    }
});

ruta.post("/insert/:selectedDatabase/:selectedTable", ensureValidDatabase, ensureValidTable, async (request, response, next) => {
    const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    const payload = TableDataValidation.ensureArray(request.body.payload).map(value => value === ''? null: value);
    try {
        DatabaseController
            .insertRecord(tableIdentifier.internalName, payload)
            .then(() => {
                response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/${DashboardUtilities.getUrlForTable(tableIdentifier)}`);
            });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/delete-record/:selectedDatabase/:selectedTable/:selectedId", ensureValidDatabase, ensureValidTable, ensureValidId, async (request, response, next) => {
    const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    const selectedId = Number.parseInt(request.params.selectedId);
    
    try {
        DatabaseController
            .deleteRecord(tableIdentifier.internalName, selectedId)
            .then(() => {
                response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/${DashboardUtilities.getUrlForTable(tableIdentifier)}`);
            });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.post("/update-record/:selectedDatabase/:selectedTable/:selectedId", ensureValidDatabase, ensureValidTable, ensureValidId, async (request, response, next) => {
    const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    const selectedId = Number.parseInt(request.params.selectedId);
    const payload = TableDataValidation.ensureArray(request.body.payload).map(value => value === ''? null: value);
    
    try {
        DatabaseController
            .updateRecord(tableIdentifier.internalName, selectedId, payload)
            .then(() => {
                response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/${DashboardUtilities.getUrlForTable(tableIdentifier)}`);
            });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

ruta.get("/new-column/:selectedDatabase/:selectedTable/:selectedType", ensureValidDatabase, ensureValidTable, ensureValidType, async (request, response, next) => {
    const databaseIdentifier = DashboardUtilities.parseDatabaseIdentifier(request.params.selectedDatabase);
    const tableIdentifier = DashboardUtilities.parseTableIdentifier(request.params.selectedTable);
    const selectedType = request.params.selectedType;
    
    try {
        DatabaseController
            .addColumn(tableIdentifier.internalName, selectedType)
            .then(() => {
                response.redirect(`/databases/${DashboardUtilities.getUrlForDatabase(databaseIdentifier)}/${DashboardUtilities.getUrlForTable(tableIdentifier)}`);
            });
    } catch (error) {
        console.log(error);
        next(error);
    }
});


ruta.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/index'); // Redirige al índice si ya está autenticado
    }
    res.render('login');
});

// Ruta para manejar el inicio de sesión
ruta.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const connection = await SingletonConexion.connect();
        const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0 || !await bcrypt.compare(password, rows[0].password)) {
            return res.status(401).send('Credenciales incorrectas');
        }

        req.session.user = {
            id: rows[0].id,
            username: rows[0].username,
            role: rows[0].role // Asegúrate de guardar el rol
        };

        // Aquí se muestra la sesión en la consola después de iniciar sesión
        console.log(req.session.user);

        res.redirect('/index'); // Redirige al índice después del inicio de sesión
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).send('Error en el servidor');
    }
});
// Mostrar el formulario de registro
ruta.get('/register', (req, res) => {
    res.render('register');
});

// Manejar el registro
ruta.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    const connection = await SingletonConexion.connect();
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.redirect('/register');
    }
});
// Cerrar sesión
ruta.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Ruta protegida, usa el middleware de autenticación
ruta.get('/index', authMiddleware, (req, res) => {
    res.render('index'); // Asegúrate de tener una vista 'index.ejs'
});

// Ruta para mostrar la lista de usuarios (solo administradores)
ruta.get('/access', authMiddleware, async (req, res) => {
    if (req.session.user.role !== 'admin') {
        return res.redirect('/'); // Redirige si no es admin
    }

    try {
        const connection = await SingletonConexion.connect();
        const [users] = await connection.query('SELECT id, username, role FROM users');
        res.render('access', { users }); // Asegúrate de tener una vista `access.ejs`
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).send('Error en el servidor');
    }
});

// Ruta para actualizar el rol de un usuario (solo administradores)
ruta.post('/update-role', authMiddleware, async (req, res) => {
    if (req.session.user.role !== 'admin') {
        return res.redirect('/'); // Redirige si no es admin
    }

    const { userId, newRole } = req.body;

    try {
        const connection = await SingletonConexion.connect();
        await connection.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
        res.redirect('/access'); // Redirige de vuelta a la página de acceso
    } catch (error) {
        console.error('Error al actualizar el rol del usuario:', error);
        res.status(500).send('Error en el servidor');
    }
});
module.exports = ruta;
