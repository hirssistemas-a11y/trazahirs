// ==========================================
// CONTROLADOR DEL MONITOR EN VIVO (HIRS)
// ==========================================

var tokenAdmin = sessionStorage.getItem("admin_token") || null;
var historialCompleto = [];
var todasLasGuardiasRaw = [];
var guardiasEnVivo = [];
var guardiasIncumplidasLista = [];
var logsAuditoriaLista = [];
var referentesCache = {};
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

function actualizarReloj() {
  var now = new Date();
  document.getElementById('reloj').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' | ' + now.toLocaleDateString();
  
  segundosDesdeUltimaSync++;
  var elStatus = document.getElementById('syncStatus');
  if (cargandoDatos) {
    elStatus.innerHTML = '<i class="bi bi-arrow-repeat text-warning"></i> Sincronizando datos...';
  } else {
    var prox = INTERVALO_REFRESCO_SEG - segundosDesdeUltimaSync;
    elStatus.innerHTML = '<i class="bi bi-check-circle text-success"></i> Actualizado hace ' + segundosDesdeUltimaSync + 's (próximo en ' + (prox > 0 ? prox : 0) + 's)';
  }

  if (segundosDesdeUltimaSync >= INTERVALO_REFRESCO_SEG) {
    cargarDatos();
  }
}
setInterval(actualizarReloj, 1000);
actualizarReloj();

function forzarRefresco() {
  cargarDatos();
  if (tokenAdmin) {
    cargarHistorial();
    cargarAlertas();
  }
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

async function cargarDatos() {
  if (cargandoDatos) return;
  cargandoDatos = true;
  var elStatus = document.getElementById('syncStatus');
  if (elStatus) elStatus.innerHTML = '<i class="bi bi-arrow-repeat spin text-warning"></i> Actualizando...';

  try {
    if (!db) throw new Error("Base de datos no configurada en js/config.js");

    await cargarReferentesDesdeBD();

    var ahora = new Date();
    var ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);
    var ayerStr = formatearFechaLocalISO(ayer);

    const { data, error } = await db
      .from('guardias')
      .select('*')
      .gte('fecha_fin', ayerStr)
      .order('fecha_inicio', { ascending: true });

    if (error) throw error;

    todasLasGuardiasRaw = (data || []).map(function(r) {
      // Si hubiera registros viejos guardados como "UTI", se normalizan a "Terapia Intensiva (UTI)"
      var srvNormalizado = (r.servicio && r.servicio.trim() === 'UTI') ? 'Terapia Intensiva (UTI)' : r.servicio;
      return {
        id: r.id,
        servicio: srvNormalizado,
        tipo: r.tipo,
        modalidad: r.modalidad,
        fechaInicio: r.fecha_inicio,
        fechaFin: r.fecha_fin,
        responsable: r.responsable,
        contacto: r.contacto,
        interno: r.interno,
        observaciones: r.observaciones ? String(r.observaciones).trim() : null
      };
    });

    guardiasEnVivo = todasLasGuardiasRaw.filter(function(g) {
      return typeof esGuardiaVigente === 'function' ? esGuardiaVigente(g, ahora) : true;
    });

    renderizarTablasEnVivo(guardiasEnVivo);
    cargandoDatos = false;
    segundosDesdeUltimaSync = 0;
    if (elStatus) elStatus.innerHTML = '<i class="bi bi-check-circle text-success"></i> Conectado';

  } catch(err) {
    console.error("Error al obtener guardias:", err);
    cargandoDatos = false;
    segundosDesdeUltimaSync = 0;
    if (elStatus) elStatus.innerHTML = '<i class="bi bi-exclamation-triangle text-danger"></i> ' + (err.message || 'Error de conexión');
  }

  if (tokenAdmin) {
    cargarHistorial();
    cargarAlertas();
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
    }
  } catch (e) {
    console.warn("No se pudo cargar referentes_servicios:", e);
  }
}

function buscarProximaGuardia(servicioActual, idActual, fechaFinTurnoActual) {
  var ahoraTimestamp = new Date().getTime();
  var umbralTimestamp = ahoraTimestamp;

  var candidatas = todasLasGuardiasRaw.filter(function(g) {
    if (g.servicio !== servicioActual || g.id === idActual) return false;

    var inicioTurno = typeof obtenerInicioTurnoGuardia === 'function' 
      ? obtenerInicioTurnoGuardia(g) 
      : null;

    if (!inicioTurno) {
      var fIniStr = String(g.fechaInicio || '').slice(0, 10);
      var p = fIniStr.split('-');
      inicioTurno = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 8, 0, 0, 0);
    }

    return inicioTurno.getTime() >= (umbralTimestamp - 5 * 60 * 1000);
  });

  if (candidatas.length === 0) return null;

  candidatas.sort(function(a, b) {
    var iniA = typeof obtenerInicioTurnoGuardia === 'function' ? obtenerInicioTurnoGuardia(a) : new Date(a.fechaInicio);
    var iniB = typeof obtenerInicioTurnoGuardia === 'function' ? obtenerInicioTurnoGuardia(b) : new Date(b.fechaInicio);
    return iniA.getTime() - iniB.getTime();
  });

  return candidatas[0];
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
  cont.innerHTML = '';

  var limpio = String(ref.contacto || '').trim();
  var wsp = normalizarWhatsApp(limpio);

  if (limpio) {
    cont.innerHTML += '<a href="tel:' + limpio.replace(/\s+/g, '') + '" class="btn-action-tel fs-6 py-1 px-3">' +
                        '<i class="bi bi-telephone-fill me-1"></i> Llamar: ' + limpio +
                      '</a>';
  }

  if (wsp) {
    var msg = encodeURIComponent('Hola ' + (ref.nombre || 'Jefe de Servicio') + ', me comunico para notificar una novedad sobre la guardia de ' + servicio + ' en el Hospital Italiano.');
    var esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    var urlWsp = esMovil ? 'https://wa.me/' + wsp + '?text=' + msg : 'https://web.whatsapp.com/send?phone=' + wsp + '&text=' + msg;

    cont.innerHTML += '<a href="' + urlWsp + '" target="_blank" rel="noopener noreferrer" class="btn-action-wsp fs-6 py-1 px-3">' +
                        '<i class="bi bi-whatsapp me-1"></i> WhatsApp' +
                      '</a>';
  }

  if (!modalContactoInstance) {
    modalContactoInstance = new bootstrap.Modal(document.getElementById('modalContactoReferente'));
  }
  modalContactoInstance.show();
}

function renderizarTablasEnVivo(guardias) {
  var tAct = document.getElementById('tablaActivas');
  var tPas = document.getElementById('tablaPasivas');
  tAct.innerHTML = '';
  tPas.innerHTML = '';

  var activasCount = 0;
  var pasivasCount = 0;
  var listaOperativos = (typeof SERVICIOS_OPERATIVOS !== 'undefined') ? SERVICIOS_OPERATIVOS : [];
  var ahora = new Date();

  guardias.forEach(function(g, index) {
    var esOperativo = listaOperativos.includes(g.servicio);
    if (filtroCategoriaActual === 'profesional' && esOperativo) return;
    if (filtroCategoriaActual === 'operativa' && !esOperativo) return;

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
    var msRestantes = fechaFinTurno ? (fechaFinTurno.getTime() - ahora.getTime()) : 0;
    var tiempoRestanteTxt = typeof formatearTiempoRestante === 'function' ? formatearTiempoRestante(msRestantes) : '-';

    var LIMITE_48_HORAS_MS = 48 * 60 * 60 * 1000;
    var mostrarDesplegable = (msRestantes > 0 && msRestantes <= LIMITE_48_HORAS_MS);

    var btnDesplegable = '';
    var filaCollapseHtml = '';

    if (mostrarDesplegable) {
      var prox = buscarProximaGuardia(g.servicio, g.id, fechaFinTurno);
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
      tAct.innerHTML += row;
      activasCount++;
    } else {
      tPas.innerHTML += row;
      pasivasCount++;
    }
  });

  if (activasCount === 0) {
    tAct.innerHTML = '<tr><td colspan="3" class="text-center tabla-vacia"><i class="bi bi-info-circle me-1"></i> Sin guardias activas para la vista seleccionada.</td></tr>';
  }
  if (pasivasCount === 0) {
    tPas.innerHTML = '<tr><td colspan="3" class="text-center tabla-vacia"><i class="bi bi-info-circle me-1"></i> Sin guardias pasivas a demanda para la vista seleccionada.</td></tr>';
  }
}

function obtenerServiciosSegunUsuario() {
  var user = (typeof SESION_USUARIO !== 'undefined' ? SESION_USUARIO : '').toLowerCase().trim();
  var nom = (typeof SESION_NOMBRE !== 'undefined' ? SESION_NOMBRE : '').trim();

  if (user === 'guardia' || nom.toLowerCase() === 'guardia') {
    return {
      etiqueta: 'Guardia Externa Adultos',
      servicios: ['Guardia externa Adultos']
    };
  }

  if (user === 'pediatria' || nom.toLowerCase() === 'pediatria') {
    return {
      etiqueta: 'Pediatría y Neonatología',
      servicios: ['Guardia externa Pediatrica', 'Neonatologia', 'Pediatria', 'Terapia Intensiva Pediatrica (UTIP)']
    };
  }

  if (user.includes('ecoimagenes') || nom.toLowerCase().includes('ecoimagenes')) {
    return {
      etiqueta: 'Ecoimágenes / Ecodoppler',
      servicios: ['Ecodopler cardiaco', 'Ecodopler cardiaco Pediatrico', 'Ecografia']
    };
  }

  var nombreFinal = nom || user || 'Mi Servicio';
  return {
    etiqueta: nombreFinal,
    servicios: [nombreFinal]
  };
}

function abrirModalMiPlanilla() {
  if (!modalMiPlanillaInstance) {
    modalMiPlanillaInstance = new bootstrap.Modal(document.getElementById('modalMiPlanilla'));
  }
  
  var hoy = new Date();
  var primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  var ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);

  var mapeo = obtenerServiciosSegunUsuario();
  document.getElementById('miServicioNombre').value = mapeo.etiqueta;
  document.getElementById('miPlanillaDesde').value = primerDia;
  document.getElementById('miPlanillaHasta').value = ultimoDia;

  modalMiPlanillaInstance.show();
}

async function exportarExcelMiServicio() {
  var dDesde = document.getElementById('miPlanillaDesde').value;
  var dHasta = document.getElementById('miPlanillaHasta').value;
  var mapeo = obtenerServiciosSegunUsuario();

  try {
    let query = db.from('guardias').select('*');

    if (mapeo.servicios.length > 1) {
      query = query.in('servicio', mapeo.servicios);
    } else {
      query = query.ilike('servicio', '%' + mapeo.servicios[0] + '%');
    }
    
    if (dDesde) query = query.gte('fecha_inicio', dDesde);
    if (dHasta) query = query.lte('fecha_fin', dHasta);

    const { data, error } = await query.order('fecha_inicio', { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) {
      alert('No se encontraron guardias registradas para ' + mapeo.etiqueta + ' en el rango de fechas seleccionado.');
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
      { wch: 26 }, { wch: 10 }, { wch: 22 }, { wch: 12 }, 
      { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 20 }
    ];

    var nombreArchivo = "Guardias_" + mapeo.etiqueta.replace(/[\s\/]+/g, '_') + "_" + dDesde + "_al_" + dHasta + ".xlsx";
    XLSX.writeFile(wb, nombreArchivo);

    if (modalMiPlanillaInstance) modalMiPlanillaInstance.hide();
  } catch(e) {
    alert("Error al descargar planilla: " + e.message);
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

// Validación de PIN en el backend (Sin contraseña expuesta en JS)
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

  // Filtramos "UTI" suelto para que solo exista "Terapia Intensiva (UTI)"
  return [...new Set(servicios)]
    .filter(function(s) { return s.trim() !== 'UTI'; })
    .sort();
}

async function cargarAlertas() {
  if (!tokenAdmin || !db) return;
  try {
    var ahora = new Date();

    var inicioAuditoria = new Date(ahora);
    if (ahora.getHours() < 8) {
      inicioAuditoria.setDate(inicioAuditoria.getDate() - 1);
    }
    inicioAuditoria.setHours(8, 0, 0, 0);

    var finAuditoria = new Date(inicioAuditoria.getTime() + 48 * 60 * 60 * 1000);

    var fAyerStr = formatearFechaLocalISO(inicioAuditoria);
    var { data, error } = await db
      .from('guardias')
      .select('*')
      .gte('fecha_fin', fAyerStr);

    if (error) throw error;

    var filas = (data || []).map(function(r) {
      var srvNorm = (r.servicio && r.servicio.trim() === 'UTI') ? 'Terapia Intensiva (UTI)' : r.servicio;
      return {
        id: r.id,
        servicio: srvNorm,
        tipo: r.tipo,
        modalidad: r.modalidad,
        fechaInicio: r.fecha_inicio,
        fechaFin: r.fecha_fin,
        responsable: r.responsable,
        contacto: r.contacto,
        interno: r.interno,
        observaciones: r.observaciones
      };
    });

    var todosLosServicios = obtenerTodosLosServicios();
    huecosDetectadosGlobal = [];

    var PASO_MINUTOS = 30;
    var PASO_MS = PASO_MINUTOS * 60 * 1000;

    todosLosServicios.forEach(function(srv) {
      var huecoActual = null;
      var cursor = new Date(inicioAuditoria);

      while (cursor < finAuditoria) {
        var tiempoMedio = new Date(cursor.getTime() + (PASO_MS / 2));

        // 1. Primero verificamos si es horario de trabajo de planta en el hospital (ej. Farmacia 8-16, Sistemas 8-15)
        var cubierto = (typeof esHorarioPlantaInstitucional === 'function')
          ? esHorarioPlantaInstitucional(srv, tiempoMedio)
          : false;

        // 2. Si no es horario de planta, verificamos si hay una guardia cargada que cubra esa hora
        if (!cubierto) {
          cubierto = filas.some(function(g) {
            if (g.servicio !== srv) return false;
            return typeof guardiaCubreHoraAuditoria === 'function' 
              ? guardiaCubreHoraAuditoria(g, tiempoMedio) 
              : (typeof esGuardiaVigente === 'function' ? esGuardiaVigente(g, tiempoMedio) : true);
          });
        }

        if (!cubierto) {
          if (!huecoActual) {
            huecoActual = {
              servicio: srv,
              inicio: new Date(cursor),
              fin: new Date(cursor.getTime() + PASO_MS)
            };
          } else {
            huecoActual.fin = new Date(cursor.getTime() + PASO_MS);
          }
        } else {
          if (huecoActual) {
            huecosDetectadosGlobal.push(huecoActual);
            huecoActual = null;
          }
        }

        cursor = new Date(cursor.getTime() + PASO_MS);
      }

      if (huecoActual) {
        huecosDetectadosGlobal.push(huecoActual);
      }
    });

    poblarComboFiltroAlertas(todosLosServicios);
    renderizarListaAlertas(huecosDetectadosGlobal);

  } catch(e) {
    console.error("Error al auditar descubiertos horarios:", e);
  }
}

function poblarComboFiltroAlertas(servicios) {
  var sel = document.getElementById('filtroServicioAlerta');
  if (!sel) return;
  var valorPrevio = sel.value;
  sel.innerHTML = '<option value="">Todos los servicios (' + servicios.length + ')</option>';
  servicios.forEach(function(s) {
    sel.innerHTML += '<option value="' + s + '">' + s + '</option>';
  });
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
      .order('created_at', { ascending: false });

    if (error) throw error;

    historialCompleto = (data || []).map(function(d) {
      var srvNorm = (d.servicio && d.servicio.trim() === 'UTI') ? 'Terapia Intensiva (UTI)' : d.servicio;
      return {
        id: d.id,
        timestamp: d.created_at ? new Date(d.created_at).toLocaleString() : '',
        servicio: srvNorm,
        tipo: d.tipo,
        modalidad: d.modalidad || 'Semanal/Bloque',
        fechaInicio: d.fecha_inicio,
        fechaFin: d.fecha_fin,
        responsable: d.responsable,
        contacto: d.contacto,
        interno: d.interno || '',
        observaciones: d.observaciones ? String(d.observaciones).trim() : ''
      };
    });

    llenarComboServicios(historialCompleto);
    filtrarHistorial();
  } catch(e) {
    console.error("Error historial:", e);
  }
}

function llenarComboServicios(data) {
  var combo = document.getElementById('filtroServicio');
  var previo = combo.value;
  var servicios = [...new Set(data.map(function(d) { return d.servicio; }))]
    .filter(function(s) { return s && s.trim() !== 'UTI'; })
    .sort();
  combo.innerHTML = '<option value="">Todos los servicios</option>';
  servicios.forEach(function(s) { combo.innerHTML += '<option value="' + s + '">' + s + '</option>'; });
  if (previo) combo.value = previo;
}

function filtrarHistorial() {
  var txt = document.getElementById('filtroNombre').value.toLowerCase();
  var serv = document.getElementById('filtroServicio').value;
  var dDesde = document.getElementById('filtroDesde').value;
  var dHasta = document.getElementById('filtroHasta').value;

  var filtrados = historialCompleto.filter(function(item) {
    var coincideTxt = !txt || 
      item.responsable.toLowerCase().includes(txt) || 
      item.contacto.toLowerCase().includes(txt) ||
      item.interno.toLowerCase().includes(txt) ||
      item.observaciones.toLowerCase().includes(txt);

    var coincideServ = !serv || item.servicio === serv;
    var coincideDesde = !dDesde || item.fechaInicio >= dDesde;
    var coincideHasta = !dHasta || item.fechaFin <= dHasta;
    return coincideTxt && coincideServ && coincideDesde && coincideHasta;
  });

  renderizarTablaHistorial(filtrados);
}

function renderizarTablaHistorial(datos) {
  var tbody = document.getElementById('tablaHistorial');
  tbody.innerHTML = '';
  if (datos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center tabla-vacia"><i class="bi bi-info-circle me-1"></i> No se encontraron guardias con esos filtros.</td></tr>';
    return;
  }
  datos.forEach(function(d) {
    var badgeObsHist = '';
    if (d.observaciones && d.observaciones !== 'Normal Activa') {
      var cB = d.observaciones.toLowerCase().includes('rojo') ? 'bg-danger' : 'bg-warning text-dark';
      badgeObsHist = '<br><span class="badge ' + cB + ' py-0" style="font-size: 0.7rem;">' + d.observaciones + '</span>';
    }

    tbody.innerHTML += '<tr>' +
      '<td class="text-secondary small">' + d.timestamp + '</td>' +
      '<td class="fw-bold text-white">' + d.servicio + badgeObsHist + '</td>' +
      '<td><span class="badge ' + (d.tipo === 'Activa' ? 'bg-success' : 'bg-primary') + '">' + d.tipo + '</span></td>' +
      '<td><small>' + d.modalidad + '</small></td>' +
      '<td>' + d.fechaInicio + ' al ' + d.fechaFin + '</td>' +
      '<td>' + d.responsable + '</td>' +
      '<td class="text-warning">' + d.contacto + '</td>' +
      '<td>' + (d.interno ? '<span class="badge bg-secondary">Int. ' + d.interno + '</span>' : '-') + '</td>' +
      '<td>' +
        '<button class="btn btn-outline-danger btn-sm py-0" onclick="eliminarFila(' + d.id + ')">' +
          '<i class="bi bi-trash"></i>' +
        '</button>' +
      '</td>' +
    '</tr>';
  });
}

async function eliminarFila(id) {
  if (!confirm('¿Seguro que deseas eliminar este registro de guardia? Quedará registrado en el log de auditoría.')) return;
  try {
    var { error } = await db.from('guardias').delete().eq('id', id);
    if (error) throw error;
    cargarHistorial();
    cargarAlertas();
    cargarDatos();
  } catch(e) {
    alert("Error al eliminar: " + e.message);
  }
}

function exportarExcelFiltrado() {
  var txt = document.getElementById('filtroNombre').value.toLowerCase();
  var serv = document.getElementById('filtroServicio').value;
  var dDesde = document.getElementById('filtroDesde').value;
  var dHasta = document.getElementById('filtroHasta').value;

  var filtrados = historialCompleto.filter(function(item) {
    var coincideTxt = !txt || 
      item.responsable.toLowerCase().includes(txt) || 
      item.contacto.toLowerCase().includes(txt) ||
      item.interno.toLowerCase().includes(txt) ||
      item.observaciones.toLowerCase().includes(txt);

    var coincideServ = !serv || item.servicio === serv;
    var coincideDesde = !dDesde || item.fechaInicio >= dDesde;
    var coincideHasta = !dHasta || item.fechaFin <= dHasta;
    return coincideTxt && coincideServ && coincideDesde && coincideHasta;
  });

  if (filtrados.length === 0) {
    alert('No hay datos visibles con los filtros actuales para exportar.');
    return;
  }

  var filasExcel = filtrados.map(function(d) {
    return {
      "Fecha Carga": d.timestamp || '',
      "Servicio": d.servicio || '',
      "Observaciones": d.observaciones || 'Normal Activa',
      "Tipo": d.tipo || '',
      "Modalidad": d.modalidad || '',
      "Desde": d.fechaInicio || '',
      "Hasta": d.fechaFin || '',
      "Responsable": d.responsable || '',
      "WhatsApp / Móvil": d.contacto || '',
      "Interno": d.interno || ''
    };
  });

  var ws = XLSX.utils.json_to_sheet(filasExcel);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Guardias");

  ws['!cols'] = [
    { wch: 18 }, { wch: 26 }, { wch: 18 }, { wch: 10 }, { wch: 22 },
    { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 12 }
  ];

  var fechaHoy = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, "Reporte_Guardias_HIRS_" + fechaHoy + ".xlsx");
}

async function abrirModalJefes() {
  if (!tokenAdmin) return;
  if (!modalJefesInstance) {
    modalJefesInstance = new bootstrap.Modal(document.getElementById('modalJefes'));
  }
  await cargarTablaJefes();
  modalJefesInstance.show();
}

async function cargarTablaJefes() {
  var tbody = document.getElementById('tablaJefesBody');
  var selServ = document.getElementById('jefeSelServicio');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center tabla-vacia">Cargando jefaturas...</td></tr>';

  try {
    const { data, error } = await db.from('referentes_servicios').select('*').order('servicio');
    if (error) throw error;

    var lista = data || [];
    tbody.innerHTML = '';

    var listaServiciosMaestra = obtenerTodosLosServicios();

    selServ.innerHTML = '<option value="">-- Seleccione un Servicio --</option>';
    listaServiciosMaestra.forEach(function(s) {
      selServ.innerHTML += '<option value="' + s + '">' + s + '</option>';
    });

    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center tabla-vacia">No hay jefes registrados aún.</td></tr>';
      return;
    }

    lista.forEach(function(j) {
      referentesCache[j.servicio] = { id: j.id, nombre: j.nombre_referente, contacto: j.contacto };
      tbody.innerHTML += '<tr>' +
        '<td class="fw-bold text-info">' + j.servicio + '</td>' +
        '<td>' + j.nombre_referente + '</td>' +
        '<td class="text-warning">' + j.contacto + '</td>' +
        '<td>' +
          '<button class="btn btn-outline-danger btn-sm py-0" onclick="eliminarJefe(' + j.id + ')" title="Eliminar">' +
            '<i class="bi bi-trash"></i>' +
          '</button>' +
        '</td>' +
      '</tr>';
    });

  } catch(e) {
    console.error("Error al cargar jefes:", e);
    tbody.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Error al conectar con la base de datos.</td></tr>';
  }
}

async function guardarJefeServicio(e) {
  e.preventDefault();
  var srv = document.getElementById('jefeSelServicio').value;
  var nom = document.getElementById('jefeNombre').value.trim();
  var tel = document.getElementById('jefeContacto').value.trim();

  if (!srv || !nom || !tel) return;

  try {
    const { error } = await db.from('referentes_servicios').upsert(
      { servicio: srv, nombre_referente: nom, contacto: tel },
      { onConflict: 'servicio' }
    );
    if (error) throw error;

    document.getElementById('formJefe').reset();
    await cargarTablaJefes();
  } catch(err) {
    alert("Error al guardar jefe: " + err.message);
  }
}

async function eliminarJefe(id) {
  if (!confirm("¿Desea eliminar esta jefatura?")) return;
  try {
    const { error } = await db.from('referentes_servicios').delete().eq('id', id);
    if (error) throw error;
    await cargarTablaJefes();
  } catch(err) {
    alert("Error al eliminar: " + err.message);
  }
}

async function abrirModalIncumplidas() {
  if (!tokenAdmin) return;
  if (!modalIncumplidasInstance) {
    modalIncumplidasInstance = new bootstrap.Modal(document.getElementById('modalIncumplidas'));
  }
  await cargarTablaIncumplidas();
  modalIncumplidasInstance.show();
}

async function cargarTablaIncumplidas() {
  var tbody = document.getElementById('tablaIncumplidasBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center tabla-vacia">Cargando incidentes...</td></tr>';

  try {
    const { data, error } = await db
      .from('guardias_incumplidas')
      .select('*')
      .order('fecha_reporte', { ascending: false });

    if (error) throw error;

    guardiasIncumplidasLista = data || [];
    tbody.innerHTML = '';

    if (guardiasIncumplidasLista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center tabla-vacia text-success"><i class="bi bi-check-circle me-1"></i> No se han registrado incidentes de guardia.</td></tr>';
      return;
    }

    guardiasIncumplidasLista.forEach(function(item) {
      var fRep = item.fecha_reporte ? new Date(item.fecha_reporte).toLocaleString() : '-';
      tbody.innerHTML += '<tr>' +
        '<td class="text-secondary small">' + fRep + '</td>' +
        '<td class="fw-bold text-danger">' + item.servicio + '</td>' +
        '<td>' + item.responsable + '</td>' +
        '<td><span class="badge bg-secondary">' + (item.tipo || '-') + '</span></td>' +
        '<td><small>' + (item.modalidad || '-') + '</small></td>' +
        '<td class="text-warning small">' + (item.motivo || 'Reportado') + '</td>' +
        '<td>' +
          '<button class="btn btn-outline-danger btn-sm py-0" onclick="eliminarReporteIncumplido(' + item.id + ')">' +
            '<i class="bi bi-trash"></i>' +
          '</button>' +
        '</td>' +
      '</tr>';
    });

  } catch(e) {
    console.error("Error al cargar incidentes:", e);
    tbody.innerHTML = '<tr><td colspan="7" class="text-danger text-center">Error al conectar con la base de datos.</td></tr>';
  }
}

async function eliminarReporteIncumplido(id) {
  if (!confirm("¿Desea quitar este registro de incidente de guardia?")) return;
  try {
    const { error } = await db.from('guardias_incumplidas').delete().eq('id', id);
    if (error) throw error;
    await cargarTablaIncumplidas();
  } catch(e) {
    alert("Error al eliminar: " + e.message);
  }
}

function exportarExcelIncumplidas() {
  if (!guardiasIncumplidasLista || guardiasIncumplidasLista.length === 0) {
    alert('No hay registros de incidentes de guardia para exportar.');
    return;
  }

  var filas = guardiasIncumplidasLista.map(function(d) {
    return {
      "Fecha de Reporte": d.fecha_reporte ? new Date(d.fecha_reporte).toLocaleString() : '',
      "Servicio": d.servicio || '',
      "Responsable Reportado": d.responsable || '',
      "Tipo de Guardia": d.tipo || '',
      "Modalidad": d.modalidad || '',
      "Detalle / Incidente": d.motivo || 'Incidente reportado'
    };
  });

  var ws = XLSX.utils.json_to_sheet(filas);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Incidentes");

  ws['!cols'] = [
    { wch: 22 }, { wch: 26 }, { wch: 24 }, { wch: 14 }, { wch: 22 }, { wch: 40 }
  ];

  var fechaHoy = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, "Reporte_Incidentes_Guardias_HIRS_" + fechaHoy + ".xlsx");
}

async function abrirModalLogs() {
  if (!tokenAdmin) return;
  if (!modalLogsInstance) {
    modalLogsInstance = new bootstrap.Modal(document.getElementById('modalLogs'));
  }
  await cargarTablaLogs();
  modalLogsInstance.show();
}

async function cargarTablaLogs() {
  var tbody = document.getElementById('tablaLogsBody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center tabla-vacia">Cargando registros de auditoría...</td></tr>';

  try {
    const { data, error } = await db
      .from('logs_auditoria')
      .select('*')
      .order('fecha_hora', { ascending: false })
      .limit(200);

    if (error) throw error;

    logsAuditoriaLista = data || [];
    tbody.innerHTML = '';

    if (logsAuditoriaLista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center tabla-vacia text-success"><i class="bi bi-check-circle me-1"></i> No se han registrado movimientos en la base de datos.</td></tr>';
      return;
    }

    logsAuditoriaLista.forEach(function(l) {
      var fHora = l.fecha_hora ? new Date(l.fecha_hora).toLocaleString() : '-';
      var badgeClass = 'bg-secondary';
      if (l.operacion === 'ELIMINAR') badgeClass = 'bg-danger';
      if (l.operacion === 'CREAR') badgeClass = 'bg-success';
      if (l.operacion === 'ACTUALIZAR') badgeClass = 'bg-warning text-dark';

      var detalle = '';
      if (l.operacion === 'ELIMINAR') {
        var ant = l.datos_anteriores || {};
        detalle = 'Se eliminó guardia del ' + (ant.fecha_inicio || '?') + ' al ' + (ant.fecha_fin || '?') + ' (' + (ant.modalidad || '') + ')';
      } else if (l.operacion === 'CREAR') {
        var nvo = l.datos_nuevos || {};
        detalle = 'Alta asignada para: ' + (nvo.fecha_inicio || '?') + ' al ' + (nvo.fecha_fin || '?') + ' | ' + (nvo.modalidad || '');
      } else {
        detalle = 'Modificación de registro';
      }

      tbody.innerHTML += '<tr>' +
        '<td class="text-secondary">' + fHora + '</td>' +
        '<td><span class="badge ' + badgeClass + '">' + l.operacion + '</span></td>' +
        '<td class="text-secondary">' + (l.registro_id || '-') + '</td>' +
        '<td class="fw-bold text-light">' + (l.servicio || '-') + '</td>' +
        '<td>' + (l.responsable || '-') + '</td>' +
        '<td class="text-info small">' + detalle + '</td>' +
      '</tr>';
    });

  } catch(e) {
    console.error("Error al cargar logs:", e);
    tbody.innerHTML = '<tr><td colspan="6" class="text-danger text-center">Error al conectar con la base de datos de auditoría.</td></tr>';
  }
}

function exportarExcelLogs() {
  if (!logsAuditoriaLista || logsAuditoriaLista.length === 0) {
    alert('No hay registros de auditoría para exportar.');
    return;
  }

  var filas = logsAuditoriaLista.map(function(d) {
    var ant = d.datos_anteriores ? JSON.stringify(d.datos_anteriores) : '';
    var nvo = d.datos_nuevos ? JSON.stringify(d.datos_nuevos) : '';

    return {
      "ID Log": d.id,
      "Fecha y Hora": d.fecha_hora ? new Date(d.fecha_hora).toLocaleString() : '',
      "Operación": d.operacion || '',
      "Tabla": d.tabla_afectada || '',
      "ID Registro": d.registro_id || '',
      "Servicio": d.servicio || '',
      "Responsable": d.responsable || '',
      "Datos Anteriores (JSON)": ant,
      "Datos Nuevos (JSON)": nvo
    };
  });

  var ws = XLSX.utils.json_to_sheet(filas);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Auditoria");

  ws['!cols'] = [
    { wch: 10 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, 
    { wch: 12 }, { wch: 26 }, { wch: 24 }, { wch: 35 }, { wch: 35 }
  ];

  var fechaHoy = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, "Logs_Auditoria_Guardias_HIRS_" + fechaHoy + ".xlsx");
}

if (tokenAdmin) activarModoAdmin();
cargarDatos();
