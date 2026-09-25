const formulario = document.getElementById("loginForm");

const error = document.getElementById("error");

formulario.addEventListener("submit", async (event) => {

    event.preventDefault();

    error.textContent = "";

    const usuario =
        document.getElementById("usuario").value.trim();

    const password =
        document.getElementById("password").value;

    try {

        const respuesta = await fetch(
            "/api/login",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    usuario,
                    password
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            error.textContent =
                datos.error ||
                "No se ha podido iniciar sesión.";

            return;
        }

        const paginaActual = window.location.pathname;
        const destino = paginaActual.includes("/public/")
            ? "./empleados.html"
            : "/public/empleados.html";

        window.location.href = destino;

    } catch (e) {

        error.textContent =
            "No se puede conectar con el servidor.";

    }

});