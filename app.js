const ticket = "AC3A098B-4CD0-41AF-81A5-41284248419B";

document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('form-filtros').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fechaInput = document.getElementById('fecha').value.trim();
    const estado = document.getElementById('estado').value.trim();

    if (!fechaInput) {
      alert('Por favor ingresa una fecha');
      return;
    }

    const fecha = formatearFecha(fechaInput);
    // No agregamos estado en la URL porque genera error 500
    const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?fecha=${fecha}&ticket=${ticket}`;

    console.log('URL de consulta:', url);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error en la petición');

      const data = await response.json();
      const licitaciones = data.Listado || [];

      // Filtrar por estado en frontend si se seleccionó uno
      let licitacionesFiltradas = licitaciones;
      if (estado !== "") {
        const estadoNum = parseInt(estado);
        licitacionesFiltradas = licitaciones.filter(lic => lic.CodigoEstado === estadoNum);
      }

      if (licitacionesFiltradas.length === 0) {
        alert('No se encontraron licitaciones para los filtros seleccionados.');
        return;
      }

      mostrarLicitaciones(licitacionesFiltradas);
    } catch (error) {
      console.error('Error al consultar API:', error);
      alert('Ocurrió un error al consultar las licitaciones');
    }
  });

  // Función para formatear fecha yyyy-mm-dd a ddmmyyyy
  function formatearFecha(fechaInput) {
    const [year, month, day] = fechaInput.split('-');
    return `${day}${month}${year}`;
  }

  function obtenerNombreEstado(codigoEstado) {
    const estados = {
      5: "Desierta",
      6: "Adjudicada",
      7: "Revocada",
      8: "Suspendida",
      15: "En evaluación",
      16: "Cerrada"
    };
    return estados[codigoEstado] || "Desconocido";
  }

  function mostrarLicitaciones(licitaciones) {
    const contenedor = document.getElementById('resultados-licitaciones');
    contenedor.innerHTML = '';

    const lista = document.createElement('ul');
    lista.classList.add('list-group');

    licitaciones.forEach(lic => {
      const item = document.createElement('li');
      item.classList.add('list-group-item');

      const codigo = lic.CodigoExterno || 'N/A';
      const nombre = lic.Nombre || 'Sin nombre';
      const estadoNombre = obtenerNombreEstado(lic.CodigoEstado);
      // Formatear fecha a dd-mm-yyyy
      const fechaCierre = lic.FechaCierre ? lic.FechaCierre.substring(0,10).split('-').reverse().join('-') : 'N/A';

      item.innerHTML = `
        <strong>${nombre}</strong><br />
        <strong>Código:</strong> ${codigo}<br />
        <strong>Estado:</strong> ${estadoNombre}<br />
        <strong>Fecha de cierre:</strong> ${fechaCierre}
      `;

      lista.appendChild(item);
    });

    contenedor.appendChild(lista);
  }

  // Aquí podrías poner el event listener y función para buscar proveedor si lo tienes en el formulario

  // Mostrar datos de proveedor en el DOM
  function mostrarProveedor(proveedor) {
    const contenedor = document.getElementById('resultado-proveedor');
    contenedor.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${proveedor.Nombre}</h5>
          <p class="card-text">
            <strong>RUT:</strong> ${proveedor.RUT}<br />
            <strong>Dirección:</strong> ${proveedor.Direccion}<br />
            <strong>Comuna:</strong> ${proveedor.Comuna}<br />
            <strong>Teléfono:</strong> ${proveedor.Telefono}<br />
            <strong>Email:</strong> ${proveedor.Mail}
          </p>
        </div>
      </div>
    `;
  }

});
