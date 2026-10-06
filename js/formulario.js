// =========================================================
// FORMULARIO DE CARGA: PRECONFIGURACIÓN SERVICIO POR SERVICIO
// =========================================================

var CONFIG_SERVICIOS = {
  // --- SERVICIOS CON FRACCIONAMIENTO TOTAL Y ESTADOS CRÍTICOS ---
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

  // --- SERVICIOS MIXTOS ---
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

  // --- GUARDIAS PASIVAS ASISTENCIALES ---
  "Ecodopler cardiaco": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoBloqueado: true, 
    permiteAlertaCritica: false, 
    nota: "Guardia pasiva 24 hs (08:00 a 08:00 hs). Se visualiza en monitor de 15:00 a 07:00 hs." 
  },
  "Ecodopler cardiaco Pediatrico": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoBloqueado: true, 
    permiteAlertaCritica: false, 
    nota: "Guardia pasiva 24 hs (08:00 a 08:00 hs). Se visualiza en monitor de 15:00 a 07:00 hs." 
  },

  // --- PASIVAS Y ACTIVAS ESTÁNDAR ---
  "Hemoterapia": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Hemodinamia": { tipo: "Pasiva", fraccionable: false, permiteAlertaCritica: false, nota: "Guardia pasiva continua / semanal." },
  "Anestesista": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Pasiva continua / Refuerzo activo." },
  "Tecnico de Anestesia": { tipo: "Activa", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Guardia operativa de técnicos." },
  "Cirugia General": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Pasiva continua / Bloques 24 hs." },
  "Traumatologia": { tipo: "Pasiva", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Pasiva continua / Bloques 24 hs." },
  "Laboratorio": { tipo: "Activa", fraccionable: false, tipoEditable: true, permiteAlertaCritica: false, nota: "Guardia activa de planta 24 hs." }
};

var fpFechas = null;
var modoFechaActual = 'rango';

document.addEventListener('DOMContentLoaded', function() {
  poblarComboServicios();
  inicializarFlatpickr();

  var selServicio = document.getElementById('servicio');
  var selTipo = document.getElementById('tipo');
  var selDuracion = document.getElementById('duracion');

  selServicio.addEventListener('change', alCambiarServicio);
  selTipo.addEventListener('change', alCambiarTipo);
  selDuracion.addEventListener('change', alCambiarDuracion);

  document.getElementById('formGuardia').addEventListener('submit', guardarGuardia);
});

// -------------------------------------------------------------
// CONTROL DE ACCESO POR SESIÓN (SISTEMAS / PERSONAL / SERVICIOS)
// -------------------------------------------------------------
function obtenerServiciosPermitidosPorSesion(listaTotalServicios) {
  var u = (typeof SESION_USUARIO !== 'undefined' ? SESION_USUARIO : '').toLowerCase().trim();
  var n = (typeof SESION_NOMBRE !== 'undefined' ? SESION_NOMBRE : '').toLowerCase().trim();

  // 1. Sin sesión (desarrollo o prueba local)
  if (!u && !n) {
    return { esSuper: true, servicios: listaTotalServicios };
  }

  // 2. Superusuarios: SISTEMAS y PERSONAL
  if (u === 'sistemas' || n === 'sistemas' || u === 'personal' || n === 'personal' || u === 'admin' || n === 'admin') {
    return { esSuper: true, servicios: listaTotalServicios };
  }

  // 3. ANESTESIA (Médicos anestesistas + Técnicos de anestesia)
  if (u === 'anestesia' || n.includes('anestesia') || n.includes('anestesista')) {
    var serviciosAnestesia = listaTotalServicios.filter(function(srv) {
      var s = srv.toLowerCase();
      return s.includes('anestesia') || s.includes('anestesista');
    });

    if (serviciosAnestesia.length === 0) {
      serviciosAnestesia = ['Anestesista', 'Tecnico de Anestesia'];
    }

    return {
      esSuper: false,
      etiqueta: 'Anestesiología',
      servicios: serviciosAnestesia
    };
  }

  // 4. PEDIATRÍA (Pediatría en planta, Guardia externa y Neonatología)
  if (u === 'pediatria' || n.includes('pediatria')) {
    var serviciosPediatria = listaTotalServicios.filter(function(srv) {
      var s = srv.toLowerCase();
      return s.includes('pediatri') || s.includes('neonatolog');
    });

    if (serviciosPediatria.length === 0) {
      serviciosPediatria = ['Guardia externa Pediatrica', 'Neonatologia', 'Pediatria'];
    }

    return {
      esSuper: false,
      etiqueta: 'Pediatría y Neonatología',
      servicios: serviciosPediatria
    };
  }

  // 5. ECOIMÁGENES (Cardíaco y Pediátrico)
  if (u === 'ecoimagenes' || n.includes('ecoimagen') || n.includes('ecodopler') || n.includes('ecocardiograma')) {
    return {
      esSuper: false,
      etiqueta: 'Ecoimágenes',
      servicios: ['Ecodopler cardiaco', 'Ecodopler cardiaco Pediatrico']
    };
  }

  // 6. GUARDIA EXTERNA ADULTOS
  if (u === 'guardia' || n.includes('guardia externa') || n.includes('guardia adultos')) {
    return {
      esSuper: false,
      etiqueta: 'Guardia Externa Adultos',
      servicios: ['Guardia externa Adultos']
    };
  }

  // 7. TERAPIA INTENSIVA (UTI y UTIP)
  if (u === 'uti' || n.includes('terapia') || n.includes('intensiva')) {
    return {
      esSuper: false,
      etiqueta: 'Terapia Intensiva',
      servicios: ['Terapia Intensiva (UTI)', 'Terapia Intensiva Pediatrica (UTIP)']
    };
  }

  // 8. Servicios individuales por coincidencia general
  var permitidos = listaTotalServicios.filter(function(srv) {
    var srvNorm = srv.toLowerCase();
    return srvNorm === u || srvNorm === n || srvNorm.includes(u) || (n && srvNorm.includes(n)) || (u && u.includes(srvNorm));
  });

  if (permitidos.length > 0) {
    return {
      esSuper: false,
      etiqueta: permitidos[0],
      servicios: permitidos
    };
  }

  // Respaldo
  return { esSuper: true, servicios: listaTotalServicios };
}

function poblarComboServicios() {
  var sel = document.getElementById('servicio');
  var lblAyuda = document.getElementById('servicioAyuda');

  var listaTotal = Object.keys(CONFIG_SERVICIOS);
  if (typeof SERVICIOS_CRITICOS !== 'undefined') {
    SERVICIOS_CRITICOS.forEach(function(s) { if (!listaTotal.includes(s)) listaTotal.push(s); });
  }
  if (typeof SERVICIOS_OPERATIVOS !== 'undefined') {
    SERVICIOS_OPERATIVOS.forEach(function(s) { if (!listaTotal.includes(s)) listaTotal.push(s); });
  }
  listaTotal.sort();

  var info = obtenerServiciosPermitidosPorSesion(listaTotal);
  sel.innerHTML = '';

  if (info.esSuper) {
    sel.innerHTML += '<option value="">-- Seleccione un Servicio --</option>';
    info.servicios.forEach(function(s) {
      sel.innerHTML += '<option value="' + s + '">' + s + '</option>';
    });
    if (sel.options.length > 1) {
      sel.selectedIndex = 1;
      alCambiarServicio();
    }
  } else {
    if (info.servicios.length === 1) {
      var unico = info.servicios[0];
      sel.innerHTML += '<option value="' + unico + '">' + unico + '</option>';
      sel.value = unico;
      alCambiarServicio();
      if (lblAyuda) {
        lblAyuda.innerHTML = '<i class="bi bi-person-check-fill me-1"></i> Servicio asignado a su cuenta: <strong>' + unico + '</strong>';
      }
    } else {
      sel.innerHTML += '<option value="">-- Seleccione Servicio (' + (info.etiqueta || 'Asignado') + ') --</option>';
      info.servicios.forEach(function(s) {
        sel.innerHTML += '<option value="' + s + '">' + s + '</option>';
      });
      sel.selectedIndex = 1;
      alCambiarServicio();
      if (lblAyuda) {
        lblAyuda.innerHTML = '<i class="bi bi-info-circle me-1"></i> Mostrando servicios autorizados para <strong>' + (info.etiqueta || 'su área') + '</strong>.';
      }
    }
  }
}

// -------------------------------------------------------------
// CONTROL DE SELECTORES Y ESTADO OPERATIVO
// -------------------------------------------------------------
function alCambiarServicio() {
  var srv = document.getElementById('servicio').value;
  var conf = CONFIG_SERVICIOS[srv] || { tipo: "Activa", fraccionable: false, permiteAlertaCritica: false, nota: "" };

  var selTipo = document.getElementById('tipo');
  var lblNota = document.getElementById('servicioAyuda');
  var selObs = document.getElementById('observaciones');
  var obsAyuda = document.getElementById('observacionesAyuda');

  if (conf.nota) {
    lblNota.innerText = conf.nota;
  }

  selTipo.value = conf.tipo;
  if (conf.tipoBloqueado) {
    selTipo.setAttribute('disabled', 'disabled');
  } else {
    selTipo.removeAttribute('disabled');
  }

  if (conf.permiteAlertaCritica) {
    selObs.removeAttribute('disabled');
    obsAyuda.innerText = "Este servicio permite reportar contingencias operativas.";
  } else {
    selObs.value = "Normal Activa";
    selObs.setAttribute('disabled', 'disabled');
    obsAyuda.innerText = "Servicio con estado operativo estándar (Normal Activa).";
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

// -------------------------------------------------------------
// MANEJO DE FECHAS
// -------------------------------------------------------------
function cambiarModoFecha(modo) {
  modoFechaActual = modo;
  var bRango = document.getElementById('btnModoRango');
  var bDias = document.getElementById('btnModoDias');
  var txtAyuda = document.getElementById('rangoAyuda');

  if (modo === 'rango') {
    bRango.className = 'btn btn-sm btn-outline-info btn-modo-fecha active';
    bDias.className = 'btn btn-sm btn-outline-secondary btn-modo-fecha';
    txtAyuda.innerText = 'Haga clic en el primer día y luego en el último día para cubrir el rango.';
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
    mode: modoFechaActual === 'rango' ? 'range' : 'multiple',
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    allowInput: false,
    clickOpens: true,
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
    onClose: function(selectedDates) {
      if (modoFechaActual === 'rango' && selectedDates.length >= 1) {
        document.getElementById('fecha_inicio').value = flatpickr.formatDate(selectedDates[0], "Y-m-d");
        document.getElementById('fecha_fin').value = flatpickr.formatDate(selectedDates[selectedDates.length - 1], "Y-m-d");
      }
    },
    onChange: function(selectedDates) {
      if (modoFechaActual === 'rango') {
        if (selectedDates.length === 1) {
          document.getElementById('fecha_inicio').value = flatpickr.formatDate(selectedDates[0], "Y-m-d");
          document.getElementById('fecha_fin').value = flatpickr.formatDate(selectedDates[0], "Y-m-d");
        } else if (selectedDates.length >= 2) {
          document.getElementById('fecha_inicio').value = flatpickr.formatDate(selectedDates[0], "Y-m-d");
          document.getElementById('fecha_fin').value = flatpickr.formatDate(selectedDates[selectedDates.length - 1], "Y-m-d");
        }
      }
    }
  });
}

// -------------------------------------------------------------
// GUARDADO EN SUPABASE
// -------------------------------------------------------------
async function guardarGuardia(e) {
  e.preventDefault();

  var srv = document.getElementById('servicio').value;
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

  if (modoFechaActual === 'rango') {
    var fIni = flatpickr.formatDate(selectedDates[0], "Y-m-d");
    var fFin = selectedDates.length > 1 
      ? flatpickr.formatDate(selectedDates[selectedDates.length - 1], "Y-m-d") 
      : fIni;

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
