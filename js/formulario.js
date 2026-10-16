// =========================================================
// FORMULARIO DE CARGA: PRECONFIGURACIÓN SERVICIO POR SERVICIO
// =========================================================

var CONFIG_SERVICIOS = {
  // --- SERVICIOS CON FRACCIONAMIENTO TOTAL (6, 12, 18 y 24 hs) ---
  "Guardia externa Adultos": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: true,
    nota: "Admite 6 hs, 12 hs, 18 hs y 24 hs. Habilitado para Código Rojo o Guardia Restringida." 
  },
  "Guardia externa Pediatrica": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: true,
    nota: "Admite 6 hs, 12 hs, 18 hs y 24 hs. Habilitado para Código Rojo o Guardia Restringida." 
  },
  "Neonatologia": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: false,
    nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs." 
  },
  "Terapia Intensiva (UTI)": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: false,
    nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs." 
  },
  "Terapia Intensiva Pediatrica (UTIP)": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: false,
    nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs." 
  },
  "Pediatria": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: false,
    nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs." 
  },

  // --- SERVICIOS MIXTOS (Planta institucional de día / Pasiva de noche y fines de semana) ---
  "Cardiologia/Unidad Coronaria": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoEditable: true, 
    permiteAlertaCritica: false,
    nota: "Pasiva lun a vie de 16:00 a 09:00 hs (o Activa en planta según profesional). Finde 24 hs." 
  },
  "Sistemas": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoBloqueado: true, 
    permiteAlertaCritica: false,
    nota: "Pasiva lun a vie de 15:00 a 08:00 hs. Finde 24 hs." 
  },
  "Electromedicina": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoBloqueado: true, 
    permiteAlertaCritica: false,
    nota: "Pasiva lun a vie de 13:00 a 08:00 hs. Finde 24 hs." 
  },
  "Farmacia": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoBloqueado: true, 
    permiteAlertaCritica: false,
    nota: "Pasiva lun a vie de 16:00 a 08:00 hs. Finde 24 hs." 
  },
  "Tecnico de Imagenes": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoBloqueado: true, 
    permiteAlertaCritica: false,
    nota: "Pasiva lun a vie de 22:00 a 06:00 hs. Finde 24 hs." 
  },
  "RX Quirofano": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoBloqueado: true, 
    permiteAlertaCritica: false,
    nota: "Pasiva lun a vie de 20:00 a 08:00 hs. Finde 24 hs." 
  },

  // --- PASIVAS Y ACTIVAS ESTÁNDAR ---
  "Hemoterapia": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Hemodinamia": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Anestesista": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Pasiva continua / Refuerzo activo." },
  "Tecnico de Anestesia": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Pasiva continua / Bloques 24 hs." },
  "Cirugia General": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Pasiva continua / Bloques 24 hs." },
  "Traumatologia": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Pasiva continua / Bloques 24 hs." },
  "Ginecologia": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Pasiva continua / Bloques 24 hs." },
  "Obstetricia": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Pasiva continua / Bloques 24 hs." },
  "Parteras": { tipo: "Activa", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Guardia de planta / Bloques 24 hs." },
  "Gastroenterologia": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Ecografia": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Ecodopler cardiaco": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Ecodopler cardiaco Pediatrico": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Instrumentadoras": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Mantenimiento": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Esterilizacion": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Laboratorio": { tipo: "Activa", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Guardia activa de planta 24 hs." }
};

var fpFechas = null;
var modoFechaActual = 'range';

function normalizarTexto(t) {
  return String(t || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Filtra qué servicios puede cargar el usuario según su sesión en Traza HIRS
function obtenerServiciosPermitidosPorSesion(catalogoCompleto) {
  var u = normalizarTexto(typeof SESION_USUARIO !== 'undefined' ? SESION_USUARIO : '');
  var n = normalizarTexto(typeof SESION_NOMBRE !== 'undefined' ? SESION_NOMBRE : '');

  // Administradores generales o sesiones de sistemas/personal/dirección ven todo el catálogo
  if (!u || u === 'sistemas' || u === 'admin' || u === 'personal' || u === 'direccion' || n.includes('sistemas') || n.includes('administracion')) {
    return catalogoCompleto;
  }

  if (u === 'guardia' || n === 'guardia') {
    return catalogoCompleto.filter(function(s) { return s === 'Guardia externa Adultos'; });
  }
  if (u.includes('pediatria') || n.includes('pediatria')) {
    return catalogoCompleto.filter(function(s) {
      return ['Guardia externa Pediatrica', 'Neonatologia', 'Pediatria', 'Terapia Intensiva Pediatrica (UTIP)'].includes(s);
    });
  }
  if (u.includes('uti') || n.includes('terapia intensiva') || n.includes('uti')) {
    return catalogoCompleto.filter(function(s) {
      return ['Terapia Intensiva (UTI)', 'Terapia Intensiva Pediatrica (UTIP)'].includes(s);
    });
  }
  if (u.includes('ecoimagenes') || n.includes('ecoimagenes') || u.includes('ecodoppler')) {
    return catalogoCompleto.filter(function(s) {
      return ['Ecodopler cardiaco', 'Ecodopler cardiaco Pediatrico', 'Ecografia'].includes(s);
    });
  }
  if (u.includes('anestesia') || n.includes('anestesia')) {
    return catalogoCompleto.filter(function(s) {
      return ['Anestesista', 'Tecnico de Anestesia'].includes(s);
    });
  }
  if (u.includes('imagenes') || u.includes('rayos') || n.includes('imagenes')) {
    return catalogoCompleto.filter(function(s) {
      return ['Tecnico de Imagenes', 'RX Quirofano', 'Ecografia'].includes(s);
    });
  }

  // Coincidencia flexible por nombre del servicio
  var coincidencias = catalogoCompleto.filter(function(s) {
    var sNorm = normalizarTexto(s);
    return (u && sNorm.includes(u)) || (n && sNorm.includes(n));
  });

  return coincidencias.length > 0 ? coincidencias : catalogoCompleto;
}

document.addEventListener('DOMContentLoaded', function() {
  poblarComboServicios();
  inicializarFlatpickr();

  var selServicio = document.getElementById('servicio');
  var selTipo = document.getElementById('tipo');
  var selDuracion = document.getElementById('duracion');

  selServicio.addEventListener('change', alCambiarServicio);
  selTipo.addEventListener('change', alCambiarTipo);
  selDuracion.addEventListener('change', alCambiarDuracion);

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

  if (typeof SERVICIOS_CRITICOS !== 'undefined') {
    SERVICIOS_CRITICOS.forEach(function(s) {
      if (s.trim() !== 'UTI' && !lista.includes(s)) lista.push(s);
    });
  }
  if (typeof SERVICIOS_OPERATIVOS !== 'undefined') {
    SERVICIOS_OPERATIVOS.forEach(function(s) {
      if (s.trim() !== 'UTI' && !lista.includes(s)) lista.push(s);
    });
  }

  // Filtrar "UTI" suelto y aplicar permisos por sesión
  var limpia = lista.filter(function(s) { return s.trim() !== 'UTI'; }).sort();
  var permitidos = obtenerServiciosPermitidosPorSesion(limpia);

  permitidos.forEach(function(s) {
    sel.innerHTML += '<option value="' + s + '">' + s + '</option>';
  });
}

function alCambiarServicio() {
  var srv = document.getElementById('servicio').value;
  var conf = CONFIG_SERVICIOS[srv] || { tipo: "Activa", fraccionable: false, permiteAlertaCritica: false, nota: "" };

  var selTipo = document.getElementById('tipo');
  var lblNota = document.getElementById('servicioAyuda');
  var selObs = document.getElementById('observaciones');
  var obsAyuda = document.getElementById('observacionesAyuda');

  lblNota.innerText = conf.nota || "";

  // 1. Casillero Tipo de Guardia
  selTipo.value = conf.tipo;
  if (conf.tipoBloqueado) {
    selTipo.setAttribute('disabled', 'disabled');
  } else {
    selTipo.removeAttribute('disabled');
  }

  // 2. Estado Operativo Especial (Código Rojo / Restringida solo donde corresponde)
  if (conf.permiteAlertaCritica) {
    selObs.removeAttribute('disabled');
    if (obsAyuda) obsAyuda.innerText = "Este servicio permite reportar contingencias operativas (Código Rojo / Guardia Restringida).";
  } else {
    selObs.value = "Normal Activa";
    selObs.setAttribute('disabled', 'disabled');
    if (obsAyuda) obsAyuda.innerText = "Servicio con estado operativo estándar (Normal Activa).";
  }

  // 3. Casillero Duración y Franjas
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
    selDuracion.innerHTML += '<option value="24 hs">24 Horas</option>';
    selDuracion.innerHTML += '<option value="18 hs">18 Horas</option>';
    selDuracion.innerHTML += '<option value="12 hs">12 Horas</option>';
    selDuracion.innerHTML += '<option value="6 hs">6 Horas</option>';
  } else {
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

function cambiarModoFecha(modo) {
  modoFechaActual = (modo === 'rango' || modo === 'range') ? 'range' : 'multiple';
  var bRango = document.getElementById('btnModoRango');
  var bDias = document.getElementById('btnModoDias');
  var txtAyuda = document.getElementById('rangoAyuda');

  if (modoFechaActual === 'range') {
    bRango.className = 'btn btn-sm btn-outline-info btn-modo-fecha active';
    bDias.className = 'btn btn-sm btn-outline-secondary btn-modo-fecha';
    txtAyuda.innerText = 'Haga clic en el primer día y luego en el último día para cubrir el bloque.';
  } else {
    bDias.className = 'btn btn-sm btn-outline-info btn-modo-fecha active';
    bRango.className = 'btn btn-sm btn-outline-secondary btn-modo-fecha';
    txtAyuda.innerText = 'Haga clic sobre cada día puntual en el que el profesional realiza la guardia.';
  }

  inicializarFlatpickr();
}

function inicializarFlatpickr() {
  if (fpFechas) {
    fpFechas.destroy();
  }

  var inputFechas = document.getElementById('selectorFechas');
  inputFechas.value = '';
  document.getElementById('fecha_inicio').value = '';
  document.getElementById('fecha_fin').value = '';

  fpFechas = flatpickr(inputFechas, {
    mode: modoFechaActual,
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    locale: {
      firstDayOfWeek: 1,
      weekdays: {
        shorthand: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
        longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      },
      months: {
        shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      },
      rangeSeparator: " al "
    },
    onChange: function(selectedDates) {
      if (modoFechaActual === 'range') {
        if (selectedDates.length === 1) {
          var d1 = flatpickr.formatDate(selectedDates[0], "Y-m-d");
          document.getElementById('fecha_inicio').value = d1;
          document.getElementById('fecha_fin').value = d1;
        } else if (selectedDates.length === 2) {
          document.getElementById('fecha_inicio').value = flatpickr.formatDate(selectedDates[0], "Y-m-d");
          document.getElementById('fecha_fin').value = flatpickr.formatDate(selectedDates[1], "Y-m-d");
        }
      }
    }
  });
}

async function guardarGuardia(e) {
  e.preventDefault();

  var selTipo = document.getElementById('tipo');
  var dur = document.getElementById('duracion').value;
  var fra = document.getElementById('franja').value;

  var modalidadFinal = '';
  if (dur === 'Semanal/Bloque') {
    modalidadFinal = 'Semanal/Bloque';
  } else if (dur === '24 hs') {
    modalidadFinal = '24 hs (08:00 a 08:00)';
  } else if (dur === '18 hs') {
    modalidadFinal = '18 hs (' + fra.replace(' hs', '').trim() + ')';
  } else if (dur === '12 hs') {
    modalidadFinal = fra.indexOf('20:00') === 0 ? '12 hs Nocturna (20:00-08:00)' : '12 hs Diurna (08:00-20:00)';
  } else if (dur === '6 hs') {
    modalidadFinal = '6 hs (' + fra.split(' ')[0] + '-' + fra.split(' ')[2] + ')';
  }

  var srv = document.getElementById('servicio').value;
  var tipoVal = selTipo.value;
  var resp = document.getElementById('responsable').value.trim();
  var tel = document.getElementById('contacto').value.trim();
  var intNum = document.getElementById('interno') ? document.getElementById('interno').value.trim() : '';

  var selObs = document.getElementById('observaciones');
  var obs = (selObs && !selObs.disabled) ? selObs.value : 'Normal Activa';

  var selectedDates = fpFechas ? fpFechas.selectedDates : [];
  if (!selectedDates || selectedDates.length === 0) {
    alert('Por favor seleccione una fecha o rango de cobertura.');
    return;
  }

  var registros = [];

  if (modoFechaActual === 'range') {
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

    alert(registros.length > 1 ? 'Se registraron las ' + registros.length + ' guardias correctamente.' : 'Guardia registrada con éxito.');
    window.location.href = 'index.php';
  } catch (err) {
    alert('Error al registrar guardia: ' + (err.message || err));
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i> Guardar Guardia';
  }
}
