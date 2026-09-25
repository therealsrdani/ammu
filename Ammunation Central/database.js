const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "data.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let datos;

function guardar() {
    fs.writeFileSync(dataFile, JSON.stringify(datos, null, 2), "utf8");
}

function cargar() {
    if (fs.existsSync(dataFile)) {
        datos = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } else {
        datos = {
            empleados: [],
            productos: [],
            formularios: []
        };
    }

    // Crear empleado inicial
    if (datos.empleados.length === 0) {
        datos.empleados.push({
            id: 1,
            usuario: "admin",
            password: bcrypt.hashSync("admin123", 10),
            nombre: "Administrador",
            rango: "Gerente"
        });
    }

    // Crear productos iniciales
    if (datos.productos.length === 0) {
        datos.productos.push(
            {
                id: 1,
                nombre: "Pistola",
                categoria: "Armas",
                precio: 500,
                stock: 10
            },
            {
                id: 2,
                nombre: "Munición",
                categoria: "Munición",
                precio: 50,
                stock: 100
            },
            {
                id: 3,
                nombre: "Chaleco",
                categoria: "Protección",
                precio: 300,
                stock: 15
            }
        );
    }

    guardar();
}

cargar();

module.exports = {
    datos,
    guardar
};