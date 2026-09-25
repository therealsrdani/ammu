const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");

const { datos, guardar } = require("./database");

const app = express();
const PORT = 3000;

const PERMISOS_POR_RANGO = {
    Jefe: [
        "verEmpleados",
        "crearEmpleado",
        "verProductos",
        "crearProductos",
        "eliminarProductos",
        "verStock",
        "editarStock",
        "verFormularios",
        "crearFormulario"
    ],
    Encargado: [
        "verProductos",
        "crearProductos",
        "verStock",
        "editarStock",
        "verFormularios",
        "crearFormulario"
    ],
    Empleado: [
        "verProductos",
        "verFormularios",
        "crearFormulario"
    ]
};

/* -------------------------
   CONFIGURACIÓN
------------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "clave-secreta-comercio-juego",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 8,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        }
    })
);

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            error: "La petición contiene JSON no válido."
        });
    }

    next(error);
});

/* -------------------------
   ARCHIVOS PÚBLICOS
    La carpeta public es la única superficie web pública.
------------------------- */

app.use(express.static(path.join(__dirname, "public")));
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

function comprobarPermiso(permiso) {
    return (req, res, next) => {
        if (!req.session.empleado) {
            return res.status(401).json({
                error: "No tienes una sesión activa."
            });
        }

        const permisos = PERMISOS_POR_RANGO[req.session.empleado.rango] || [];

        if (!permisos.includes(permiso)) {
            return res.status(403).json({
                error: "No tienes permisos para esta acción."
            });
        }

        next();
    };
}

/* -------------------------
   LOGIN
------------------------- */

app.post("/api/login", async (req, res) => {

    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({
            error: "Introduce usuario y contraseña."
        });
    }

    const empleado = datos.empleados.find(
        empleado => empleado.usuario.toLowerCase() === String(usuario).trim().toLowerCase()
    );

    if (!empleado) {
        return res.status(401).json({
            error: "Usuario o contraseña incorrectos."
        });
    }

    const correcto = await bcrypt.compare(
        String(password),
        empleado.password
    );

    if (!correcto) {
        return res.status(401).json({
            error: "Usuario o contraseña incorrectos."
        });
    }

    req.session.empleado = {
        id: empleado.id,
        usuario: empleado.usuario,
        nombre: empleado.nombre,
        rango: empleado.rango,
        passwordTemporal: Boolean(empleado.passwordTemporal)
    };

    res.json({
        correcto: true,
        requiereCambio: Boolean(empleado.passwordTemporal)
    });
});

/* -------------------------
   COMPROBAR SESIÓN
------------------------- */

app.get("/api/sesion", (req, res) => {

    if (!req.session.empleado) {
        return res.status(401).json({
            autenticado: false
        });
    }

    res.json({
        autenticado: true,
        empleado: req.session.empleado
    });
});

/* -------------------------
   CERRAR SESIÓN
------------------------- */

app.post("/api/logout", (req, res) => {

    req.session.destroy(() => {
        res.json({
            correcto: true
        });
    });

});

/* -------------------------
   MIDDLEWARE EMPLEADO
------------------------- */

function comprobarSesion(req, res, next) {

    if (!req.session.empleado) {
        return res.status(401).json({
            error: "No tienes una sesión activa."
        });
    }

    next();
}

function comprobarEmpleado(req, res, next) {
    comprobarSesion(req, res, () => {
        if (req.session.empleado.passwordTemporal) {
            return res.status(403).json({
                error: "Debes cambiar tu contraseña antes de continuar."
            });
        }

        next();
    });
}

/* -------------------------
   PRODUCTOS
------------------------- */

app.get("/api/productos", comprobarEmpleado, comprobarPermiso("verProductos"), (req, res) => {

    const productos = [...datos.productos]
        .sort((a, b) => b.id - a.id);

    res.json(productos);
});

app.post("/api/productos", comprobarEmpleado, comprobarPermiso("crearProductos"), (req, res) => {

    const {
        nombre,
        categoria,
        precio,
        stock
    } = req.body;

    const nombreNormalizado = String(nombre || "").trim();
    const precioNormalizado = Number(precio);
    const stockNormalizado = Number(stock);

    if (!nombreNormalizado) {
        return res.status(400).json({
            error: "El producto necesita un nombre."
        });
    }

    if (!Number.isFinite(precioNormalizado) || precioNormalizado < 0 ||
        !Number.isFinite(stockNormalizado) || stockNormalizado < 0) {
        return res.status(400).json({
            error: "El precio y el stock deben ser números válidos y no negativos."
        });
    }

    const nuevoId = datos.productos.length > 0
        ? Math.max(...datos.productos.map(p => p.id)) + 1
        : 1;

    const producto = {
        id: nuevoId,
        nombre: nombreNormalizado,
        categoria: String(categoria || "").trim(),
        precio: precioNormalizado,
        stock: stockNormalizado
    };

    datos.productos.push(producto);

    guardar();

    res.json({
        correcto: true,
        id: producto.id
    });
});

app.delete("/api/productos/:id", comprobarEmpleado, comprobarPermiso("eliminarProductos"), (req, res) => {

    const id = Number(req.params.id);

    const posicion = datos.productos.findIndex(
        producto => producto.id === id
    );

    if (posicion === -1) {
        return res.status(404).json({
            error: "Producto no encontrado."
        });
    }

    datos.productos.splice(posicion, 1);

    guardar();

    res.json({
        correcto: true
    });
});

/* -------------------------
   STOCK
------------------------- */

app.patch("/api/stock/:id", comprobarEmpleado, comprobarPermiso("editarStock"), (req, res) => {

    const cantidad = Number(req.body.cantidad);

    if (!Number.isFinite(cantidad)) {
        return res.status(400).json({
            error: "Cantidad incorrecta."
        });
    }

    const id = Number(req.params.id);

    const producto = datos.productos.find(
        producto => producto.id === id
    );

    if (!producto) {
        return res.status(404).json({
            error: "Producto no encontrado."
        });
    }

    producto.stock += cantidad;

    if (producto.stock < 0) {
        producto.stock = 0;
    }

    guardar();

    res.json({
        correcto: true,
        stock: producto.stock
    });
});

/* -------------------------
   FORMULARIOS
------------------------- */

app.get("/api/formularios", comprobarEmpleado, comprobarPermiso("verFormularios"), (req, res) => {

    const formularios = [...datos.formularios]
        .sort((a, b) => b.id - a.id);

    res.json(formularios);
});

app.post("/api/formularios", comprobarEmpleado, comprobarPermiso("crearFormulario"), (req, res) => {

    const {
        tipo,
        descripcion
    } = req.body;

    const nuevoId = datos.formularios.length > 0
        ? Math.max(...datos.formularios.map(f => f.id)) + 1
        : 1;

    const formulario = {
        id: nuevoId,
        tipo: tipo || "General",
        descripcion: descripcion || "",
        empleado: req.session.empleado.usuario,
        fecha: new Date().toLocaleString("es-ES")
    };

    datos.formularios.push(formulario);

    guardar();

    res.json({
        correcto: true,
        id: formulario.id
    });
});

/* -------------------------
   EMPLEADOS
------------------------- */

app.get("/api/empleados", comprobarEmpleado, comprobarPermiso("verEmpleados"), (req, res) => {

    const empleados = datos.empleados
        .map(empleado => ({
            id: empleado.id,
            usuario: empleado.usuario,
            nombre: empleado.nombre,
            rango: empleado.rango,
            passwordTemporal: Boolean(empleado.passwordTemporal)
        }))
        .sort((a, b) => b.id - a.id);

    res.json(empleados);
});

app.put("/api/empleados/:id", comprobarEmpleado, comprobarPermiso("crearEmpleado"), async (req, res) => {

    const id = Number(req.params.id);
    const { usuario, nombre, rango, password } = req.body;

    const empleado = datos.empleados.find(item => item.id === id);

    if (!empleado) {
        return res.status(404).json({
            error: "Empleado no encontrado."
        });
    }

    const usuarioNormalizado = String(usuario || empleado.usuario).trim();
    const nombreNormalizado = String(nombre || empleado.nombre).trim();
    const rangoNormalizado = String(rango || empleado.rango).trim();

    if (!usuarioNormalizado || !nombreNormalizado) {
        return res.status(400).json({
            error: "Usuario y nombre son obligatorios."
        });
    }

    if (!PERMISOS_POR_RANGO[rangoNormalizado]) {
        return res.status(400).json({
            error: "El rango indicado no es válido."
        });
    }

    const conflicto = datos.empleados.some(item =>
        item.id !== id && item.usuario.toLowerCase() === usuarioNormalizado.toLowerCase()
    );

    if (conflicto) {
        return res.status(409).json({
            error: "Ya existe un empleado con ese nombre de usuario."
        });
    }

    empleado.usuario = usuarioNormalizado;
    empleado.nombre = nombreNormalizado;
    empleado.rango = rangoNormalizado;

    if (password && String(password).trim()) {
        empleado.password = bcrypt.hashSync(String(password).trim(), 10);
        empleado.passwordTemporal = true;
    }

    guardar();

    res.json({
        correcto: true,
        mensaje: "Empleado actualizado correctamente."
    });
});

app.post("/api/empleados", comprobarEmpleado, comprobarPermiso("crearEmpleado"), async (req, res) => {

    const { usuario, nombre, rango, password } = req.body;

    const usuarioNormalizado = String(usuario || "").trim();
    const nombreNormalizado = String(nombre || "").trim();
    const passwordNormalizado = String(password || "").trim();
    const rangoNormalizado = String(rango || "Vendedor").trim();

    if (!usuarioNormalizado || !nombreNormalizado || !passwordNormalizado) {
        return res.status(400).json({
            error: "Usuario, nombre y contraseña son obligatorios."
        });
    }

    if (!PERMISOS_POR_RANGO[rangoNormalizado]) {
        return res.status(400).json({
            error: "El rango indicado no es válido."
        });
    }

    const existe = datos.empleados.some(
        empleado => empleado.usuario.toLowerCase() === usuarioNormalizado.toLowerCase()
    );

    if (existe) {
        return res.status(409).json({
            error: "Ya existe un empleado con ese nombre de usuario."
        });
    }

    const nuevoId = datos.empleados.length > 0
        ? Math.max(...datos.empleados.map(empleado => empleado.id)) + 1
        : 1;

    const nuevoEmpleado = {
        id: nuevoId,
        usuario: usuarioNormalizado,
        password: bcrypt.hashSync(passwordNormalizado, 10),
        nombre: nombreNormalizado,
        rango: rangoNormalizado,
        passwordTemporal: true
    };

    datos.empleados.push(nuevoEmpleado);
    guardar();

    res.json({
        correcto: true,
        id: nuevoEmpleado.id,
        usuario: nuevoEmpleado.usuario,
        rango: nuevoEmpleado.rango
    });
});

app.delete("/api/empleados/:id", comprobarEmpleado, comprobarPermiso("crearEmpleado"), (req, res) => {

    const id = Number(req.params.id);

    if (req.session.empleado.id === id) {
        return res.status(400).json({
            error: "No puedes eliminar tu propio usuario."
        });
    }

    const posicion = datos.empleados.findIndex(empleado => empleado.id === id);

    if (posicion === -1) {
        return res.status(404).json({
            error: "Empleado no encontrado."
        });
    }

    if (datos.empleados.length === 2) {
        return res.status(400).json({
            error: "Debes dejar al menos un usuario activo en el sistema."
        });
    }

    datos.empleados.splice(posicion, 1);
    guardar();

    res.json({
        correcto: true,
        mensaje: "Empleado eliminado correctamente."
    });
});

app.post("/api/empleados/cambiar-password", comprobarSesion, async (req, res) => {
    const { passwordActual, passwordNueva, confirmarPassword } = req.body;

    const empleado = datos.empleados.find(
        item => item.id === req.session.empleado.id
    );

    if (!empleado) {
        return res.status(404).json({
            error: "Empleado no encontrado."
        });
    }

    const nuevaPassword = String(passwordNueva || "").trim();
    const confirmar = String(confirmarPassword || "").trim();

    if (!nuevaPassword || !confirmar) {
        return res.status(400).json({
            error: "Debes introducir la nueva contraseña y confirmarla."
        });
    }

    if (nuevaPassword.length < 4) {
        return res.status(400).json({
            error: "La nueva contraseña debe tener al menos 4 caracteres."
        });
    }

    if (nuevaPassword !== confirmar) {
        return res.status(400).json({
            error: "La confirmación de la contraseña no coincide."
        });
    }

    if (!empleado.passwordTemporal) {
        const actual = String(passwordActual || "").trim();

        if (!actual) {
            return res.status(400).json({
                error: "Debes introducir la contraseña actual."
            });
        }

        const esCorrecta = await bcrypt.compare(actual, empleado.password);

        if (!esCorrecta) {
            return res.status(401).json({
                error: "La contraseña actual es incorrecta."
            });
        }
    }

    empleado.password = bcrypt.hashSync(nuevaPassword, 10);
    empleado.passwordTemporal = false;

    req.session.empleado.passwordTemporal = false;

    guardar();

    res.json({
        correcto: true,
        mensaje: "Contraseña actualizada correctamente."
    });
});

app.get("/api/permisos", comprobarEmpleado, (req, res) => {
    res.json({
        permisos: PERMISOS_POR_RANGO[req.session.empleado.rango] || []
    });
});

/* -------------------------
   PRODUCTOS PÚBLICOS
------------------------- */

app.get("/api/productos-publicos", (req, res) => {

    const productos = datos.productos.map(producto => ({
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        precio: producto.precio,
        stock: producto.stock
    }));

    res.json(productos);
});

/* -------------------------
   INICIAR SERVIDOR
------------------------- */

app.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log("      AMMUNATION CENTRAL");
    console.log("=================================");
    console.log("");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("");
    console.log("Usuario de prueba: admin");
    console.log("Contraseña: admin123");
    console.log("");
});