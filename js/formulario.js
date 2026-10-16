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
var modalReemplazoInstance = null;

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

  selTipo.value = conf.tipo;
  if (conf.tipoBloqueado) {
    selTipo.setAttribute('disabled', 'disabled');
  } else {
    selTipo.removeAttribute('disabled');
  }

  if (conf.permiteAlertaCritica) {
    selObs.removeAttribute('disabled');
    if (obsAyuda) obsAyuda.innerText = "Este servicio permite reportar contingencias operativas (Código Rojo / Guardia Restringida).";
  } else {
    selObs.value = "Normal Activa";
    selObs.setAttribute('disabled', 'disabled');
    if (obsAyuda) obsAyuda.innerText = "Servicio con estado operativo estándar (Normal Activa).";
  }

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

// =========================================================
// LÓGICA DE DETECCIÓN DE SUPERPOSICIÓN Y REEMPLAZO
// =========================================================

// Convierte una modalidad al intervalo horario relativo del ciclo de guardia [8 a 32]
// (donde 8 = 08:00 AM del día de guardia, 24 = 00:00 medianoche, 26 = 02:00 AM sig., 32 = 08:00 AM sig.)
function obtenerRangoHorasModalidad(modalidad) {
  var m = String(modalidad || '');

  // 18 Horas
  if (m.indexOf('18 hs') !== -1) {
    if (m.indexOf('08:00-02:00') !== -1 || m.indexOf('08:00 a 02:00') !== -1) return [8, 26];
    if (m.indexOf('14:00-08:00') !== -1 || m.indexOf('14:00 a 08:00') !== -1) return [14, 32];
  }

  // 12 Horas
  if (m.indexOf('12 hs Diurna') !== -1 || m.indexOf('08:00-20:00') !== -1 || m.indexOf('08:00 a 20:00') !== -1) {
    return [8, 20];
  }
  if (m.indexOf('12 hs Nocturna') !== -1 || m.indexOf('20:00-08:00') !== -1 || m.indexOf('20:00 a 08:00') !== -1) {
    return [20, 32];
  }

  // 6 Horas
  if (m.indexOf('6 hs') !== -1) {
    if (m.indexOf('08:00-14:00') !== -1 || m.indexOf('08:00 a 14:00') !== -1) return [8, 14];
    if (m.indexOf('14:00-20:00') !== -1 || m.indexOf('14:00 a 20:00') !== -1) return [14, 20];
    if (m.indexOf('20:00-02:00') !== -1 || m.indexOf('20:00 a 02:00') !== -1) return [20, 26];
    if (m.indexOf('02:00-08:00') !== -1 || m.indexOf('02:00 a 08:00') !== -1) return [26, 32];
  }

  // 24 hs o Semanal/Bloque cubren el ciclo completo [8, 32]
  return [8, 32];
}

// Determina si dos modalidades se superponen en horas el mismo día
function seSuperponenModalidades(modA, modB) {
  var rA = obtenerRangoHorasModalidad(modA);
  var rB = obtenerRangoHorasModalidad(modB);
  return Math.max(rA[0], rB[0]) < Math.min(rA[1], rB[1]);
}

// Devuelve un array con todas las fechas YYYY-MM-DD entre inicio y fin inclusive
function expandirFechas(fIniStr, fFinStr) {
  var pIni = String(fIniStr).slice(0, 10).split('-');
  var pFin = String(fFinStr || fIniStr).slice(0, 10).split('-');

  var cursor = new Date(parseInt(pIni[0], 10), parseInt(pIni[1], 10) - 1, parseInt(pIni[2], 10), 12, 0, 0);
  var fin = new Date(parseInt(pFin[0], 10), parseInt(pFin[1], 10) - 1, parseInt(pFin[2], 10), 12, 0, 0);

  var resultado = [];
  while (cursor <= fin) {
    var y = cursor.getFullYear();
    var m = String(cursor.getMonth() + 1).padStart(2, '0');
    var d = String(cursor.getDate()).padStart(2, '0');
    resultado.push(y + '-' + m + '-' + d);
    cursor.setDate(cursor.getDate() + 1);
  }
  return resultado;
}

// Agrupa un array de fechas YYYY-MM-DD ordenadas en rangos contiguos [{inicio, fin}]
function agruparFechasContiguas(fechasOrdenadas) {
  if (!fechasOrdenadas || fechasOrdenadas.length === 0) return [];
  var bloques = [];
  var inicioActual = fechasOrdenadas[0];
  var prevActual = fechasOrdenadas[0];

  for (var i = 1; i < fechasOrdenadas.length; i++) {
    var fActual = fechasOrdenadas[i];
    var pPrev = prevActual.split('-');
    var dPrev = new Date(parseInt(pPrev[0], 10), parseInt(pPrev[1], 10) - 1, parseInt(pPrev[2], 10), 12, 0, 0);
    dPrev.setDate(dPrev.getDate() + 1);
    var sigEsperada = dPrev.getFullYear() + '-' + String(dPrev.getMonth() + 1).padStart(2, '0') + '-' + String(dPrev.getDate()).padStart(2, '0');

    if (fActual === sigEsperada) {
      prevActual = fActual;
    } else {
      bloques.push({ inicio: inicioActual, fin: prevActual });
      inicioActual = fActual;
      prevActual = fActual;
    }
  }
  bloques.push({ inicio: inicioActual, fin: prevActual });
  return bloques;
}

// Abre el modal Sí/No y retorna una Promesa booleana
function preguntarReemplazoModal(conflictos) {
  return new Promise(function(resolve) {
    var nombresUnicos = [...new Set(conflictos.map(function(c) { return c.guardia.responsable; }))].join(' / ');
    document.getElementById('nombreResponsableReemplazo').innerText = nombresUnicos;

    var detallesHtml = conflictos.map(function(c) {
      var g = c.guardia;
      var rangoTxt = (g.fecha_inicio === g.fecha_fin) ? g.fecha_inicio : (g.fecha_inicio + ' al ' + g.fecha_fin);
      return '<div><i class="bi bi-calendar-event text-warning me-1"></i> <strong>' + g.servicio + '</strong>: ' +
             g.responsable + ' (' + (g.modalidad || '24 hs') + ' • ' + rangoTxt + ')</div>';
    }).join('');
    document.getElementById('detalleSuperposicion').innerHTML = detallesHtml;

    var modalEl = document.getElementById('modalReemplazarGuardia');
    if (typeof bootstrap !== 'undefined' && modalEl) {
      if (!modalReemplazoInstance) {
        modalReemplazoInstance = new bootstrap.Modal(modalEl);
      }

      var btnSi = document.getElementById('btnReemplazoSi');
      var btnNo = document.getElementById('btnReemplazoNo');
      var btnCerrar = document.getElementById('btnCerrarModalReemplazo');

      var limpiarEventos = function() {
        btnSi.onclick = null;
        btnNo.onclick = null;
        btnCerrar.onclick = null;
      };

      btnSi.onclick = function() {
        limpiarEventos();
        modalReemplazoInstance.hide();
        resolve(true);
      };

      var cancelar = function() {
        limpiarEventos();
        modalReemplazoInstance.hide();
        resolve(false);
      };

      btnNo.onclick = cancelar;
      btnCerrar.onclick = cancelar;

      modalReemplazoInstance.show();
    } else {
      // Respaldo nativo si por algún motivo no cargó el modal
      var resp = confirm('¿Desea reemplazar la guardia de: "' + nombresUnicos + '"?');
      resolve(resp);
    }
  });
}

// =========================================================
// GUARDADO EN SUPABASE CON VERIFICACIÓN DE SUPERPOSICIÓN
// =========================================================

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
  var todasFechasNuevas = [];

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
    todasFechasNuevas = expandirFechas(fIni, fFin);
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
      if (!todasFechasNuevas.includes(dStr)) {
        todasFechasNuevas.push(dStr);
      }
    });
    todasFechasNuevas.sort();
  }

  var btnGuardar = document.querySelector('button[type="submit"]');
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Verificando...';

  try {
    var minFecha = todasFechasNuevas[0];
    var maxFecha = todasFechasNuevas[todasFechasNuevas.length - 1];
    var setFechasNuevas = new Set(todasFechasNuevas);

    // 1. Buscar guardias existentes del mismo servicio en ese rango de fechas
    const { data: existentes, error: errBusqueda } = await db
      .from('guardias')
      .select('*')
      .eq('servicio', srv)
      .lte('fecha_inicio', maxFecha)
      .gte('fecha_fin', minFecha);

    if (errBusqueda) throw errBusqueda;

    // 2. Filtrar aquellas que realmente se superponen en día y franja horaria
    var conflictos = [];
    (existentes || []).forEach(function(ex) {
      if (seSuperponenModalidades(ex.modalidad, modalidadFinal)) {
        var fechasEx = expandirFechas(ex.fecha_inicio, ex.fecha_fin);
        var diasChoque = fechasEx.filter(function(f) { return setFechasNuevas.has(f); });
        if (diasChoque.length > 0) {
          conflictos.push({
            guardia: ex,
            fechasOriginales: fechasEx,
            diasChoque: diasChoque
          });
        }
      }
    });

    // 3. Si hay superposición, mostrar el cartel "¿Desea reemplazar la guardia de: X?" Sí/No
    if (conflictos.length > 0) {
      var deseaReemplazar = await preguntarReemplazoModal(conflictos);
      if (!deseaReemplazar) {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i> Guardar Guardia';
        return;
      }

      btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Reemplazando...';

      // 4. Reemplazar cada guardia en conflicto (conservando días no superpuestos si era un bloque largo)
      for (var i = 0; i < conflictos.length; i++) {
        var c = conflictos[i];
        var gVieja = c.guardia;
        var fechasRestantes = c.fechasOriginales.filter(function(f) { return !setFechasNuevas.has(f); });

        // Eliminamos el registro superpuesto anterior
        const { error: errDel } = await db.from('guardias').delete().eq('id', gVieja.id);
        if (errDel) throw errDel;

        // Si la guardia anterior abarcaba otros días que NO se pisan con la nueva, los preservamos
        if (fechasRestantes.length > 0) {
          var bloquesRestantes = agruparFechasContiguas(fechasRestantes);
          var fragmentos = bloquesRestantes.map(function(b) {
            return {
              servicio: gVieja.servicio,
              tipo: gVieja.tipo,
              modalidad: gVieja.modalidad,
              fecha_inicio: b.inicio,
              fecha_fin: b.fin,
              responsable: gVieja.responsable,
              contacto: gVieja.contacto,
              interno: gVieja.interno,
              observaciones: gVieja.observaciones
            };
          });
          const { error: errReinsert } = await db.from('guardias').insert(fragmentos);
          if (errReinsert) throw errReinsert;
        }
      }
    }

    // 5. Insertar la nueva guardia
    btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';
    const { error: errInsert } = await db.from('guardias').insert(registros);
    if (errInsert) throw errInsert;

    alert(registros.length > 1 ? 'Se registraron las ' + registros.length + ' guardias correctamente.' : 'Guardia registrada con éxito.');
    window.location.href = 'index.php';

  } catch (err) {
    alert('Error al registrar guardia: ' + (err.message || err));
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i> Guardar Guardia';
  }
}
