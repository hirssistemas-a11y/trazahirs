/**
 * -----------------------------------------------------------------------------
 * Lógica y Servicios de Guardia TI - HIRS (v2.4.49)
 * -----------------------------------------------------------------------------
 */

const GuardiaLogica = {
  // Mapeo semántico de estados según el diccionario unificado
  ESTADOS: {
    0: { label: 'Sin Iniciar', badge: 'bg-secondary' },
    1: { label: 'En Diagnóstico', badge: 'bg-info text-dark' },
    2: { label: 'Finalizado/OK', badge: 'bg-success' },
    3: { label: 'Pendiente Guardia', badge: 'bg-danger' },
    4: { label: 'En Reparación', badge: 'bg-warning text-dark' },
    5: { label: 'Enviado a Service', badge: 'bg-dark' },
    6: { label: 'Baja Definitiva', badge: 'bg-secondary' }
  },

  // Obtener tareas combinadas desde la API central
  async obtenerTareas() {
    try {
      // Apunta a la nueva API centralizada en /services/systems/
      const res = await fetch('/services/systems/api/task/task.php', {
        method: 'GET',
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} al consultar tareas.`);
      }

      const datos = await res.json();
      return Array.isArray(datos) ? datos : (datos.data || []);
    } catch (error) {
      console.error('Error en GuardiaLogica.obtenerTareas:', error);
      throw error;
    }
  },

  // Actualizar estado de una tarea
  async cambiarEstado(id, nuevoEstado) {
    const formData = new FormData();
    formData.append('task_id', id);
    formData.append('task_state', nuevoEstado);
    formData.append('edit', 1);

    const res = await fetch('/services/systems/api/task/tasks.php', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Error al actualizar el estado de la tarea.');
    return true;
  },

  // Helper para devolver la configuración visual del estado
  renderEstadoBadge(estadoId) {
    const estado = this.ESTADOS[estadoId] || { label: 'Desconocido', badge: 'bg-secondary' };
    return `<span class="badge ${estado.badge} w-100 py-2">${estado.label}</span>`;
  },

  // Formatear fechas a d/m/Y
  formatearFecha(cadenaFecha) {
    if (!cadenaFecha) return '-';
    const partes = cadenaFecha.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0].slice(-2)}`;
    }
    return cadenaFecha;
  }
};
