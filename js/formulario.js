// =========================================================
// FORMULARIO DE CARGA: PRECONFIGURACIÓN SERVICIO POR SERVICIO
// =========================================================

// CONFIGURACIÓN MAESTRA DE SERVICIOS HIRS
// define: tipo sugerido/bloqueado, si admite fraccionamiento y franjas permitidas
var CONFIG_SERVICIOS = {
  // --- SERVICIOS CON FRACCIONAMIENTO TOTAL (6, 12, 18 y 24 hs) ---
  "Guardia externa Adultos": { tipo: "Activa", fraccionable: true, nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs" },
  "Guardia externa Pediatrica": { tipo: "Activa", fraccionable: true, nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs" },
  "Neonatologia": { tipo: "Activa", fraccionable: true, nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs" },
  "Terapia Intensiva (UTI)": { tipo: "Activa", fraccionable: true, nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs" },
  "Terapia Intensiva Pediatrica (UTIP)": { tipo: "Activa", fraccionable: true, nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs" },
  "Pediatria": { tipo: "Activa", fraccionable: true, nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs" },

  // --- SERVICIOS MIXTOS (Planta de día / Pasiva de noche y fines de semana) ---
  "Cardiologia/Unidad Coronaria": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, nota: "Pasiva 16:00 a 09:00 hs (o Activa en planta según profesional)" },
  "Sistemas": { tipo: "Pasiva", fraccionable: false, tipoBloqueado: true, nota: "Pasiva lun a vie de 15:00 a 08:00 hs. Finde 24 hs." },
  "Electromedicina": { tipo: "Pasiva", fraccionable: false, tipoBloqueado: true, nota: "Pasiva lun a vie de 13:00 a 08:00 hs. Finde 24 hs." },
  "Farmacia": { tipo: "Pasiva", fraccionable: false, tipoBloqueado: true, nota: "Pasiva lun a vie de 16:00 a 08:00 hs. Finde 24 hs." },
  "Tecnico de Imagenes": { tipo: "Pasiva", fraccionable: false, tipoBloqueado: true, nota: "Pasiva lun a vie de 22:00 a 06:00 hs. Finde 24 hs." },
  "RX Quirofano": { tipo: "Pasiva", fraccionable: false, tipoBloqueado: true, nota: "Pasiva lun a vie de 20:00 a 08:00 hs. Finde 24 hs." },

  // --- PASIVAS ESTÁNDAR 24 HS / SEMANAL ---
  "Hemoterapia": { tipo: "Pasiva", fraccionable: false, nota: "Guardia pasiva continua / semanal" },
  "Hemodinamia": { tipo: "Pasiva", fraccionable: false, nota: "Guardia pasiva continua / semanal" },
  "Anestesista": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, nota: "Pasiva continua / Refuerzo activo" },
  "Cirugia General": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, nota: "Pasiva continua / Bloques 24 hs" },
  "Traumatologia": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, nota: "Pasiva continua / Bloques 24 hs" },
  "Laboratorio": { tipo: "Activa", fraccionable: false, tipoEditable: true, nota: "Guardia activa de planta 24 hs" }
};

var fpFechas = null;
var modoFechaActual = 'rango';

document.addEventListener('DOMContentLoaded', function() {
  poblarComboServicios();
  inicializarFlatpickr();

  var selServicio = document.getElementById('servicio');
  var selTipo = document.getElementById('tipo');
  var selDuracion = document.getElementById('duracion');
  var selFranja = document.getElementById('franja');

  selServicio.addEventListener('change', alCambiarServicio);
  selTipo.addEventListener('change', alCambiarTipo);
  selDuracion.addEventListener('change', alCambiarDuracion);

  // Inicialización con el primer servicio
  if (selServicio.options.length > 1) {
    selServicio.selectedIndex = 1;
    alCambiarServicio();
  }

  document.getElementById('formGuardia').addEventListener('submit', guardarGuardia);
});

function poblarComboServicios() {
  var sel = document.getElementById('servicio');
  sel.innerHTML = '<option value="">-- Seleccione un Servicio --</option>';

  var lista = Object.keys(CONFIG_SERVICIOS);

  // Unir con los definidos en config.js si existen
  if (typeof SERVICIOS_CRITICOS !== 'undefined') {
    SERVICIOS_CRITICOS.forEach(function(s) { if (!lista.includes(s)) lista.push(s); });
  }
  if (typeof SERVICIOS_OPERATIVOS !== 'undefined') {
    SERVICIOS_OPERATIVOS.forEach(function(s) { if (!lista.includes(s)) lista.push(s); });
  }

  lista.sort().forEach(function(s) {
    sel.innerHTML += '<option value="' + s + '">' + s + '</option>';
  });
}

// -------------------------------------------------------------
// ENCADENAMIENTO DE LOS 3 CASILLEROS
// -------------------------------------------------------------

function alCambiarServicio() {
  var srv = document.getElementById('servicio').value;
  var conf = CONFIG_SERVICIOS[srv] || { tipo: "Activa", fraccionable: false, nota: "" };

  var selTipo = document.getElementById('tipo');
  var lblNota = document.getElementById('servicioAyuda');

  lblNota.innerText = conf.nota || "";

  // 1. Configurar Tipo de Guardia
  selTipo.value = conf.tipo;
  if (conf.tipoBloqueado) {
    selTipo.setAttribute('disabled', 'disabled');
  } else {
    selTipo.removeAttribute('disabled');
  }

  // 2. Poblar Casillero 2: Duración del Turno
  actualizarSelectorDuracion(conf);
}

function alCambiarTipo() {
  var srv = document.getElementById('servicio').value;
  var conf = CONFIG_SERVICIOS[srv] || { tipo: "Activa", fraccionable: false };
  actualizarSelectorDuracion(conf);
}

function actualizarSelectorDuracion(conf) {
  var selDuracion = document.getElementById('duracion');
  var selTipo = document.getElementById('tipo');
  selDuracion.innerHTML = '';

  if (conf.fraccionable) {
    // Servicios fraccionables: admiten 24, 18, 12 y 6 horas
    selDuracion.innerHTML += '<option value="24 hs">24 Horas</option>';
    selDuracion.innerHTML += '<option value="18 hs">18 Horas</option>';
    selDuracion.innerHTML += '<option value="12 hs">12 Horas</option>';
    selDuracion.innerHTML += '<option value="6 hs">6 Horas</option>';
  } else {
    // Servicios estándar / pasivas fijas
    if (selTipo.value === 'Pasiva') {
      selDuracion.innerHTML += '<option value="Semanal/Bloque">Semanal / Bloque Continuo</option>';
      selDuracion.innerHTML += '<option value="24 hs">24 Horas (Día individual)</option>';
    } else {
      selDuracion.innerHTML += '<option value="24 hs">24 Horas</option>';
      selDuracion.innerHTML += '<option value="12 hs">12 Horas</option>';
    }
  }

  alCambiarDuracion();
}

function alCambiarDuracion() {
  var dur = document.getElementById('duracion').value;
  var selFranja = document.getElementById('franja');
  selFranja.innerHTML = '';

  if (dur === '18 hs') {
    selFranja.innerHTML += '<option value="08:00 a 02:00">08:00 a 02:00 hs (Día + Noche)</option>';
    selFranja.innerHTML += '<option value="14:00 a 08:00">14:00 a 08:00 hs (Tarde + Trasnoche)</option>';
  } else if (dur === '12 hs') {
    selFranja.innerHTML += '<option value="08:00 a 20:00">08:00 a 20:00 hs (Diurna)</option>';
    selFranja.innerHTML += '<option value="20:00 a 08:00">20:00 a 08:00 hs (Nocturna)</option>';
  } else if (dur === '6 hs') {
    selFranja.innerHTML += '<option value="08:00 a 14:00">08:00 a 14:00 hs (Mañana)</option>';
    selFranja.innerHTML += '<option value="14:00 a 20:00">14:00 a 20:00 hs (Tarde)</option>';
    selFranja.innerHTML += '<option value="20:00 a 02:00">20:00 a 02:00 hs (Noche)</option>';
    selFranja.innerHTML += '<option value="02:00 a 08:00">02:00 a 08:00 hs (Trasnoche)</option>';
  } else if (dur === '24 hs') {
    selFranja.innerHTML += '<option value="08:00 a 08:00">08:00 a 08:00 hs (Guardia Completa)</option>';
  } else {
    selFranja.innerHTML += '<option value="Cobertura Continua">Cobertura Continua del Período</option>';
  }
}

// -------------------------------------------------------------
// MANEJO DE FECHAS (FLATPICKR)
// -------------------------------------------------------------

function cambiarModoFecha(modo) {
  modoFechaActual = modo;
  var bRango = document.getElementById('btnModoRango');
  var bDias = document.getElementById('btnModoDias');
  var txtAyuda = document.getElementById('rangoAyuda');

  if (modo === 'rango') {
    bRango.className = 'btn btn-sm btn-outline-info btn-modo-fecha active';
    bDias.className = 'btn btn-sm btn-outline-secondary btn-modo-fecha';
    txtAyuda.innerText = 'Seleccione una fecha de inicio y una de fin para cubrir el bloque.';
  } else {
    bDias.className = 'btn btn-sm btn-outline-info btn-modo-fecha active';
    bRango.className = 'btn btn-sm btn-outline-secondary btn-modo-fecha';
    txtAyuda.innerText = 'Haga clic sobre cada día puntual en el que el profesional realiza la guardia.';
  }

  inicializarFlatpickr();
}

function inicializarFlatpickr() {
  if (fpFechas) fpFechas.destroy();

  var hoy = new Date();
  var inputFechas = document.getElementById('selectorFechas');
  inputFechas.value = '';

  fpFechas = flatpickr(inputFechas, {
    mode: modoFechaActual,
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    locale: "es",
    defaultDate: modoFechaActual === 'rango' ? [hoy, hoy] : [hoy],
    onChange: function(selectedDates, dateStr) {
      if (modoFechaActual === 'rango') {
        if (selectedDates.length >= 1) {
          document.getElementById('fecha_inicio').value = flatpickr.formatDate(selectedDates[0], "Y-m-d");
          document.getElementById('fecha_fin').value = selectedDates.length === 2 
            ? flatpickr.formatDate(selectedDates[1], "Y-m-d") 
            : document.getElementById('fecha_inicio').value;
        }
      }
    }
  });

  document.getElementById('fecha_inicio').value = flatpickr.formatDate(hoy, "Y-m-d");
  document.getElementById('fecha_fin').value = flatpickr.formatDate(hoy, "Y-m-d");
}

// -------------------------------------------------------------
// GUARDADO EN SUPABASE
// -------------------------------------------------------------

async function guardarGuardia(e) {
  e.preventDefault();

  var selTipo = document.getElementById('tipo');
  var dur = document.getElementById('duracion').value;
  var fra = document.getElementById('franja').value;

  // Armamos el texto unificado que la base de datos y logica.js reconocen
  var modalidadFinal = '';
  if (dur === 'Semanal/Bloque') {
    modalidadFinal = 'Semanal/Bloque';
  } else if (dur === '24 hs') {
    modalidadFinal = '24 hs (08:00 a 08:00)';
  } else if (dur === '18 hs') {
    modalidadFinal = '18 hs (' + fra.replace(' hs', '').trim() + ')';
  } else if (dur === '12 hs') {
    var etiqueta12 = fra.indexOf('20:00') === 0 ? '12 hs Nocturna (20:00-08:00)' : '12 hs Diurna (08:00-20:00)';
    modalidadFinal = etiqueta12;
  } else if (dur === '6 hs') {
    modalidadFinal = '6 hs (' + fra.split(' ')[0] + '-' + fra.split(' ')[2] + ')';
  }

  var srv = document.getElementById('servicio').value;
  var tipoVal = selTipo.value;
  var resp = document.getElementById('responsable').value.trim();
  var tel = document.getElementById('contacto').value.trim();
  var intNum = document.getElementById('interno').value.trim();
  var obs = document.getElementById('observaciones').value;

  var selectedDates = fpFechas.selectedDates;
  if (!selectedDates || selectedDates.length === 0) {
    alert('Por favor seleccione al menos una fecha.');
    return;
  }

  var registros = [];

  if (modoFechaActual === 'rango') {
    var fIni = document.getElementById('fecha_inicio').value;
    var fFin = document.getElementById('fecha_fin').value || fIni;
    registros.push({
      servicio: srv,
      tipo: tipoVal,
      modalidad: modalidadFinal,
      fecha_inicio: fIni,
      fecha_fin: fFin,
      responsable: resp,
      contacto: tel,
      interno: intNum,
      observaciones: obs
    });
  } else {
    // Si eligió días múltiples, se genera un registro individual por cada día
    selectedDates.forEach(function(d) {
      var dStr = flatpickr.formatDate(d, "Y-m-d");
      registros.push({
        servicio: srv,
        tipo: tipoVal,
        modalidad: modalidadFinal,
        fecha_inicio: dStr,
        fecha_fin: dStr,
        responsable: resp,
        contacto: tel,
        interno: intNum,
        observaciones: obs
      });
    });
  }

  var btnGuardar = document.querySelector('button[type="submit"]');
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';

  try {
    const { error } = await db.from('guardias').insert(registros);
    if (error) throw error;

    alert(registros.length > 1 ? 'Se registraron las ' + registros.length + ' guardias con éxito.' : 'Guardia registrada con éxito.');
    window.location.href = 'index.php';
  } catch (err) {
    alert('Error al guardar: ' + (err.message || err));
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i> Guardar Guardia';
  }
}
