// ==========================================
// CONTROLADOR DEL FORMULARIO DE CARGA (HIRS)
// ==========================================

var fpInstance = null;
var modoActual = 'range';

const selServicio = document.getElementById('servicio');
const selTipo = document.getElementById('tipo');
const selModalidad = document.getElementById('modalidad');
const formGuardia = document.getElementById('formGuardia');

// Inicialización de Flatpickr
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

// Parametrización dinámica de horarios según el servicio y tipo
function actualizarHorariosSegunServicio() {
  const opt = selServicio.options[selServicio.selectedIndex];
  if (!opt || !opt.value) {
    selModalidad.innerHTML = '<option value="24 hs (08:00-08:00)">24 hs (08:00 a 08:00)</option>';
    return;
  }

  const tipoSugerido = opt.dataset.tipo || 'Activa';
  const perfil = opt.dataset.perfil || 'medica';

  // Sincronizar select de Tipo
  selTipo.value = tipoSugerido;

  // Cargar franjas horarias válidas
  selModalidad.innerHTML = '';

  if (selTipo.value === 'Pasiva') {
    if (perfil === 'operativa') {
      selModalidad.innerHTML = `
        <option value="Turno Rotativo / Pasiva">Pasiva según horario institucional (LV tarde/noche - Sab/Dom 24hs)</option>
        <option value="Semanal Continuo">Semanal / Bloque Continuo</option>
      `;
    } else {
      selModalidad.innerHTML = `
        <option value="Turno Rotativo / Pasiva">Pasiva Continua / A llamado</option>
        <option value="Semanal Continuo">Semanal / Bloque Completo</option>
      `;
    }
  } else {
    // Activa (En Planta)
    if (opt.value.includes('Guardia externa') || opt.value === 'Neonatologia' || opt.value === 'Cirugia General') {
      selModalidad.innerHTML = `
        <option value="24 hs (08:00-08:00)">24 hs (08:00 a 08:00)</option>
        <option value="12 hs Diurna (08:00-20:00)">12 hs Diurna (08:00 a 20:00)</option>
        <option value="12 hs Nocturna (20:00-08:00)">12 hs Nocturna (20:00 a 08:00)</option>
      `;
    } else {
      selModalidad.innerHTML = `
        <option value="24 hs (08:00-08:00)">24 hs (08:00 a 08:00)</option>
        <option value="12 hs Diurna (08:00-20:00)">12 hs Diurna (08:00 a 20:00)</option>
        <option value="12 hs Nocturna (20:00-08:00)">12 hs Nocturna (20:00 a 08:00)</option>
        <option value="Turno Rotativo / Pasiva">Turno Rotativo</option>
      `;
    }
  }
}

// Escuchar cambios de servicio y tipo
selServicio.addEventListener('change', actualizarHorariosSegunServicio);

selTipo.addEventListener('change', function() {
  if (selTipo.value === 'Pasiva') {
    selModalidad.innerHTML = `
      <option value="Turno Rotativo / Pasiva">Turno Continuo / Pasiva</option>
      <option value="Semanal Continuo">Semanal / Bloque Continuo</option>
    `;
  } else {
    actualizarHorariosSegunServicio();
  }
});

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
    feed.innerText = 'Error: Base de datos Supabase no configurada en js/config.js.';
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
      // Días específicos seleccionados
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

    // Resetear campos manteniendo el servicio si se desea seguir cargando
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

// Inicio por defecto
initFlatpickr('range');
actualizarHorariosSegunServicio();
