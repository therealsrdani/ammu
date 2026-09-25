const titulo = document.getElementById("titulo");

const contenido = document.getElementById("contenido");

const empleadoInfo =
    document.getElementById("empleadoInfo");

let empleadoActual = null;

const permisosPorRango = {
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

function tienePermiso(permiso) {
    if (!empleadoActual || !empleadoActual.rango) {
        return false;
    }

    const permisos = permisosPorRango[empleadoActual.rango] || [];
    return permisos.includes(permiso);
}

function mostrarErrorPanel(mensaje) {
    contenido.innerHTML = `
        <div class="card estado-error">
            <h2>No se puede abrir esta sección</h2>
            <p>${mensaje}</p>
        </div>
    `;
}

async function obtenerJson(url, opciones) {
    const respuesta = await fetch(url, opciones);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo completar la operación.");
    }

    return datos;
}

async function comprobarSesion() {

    const respuesta =
        await fetch("/api/sesion");

    if (!respuesta.ok) {
        const paginaActual = window.location.pathname;
        const destino = paginaActual.includes("/public/")
            ? "./login.html"
            : "/public/login.html";

        window.location.href = destino;
        return;
    }

    const datos = await respuesta.json();
    empleadoActual = datos.empleado;

    empleadoInfo.innerHTML = `
        <strong>${datos.empleado.nombre}</strong>
        <br>
        ${datos.empleado.rango}
    `;

    document.querySelectorAll("[data-permission]").forEach(boton => {
        boton.hidden = !tienePermiso(boton.dataset.permission);
    });

    if (datos.empleado.passwordTemporal) {
        mostrarCambioClave();
        return;
    }

    mostrarInicio();
}

function mostrarSeccion(seccion) {

    if (seccion === "inicio") {
        mostrarInicio();
    }

    if (seccion === "stock") {
        mostrarStock();
    }

    if (seccion === "productos") {
        mostrarProductos();
    }

    if (seccion === "formularios") {
        mostrarFormularios();
    }

    if (seccion === "empleados") {
        mostrarEmpleados();
    }

}

async function mostrarCambioClave() {
    titulo.textContent = "Cambiar contraseña";

    const requierePasswordActual = Boolean(empleadoActual && !empleadoActual.passwordTemporal);

    contenido.innerHTML = `
        <div class="card">
            <h2>Primera vez en el sistema</h2>
            <p>Debes cambiar tu contraseña para continuar.</p>

            <form id="cambiarPasswordForm" class="form-grid">
                ${requierePasswordActual ? `
                    <div class="form-group">
                        <label>Contraseña actual</label>
                        <input type="password" id="passwordActual" placeholder="Contraseña actual" required>
                    </div>
                ` : ""}

                <div class="form-group">
                    <label>Nueva contraseña</label>
                    <input type="password" id="passwordNueva" placeholder="Nueva contraseña" required>
                </div>

                <div class="form-group">
                    <label>Confirmar contraseña</label>
                    <input type="password" id="confirmarPassword" placeholder="Repite la nueva contraseña" required>
                </div>

                <div class="full">
                    <button class="action-button" type="submit">Guardar contraseña</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById("cambiarPasswordForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const passwordActualInput = document.getElementById("passwordActual");
        const passwordActual = passwordActualInput ? passwordActualInput.value : "";
        const passwordNueva = document.getElementById("passwordNueva").value;
        const confirmarPassword = document.getElementById("confirmarPassword").value;

        const respuesta = await fetch("/api/empleados/cambiar-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                passwordActual,
                passwordNueva,
                confirmarPassword
            })
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            alert(data.error || "No se pudo cambiar la contraseña.");
            return;
        }

        alert(data.mensaje || "Contraseña actualizada correctamente.");
        empleadoActual.passwordTemporal = false;
        mostrarInicio();
    });
}

/* -------------------------
   INICIO
------------------------- */

function mostrarInicio() {

    titulo.textContent = "Inicio";

    contenido.innerHTML = `

        <div class="card">

            <h2>
                Panel de gestión
            </h2>

            <p>
                Bienvenido al panel del comercio.
            </p>

        </div>

    `;

}

/* -------------------------
   STOCK
------------------------- */

async function mostrarStock() {

    titulo.textContent = "Stock";

    let productos;
    try {
        productos = await obtenerJson("/api/productos");
    } catch (error) {
        mostrarErrorPanel(error.message);
        return;
    }

    let filas = "";

    productos.forEach(producto => {

        filas += `

            <tr>

                <td>
                    ${producto.nombre}
                </td>

                <td>
                    ${producto.categoria}
                </td>

                <td>
                    ${producto.stock}
                </td>

                <td>

                    <div class="stock-buttons">

                        <button
                            onclick="modificarStock(
                                ${producto.id},
                                1
                            )"
                            ${tienePermiso("editarStock") ? "" : "disabled"}
                        >
                            +1
                        </button>

                        <button
                            onclick="modificarStock(
                                ${producto.id},
                                -1
                            )"
                            ${tienePermiso("editarStock") ? "" : "disabled"}
                        >
                            -1
                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

    contenido.innerHTML = `

        <div class="card">

            <h2>
                Stock
            </h2>

            <p>
                Gestiona las cantidades disponibles.
            </p>

            <div class="table-container">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Producto
                            </th>

                            <th>
                                Categoría
                            </th>

                            <th>
                                Cantidad
                                    "verEmpleados", // Cambiar Gerente a Jefe
                                    "crearEmpleado",
                                    "verProductos",
                                    "crearProductos",
                                    "eliminarProductos",
                                    "verStock",
                                    "editarStock",
                                    "verFormularios",
                                    "crearFormulario"

                                Jefe: [
                                Modificar
                            </th>

                        </tr>

                    </thead>

                                Encargado: [
                    <tbody>

                        ${filas}

                    </tbody>

                </table>
                                const rango = prompt("Rango (Jefe, Encargado, Empleado):", empleado.rango);
            </div>
                                                <option value="Encargado">Encargado</option>
                                                <option value="Empleado">Empleado</option>
                                                <option value="Jefe">Jefe</option>
    `;

}


/* -------------------------
   MODIFICAR STOCK
------------------------- */

async function modificarStock(
    id,
    cantidad
) {

    await fetch(
        `/api/stock/${id}`,
        {
            method: "PATCH",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                cantidad
            })
        }
    );


    mostrarStock();

}


/* -------------------------
   PRODUCTOS
------------------------- */

async function mostrarProductos() {

    titulo.textContent = "Productos";

    let productos;
    try {
        productos = await obtenerJson("/api/productos");
    } catch (error) {
        mostrarErrorPanel(error.message);
        return;
    }

    let filas = "";

    productos.forEach(producto => {

        filas += `

            <tr>

                <td>
                    ${producto.nombre}
                </td>

                <td>
                    ${producto.categoria}
                </td>

                <td>
                    ${producto.precio}
                </td>

                <td>
                    ${producto.stock}
                </td>

                <td>

                    <button
                        class="action-button danger"
                        onclick="eliminarProducto(${producto.id})"
                        ${tienePermiso("eliminarProductos") ? "" : "disabled"}
                    >
                        Eliminar
                    </button>

                </td>

            </tr>

        `;

    });

    const formularioProducto = tienePermiso("crearProductos") ? `
        <form id="productoForm" class="form-grid">
            <div class="form-group">
                <label>Nombre</label>
                <input id="productoNombre" required>
            </div>

            <div class="form-group">
                <label>Categoría</label>
                <input id="productoCategoria">
            </div>

            <div class="form-group">
                <label>Precio</label>
                <input type="number" id="productoPrecio" step="0.01">
            </div>

            <div class="form-group">
                <label>Stock inicial</label>
                <input type="number" id="productoStock" value="0">
            </div>

            <div class="full">
                <button class="action-button" type="submit">Añadir producto</button>
            </div>
        </form>
    ` : "";

    contenido.innerHTML = `

        <div class="card">

            <h2>
                Productos
            </h2>

            ${formularioProducto}

            <div class="table-container">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Nombre
                            </th>

                            <th>
                                Categoría
                            </th>

                            <th>
                                Precio
                            </th>

                            <th>
                                Stock
                            </th>

                            <th>
                                Acción
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${filas}

                    </tbody>

                </table>

            </div>

        </div>

    `;

    const productoForm = document.getElementById("productoForm");
    if (productoForm) {
        productoForm.addEventListener("submit", crearProducto);
    }

}


/* -------------------------
   CREAR PRODUCTO
------------------------- */

async function crearProducto(event) {

    event.preventDefault();


    const nombre =
        document
            .getElementById("productoNombre")
            .value;


    const categoria =
        document
            .getElementById("productoCategoria")
            .value;


    const precio =
        document
            .getElementById("productoPrecio")
            .value;


    const stock =
        document
            .getElementById("productoStock")
            .value;


    await fetch(
        "/api/productos",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                nombre,

                categoria,

                precio,

                stock

            })

        }
    );


    mostrarProductos();

}


/* -------------------------
   ELIMINAR PRODUCTO
------------------------- */

async function eliminarProducto(id) {

    if (!confirm(
        "¿Eliminar este producto?"
    )) {

        return;

    }


    await fetch(
        `/api/productos/${id}`,
        {
            method: "DELETE"
        }
    );


    mostrarProductos();

}


/* -------------------------
   FORMULARIOS
------------------------- */

async function mostrarFormularios() {

    titulo.textContent =
        "Formularios";


    let formularios;
    try {
        formularios = await obtenerJson("/api/formularios");
    } catch (error) {
        mostrarErrorPanel(error.message);
        return;
    }


    let filas = "";


    formularios.forEach(formulario => {

        filas += `

            <tr>

                <td>
                    ${formulario.tipo}
                </td>

                <td>
                    ${formulario.descripcion}
                </td>

                <td>
                    ${formulario.empleado}
                </td>

                <td>
                    ${formulario.fecha}
                </td>

            </tr>

        `;

    });


    contenido.innerHTML = `

        <div class="card">

            <h2>
                Formularios
            </h2>


            <form
                id="formularioInterno"
                class="form-grid"
            >

                <div class="form-group">

                    <label>
                        Tipo
                    </label>

                    <select
                        id="formTipo"
                    >

                        <option>
                            General
                        </option>

                        <option>
                            Incidencia
                        </option>

                        <option>
                            Solicitud
                        </option>

                        <option>
                            Registro
                        </option>

                    </select>

                </div>


                <div class="form-group full">

                    <label>
                        Descripción
                    </label>

                    <textarea
                        id="formDescripcion"
                    ></textarea>

                </div>


                <div class="full">

                    <button
                        type="submit"
                        class="action-button"
                    >
                        Guardar formulario
                    </button>

                </div>

            </form>


            <div class="table-container">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Tipo
                            </th>

                            <th>
                                Descripción
                            </th>

                            <th>
                                Empleado
                            </th>

                            <th>
                                Fecha
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${filas}

                    </tbody>

                </table>

            </div>

        </div>

    `;


    document
        .getElementById(
            "formularioInterno"
        )
        .addEventListener(
            "submit",
            guardarFormulario
        );

}


/* -------------------------
   GUARDAR FORMULARIO
------------------------- */

async function guardarFormulario(event) {

    event.preventDefault();


    const tipo =
        document
            .getElementById("formTipo")
            .value;


    const descripcion =
        document
            .getElementById("formDescripcion")
            .value;


    await fetch(
        "/api/formularios",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                tipo,

                descripcion

            })

        }
    );


    mostrarFormularios();

}


/* -------------------------
   EMPLEADOS
------------------------- */

async function mostrarEmpleados() {

    titulo.textContent = "Empleados";

    let empleados;
    try {
        empleados = await obtenerJson("/api/empleados");
    } catch (error) {
        mostrarErrorPanel(error.message);
        return;
    }

    const permisosHtml = Object.entries(permisosPorRango).map(([rango, permisos]) => `
        <div class="permiso-card">
            <h3>${rango}</h3>
            <ul>
                ${permisos.map(permiso => `<li>${permiso}</li>`).join("")}
            </ul>
        </div>
    `).join("");

    let filas = "";

    empleados.forEach(empleado => {

        const puedeEditar = tienePermiso("crearEmpleado");
        const estadoClave = empleado.passwordTemporal
            ? '<span class="estado-clave temporal">Clave temporal</span>'
            : '<span class="estado-clave ok">Clave actualizada</span>';

        filas += `

            <tr>

                <td>
                    ${empleado.nombre}
                </td>

                <td>
                    ${empleado.usuario}
                </td>

                <td>
                    ${empleado.rango}
                </td>

                <td>
                    ${estadoClave}
                </td>

                <td>
                    ${puedeEditar ? `
                        <button class="action-button" onclick="editarEmpleado(${empleado.id})">Editar</button>
                        <button class="action-button danger" onclick="eliminarEmpleado(${empleado.id})">Borrar</button>
                    ` : ""}
                </td>

            </tr>

        `;

    });

    const formularioEmpleado = tienePermiso("crearEmpleado") ? `
        <form id="empleadoForm" class="form-grid" style="margin-top: 20px;">
            <div class="form-group">
                <label>Nombre</label>
                <input id="nuevoEmpleadoNombre" required>
            </div>

            <div class="form-group">
                <label>Usuario</label>
                <input id="nuevoEmpleadoUsuario" required>
            </div>

            <div class="form-group">
                <label>Rango</label>
                <select id="nuevoEmpleadoRango">
                    <option value="Vendedor">Vendedor</option>
                    <option value="Recepcionista">Recepcionista</option>
                    <option value="Gerente">Gerente</option>
                </select>
            </div>

            <div class="form-group">
                <label>Contraseña</label>
                <input type="password" id="nuevoEmpleadoPassword" required>
            </div>

            <div class="full">
                <button class="action-button" type="submit">Añadir empleado</button>
            </div>
        </form>
    ` : "";

    contenido.innerHTML = `

        <div class="card">

            <h2>
                Empleados
            </h2>

            <p>
                Empleados registrados en el comercio.
            </p>

            <div class="permisos-grid">
                ${permisosHtml}
            </div>

            ${formularioEmpleado}

            <div class="table-container">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Nombre
                            </th>

                            <th>
                                Usuario
                            </th>

                            <th>
                                Rango
                            </th>

                            <th>
                                Estado clave
                            </th>

                            <th>
                                Acciones
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${filas}

                    </tbody>

                </table>

            </div>

        </div>

    `;

    const empleadoForm = document.getElementById("empleadoForm");
    if (empleadoForm) {
        empleadoForm.addEventListener("submit", crearEmpleado);
    }

}

async function editarEmpleado(id) {
    const respuesta = await fetch("/api/empleados");
    const empleados = await respuesta.json();
    const empleado = empleados.find(item => item.id === id);

    if (!empleado) {
        return;
    }

    const nombre = prompt("Nombre del empleado:", empleado.nombre);
    if (nombre === null) {
        return;
    }

    const usuario = prompt("Usuario:", empleado.usuario);
    if (usuario === null) {
        return;
    }

    const rango = prompt("Rango (Gerente, Vendedor, Recepcionista):", empleado.rango);
    if (rango === null) {
        return;
    }

    const nuevaPassword = prompt("Nueva contraseña (opcional, deja vacío para mantener la actual):", "");
    if (nuevaPassword === null) {
        return;
    }

    const payload = {
        nombre: nombre.trim(),
        usuario: usuario.trim(),
        rango: rango.trim(),
        password: nuevaPassword.trim()
    };

    const updateResponse = await fetch(`/api/empleados/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await updateResponse.json();

    if (!updateResponse.ok) {
        alert(data.error || "No se pudo actualizar el empleado.");
        return;
    }

    alert(data.mensaje || "Empleado actualizado.");
    mostrarEmpleados();
}

async function eliminarEmpleado(id) {
    if (!confirm("¿Seguro que quieres borrar este empleado?")) {
        return;
    }

    const respuesta = await fetch(`/api/empleados/${id}`, {
        method: "DELETE"
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
        alert(data.error || "No se pudo borrar el empleado.");
        return;
    }

    alert(data.mensaje || "Empleado borrado.");
    mostrarEmpleados();
}

async function crearEmpleado(event) {
    event.preventDefault();

    const nombre = document.getElementById("nuevoEmpleadoNombre").value.trim();
    const usuario = document.getElementById("nuevoEmpleadoUsuario").value.trim();
    const rango = document.getElementById("nuevoEmpleadoRango").value;
    const password = document.getElementById("nuevoEmpleadoPassword").value;

    const respuesta = await fetch("/api/empleados", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre,
            usuario,
            rango,
            password
        })
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
        alert(data.error || "No se pudo crear el empleado.");
        return;
    }

    alert(`Empleado ${data.usuario} creado correctamente.`);
    mostrarEmpleados();
}


/* -------------------------
   LOGOUT
------------------------- */

async function cerrarSesion() {

    await fetch(
        "/api/logout",
        {
            method: "POST"
        }
    );


    const paginaActual = window.location.pathname;
    const destino = paginaActual.includes("/public/")
        ? "./index.html"
        : "/public/index.html";

    window.location.href = destino;

}