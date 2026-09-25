const listaProductos = document.getElementById("listaProductos");

function escaparHtml(valor) {
    return String(valor).replace(/[&<>'"]/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        "\"": "&quot;"
    })[caracter]);
}

async function cargarProductos() {
    try {
        const respuesta = await fetch("/api/productos-publicos");
        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los productos.");
        }

        const productos = await respuesta.json();
        listaProductos.innerHTML = productos.length > 0
            ? productos.map(producto => `
                <article class="tarjeta">
                    <span class="tarjeta-categoria">${escaparHtml(producto.categoria || "General")}</span>
                    <h3>${escaparHtml(producto.nombre)}</h3>
                    <p>${Number(producto.precio).toFixed(2)} €</p>
                    <small>${producto.stock > 0 ? `${producto.stock} disponibles` : "Agotado"}</small>
                </article>
            `).join("")
            : '<p class="estado-productos">No hay productos disponibles.</p>';
    } catch (error) {
        listaProductos.innerHTML = '<p class="estado-productos error">No se pudieron cargar los productos.</p>';
    }
}

cargarProductos();