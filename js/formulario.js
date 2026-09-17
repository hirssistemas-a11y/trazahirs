// ==========================================
// CONTROLADOR DEL FORMULARIO DE CARGA (HIRS)
// ==========================================

var fpInstance = null;
var modoActual = 'range';

const selServicio = document.getElementById('servicio');
const selTipo = document.getElementById('tipo');
const selDuracion = document.getElementById('duracionTurno');
const colDuracion = document.getElementById('colDuracion');
const colModalidad = document.getElementById('colModalidad');
const colTipo = document.getElementById('colTipo');
const selModalidad = document.getElementById('modalidad');
const colObservaciones = document.getElementById('colObservaciones');
const selObservaciones = document.getElementById('observaciones');
const formGuardia = document.getElementById('formGuardia');

function initFlatpickr(mode) {
  if (fpInstance) fpInstance.destroy();
  modoActual = mode;
  fpInstance = flatpickr("#selectorFechas", {
    mode: mode,
    locale: "es",
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    conjunction: " | ",
    minDate: "today"
  });
}

function cambiarModoCalendario(mode) {
  document.getElementById('selectorFechas').value = '';
  initFlatpickr(mode);
  
  const bRango = document.getElementById('btnModoRango');
  const bDias = document.getElementById('btnModoDias');
  const ayuda = document.getElementById('ayudaFechas');

  if (mode === 'range') {
    bRango.className = 'btn btn-outline-info btn-sm';
    bDias.className = 'btn btn-outline-secondary btn-sm';
    ayuda.innerText = 'Seleccione una fecha de inicio y una de fin para cubrir todo el bloque continuo.';
  } else {
    bRango.className = 'btn btn-outline-secondary btn-sm';
    bDias.className = 'btn btn-outline-info btn-sm';
    ayuda.innerText = 'Haga clic en cada uno de los días específicos en los que cubrirá guardia.';
  }
}

function actualizarFranjasHorarias() {
  if (!selDuracion) return;
  const dur = selDuracion.value;
  selModalidad.innerHTML = '';

  if (dur === '24') {
    selModalidad.innerHTML = '<option value="24 hs (08:00-08:00)">24 hs (08:00 a 08:00)</option>';
  } else if (dur === '12') {
    selModalidad.innerHTML = `
      <option value="12 hs Diurna (08:00-20:00)">12 hs Diurna (08:00 a 20:00)</option>
      <option value="12 hs Nocturna (20:00-08:00)">12 hs Nocturna (20:00 a 08:00)</option>
    `;
  } else if (dur === '6') {
    selModalidad.innerHTML = `
      <option value="6 hs Mañana (08:00-14:00)">6 hs Mañana (08:00 a 14:00)</option>
      <option value="6 hs Tarde (14:00-20:00)">6 hs Tarde (14:00 a 20:00)</option>
      <option value="6 hs Noche (20:00-02:00)">6 hs Noche (20:00 a 02:00)</option>
      <option value="6 hs Trasnoche (02:00-08:00)">6 hs Trasnoche (02:00 a 08:00)</option>
    `;
  }
}

function esServicioGuardiaExterna(servicio) {
  var s = String(servicio || '').toLowerCase();
  return s.includes('guardia externa') || s.includes('adultos') || s.includes('pediatrica');
}

function actualizarHorariosSegunServicio() {
  if (!selServicio) return;
  const srv = selServicio.value;
  selModalidad.innerHTML = '';

  // Control de visibilidad del campo Observaciones
  if (esServicioGuardiaExterna(srv)) {
    if (colObservaciones) colObservaciones.style.display = 'block';
  } else {
    if (colObservaciones) {
      colObservaciones.style.display = 'none';
      if (selObservaciones) selObservaciones.value = 'Normal Activa';
    }
  }

  if (!srv) {
    if (colDuracion) colDuracion.style.display = 'none';
    if (colTipo) colTipo.className = 'col-md-6';
    if (colModalidad) colModalidad.className = 'col-md-6';
    selModalidad.innerHTML = '<option value="24 hs (08:00-08:00)">24 hs (08:00 a 08:00)</option>';
    return;
  }

  // 1. Servicios con turnos configurables de 6, 12 y 24 hs (Guardia externa y UTI)
  if (srv.includes('Guardia externa') || srv === 'UTI') || srv === 'Neonatologia') {
    selTipo.value = 'Activa';
    selTipo.disabled = true;
    if (colTipo) colTipo.className = 'col-md-4';
    if (colDuracion) colDuracion.style.display = 'block';
    if (colModalidad) colModalidad.className = 'col-md-4';
    actualizarFranjasHorarias();
    return;
  }

  // 2. Servicios restantes: modalidad fija en 24 hs
  if (colDuracion) colDuracion.style.display = 'none';
  if (colTipo) colTipo.className = 'col-md-4';
  if (colModalidad) colModalidad.className = 'col-md-8';

  const serviciosActivos = [
    'Cirugia General', 
    'Traumatologia', 
    'Cardiologia/Unidad Coronaria', 
    'Parteras', 
    'Laboratorio', 
    'Anestesista', 
    'Tecnico de Anestesia', 
    'Instrumentadoras',
    'Clinica Medica'
  ];

  if (serviciosActivos.includes(srv)) {
    selTipo.value = 'Activa';
  } else {
    selTipo.value = 'Pasiva';
  }
  selTipo.disabled = true;

  selModalidad.innerHTML = '<option value="24 hs (08:00-08:00)">24 hs (08:00 a 08:00)</option>';
}

if (selServicio) {
  selServicio.addEventListener('change', actualizarHorariosSegunServicio);
}
if (selDuracion) {
  selDuracion.addEventListener('change', actualizarFranjasHorarias);
}

// Envío a Supabase
if (formGuardia) {
  formGuardia.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnGuardar');
    const feed = document.getElementById('alertaFeedback');
    if (feed) feed.style.display = 'none';

    if (!fpInstance || fpInstance.selectedDates.length === 0) {
      if (feed) {
        feed.className = 'alert alert-warning';
        feed.innerText = 'Debe seleccionar al menos una fecha o rango.';
        feed.style.display = 'block';
      }
      return;
    }

    if (!db) {
      if (feed) {
        feed.className = 'alert alert-danger';
        feed.innerText = 'Error: Base de datos Supabase no conectada. Verifique js/config.js.';
        feed.style.display = 'block';
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando registros...';
    }

    try {
      const servicioValor = selServicio.value;
      const tipoValor = selTipo.value;
      const modalidadValor = selModalidad.value;
      const respValor = document.getElementById('responsable').value.trim();
      const contactoValor = document.getElementById('contacto').value.trim();
      const internoValor = document.getElementById('interno').value.trim();

      // Captura segura de observaciones
      let obsValor = null;
      const srvLower = servicioValor.toLowerCase();
      if (srvLower.includes('guardia externa') || srvLower.includes('adultos') || srvLower.includes('pediatrica')) {
        const elObs = document.getElementById('observaciones');
        if (elObs && elObs.value && elObs.value !== 'Normal Activa') {
          obsValor = elObs.value.trim();
        }
      }

      const fechasParaInsertar = [];

      if (modoActual === 'range') {
        const fIni = fpInstance.selectedDates[0];
        const fFin = fpInstance.selectedDates[1] || fIni;
        fechasParaInsertar.push({
          inicio: formatearFechaLocalISO(fIni),
          fin: formatearFechaLocalISO(fFin)
        });
      } else {
        fpInstance.selectedDates.forEach(function(d) {
          const str = formatearFechaLocalISO(d);
          fechasParaInsertar.push({ inicio: str, fin: str });
        });
      }

      const filas = fechasParaInsertar.map(function(item) {
        return {
          servicio: servicioValor,
          tipo: tipoValor,
          modalidad: modalidadValor,
          fecha_inicio: item.inicio,
          fecha_fin: item.fin,
          responsable: respValor,
          contacto: contactoValor,
          interno: internoValor || null,
          observaciones: obsValor
        };
      });

      const { data, error } = await db
        .from('guardias')
        .insert(filas);

      if (error) throw error;

      if (feed) {
        feed.className = 'alert alert-success';
        feed.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Se registraron exitosamente ' + filas.length + ' guardia(s).';
        feed.style.display = 'block';
      }

      document.getElementById('responsable').value = '';
      document.getElementById('contacto').value = '';
      document.getElementById('interno').value = '';
      document.getElementById('selectorFechas').value = '';
      if (selObservaciones) selObservaciones.value = 'Normal Activa';
      initFlatpickr(modoActual);

    } catch (err) {
      console.error("Error al registrar:", err);
      if (feed) {
        feed.className = 'alert alert-danger';
        feed.innerHTML = '<i class="bi bi-exclamation-octagon-fill me-1"></i> Error: ' + (err.message || 'No se pudo guardar');
        feed.style.display = 'block';
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle"></i> Confirmar Asignación de Guardia';
      }
    }
  });
}

initFlatpickr('range');
actualizarHorariosSegunServicio();
