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

// Opciones horarias exclusivas para Guardia Externa
function actualizarFranjasHorarias() {
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

// Adaptación de los selectores según el servicio seleccionado
function actualizarHorariosSegunServicio() {
  const srv = selServicio.value;
  selModalidad.innerHTML = '';

  if (!srv) {
    colDuracion.style.display = 'none';
    colTipo.className = 'col-md-6';
    colModalidad.className = 'col-md-6';
    selModalidad.innerHTML = '<option value="24 hs (08:00-08:00)">24 hs (08:00 a 08:00)</option>';
    return;
  }

  // CASO 1: Guardia Externa (Adultos y Pediátrica) -> Habilita 6, 12 y 24 hs
  if (srv.includes('Guardia externa')) {
    selTipo.value = 'Activa';
    selTipo.disabled = true;
    colTipo.className = 'col-md-4';
    colDuracion.style.display = 'block';
    colModalidad.className = 'col-md-4';
    actualizarFranjasHorarias();
    return;
  }

  // CASO 2: TODOS los demás servicios -> 24 hs fija (una sola opción)
  colDuracion.style.display = 'none';
  colTipo.className = 'col-md-4';
  colModalidad.className = 'col-md-8';

  const serviciosActivos = [
    'Neonatologia', 'Cirugia General', 'Traumatologia', 
    'Obstetricia', 'Laboratorio', 'Cardiologia/Unidad Coronaria', 
    'Anestesia', 'Instrumentadoras'
  ];

  if (serviciosActivos.includes(srv)) {
    selTipo.value = 'Activa';
  } else {
    selTipo.value = 'Pasiva';
  }
  selTipo.disabled = true;

  // Solo 24 horas para cualquier otro servicio
  selModalidad.innerHTML = '<option value="24 hs (08:00-08:00)">24 hs (08:00 a 08:00)</option>';
}

selServicio.addEventListener('change', actualizarHorariosSegunServicio);
selDuracion.addEventListener('change', actualizarFranjasHorarias);

// Envío a Supabase
formGuardia.addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('btnGuardar');
  const feed = document.getElementById('alertaFeedback');
  feed.style.display = 'none';

  if (!fpInstance || fpInstance.selectedDates.length === 0) {
    feed.className = 'alert alert-warning';
    feed.innerText = 'Debe seleccionar al menos una fecha o rango.';
    feed.style.display = 'block';
    return;
  }

  if (!db) {
    feed.className = 'alert alert-danger';
    feed.innerText = 'Error: Base de datos Supabase no conectada. Verifique js/config.js.';
    feed.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando registros...';

  try {
    const servicioValor = selServicio.value;
    const tipoValor = selTipo.value;
    const modalidadValor = selModalidad.value;
    const respValor = document.getElementById('responsable').value.trim();
    const contactoValor = document.getElementById('contacto').value.trim();
    const internoValor = document.getElementById('interno').value.trim();

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
        interno: internoValor || null
      };
    });

    const { data, error } = await db
      .from('guardias')
      .insert(filas);

    if (error) throw error;

    feed.className = 'alert alert-success';
    feed.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Se registraron exitosamente ' + filas.length + ' guardia(s).';
    feed.style.display = 'block';

    document.getElementById('responsable').value = '';
    document.getElementById('contacto').value = '';
    document.getElementById('interno').value = '';
    document.getElementById('selectorFechas').value = '';
    initFlatpickr(modoActual);

  } catch (err) {
    console.error("Error al registrar:", err);
    feed.className = 'alert alert-danger';
    feed.innerHTML = '<i class="bi bi-exclamation-octagon-fill me-1"></i> Error: ' + (err.message || 'No se pudo guardar');
    feed.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-circle"></i> Confirmar Asignación de Guardia';
  }
});

// Inicialización
initFlatpickr('range');
actualizarHorariosSegunServicio();
