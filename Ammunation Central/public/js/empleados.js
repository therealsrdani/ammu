const titulo = document.getElementById("titulo");

const contenido = document.getElementById("contenido");

const empleadoInfo =
    document.getElementById("empleadoInfo");


/* -------------------------
   COMPROBAR SESIÓN
------------------------- */

async function comprobarSesion() {

    const respuesta =
        await fetch("/api/sesion");


    if (!respuesta.ok) {

        window.location.href =
            "login.html";

        return;

    }


    const datos =
        await respuesta.json();


    empleadoInfo.innerHTML = `
        <strong>${datos.empleado.nombre}</strong>
        <br>
        ${datos.empleado.rango}
    `;

}


comprobarSesion();


/* -------------------------
   CAMBIAR SECCIÓN
------------------------- */

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


    const respuesta =
        await fetch("/api/productos");


    const productos =
        await respuesta.json();


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
                        >
                            +1
                        </button>

                        <button
                            onclick="modificarStock(
                                ${producto.id},
                                -1
                            )"
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
                            </th>

                            <th>
                                Modificar
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


    const respuesta =
        await fetch("/api/productos");


    const productos =
        await respuesta.json();


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
                        onclick="eliminarProducto(
                            ${producto.id}
                        )"
                    >
                        Eliminar
                    </button>

                </td>

            </tr>

        `;

    });


    contenido.innerHTML = `

        <div class="card">

            <h2>
                Productos
            </h2>


            <form
                id="productoForm"
                class="form-grid"
            >

                <div class="form-group">

                    <label>
                        Nombre
                    </label>

                    <input
                        id="productoNombre"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Categoría
                    </label>

                    <input
                        id="productoCategoria"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Precio
                    </label>

                    <input
                        type="number"
                        id="productoPrecio"
                        step="0.01"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Stock inicial
                    </label>

                    <input
                        type="number"
                        id="productoStock"
                        value="0"
                    >

                </div>


                <div class="full">

                    <button
                        class="action-button"
                        type="submit"
                    >
                        Añadir producto
                    </button>

                </div>

            </form>


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


    document
        .getElementById("productoForm")
        .addEventListener(
            "submit",
            crearProducto
        );

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


    const respuesta =
        await fetch(
            "/api/formularios"
        );


    const formularios =
        await respuesta.json();


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

    titulo.textContent =
        "Empleados";


    const respuesta =
        await fetch(
            "/api/empleados"
        );


    const empleados =
        await respuesta.json();


    let filas = "";


    empleados.forEach(empleado => {

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

            </tr>

        `;

    });


    contenido.innerHTML = `

        <div class="card">

            <h2>
                Empleados
            </h2>

            <p>
                Empleados registrados en el comercio.
            </p>


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

                        </tr>

                    </thead>


                    <tbody>

                        ${filas}

                    </tbody>

                </table>

            </div>

        </div>

    `;

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


    window.location.href =
        "index.html";

}