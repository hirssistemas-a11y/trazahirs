// ==========================================
// CONTROLADOR DEL MONITOR EN VIVO (HIRS) - OPTIMIZADO
// ==========================================

var tokenAdmin = sessionStorage.getItem("admin_token") || null;
var historialCompleto = [];
var todasLasGuardiasRaw = [];
var guardiasEnVivo = [];
var guardiasIncumplidasLista = [];
var logsAuditoriaLista = [];
var referentesCache = {};
var referentesCargados = false;
var limpiezaUTIEjecutada = false;
var huecosDetectadosGlobal = [];

var modalInstance = null;
var modalConfirmarInstance = null;
var modalContactoInstance = null;
var modalJefesInstance = null;
var modalIncumplidasInstance = null;
var modalLogsInstance = null;
var modalMiPlanillaInstance = null;

var guardiaPendienteReporte = null;
var cargandoDatos = false;
var segundosDesdeUltimaSync = 0;
var filtroCategoriaActual = 'todas';
var INTERVALO_REFRESCO_SEG = 30;
var timerFiltroHistorial = null;

function normalizarTexto(t) {
  return String(t || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function actualizarReloj() {
  if (document.hidden) return; // No gastar CPU si la pestaña está minimizada

  var now = new Date();
  var elReloj = document.getElementById('reloj');
  if (elReloj) {
    elReloj.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' | ' + now.toLocaleDateString();
  }
  
  segundosDesdeUltimaSync++;
  var elStatus = document.getElementById('syncStatus');
  if (elStatus) {
    if (cargandoDatos) {
      elStatus.innerHTML = '<i class="bi bi-arrow-repeat text-warning"></i> Sincronizando datos...';
    } else {
      var prox = INTERVALO_REFRESCO_SEG - segundosDesdeUltimaSync;
      elStatus.innerHTML = '<i class="bi bi-check-circle text-success"></i> Actualizado hace ' + segundosDesdeUltimaSync + 's (próximo en ' + (prox > 0 ? prox : 0) + 's)';
    }
  }

  if (segundosDesdeUltimaSync >= INTERVALO_REFRESCO_SEG) {
    cargarDatos(false);
  }
}
setInterval(actualizarReloj, 1000);
actualizarReloj();

function forzarRefresco() {
  cargarDatos(true);
}

function filtrarCategoria(cat) {
  filtroCategoriaActual = cat;
  var bTodos = document.getElementById('btnTabTodos');
  var bProf = document.getElementById('btnTabProf');
  var bOper = document.getElementById('btnTabOper');

  bTodos.blur();
  bProf.blur();
  bOper.blur();

  bTodos.className = cat === 'todas' ? 'btn btn-switch btn-switch-active flex-fill flex-md-grow-0' : 'btn btn-switch btn-switch-inactive flex-fill flex-md-grow-0';
  bProf.className = cat === 'profesional' ? 'btn btn-switch btn-switch-active flex-fill flex-md-grow-0' : 'btn btn-switch btn-switch-inactive flex-fill flex-md-grow-0';
  bOper.className = cat === 'operativa' ? 'btn btn-switch btn-switch-active flex-fill flex-md-grow-0' : 'btn btn-switch btn-switch-inactive flex-fill flex-md-grow-0';

  renderizarTablasEnVivo(guardiasEnVivo);
}

// -------------------------------------------------------------
// LIMPIEZA AUTOMÁTICA DE "UTI" VIEJA Y GUARDIAS DUPLICADAS
// -------------------------------------------------------------
async function limpiarUTIDuplicadasEnBD() {
  if (limpiezaUTIEjecutada || !db) return;
  limpiezaUTIEjecutada = true;

  try {
    // 1. Borrar todas las guardias que quedaron con el nombre viejo "UTI"
    await db.from('guardias').delete().eq('servicio', 'UTI');

    // 2. Buscar si hay duplicadas exactas dentro de "Terapia Intensiva (UTI)" y eliminar el duplicado
    const { data: utiRows } = await db
      .from('guardias')
      .select('id, servicio, fecha_inicio, fecha_fin, modalidad, responsable')
      .eq('servicio', 'Terapia Intensiva (UTI)')
      .order('id', { ascending: true });

    if (utiRows && utiRows.length > 1) {
      var vistos = new Set();
      var idsDuplicados = [];

      utiRows.forEach(function(r) {
        var clave = [
          r.servicio,
          r.fecha_inicio,
          r.fecha_fin,
          (r.modalidad || '').trim().toLowerCase(),
          (r.responsable || '').trim().toLowerCase()
        ].join('|');

        if (vistos.has(clave)) {
          idsDuplicados.push(r.id);
        } else {
          vistos.add(clave);
        }
      });

      if (idsDuplicados.length > 0) {
        await db.from('guardias').delete().in('id', idsDuplicados);
      }
    }
  } catch (e) {
    console.warn("Aviso en limpieza automática de UTI:", e);
  }
}

async function cargarDatos(forzarTodo) {
  if (cargandoDatos) return;
  cargandoDatos = true;
  var elStatus = document.getElementById('syncStatus');
  if (elStatus) elStatus.innerHTML = '<i class="bi bi-arrow-repeat text-warning"></i> Actualizando...';

  try {
    if (!db) throw new Error("Base de datos no configurada en js/config.js");

    // Ejecutar limpieza de "UTI" vieja y cargar referentes solo la primera vez o al forzar
    if (!limpiezaUTIEjecutada) {
      await limpiarUTIDuplicadasEnBD();
    }
    if (!referentesCargados || forzarTodo) {
      await cargarReferentesDesdeBD();
    }

    var ahora = new Date();
    var ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);
    var ayerStr = formatearFechaLocalISO(ayer);

    const { data, error } = await db
      .from('guardias')
      .select('*')
      .neq('servicio', 'UTI')
      .gte('fecha_fin', ayerStr)
      .order('fecha_inicio', { ascending: true });

    if (error) throw error;

    todasLasGuardiasRaw = [];
    var vistosEnMemoria = new Set();

    (data || []).forEach(function(r) {
      if (!r.servicio || r.servicio.trim() === 'UTI') return;

      // Evitar mostrar filas idénticas duplicadas en pantalla
      var claveUnica = r.servicio + '|' + r.fecha_inicio + '|' + r.fecha_fin + '|' + (r.modalidad || '') + '|' + (r.responsable || '').trim().toLowerCase();
      if (vistosEnMemoria.has(claveUnica)) return;
      vistosEnMemoria.add(claveUnica);

      var obj = {
        id: r.id,
        servicio: r.servicio,
        tipo: r.tipo,
        modalidad: r.modalidad,
        fechaInicio: r.fecha_inicio,
        fechaFin: r.fecha_fin,
        responsable: r.responsable,
        contacto: r.contacto,
        interno: r.interno,
        observaciones: r.observaciones ? String(r.observaciones).trim() : null
      };
      if (typeof asegurarCacheFechasGuardia === 'function') {
        asegurarCacheFechasGuardia(obj);
      }
      todasLasGuardiasRaw.push(obj);
    });

    guardiasEnVivo = todasLasGuardiasRaw.filter(function(g) {
      return typeof esGuardiaVigente === 'function' ? esGuardiaVigente(g, ahora) : true;
    });

    renderizarTablasEnVivo(guardiasEnVivo);
    cargandoDatos = false;
    segundosDesdeUltimaSync = 0;
    if (elStatus) elStatus.innerHTML = '<i class="bi bi-check-circle text-success"></i> Conectado';

    if (tokenAdmin) {
      // Reutilizamos todasLasGuardiasRaw para las alertas de 48 hs (sin hacer otra consulta a Supabase)
      cargarAlertas();
      if (forzarTodo || historialCompleto.length === 0) {
        cargarHistorial();
      }
    }

  } catch(err) {
    console.error("Error al obtener guardias:", err);
    cargandoDatos = false;
    segundosDesdeUltimaSync = 0;
    if (elStatus) elStatus.innerHTML = '<i class="bi bi-exclamation-triangle text-danger"></i> ' + (err.message || 'Error de conexión');
  }
}

async function cargarReferentesDesdeBD() {
  try {
    const { data, error } = await db.from('referentes_servicios').select('*');
    if (!error && data) {
      data.forEach(function(item) {
        referentesCache[item.servicio] = {
          id: item.id,
          nombre: item.nombre_referente,
          contacto: item.contacto
        };
      });
      referentesCargados = true;
    }
  } catch (e) {
    console.warn("No se pudo cargar referentes_servicios:", e);
  }
}

function buscarProximaGuardia(servicioActual, idActual) {
  var umbralTimestamp = Date.now() - (5 * 60 * 1000);
  var mejorCandidata = null;
  var mejorTs = Infinity;

  for (var i = 0; i < todasLasGuardiasRaw.length; i++) {
    var g = todasLasGuardiasRaw[i];
    if (g.servicio !== servicioActual || g.id === idActual) continue;

    var inicioTurno = typeof obtenerInicioTurnoGuardia === 'function' ? obtenerInicioTurnoGuardia(g) : null;
    if (!inicioTurno) continue;

    var ts = inicioTurno.getTime();
    if (ts >= umbralTimestamp && ts < mejorTs) {
      mejorTs = ts;
      mejorCandidata = g;
    }
  }

  return mejorCandidata;
}

function normalizarWhatsApp(tel) {
  if (!tel) return null;
  var num = String(tel).replace(/\D/g, '');
  if (num.length <= 4) return null;
  if (num.startsWith('0')) num = num.substring(1);
  if (num.startsWith('15')) num = num.substring(2);
  if (!num.startsWith('54')) num = '549' + num;
  return num;
}

function generarBotonesContacto(contacto, servicio, responsable, interno, idGuardia, tipo, modalidad) {
  var limpio = String(contacto || '').trim();
  var wspNum = normalizarWhatsApp(limpio);
  var html = '<div class="d-flex align-items-center gap-1 flex-wrap">';

  if (limpio) {
    html += '<a href="tel:' + limpio.replace(/\s+/g, '') + '" class="btn-action-tel" title="Llamar">' +
              '<i class="bi bi-telephone-fill"></i> ' + limpio +
            '</a>';
  }

  if (wspNum) {
    var msg = encodeURIComponent('Hola ' + responsable + ', te contacto por la guardia de ' + servicio + ' en el Hospital Italiano.');
    var esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    var urlWsp = esMovil 
      ? 'https://wa.me/' + wspNum + '?text=' + msg 
      : 'https://web.whatsapp.com/send?phone=' + wspNum + '&text=' + msg;

    html += '<a href="' + urlWsp + '" target="_blank" rel="noopener noreferrer" class="btn-action-wsp" title="Enviar WhatsApp">' +
              '<i class="bi bi-whatsapp"></i> WSP' +
            '</a>';
  }

  if (interno && String(interno).trim() !== '') {
    html += '<span class="badge-interno" title="Interno hospitalario">' +
              '<i class="bi bi-telephone-inbound"></i> Int. ' + String(interno).trim() +
            '</span>';
  }

  var guardiaObjJson = JSON.stringify({
    id: idGuardia,
    servicio: servicio,
    responsable: responsable,
    tipo: tipo,
    modalidad: modalidad
  }).replace(/"/g, '&quot;');

  html += '<button type="button" class="btn-action-report" onclick="solicitarConfirmacionReporte(' + guardiaObjJson + ')" title="Reportar incidente de guardia">' +
            '<i class="bi bi-flag-fill"></i> Reportar' +
          '</button>';

  html += '</div>';
  return html;
}

function actualizarContadorChar(textarea) {
  var len = textarea.value.length;
  document.getElementById('charCount').innerText = len + '/120';
}

function solicitarConfirmacionReporte(guardia) {
  guardiaPendienteReporte = guardia;
  document.getElementById('confRepServicio').innerText = guardia.servicio;
  document.getElementById('confRepResponsable').innerText = guardia.responsable;

  var txtArea = document.getElementById('motivoIncidente');
  txtArea.value = '';
  actualizarContadorChar(txtArea);

  if (!modalConfirmarInstance) {
    modalConfirmarInstance = new bootstrap.Modal(document.getElementById('modalConfirmarReporte'));
  }
  modalConfirmarInstance.show();
}

async function confirmarReporteIncumplimiento() {
  if (!guardiaPendienteReporte) return;
  var g = guardiaPendienteReporte;
  var motivoTexto = document.getElementById('motivoIncidente').value.trim();
  var motivoFinal = motivoTexto !== '' ? motivoTexto.slice(0, 120) : 'Incidente reportado desde el monitor público';

  try {
    if (db) {
      await db.from('guardias_incumplidas').insert([{
        guardia_id: g.id || null,
        servicio: g.servicio,
        responsable: g.responsable,
        tipo: g.tipo,
        modalidad: g.modalidad,
        motivo: motivoFinal
      }]);
    }
    if (modalConfirmarInstance) modalConfirmarInstance.hide();
    mostrarContactoReferente(g.servicio);
  } catch (err) {
    console.error("Error al registrar incidente:", err);
    if (modalConfirmarInstance) modalConfirmarInstance.hide();
    mostrarContactoReferente(g.servicio);
  }
}

function mostrarContactoReferente(servicio) {
  var ref = referentesCache[servicio];

  if (!ref && typeof REFERENTES_SERVICIOS !== 'undefined') {
    ref = REFERENTES_SERVICIOS[servicio];
  }
  if (!ref) {
    ref = { nombre: 'Dirección Médica / Guardia Central', contacto: '2914000000' };
  }

  document.getElementById('repServicio').innerText = servicio;
  document.getElementById('repNombre').innerText = ref.nombre || ref.nombre_referente;

  var cont = document.getElementById('repAccionesContacto');
  var htmlBotones = [];

  var limpio = String(ref.contacto || '').trim();
  var wsp = normalizarWhatsApp(limpio);

  if (limpio) {
    htmlBotones.push(
      '<a href="tel:' + limpio.replace(/\s+/g, '') + '" class="btn-action-tel fs-6 py-1 px-3">' +
        '<i class="bi bi-telephone-fill me-1"></i> Llamar: ' + limpio +
      '</a>'
    );
  }

  if (wsp) {
    var msg = encodeURIComponent('Hola ' + (ref.nombre || 'Jefe de Servicio') + ', me comunico para notificar una novedad sobre la guardia de ' + servicio + ' en el Hospital Italiano.');
    var esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    var urlWsp = esMovil ? 'https://wa.me/' + wsp + '?text=' + msg : 'https://web.whatsapp.com/send?phone=' + wsp + '&text=' + msg;

    htmlBotones.push(
      '<a href="' + urlWsp + '" target="_blank" rel="noopener noreferrer" class="btn-action-wsp fs-6 py-1 px-3">' +
        '<i class="bi bi-whatsapp me-1"></i> WhatsApp' +
      '</a>'
    );
  }

  cont.innerHTML = htmlBotones.join('');

  if (!modalContactoInstance) {
    modalContactoInstance = new bootstrap.Modal(document.getElementById('modalContactoReferente'));
  }
  modalContactoInstance.show();
}

// Renderizado en memoria con 1 sola escritura DOM
function renderizarTablasEnVivo(guardias) {
  var tAct = document.getElementById('tablaActivas');
  var tPas = document.getElementById('tablaPasivas');

  var filasActivas = [];
  var filasPasivas = [];
  var listaOperativos = (typeof SERVICIOS_OPERATIVOS !== 'undefined') ? SERVICIOS_OPERATIVOS : [];
  var ahora = new Date();
  var ahoraMs = ahora.getTime();
  var LIMITE_48_HORAS_MS = 48 * 60 * 60 * 1000;

  for (var index = 0; index < guardias.length; index++) {
    var g = guardias[index];
    var esOperativo = listaOperativos.includes(g.servicio);
    if (filtroCategoriaActual === 'profesional' && esOperativo) continue;
    if (filtroCategoriaActual === 'operativa' && !esOperativo) continue;

    var btns = generarBotonesContacto(g.contacto, g.servicio, g.responsable, g.interno, g.id, g.tipo, g.modalidad);

    var badgeObs = '';
    var obsTexto = (g.observaciones || '').toString().trim();
    if (obsTexto && obsTexto !== 'Normal Activa' && obsTexto !== 'null' && obsTexto !== 'undefined') {
      var esCritico = obsTexto.toLowerCase().includes('rojo');
      var colorFondo = esCritico ? '#dc2626' : '#d97706';
      var icono = esCritico ? 'bi-exclamation-octagon-fill' : 'bi-exclamation-triangle-fill';
      badgeObs = '<div style="margin-top: 4px;">' +
                   '<span style="background-color: ' + colorFondo + ' !important; color: #ffffff !important; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; display: inline-block;">' +
                     '<i class="bi ' + icono + ' me-1"></i>' + obsTexto.toUpperCase() +
                   '</span>' +
                 '</div>';
    }

    var fechaFinTurno = typeof obtenerFinTurnoGuardia === 'function' ? obtenerFinTurnoGuardia(g, ahora) : null;
    var msRestantes = fechaFinTurno ? (fechaFinTurno.getTime() - ahoraMs) : 0;
    var tiempoRestanteTxt = typeof formatearTiempoRestante === 'function' ? formatearTiempoRestante(msRestantes) : '-';

    var mostrarDesplegable = (msRestantes > 0 && msRestantes <= LIMITE_48_HORAS_MS);
    var btnDesplegable = '';
    var filaCollapseHtml = '';

    if (mostrarDesplegable) {
      var prox = buscarProximaGuardia(g.servicio, g.id);
      var contenidoDesplegable = '';
      var btnClaseAlerta = 'btn-outline-secondary';
      var borderClaseCollapse = 'border-secondary';

      if (prox) {
        var obsProx = (prox.observaciones || '').toString().toLowerCase();
        var badgeObsProx = '';

        if (obsProx.includes('rojo')) {
          btnClaseAlerta = 'btn-outline-danger';
          borderClaseCollapse = 'border-danger';
          badgeObsProx = ' <span class="badge bg-danger ms-1"><i class="bi bi-exclamation-octagon-fill me-1"></i>CÓDIGO ROJO</span>';
        } else if (obsProx.includes('restringida')) {
          btnClaseAlerta = 'btn-outline-warning';
          borderClaseCollapse = 'border-warning';
          badgeObsProx = ' <span class="badge bg-warning text-dark ms-1"><i class="bi bi-exclamation-triangle-fill me-1"></i>RESTRINGIDA</span>';
        }

        contenidoDesplegable = 
          '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2">' +
            '<div><i class="bi bi-hourglass-split text-info me-1"></i> <strong>Cambio de guardia en:</strong> <span class="badge bg-primary text-white fs-6 py-1 px-2">' + tiempoRestanteTxt + '</span></div>' +
            '<div><i class="bi bi-person-fill-up text-success me-1"></i> <strong>Sigue:</strong> ' +
              '<strong class="text-white">' + prox.responsable + '</strong>' + badgeObsProx +
              ' <span class="text-secondary">(' + (prox.fechaInicio || '') + ' - ' + (prox.modalidad || '') + ')</span>' +
              (prox.contacto ? ' • <i class="bi bi-telephone-fill text-info"></i> ' + prox.contacto : '') +
              (prox.interno ? ' • <span class="badge bg-secondary">Int. ' + prox.interno + '</span>' : '') +
            '</div>' +
          '</div>';
      } else {
        btnClaseAlerta = 'btn-outline-danger';
        borderClaseCollapse = 'border-danger';
        contenidoDesplegable = 
          '<div class="d-flex align-items-center gap-2 text-danger fw-bold fs-6 py-1">' +
            '<i class="bi bi-exclamation-triangle-fill fs-5"></i> ' +
            '<span>¡Alerta! No hay responsable de guardia dentro de: <u class="text-warning">' + tiempoRestanteTxt + '</u></span>' +
          '</div>';
      }

      var collapseId = 'collapseProx_' + (g.id || index);

      btnDesplegable = '<button class="btn btn-sm ' + btnClaseAlerta + ' py-0 px-2 ms-2" type="button" data-bs-toggle="collapse" data-bs-target="#' + collapseId + '" title="Ver información del próximo turno">' +
                         '<i class="bi bi-clock-history me-1"></i> <small class="fw-bold">' + tiempoRestanteTxt + '</small> <i class="bi bi-chevron-down small"></i>' +
                       '</button>';

      filaCollapseHtml = 
        '<tr class="p-0 border-0">' +
          '<td colspan="3" class="p-0 border-0">' +
            '<div class="collapse" id="' + collapseId + '">' +
              '<div class="p-2 mx-2 mb-2 rounded bg-black bg-opacity-50 border ' + borderClaseCollapse + ' border-opacity-75 small">' +
                contenidoDesplegable +
              '</div>' +
            '</div>' +
          '</td>' +
        '</tr>';
    }

    var row = '<tr>' +
      '<td>' +
        '<div class="d-flex align-items-center justify-content-between">' +
          '<div class="fw-bold text-white">' + g.servicio + '</div>' +
          btnDesplegable +
        '</div>' +
        badgeObs +
      '</td>' +
      '<td class="align-middle">' + g.responsable + '</td>' +
      '<td class="align-middle">' + btns + '</td>' +
    '</tr>' + filaCollapseHtml;

    if (g.tipo === 'Activa') {
      filasActivas.push(row);
    } else {
      filasPasivas.push(row);
    }
  }

  tAct.innerHTML = filasActivas.length > 0
    ? filasActivas.join('')
    : '<tr><td colspan="3" class="text-center tabla-vacia"><i class="bi bi-info-circle me-1"></i> Sin guardias activas para la vista seleccionada.</td></tr>';

  tPas.innerHTML = filasPasivas.length > 0
    ? filasPasivas.join('')
    : '<tr><td colspan="3" class="text-center tabla-vacia"><i class="bi bi-info-circle me-1"></i> Sin guardias pasivas a demanda para la vista seleccionada.</td></tr>';
}

// -------------------------------------------------------------
// MI PLANILLA (COMPATIBLE CON UTI Y TODOS LOS SERVICIOS)
// -------------------------------------------------------------
function obtenerServiciosSegunUsuario() {
  var u = normalizarTexto(typeof SESION_USUARIO !== 'undefined' ? SESION_USUARIO : '');
  var n = normalizarTexto(typeof SESION_NOMBRE !== 'undefined' ? SESION_NOMBRE : '');
  var catalogo = obtenerTodosLosServicios();

  // Si es admin/sistemas/dirección/personal o sesión vacía, puede elegir cualquier servicio
  if (!u || u === 'sistemas' || u === 'admin' || u === 'personal' || u === 'direccion' || n.includes('sistemas') || n.includes('administracion')) {
    return catalogo;
  }

  if (u === 'guardia' || n === 'guardia') {
    return ['Guardia externa Adultos'];
  }
  if (u.includes('uti') || n.includes('uti') || u.includes('terapia') || n.includes('terapia')) {
    return ['Terapia Intensiva (UTI)', 'Terapia Intensiva Pediatrica (UTIP)'];
  }
  if (u.includes('pediatria') || n.includes('pediatria') || u.includes('neo') || n.includes('neo')) {
    return ['Guardia externa Pediatrica', 'Neonatologia', 'Pediatria', 'Terapia Intensiva Pediatrica (UTIP)'];
  }
  if (u.includes('ecoimagenes') || n.includes('ecoimagenes') || u.includes('ecodoppler')) {
    return ['Ecodopler cardiaco', 'Ecodopler cardiaco Pediatrico', 'Ecografia'];
  }
  if (u.includes('anestesia') || n.includes('anestesia')) {
    return ['Anestesista', 'Tecnico de Anestesia'];
  }
  if (u.includes('imagenes') || u.includes('rayos') || n.includes('imagenes')) {
    return ['Tecnico de Imagenes', 'RX Quirofano', 'Ecografia'];
  }
  if (u.includes('cardio') || n.includes('cardio') || u.includes('coronaria') || n.includes('uco')) {
    return ['Cardiologia/Unidad Coronaria'];
  }

  var coincidencias = catalogo.filter(function(s) {
    var sNorm = normalizarTexto(s);
    return (u && sNorm.includes(u)) || (n && sNorm.includes(n));
  });

  return coincidencias.length > 0 ? coincidencias : catalogo;
}

function abrirModalMiPlanilla() {
  if (!modalMiPlanillaInstance) {
    modalMiPlanillaInstance = new bootstrap.Modal(document.getElementById('modalMiPlanilla'));
  }
  
  var hoy = new Date();
  var primerDia = formatearFechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  var ultimoDia = formatearFechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));

  var serviciosPermitidos = obtenerServiciosSegunUsuario();
  var sel = document.getElementById('miServicioNombre');
  var opcionesHtml = [];

  if (serviciosPermitidos.length > 1) {
    opcionesHtml.push('<option value="__TODOS_MIS_SERVICIOS__">Todos mis servicios asignados (' + serviciosPermitidos.length + ')</option>');
  }

  serviciosPermitidos.forEach(function(s) {
    opcionesHtml.push('<option value="' + s + '">' + s + '</option>');
  });

  sel.innerHTML = opcionesHtml.join('');
  // Si es UTI, preseleccionamos directamente "Terapia Intensiva (UTI)"
  if (serviciosPermitidos.includes('Terapia Intensiva (UTI)') && serviciosPermitidos.length <= 2) {
    sel.value = 'Terapia Intensiva (UTI)';
  }

  document.getElementById('miPlanillaDesde').value = primerDia;
  document.getElementById('miPlanillaHasta').value = ultimoDia;

  modalMiPlanillaInstance.show();
}

async function exportarExcelMiServicio() {
  var dDesde = document.getElementById('miPlanillaDesde').value;
  var dHasta = document.getElementById('miPlanillaHasta').value;
  var seleccion = document.getElementById('miServicioNombre').value;
  var btn = document.getElementById('btnDescargarMiExcel');

  var listaServicios = (seleccion === '__TODOS_MIS_SERVICIOS__')
    ? obtenerServiciosSegunUsuario()
    : [seleccion];

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Generando...';
  }

  try {
    let query = db.from('guardias').select('*').in('servicio', listaServicios);
    
    // Filtro por superposición de fechas (incluye guardias que empiezan en el mes aunque terminen el 1 del mes siguiente)
    if (dDesde) query = query.gte('fecha_fin', dDesde);
    if (dHasta) query = query.lte('fecha_inicio', dHasta);

    const { data, error } = await query.order('fecha_inicio', { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) {
      alert('No se encontraron guardias registradas para ' + (seleccion === '__TODOS_MIS_SERVICIOS__' ? 'sus servicios' : seleccion) + ' entre ' + dDesde + ' y ' + dHasta + '.');
      return;
    }

    var filas = data.map(function(d) {
      return {
        "Servicio": d.servicio,
        "Tipo": d.tipo,
        "Modalidad": d.modalidad,
        "Desde": d.fecha_inicio,
        "Hasta": d.fecha_fin,
        "Responsable": d.responsable,
        "Contacto": d.contacto,
        "Interno": d.interno || '-',
        "Observaciones": d.observaciones || 'Normal'
      };
    });

    var ws = XLSX.utils.json_to_sheet(filas);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mis_Guardias");

    ws['!cols'] = [
      { wch: 28 }, { wch: 10 }, { wch: 24 }, { wch: 12 }, 
      { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 20 }
    ];

    var etiquetaLimpia = (seleccion === '__TODOS_MIS_SERVICIOS__' ? 'Servicio' : seleccion).replace(/[^a-zA-Z0-9]+/g, '_');
    var nombreArchivo = "Guardias_" + etiquetaLimpia + "_" + dDesde + "_al_" + dHasta + ".xlsx";
    XLSX.writeFile(wb, nombreArchivo);

    if (modalMiPlanillaInstance) modalMiPlanillaInstance.hide();
  } catch(e) {
    alert("Error al descargar planilla: " + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-file-earmark-excel"></i> Descargar Excel (.xlsx)';
    }
  }
}

function abrirModalLogin() {
  if (tokenAdmin) {
    document.getElementById('seccionAdmin').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  document.getElementById('adminPin').value = '';
  document.getElementById('loginError').style.display = 'none';
  modalInstance = new bootstrap.Modal(document.getElementById('modalLogin'));
  modalInstance.show();
}

async function validarPin() {
  var pin = document.getElementById('adminPin').value;
  var btnIngresar = document.querySelector('#modalLogin .btn-primary');
  var lblError = document.getElementById('loginError');

  lblError.style.display = 'none';
  if (!pin) return;

  btnIngresar.disabled = true;
  btnIngresar.innerText = 'Verificando...';

  try {
    var resp = await fetch('validar_admin.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin })
    });
    var res = await resp.json();

    if (resp.ok && res.success) {
      tokenAdmin = res.token || 'admin_ok';
      sessionStorage.setItem("admin_token", tokenAdmin);
      modalInstance.hide();
      activarModoAdmin();
    } else {
      lblError.innerText = res.message || 'PIN incorrecto';
      lblError.style.display = 'block';
    }
  } catch (e) {
    lblError.innerText = 'Error al validar con el servidor.';
    lblError.style.display = 'block';
  } finally {
    btnIngresar.disabled = false;
    btnIngresar.innerText = 'Ingresar';
  }
}

function activarModoAdmin() {
  document.getElementById('seccionAdmin').style.display = 'block';
  document.getElementById('btnAuth').innerHTML = '<i class="bi bi-shield-check text-success"></i> Admin Activo';

  var inputBusqueda = document.getElementById('filtroNombre');
  if (inputBusqueda) {
    inputBusqueda.value = '';
  }

  cargarHistorial();
  cargarAlertas();
  document.getElementById('seccionAdmin').scrollIntoView({ behavior: 'smooth' });
}

function cerrarSesionAdmin() {
  sessionStorage.removeItem("admin_token");
  tokenAdmin = null;
  document.getElementById('seccionAdmin').style.display = 'none';
  document.getElementById('btnAuth').innerHTML = '<i class="bi bi-shield-lock"></i> Administrador';
}

function obtenerTodosLosServicios() {
  var servicios = [];
  if (typeof SERVICIOS_CRITICOS !== 'undefined') servicios.push(...SERVICIOS_CRITICOS);
  if (typeof SERVICIOS_OPERATIVOS !== 'undefined') servicios.push(...SERVICIOS_OPERATIVOS);

  if (Array.isArray(todasLasGuardiasRaw)) {
    todasLasGuardiasRaw.forEach(function(g) {
      if (g.servicio && !servicios.includes(g.servicio)) servicios.push(g.servicio);
    });
  }

  return [...new Set(servicios)]
    .filter(function(s) { return s && s.trim() !== 'UTI'; })
    .sort();
}

// Auditoría de 48 hs ultra-rápida (agrupada por servicio y usando memoria local)
function cargarAlertas() {
  if (!tokenAdmin) return;
  try {
    var ahora = new Date();

    var inicioAuditoria = new Date(ahora);
    if (ahora.getHours() < 8) {
      inicioAuditoria.setDate(inicioAuditoria.getDate() - 1);
    }
    inicioAuditoria.setHours(8, 0, 0, 0);

    var finAuditoriaMs = inicioAuditoria.getTime() + (48 * 60 * 60 * 1000);
    var todosLosServicios = obtenerTodosLosServicios();
    huecosDetectadosGlobal = [];

    // Pre-agrupar las guardias por servicio para no recorrer todo el array en cada paso
    var guardiasPorServicio = {};
    todosLosServicios.forEach(function(s) { guardiasPorServicio[s] = []; });
    todasLasGuardiasRaw.forEach(function(g) {
      if (!guardiasPorServicio[g.servicio]) guardiasPorServicio[g.servicio] = [];
      guardiasPorServicio[g.servicio].push(g);
    });

    var PASO_MS = 30 * 60 * 1000;

    for (var idx = 0; idx < todosLosServicios.length; idx++) {
      var srv = todosLosServicios[idx];
      var guardiasDelServicio = guardiasPorServicio[srv] || [];
      var huecoActual = null;
      var cursorMs = inicioAuditoria.getTime();

      while (cursorMs < finAuditoriaMs) {
        var tiempoMedio = new Date(cursorMs + (PASO_MS / 2));

        var cubierto = (typeof esHorarioPlantaInstitucional === 'function')
          ? esHorarioPlantaInstitucional(srv, tiempoMedio)
          : false;

        if (!cubierto) {
          for (var j = 0; j < guardiasDelServicio.length; j++) {
            if (esGuardiaVigente(guardiasDelServicio[j], tiempoMedio)) {
              cubierto = true;
              break;
            }
          }
        }

        if (!cubierto) {
          if (!huecoActual) {
            huecoActual = {
              servicio: srv,
              inicio: new Date(cursorMs),
              fin: new Date(cursorMs + PASO_MS)
            };
          } else {
            huecoActual.fin = new Date(cursorMs + PASO_MS);
          }
        } else if (huecoActual) {
          huecosDetectadosGlobal.push(huecoActual);
          huecoActual = null;
        }

        cursorMs += PASO_MS;
      }

      if (huecoActual) {
        huecosDetectadosGlobal.push(huecoActual);
      }
    }

    poblarComboFiltroAlertas(todosLosServicios);
    filtrarAlertasPorServicio();

  } catch(e) {
    console.error("Error al auditar descubiertos horarios:", e);
  }
}

function poblarComboFiltroAlertas(servicios) {
  var sel = document.getElementById('filtroServicioAlerta');
  if (!sel) return;
  var valorPrevio = sel.value;
  var html = ['<option value="">Todos los servicios (' + servicios.length + ')</option>'];
  servicios.forEach(function(s) {
    html.push('<option value="' + s + '">' + s + '</option>');
  });
  sel.innerHTML = html.join('');
  if (valorPrevio) sel.value = valorPrevio;
}

function filtrarAlertasPorServicio() {
  var srvFiltro = document.getElementById('filtroServicioAlerta').value;
  if (!srvFiltro) {
    renderizarListaAlertas(huecosDetectadosGlobal);
  } else {
    var filtrados = huecosDetectadosGlobal.filter(function(h) {
      return h.servicio === srvFiltro;
    });
    renderizarListaAlertas(filtrados);
  }
}

function formatearRangoAlerta(inicio, fin) {
  var fIniStr = inicio.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  var hIniStr = inicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  var fFinStr = fin.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  var hFinStr = fin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  var duracionHoras = Math.round((fin - inicio) / (1000 * 60 * 60));

  if (fIniStr === fFinStr) {
    return 'el <strong>' + fIniStr + '</strong> de <u>' + hIniStr + ' a ' + hFinStr + ' hs</u> (' + duracionHoras + ' hs sin cobertura)';
  } else {
    return 'desde el <strong>' + fIniStr + ' ' + hIniStr + ' hs</strong> hasta el <strong>' + fFinStr + ' ' + hFinStr + ' hs</strong> (' + duracionHoras + ' hs sin cobertura)';
  }
}

function renderizarListaAlertas(lista) {
  var cont = document.getElementById('contenedorAlertas');
  var contenedorTexto = document.getElementById('listaHuecos');
  var badge = document.getElementById('badgeCantHuecos');

  if (!cont || !contenedorTexto) return;

  if (badge) badge.innerText = lista.length;

  if (lista.length === 0) {
    var selVal = document.getElementById('filtroServicioAlerta').value;
    if (selVal) {
      contenedorTexto.innerHTML = '<span class="text-success"><i class="bi bi-check-circle me-1"></i> El servicio <strong>' + selVal + '</strong> tiene cobertura completa en las próximas 48 hs.</span>';
      cont.style.display = 'block';
    } else {
      cont.style.display = 'none';
    }
    return;
  }

  contenedorTexto.innerHTML = lista.map(function(h) {
    var descripcion = formatearRangoAlerta(h.inicio, h.fin);
    return '<div class="mb-1 d-flex align-items-center gap-1 flex-wrap">' +
             '<span class="badge bg-danger bg-opacity-75 text-white py-1">' + h.servicio + '</span> ' +
             '<span class="text-light">Sin guardia ' + descripcion + '</span>' +
           '</div>';
  }).join('');

  cont.style.display = 'block';
}

async function cargarHistorial() {
  if (!tokenAdmin || !db) return;
  try {
    var { data, error } = await db
      .from('guardias')
      .select('*')
      .neq('servicio', 'UTI')
      .order('created_at', { ascending: false })
      .limit(350);

    if (error) throw error;

    historialCompleto = (data || []).map(function(d) {
      return {
        id: d.id,
        timestamp: d.created_at ? new Date(d.created_at).toLocaleString() : '',
        servicio: d.servicio,
        tipo: d.tipo,
        modalidad: d.modalidad || 'Semanal/Bloque',
        fechaInicio: d.fecha_inicio,
        fechaFin: d.fecha_fin,
        responsable: d.responsable || '',
        contacto: d.contacto || '',
        interno: d.interno || '',
        observaciones: d.observaciones ? String(d.observaciones).trim() : ''
      };
    });

    llenarComboServicios(historialCompleto);
    ejecutarFiltroHistorial();
  } catch(e) {
    console.error("Error historial:", e);
  }
}

function llenarComboServicios(data) {
  var combo = document.getElementById('filtroServicio');
  var previo = combo.value;
  var servicios = [...new Set(data.map(function(d) { return d.servicio; }))]
    .filter(function(s) { return s && s.trim
