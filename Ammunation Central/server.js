const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");

const { datos, guardar } = require("./database");

const app = express();
const PORT = 3000;


/* -------------------------
   CONFIGURACIÓN
------------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "clave-secreta-comercio-juego",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);


/* -------------------------
   ARCHIVOS PÚBLICOS
------------------------- */

app.use(express.static(path.join(__dirname, "public")));


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
        empleado => empleado.usuario === usuario
    );

    if (!empleado) {
        return res.status(401).json({
            error: "Usuario o contraseña incorrectos."
        });
    }

    const correcto = await bcrypt.compare(
        password,
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
        rango: empleado.rango
    };

    res.json({
        correcto: true
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

function comprobarEmpleado(req, res, next) {

    if (!req.session.empleado) {
        return res.status(401).json({
            error: "No tienes una sesión activa."
        });
    }

    next();
}


/* -------------------------
   PRODUCTOS
------------------------- */

app.get("/api/productos", comprobarEmpleado, (req, res) => {

    const productos = [...datos.productos]
        .sort((a, b) => b.id - a.id);

    res.json(productos);
});


app.post("/api/productos", comprobarEmpleado, (req, res) => {

    const {
        nombre,
        categoria,
        precio,
        stock
    } = req.body;

    if (!nombre) {
        return res.status(400).json({
            error: "El producto necesita un nombre."
        });
    }

    const nuevoId = datos.productos.length > 0
        ? Math.max(...datos.productos.map(p => p.id)) + 1
        : 1;

    const producto = {
        id: nuevoId,
        nombre: nombre,
        categoria: categoria || "",
        precio: Number(precio) || 0,
        stock: Number(stock) || 0
    };

    datos.productos.push(producto);

    guardar();

    res.json({
        correcto: true,
        id: producto.id
    });
});


app.delete("/api/productos/:id", comprobarEmpleado, (req, res) => {

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

app.patch("/api/stock/:id", comprobarEmpleado, (req, res) => {

    const cantidad = Number(req.body.cantidad);

    if (Number.isNaN(cantidad)) {
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

    // Evitar stock negativo
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

app.get("/api/formularios", comprobarEmpleado, (req, res) => {

    const formularios = [...datos.formularios]
        .sort((a, b) => b.id - a.id);

    res.json(formularios);
});


app.post("/api/formularios", comprobarEmpleado, (req, res) => {

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

app.get("/api/empleados", comprobarEmpleado, (req, res) => {

    const empleados = datos.empleados
        .map(empleado => ({
            id: empleado.id,
            usuario: empleado.usuario,
            nombre: empleado.nombre,
            rango: empleado.rango
        }))
        .sort((a, b) => b.id - a.id);

    res.json(empleados);
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