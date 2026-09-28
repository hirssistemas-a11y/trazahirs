/**
 * -----------------------------------------------------------------------------
 * Dashboard UI & Eventos de Guardia TI (v2.4.49)
 * -----------------------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
  let tareasCargadas = [];

  const tbody = document.getElementById('tbody-guardia');
  const inputFiltro = document.getElementById('filtro-busqueda');
  const btnRecargar = document.getElementById('btn-recargar');

  const countUrgentes = document.getElementById('count-urgentes');
  const countProceso = document.getElementById('count-proceso');
  const countFinalizadas = document.getElementById('count-finalizadas');

  // Función principal para renderizar la tabla
  function renderTabla(lista) {
    if (!tbody) return;

    if (!lista || lista.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted p-4">
            No hay tareas que coincidan con la búsqueda.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = lista.map(t => {
      const estadoNum = parseInt(t.state, 10);
      const fechaFmt = GuardiaLogica.formatearFecha(t.date || t.last_date);

      return `
        <tr data-id="${t.id}">
          <td class="text-muted fw-bold">${fechaFmt}</td>
          <td><b>${escapeHtml(t.service || '-')}</b></td>
          <td>${escapeHtml(t.item || '-')}</td>
          <td>${escapeHtml(t.problem || t.details || 'Sin detalle')}</td>
          <td class="text-center">
            ${GuardiaLogica.renderEstadoBadge(estadoNum)}
          </td>
          <td class="text-center">
            <button class="btn btn-sm ${estadoNum === 3 ? 'btn-danger' : 'btn-outline-primary'} w-100" 
                    onclick="gestionarTarea(${t.id}, ${estadoNum})">
              ${estadoNum === 3 ? 'Atender' : 'Resolver'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Actualizar tarjetas de conteos
  function actualizarMetricas(lista) {
    let urgentes = 0;
    let proceso = 0;
    let finalizadas = 0;

    lista.forEach(t => {
      const st = parseInt(t.state, 10);
      if (st === 3) urgentes++;
      else if (st === 1 || st === 4 || st === 5) proceso++;
      else if (st === 2) finalizadas++;
    });

    if (countUrgentes) countUrgentes.textContent = urgentes;
    if (countProceso) countProceso.textContent = proceso;
    if (countFinalizadas) countFinalizadas.textContent = finalizadas;
  }

  // Carga asíncrona de datos
  async function cargarDatos() {
    if (!tbody) return;
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted p-4">
          <span class="spinner-border spinner-border-sm me-2"></span> Sincronizando tareas...
        </td>
      </tr>`;

    try {
      tareasCargadas = await GuardiaLogica.obtenerTareas();
      actualizarMetricas(tareasCargadas);
      aplicarFiltro();
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger p-4">
            <i class="bi bi-exclamation-triangle me-2"></i> Error al conectar con el servidor de guardias.
          </td>
        </tr>`;
    }
  }

  // Filtro de búsqueda en tiempo real
  function aplicarFiltro() {
    const q = (inputFiltro?.value || '').toLowerCase().trim();
    if (!q) {
      renderTabla(tareasCargadas);
      return;
    }

    const filtradas = tareasCargadas.filter(t => {
      const serv = (t.service || '').toLowerCase();
      const item = (t.item || '').toLowerCase();
      const prob = (t.problem || t.details || '').toLowerCase();
      return serv.includes(q) || item.includes(q) || prob.includes(q);
    });

    renderTabla(filtradas);
  }

  // Event listeners
  if (inputFiltro) inputFiltro.addEventListener('input', aplicarFiltro);
  if (btnRecargar) btnRecargar.addEventListener('click', cargarDatos);

  // Sanitizado básico anti XSS
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Exponer acción de gestión global para los botones
  window.gestionarTarea = async function(id, estadoActual) {
    const nuevoEstado = estadoActual === 3 ? 1 : 2;
    const confirmacion = confirm(`¿Desea cambiar el estado de la tarea #${id}?`);
    if (!confirmacion) return;

    try {
      await GuardiaLogica.cambiarEstado(id, nuevoEstado);
      await cargarDatos();
    } catch (e) {
      alert('No se pudo actualizar la tarea en el servidor.');
    }
  };

  // Carga inicial
  cargarDatos();
});
