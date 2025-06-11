const ticket = "AC3A098B-4CD0-41AF-81A5-41284248419B"; // Asegúrate de que este ticket sea el correcto y válido para tu uso

document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("loader"); // Loader general para licitaciones

    // --- FILTRO LICITACIONES ---
    const formFiltros = document.getElementById("form-filtros");
    const btnFiltros = formFiltros.querySelector("button[type='submit']");
    const contenedorLicitaciones = document.getElementById("resultados-licitaciones");
    const paginacionContainer = document.getElementById("paginacion-licitaciones");
    const mensajeLicitaciones = document.getElementById("mensaje-licitaciones");

    // Variables para paginación
    let currentPage = 1;
    const itemsPerPage = 10;
    let filteredLicitaciones = [];

    formFiltros.addEventListener("submit", async (e) => {
        e.preventDefault();
        // Limpiar mensajes y resultados anteriores
        mensajeLicitaciones.innerHTML = "";
        contenedorLicitaciones.innerHTML = "";
        if (paginacionContainer) {
            paginacionContainer.innerHTML = "";
        }

        const fechaInput = document.getElementById("fecha").value.trim();
        const estado = document.getElementById("estado").value;

        if (!fechaInput) {
            mostrarMensaje(mensajeLicitaciones, "Por favor, ingresa una fecha.", "error");
            return;
        }

        // Validar que la fecha no sea futura
        const fechaDate = new Date(fechaInput + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Ajuste para permitir fechas de hoy
        if (fechaDate > hoy) {
            mostrarMensaje(mensajeLicitaciones, "La fecha no puede ser futura.", "error");
            return;
        }

        const fecha = formatearFecha(fechaInput);
        const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?fecha=${fecha}&ticket=${ticket}`;

        // Muestra el loader y deshabilita el botón al iniciar la búsqueda de licitaciones
        loader.style.display = "block";
        btnFiltros.disabled = true;
        btnFiltros.textContent = "Buscando...";

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error en la petición de licitaciones: ${response.status} - ${errorText}`);
                throw new Error("Error en la petición de licitaciones.");
            }

            const data = await response.json();
            const licitaciones = data.Listado || [];

            // Filtrado por estado si se seleccionó alguno
            filteredLicitaciones = estado ? licitaciones.filter(l => l.CodigoEstado === parseInt(estado)) : licitaciones;

            if (filteredLicitaciones.length === 0) {
                mostrarMensaje(mensajeLicitaciones, "No se encontraron licitaciones para la fecha y estado seleccionados.", "info");
                return;
            }

            currentPage = 1;
            mostrarPagina(currentPage);
        } catch (error) {
            console.error("Error al consultar licitaciones:", error);
            mostrarMensaje(mensajeLicitaciones, "Error al consultar las licitaciones. Es posible que la API de Mercado Público esté temporalmente fuera de servicio o que la fecha no tenga el formato esperado. Por favor, intente más tarde.", "error");
        } finally {
            // Oculta el loader y habilita el botón al finalizar la búsqueda
            loader.style.display = "none";
            btnFiltros.disabled = false;
            btnFiltros.textContent = "Filtrar"; // Restaura el texto del botón
        }
    });

    // Muestra una página específica del listado paginado
    async function mostrarPagina(page) {
        contenedorLicitaciones.innerHTML = ""; // Limpia las tarjetas de licitaciones

        // Limpia la paginación anterior si existe el contenedor
        if (paginacionContainer) {
            paginacionContainer.innerHTML = "";
        }

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginaItems = filteredLicitaciones.slice(start, end);

        if (paginaItems.length === 0) {
            mostrarMensaje(mensajeLicitaciones, "No hay licitaciones en esta página para mostrar.", "info");
            return;
        }

        // Mostrar licitaciones con proveedores adjudicados
        await mostrarLicitacionesConProveedores(paginaItems);

        // Mostrar controles de paginación
        mostrarControlesPaginacion(page);
    }

    // Control paginación: con números, primero, último, anterior y siguiente
    function mostrarControlesPaginacion(page) {
        const totalPages = Math.ceil(filteredLicitaciones.length / itemsPerPage);
        // No muestra paginación si no hay contenedor o solo hay una página
        if (!paginacionContainer || totalPages <= 1) {
            if (paginacionContainer) paginacionContainer.innerHTML = "";
            return;
        }

        const paginacionDiv = document.createElement("nav");
        paginacionDiv.setAttribute("aria-label", "Paginación de licitaciones");
        paginacionDiv.className = "mt-3";

        const maxPagesToShow = 5;
        let startPage = Math.max(page - Math.floor(maxPagesToShow / 2), 1);
        let endPage = startPage + maxPagesToShow - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(endPage - maxPagesToShow + 1, 1);
        }

        let html = '<ul class="pagination justify-content-center">';

        // Primera página con texto visible
        html += `<li class="page-item ${page === 1 ? "disabled" : ""}">
                                <button class="page-link" id="btn-first" aria-label="Primera página">Primera</button>
                            </li>`;

        // Anterior
        html += `<li class="page-item ${page === 1 ? "disabled" : ""}">
                                <button class="page-link" id="btn-prev" aria-label="Página anterior">Anterior</button>
                            </li>`;

        // Números
        for (let i = startPage; i <= endPage; i++) {
            html += `<li class="page-item ${i === page ? "active" : ""}">
                                    <button class="page-link page-number" data-page="${i}">${i}</button>
                                </li>`;
        }

        // Siguiente
        html += `<li class="page-item ${page === totalPages ? "disabled" : ""}">
                                <button class="page-link" id="btn-next" aria-label="Página siguiente">Siguiente</button>
                            </li>`;

        // Última página con texto visible
        html += `<li class="page-item ${page === totalPages ? "disabled" : ""}">
                                <button class="page-link" id="btn-last" aria-label="Última página">Última</button>
                            </li>`;

        html += '</ul>';

        paginacionDiv.innerHTML = html;
        paginacionContainer.appendChild(paginacionDiv); // Añadir al nuevo contenedor de paginación

        // Eventos paginación
        document.getElementById("btn-first")?.addEventListener("click", () => {
            if (currentPage !== 1) {
                currentPage = 1;
                mostrarPagina(currentPage);
            }
        });

        document.getElementById("btn-prev")?.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                mostrarPagina(currentPage);
            }
        });

        document.querySelectorAll(".page-number").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const selectedPage = Number(e.target.getAttribute("data-page"));
                if (selectedPage !== currentPage) {
                    currentPage = selectedPage;
                    mostrarPagina(currentPage);
                }
            });
        });

        document.getElementById("btn-next")?.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                mostrarPagina(currentPage);
            }
        });

        document.getElementById("btn-last")?.addEventListener("click", () => {
            if (currentPage !== totalPages) {
                currentPage = totalPages;
                mostrarPagina(currentPage);
            }
        });
    }

    // Helper function to introduce a delay
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Mostrar licitaciones con info proveedores adjudicados
    async function mostrarLicitacionesConProveedores(lista) {
        const promises = lista.map(async (lic) => {
            const item = document.createElement("div");
            item.className = "list-group-item";

            const nombre = lic.Nombre || "Sin nombre";
            const codigo = lic.CodigoExterno || "N/A";
            const estado = obtenerNombreEstado(lic.CodigoEstado);
            const fechaCierre = lic.FechaCierre?.split("T")[0].split("-").reverse().join("-") || "N/A";

            item.innerHTML = `
                <strong>${nombre}</strong><br />
                <strong>Código:</strong> ${codigo}<br />
                <strong>Estado:</strong> ${estado}<br />
                <strong>Fecha de cierre:</strong> ${fechaCierre}<br />
                <div class="all-proveedores-info mt-2" aria-live="polite"></div>
                <button class="btn btn-sm btn-outline-primary mt-2 ver-detalle-btn" data-codigo="${codigo}" data-bs-toggle="modal" data-bs-target="#detalleLicitacionModal">Ver Detalle</button>
            `;

            contenedorLicitaciones.appendChild(item);

            const allProveedoresDiv = item.querySelector(".all-proveedores-info");
            const adjudicacion = lic.Adjudicacion;

            if (!adjudicacion || (Array.isArray(adjudicacion) && adjudicacion.length === 0)) {
                allProveedoresDiv.innerHTML = "<p class='text-muted'>No hay proveedores adjudicados.</p>";
                return;
            }

            // Si es un array, itera sobre cada adjudicación
            if (Array.isArray(adjudicacion)) {
                // PROCESAR PROVEEDORES EN SECUENCIA PARA EVITAR ERRORES DE LÍMITE DE TASA
                for (const adj of adjudicacion) { // Cambiamos .map por un bucle for...of
                    const rut = adj?.RutProveedor || null;
                    if (rut) {
                        try {
                            const proveedor = await obtenerProveedorPorRut(rut); // Espera la respuesta
                            allProveedoresDiv.innerHTML += `
                                <div class="border-top pt-2 mt-2">
                                    <p class='mb-0'><strong>Proveedor Adjudicado:</strong> ${proveedor.NombreEmpresa || adj.NombreProveedor || "N/A"}</p>
                                    <p class='mb-0'><strong>RUT:</strong> ${formatearRut(rut)}</p>
                                    ${adj.MontoTotal ? `<p class='mb-0'><strong>Monto:</strong> $${adj.MontoTotal.toLocaleString('es-CL')}</p>` : ''}
                                </div>
                            `;
                        } catch (error) {
                            console.warn(`Error al obtener proveedor ${rut} para licitación ${codigo}:`, error);
                            allProveedoresDiv.innerHTML += `<p class='text-muted'>No se pudo obtener información para el proveedor con RUT: ${formatearRut(rut)}</p>`;
                        }
                        await delay(100); // Añade un retraso de 100ms entre cada solicitud de proveedor
                    } else {
                        allProveedoresDiv.innerHTML += `<p class='text-muted'>Proveedor adjudicado sin RUT o con RUT inválido.</p>`;
                    }
                }
            } else if (adjudicacion.RutProveedor) { // Si no es un array pero tiene RutProveedor (caso de un solo objeto directo)
                const rut = adjudicacion.RutProveedor;
                try {
                    const proveedor = await obtenerProveedorPorRut(rut);
                    allProveedoresDiv.innerHTML = `
                        <div class="border-top pt-2 mt-2">
                            <p class='mb-0'><strong>Proveedor Adjudicado:</strong> ${proveedor.NombreEmpresa || adjudicacion.NombreProveedor || "N/A"}</p>
                            <p class='mb-0'><strong>RUT:</strong> ${formatearRut(rut)}</p>
                            ${adjudicacion.MontoTotal ? `<p class='mb-0'><strong>Monto:</strong> $${adjudicacion.MontoTotal.toLocaleString('es-CL')}</p>` : ''}
                        </div>
                    `;
                } catch (error) {
                    console.warn(`Error al obtener proveedor ${rut} para licitación ${codigo}:`, error);
                    allProveedoresDiv.innerHTML = `<p class='text-muted'>No se pudo obtener información para el proveedor con RUT: ${formatearRut(rut)}</p>`;
                }
            }
        });

        // En este caso, el Promise.all() externo sigue siendo útil para esperar
        // que todas las tarjetas de licitación se procesen, pero las llamadas internas
        // a obtenerProveedorPorRut están secuenciadas por el 'for...of' y el 'delay'.
        await Promise.all(promises);
    }

    // Formatea la fecha de AAAA-MM-DD a DDMMYYYY sin separadores
    function formatearFecha(fecha) {
        const [y, m, d] = fecha.split("-");
        return `${d}${m}${y}`;
    }

    // Obtiene nombre de estado según código
    function obtenerNombreEstado(codigo) {
        const estados = {
            5: "Desierta",
            6: "Adjudicada",
            7: "Revocada",
            8: "Suspendida",
            15: "En evaluación",
            16: "Cerrada",
            17: "Publicada",
            18: "Cancelada"
        };
        return estados[codigo] || `Desconocido (${codigo})`;
    }

    // Obtener proveedor desde API Mercado Público por RUT
    async function obtenerProveedorPorRut(rut) {
        // Formatear RUT para la API (puntos y guion, si ya no los tiene)
        const rutParaAPI = formatearRut(rut); // Usamos el formateador aquí

        const url = `https://api.mercadopublico.cl/servicios/v1/Publico/Empresas/BuscarProveedor?rutempresaproveedor=${encodeURIComponent(rutParaAPI)}&ticket=${ticket}`;

        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error al obtener proveedor: ${response.status} - ${errorText}`);
            throw new Error("Error al obtener proveedor");
        }

        const data = await response.json();

        // Si data no tiene el formato esperado o no hay resultados
        if (!data || data.Cantidad === 0 || !data.listaEmpresas || data.listaEmpresas.length === 0) {
            throw new Error("No se encontró ningún proveedor con ese RUT.");
        }

        return data.listaEmpresas[0]; // Accede al primer objeto de la lista de empresas
    }

    // Mostrar info proveedor en div
    function mostrarProveedorEnDiv(proveedor, contenedor) {
        let htmlContent = `
            <h6>Proveedor encontrado:</h6>
            <p><strong>Nombre:</strong> ${proveedor.NombreEmpresa || "N/D"}</p>
            <p><strong>Código Empresa:</strong> ${proveedor.CodigoEmpresa || "N/D"}</p>
        `;

        // Agrega Dirección solo si existe y no está vacía
        if (proveedor.Direccion && proveedor.Direccion.trim() !== "") {
            htmlContent += `<p><strong>Dirección:</strong> ${proveedor.Direccion}</p>`;
        }

        // Agrega Teléfono solo si existe y no está vacía
        if (proveedor.Telefono && proveedor.Telefono.trim() !== "") {
            htmlContent += `<p><strong>Teléfono:</strong> ${proveedor.Telefono}</p>`;
        }

        contenedor.innerHTML = htmlContent;
    }

    // --- BÚSQUEDA PROVEEDOR POR RUT (SECCIÓN INDEPENDIENTE) ---
    const formProveedor = document.getElementById("form-proveedor");
    const btnProveedor = formProveedor.querySelector("button[type='submit']");
    const resultadoDivProveedor = document.getElementById("resultado-proveedor");
    const rutInput = document.getElementById("rut");

    rutInput.addEventListener("input", (e) => {
        const rutValor = e.target.value.replace(/[^0-9kK]/g, ''); // Solo números y K
        e.target.value = formatearRut(rutValor);
    });

    formProveedor.addEventListener("submit", async (e) => {
        e.preventDefault();
        limpiarMensajeError(resultadoDivProveedor);
        resultadoDivProveedor.innerHTML = ""; // Limpia resultados anteriores

        const rutIngresado = rutInput.value.trim();
        // Limpia puntos y guión para la validación y para pasar al formateador
        const rutLimpioParaValidar = rutIngresado.replace(/\./g, "").replace(/-/g, "");

        if (!rutLimpioParaValidar) {
            mostrarMensajeError(resultadoDivProveedor, "Por favor ingresa un RUT.");
            rutInput.focus();
            return;
        }

        if (!validarRutCompleto(rutLimpioParaValidar)) {
            mostrarMensajeError(resultadoDivProveedor, "El RUT ingresado no es válido.");
            rutInput.focus();
            return;
        }

        // Deshabilita el botón y muestra el spinner al iniciar la búsqueda
        btnProveedor.disabled = true;
        btnProveedor.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span class="ms-2">Buscando...</span>
        `;

        try {
            // Pasamos el RUT limpio, y la función obtenerProveedorPorRut lo formateará internamente para la API
            const proveedor = await obtenerProveedorPorRut(rutLimpioParaValidar);
            mostrarProveedorEnDiv(proveedor, resultadoDivProveedor);
        } catch (error) {
            console.error("Error en la búsqueda de proveedor por RUT:", error);
            mostrarMensajeError(resultadoDivProveedor, "No se encontró ningún proveedor con ese RUT o hubo un error al consultar.");
        } finally {
            // Siempre habilita el botón al finalizar, el contenido del div se actualizará con el resultado o error
            btnProveedor.disabled = false;
            btnProveedor.textContent = "Buscar"; // Restaura el texto del botón
        }
    });

    // --- FUNCIONES UTILES ---

    // Mostrar mensaje accesible
    function mostrarMensaje(contenedor, mensaje, tipo = "info") {
        const mensajeExistente = contenedor.querySelector(".app-message");
        if (mensajeExistente) {
            mensajeExistente.remove();
        }

        const p = document.createElement("p");
        // Ahora el tipo "info" usará 'text-black' (negro)
        p.className = `app-message text-${tipo === "error" ? "danger" : "black"} mt-3`;
        p.setAttribute("role", tipo === "error" ? "alert" : "status");
        p.textContent = mensaje;
        contenedor.appendChild(p);
    }

    // La función limpiarMensajeError se mantiene para la sección de proveedores
    function limpiarMensajeError(contenedor) {
        const mensajeExistente = contenedor.querySelector(".app-message");
        if (mensajeExistente) {
            mensajeExistente.remove();
        }
    }

    // Mostrar mensaje de error específico para el buscador de proveedor
    function mostrarMensajeError(contenedor, mensaje) {
        limpiarMensajeError(contenedor); // Limpia cualquier mensaje anterior
        const p = document.createElement("p");
        p.className = `app-message text-danger mt-3`;
        p.setAttribute("role", "alert");
        p.textContent = mensaje;
        contenedor.appendChild(p);
    }


    // Validar RUT completo con dígito verificador
    function validarRutCompleto(rut) {
        if (rut.length < 2) return false;

        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1).toUpperCase();

        if (!/^\d+$/.test(cuerpo)) return false;

        return dv === calcularDv(cuerpo);
    }

    // Calcular dígito verificador para RUT chileno
    function calcularDv(rut) {
        let suma = 0;
        let multiplo = 2;

        for (let i = rut.length - 1; i >= 0; i--) {
            suma += parseInt(rut.charAt(i), 10) * multiplo;
            multiplo = multiplo < 7 ? multiplo + 1 : 2;
        }

        const resto = suma % 11;
        const dv = 11 - resto;

        if (dv === 11) return "0";
        if (dv === 10) return "K";

        return dv.toString();
    }

    // Formatear RUT a formato estándar con puntos y guion (XX.XXX.XXX-X)
    function formatearRut(rut) {
        let rutLimpio = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
        if (rutLimpio.length === 0) return "";

        const cuerpo = rutLimpio.slice(0, -1);
        const dv = rutLimpio.slice(-1);

        let resultado = "";
        let contador = 0;

        for (let i = cuerpo.length - 1; i >= 0; i--) {
            resultado = cuerpo.charAt(i) + resultado;
            contador++;
            if (contador === 3 && i !== 0) {
                resultado = "." + resultado;
                contador = 0;
            }
        }
        return resultado + "-" + dv;
    }

    // --- NUEVAS FUNCIONES PARA DETALLE DE LICITACIÓN EN MODAL ---

    // Obtener detalle de licitación desde API Mercado Público por CodigoExterno
    async function obtenerDetalleLicitacion(codigoExterno) {
        const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${codigoExterno}&ticket=${ticket}`;

        const detalleLicitacionLoader = document.getElementById("detalle-licitacion-loader");
        const detalleLicitacionBody = document.getElementById("detalle-licitacion-body");
        detalleLicitacionBody.innerHTML = ""; // Limpiar contenido previo
        if (detalleLicitacionLoader) { // Asegurarse de que el loader exista antes de mostrarlo
            detalleLicitacionLoader.style.display = "block"; // Mostrar loader del modal
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error al obtener detalle de licitación ${codigoExterno}: ${response.status} - ${errorText}`);
                throw new Error(`Error al obtener detalle de licitación: ${response.status}`);
            }
            const data = await response.json();
            if (data.Listado && data.Listado.length > 0) {
                return data.Listado[0]; // La API de detalle también devuelve un "Listado"
            } else {
                throw new Error("No se encontró el detalle de la licitación.");
            }
        } finally {
            if (detalleLicitacionLoader) { // Asegurarse de que el loader exista antes de ocultarlo
                detalleLicitacionLoader.style.display = "none"; // Ocultar loader del modal
            }
        }
    }

    // Mostrar información de detalle de licitación en el modal
    function mostrarDetalleEnModal(detalleLicitacion) {
        const detalleLicitacionBody = document.getElementById("detalle-licitacion-body");
        if (!detalleLicitacionBody) return; // Asegurarse de que el div existe

        // Formatear fechas para mejor lectura
        const fechaCierre = detalleLicitacion.FechaCierre?.split("T")[0].split("-").reverse().join("-") || "N/A";
        const fechaCreacion = detalleLicitacion.FechaCreacion?.split("T")[0].split("-").reverse().join("-") || "N/A";
        
        // Obtener información del comprador
        const comprador = detalleLicitacion.Comprador;
        const nombreComprador = comprador?.NombreOrganismo || "N/D";
        const rutComprador = comprador?.RutUnidad || "N/D";
        const direccionComprador = comprador?.DireccionUnidad || "N/D";
        const comunaComprador = comprador?.ComunaUnidad || "N/D";
        const regionComprador = comprador?.RegionUnidad || "N/D";

        let adjudicacionHtml = '<p>No hay información de adjudicación para esta licitación.</p>';

        // Si hay adjudicaciones y es un array con elementos
        if (Array.isArray(detalleLicitacion.Adjudicacion) && detalleLicitacion.Adjudicacion.length > 0) {
            adjudicacionHtml = `<h6>Información de Adjudicación:</h6>`;
            detalleLicitacion.Adjudicacion.forEach((adj, index) => {
                adjudicacionHtml += `
                    <div class="${index > 0 ? 'mt-3 pt-3 border-top' : ''}">
                        <p class='mb-0'><strong>Proveedor Adjudicado:</strong> ${adj.NombreProveedor || 'N/A'}</p>
                        <p class='mb-0'><strong>RUT Proveedor Adjudicado:</strong> ${adj.RutProveedor ? formatearRut(adj.RutProveedor) : 'N/A'}</p>
                        ${adj.MontoTotal ? `<p class='mb-0'><strong>Monto Total:</strong> $${adj.MontoTotal.toLocaleString('es-CL')}</p>` : ''}
                        ${adj.Fecha ? `<p class='mb-0'><strong>Fecha Adjudicación:</strong> ${adj.Fecha.split("T")[0].split("-").reverse().join("-")}</p>` : ''}
                    </div>
                `;
            });
        } else if (detalleLicitacion.Adjudicacion && detalleLicitacion.Adjudicacion.RutProveedor) { // Caso de un solo objeto de adjudicación directamente
            const adj = detalleLicitacion.Adjudicacion;
            adjudicacionHtml = `
                <h6>Información de Adjudicación:</h6>
                <div>
                    <p class='mb-0'><strong>Proveedor Adjudicado:</strong> ${adj.NombreProveedor || 'N/A'}</p>
                    <p class='mb-0'><strong>RUT Proveedor Adjudicado:</strong> ${adj.RutProveedor ? formatearRut(adj.RutProveedor) : 'N/A'}</p>
                    ${adj.MontoTotal ? `<p class='mb-0'><strong>Monto Total:</strong> $${adj.MontoTotal.toLocaleString('es-CL')}</p>` : ''}
                    ${adj.Fecha ? `<p class='mb-0'><strong>Fecha Adjudicación:</strong> ${adj.Fecha.split("T")[0].split("-").reverse().join("-")}</p>` : ''}
                </div>
            `;
        }

        detalleLicitacionBody.innerHTML = `
            <h5>${detalleLicitacion.Nombre || 'Sin Nombre'}</h5>
            <p><strong>Código Externo:</strong> ${detalleLicitacion.CodigoExterno || 'N/A'}</p>
            <p><strong>Estado:</strong> ${obtenerNombreEstado(detalleLicitacion.CodigoEstado)}</p>
            <p><strong>Fecha de Creación:</strong> ${fechaCreacion}</p>
            <p><strong>Fecha de Cierre:</strong> ${fechaCierre}</p>
            <p><strong>Descripción:</strong> ${detalleLicitacion.Descripcion || 'Sin descripción detallada.'}</p>
            
            <h6>Información del Comprador:</h6>
            <ul>
                <li><strong>Organismo:</strong> ${nombreComprador}</li>
                <li><strong>RUT:</strong> ${rutComprador}</li>
                <li><strong>Dirección:</strong> ${direccionComprador}</li>
                <li><strong>Comuna:</strong> ${comunaComprador}</li>
                <li><strong>Región:</strong> ${regionComprador}</li>
            </ul>
            ${adjudicacionHtml}
        `;
    }

    // Event listener para el modal de detalle de licitación
    const detalleLicitacionModal = document.getElementById('detalleLicitacionModal');
    if (detalleLicitacionModal) {
        detalleLicitacionModal.addEventListener('show.bs.modal', async (event) => {
            // Botón que disparó el modal
            const button = event.relatedTarget;
            // Extrae la información de los atributos data-*
            const codigoExterno = button.getAttribute('data-codigo');

            const detalleLicitacionBody = document.getElementById("detalle-licitacion-body");
            detalleLicitacionBody.innerHTML = ''; // Limpiar cualquier contenido previo

            if (codigoExterno) {
                try {
                    const detalle = await obtenerDetalleLicitacion(codigoExterno);
                    mostrarDetalleEnModal(detalle);
                } catch (error) {
                    console.error("Error al cargar el detalle de la licitación en el modal:", error);
                    detalleLicitacionBody.innerHTML = `<p class="text-danger">Error al cargar los detalles. ${error.message || 'Intente de nuevo más tarde.'}</p>`;
                }
            } else {
                detalleLicitacionBody.innerHTML = `<p class="text-danger">No se pudo obtener el código de la licitación.</p>`;
            }
        });
    }
});