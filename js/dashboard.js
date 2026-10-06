// ==========================================
// CONTROLADOR DEL MONITOR EN VIVO (HIRS OPTIMIZADO)
// ==========================================

function formatearFechaLocalISO(d) {
  var anio = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return anio + '-' + mes + '-' + dia;
}

// -------------------------------------------------------------
// LÓGICA HORARIA Y FILTRO EN TIEMPO REAL
// -------------------------------------------------------------
function esGuardiaVigente(guardia, fechaReferencia) {
  var ahora = fechaReferencia || new Date();
  var ahoraTimestamp = ahora.getTime();

  var fIniStr = String(guardia.fechaInicio || '').slice(0, 10);
  var fFinStr = String(guardia.fechaFin || guardia.fechaInicio || '').slice(0, 10);
  if (!fIniStr) return false;

  var pIni = fIniStr.split('-');
  var pFin = fFinStr.split('-');
  var yIni = parseInt(pIni[0], 10), mIni = parseInt(pIni[1], 10) - 1, dIni = parseInt(pIni[2], 10);
  var yFin = parseInt(pFin[0], 10), mFin = parseInt(pFin[1], 10) - 1, dFin = parseInt(pFin[2], 10);

  var mod = String(guardia.modalidad || '');
  var srv = String(guardia.servicio || '');
  var diaSemana = ahora.getDay();
  var esFinde = (diaSemana === 0 || diaSemana === 6);
  var horaAhora = ahora.getHours();

  // Turnos de 18 hs
  if (mod.indexOf('18 hs') !== -1) {
    if (mod.indexOf('08:00-02:00') !== -1 || mod.indexOf('08:00 a 02:00') !== -1) {
      var ini18_1 = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
      var fin18_1 = new Date(yFin, mFin, dFin, 2, 0, 0, 0);
      fin18_1.setDate(fin18_1.getDate() + 1);
      return ahoraTimestamp >= ini18_1.getTime() && ahoraTimestamp < fin18_1.getTime();
    }
    if (mod.indexOf('14:00-08:00') !== -1 || mod.indexOf('14:00 a 08:00') !== -1) {
      var ini18_2 = new Date(yIni, mIni, dIni, 14, 0, 0, 0);
      var fin18_2 = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
      fin18_2.setDate(fin18_2.getDate() + 1);
      return ahoraTimestamp >= ini18_2.getTime() && ahoraTimestamp < fin18_2.getTime();
    }
  }

  // Turnos de 12 hs
  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1) {
    var hoyStr = formatearFechaLocalISO(ahora);
    if (hoyStr < fIniStr || hoyStr > fFinStr) return false;
    return horaAhora >= 8 && horaAhora < 20;
  }

  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1) {
    var iniNoc = new Date(yIni, mIni, dIni, 20, 0, 0, 0);
    var finNoc = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    finNoc.setDate(finNoc.getDate() + 1);
    if (ahoraTimestamp >= iniNoc.getTime() && ahoraTimestamp < finNoc.getTime()) return true;

    var ayerRef = new Date(ahora);
    ayerRef.setDate(ayerRef.getDate() - 1);
    return (fFinStr === formatearFechaLocalISO(ayerRef) && horaAhora < 8);
  }

  // Turnos de 6 hs
  if (mod.indexOf('6 hs') !== -1) {
    if (mod.indexOf('08:00-14:00') !== -1) {
      var i08 = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
      var f14 = new Date(yFin, mFin, dFin, 14, 0, 0, 0);
      return ahoraTimestamp >= i08.getTime() && ahoraTimestamp < f14.getTime();
    }
    if (mod.indexOf('14:00-20:00') !== -1) {
      var i14 = new Date(yIni, mIni, dIni, 14, 0, 0, 0);
      var f20 = new Date(yFin, mFin, dFin, 20, 0, 0, 0);
      return ahoraTimestamp >= i14.getTime() && ahoraTimestamp < f20.getTime();
    }
    if (mod.indexOf('20:00-02:00') !== -1) {
      var i20 = new Date(yIni, mIni, dIni, 20, 0, 0, 0);
      var f02 = new Date(yFin, mFin, dFin, 2, 0, 0, 0);
      f02.setDate(f02.getDate() + 1);
      return ahoraTimestamp >= i20.getTime() && ahoraTimestamp < f02.getTime();
    }
    if (mod.indexOf('02:00-08:00') !== -1) {
      var i02S = new Date(yIni, mIni, dIni, 2, 0, 0, 0); i02S.setDate(i02S.getDate() + 1);
      var f08S = new Date(yFin, mFin, dFin, 8, 0, 0, 0); f08S.setDate(f08S.getDate() + 1);
      var i02H = new Date(yIni, mIni, dIni, 2, 0, 0, 0);
      var f08H = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
      return (ahoraTimestamp >= i02S.getTime() && ahoraTimestamp < f08S.getTime()) ||
             (ahoraTimestamp >= i02H.getTime() && ahoraTimestamp < f08H.getTime());
    }
  }

  // Base 24 hs (08:00 a 08:00)
  var inicioGen = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
  var finGen = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
  finGen.setDate(finGen.getDate() + 1);

  if (ahoraTimestamp < inicioGen.getTime() || ahoraTimestamp >= finGen.getTime()) {
    return false;
  }

  // Restricción visual de Ecodopler (Visible de 15:00 a 07:00 hs)
  if (srv.indexOf('Ecodopler cardiaco') !== -1) {
    return (horaAhora >= 15 || horaAhora < 7);
  }

  // Horarios de planta vs pasiva lunes a viernes
  if (!esFinde) {
    if (srv.indexOf('Cardiologia') !== -1) {
      if (guardia.tipo === 'Pasiva') return (horaAhora >= 16 || horaAhora < 9);
      return true;
    }
    if (srv === 'Tecnico de Imagenes') return (horaAhora >= 22 || horaAhora < 6);
    if (srv === 'Sistemas') return (horaAhora >= 15 || horaAhora < 8);
    if (srv === 'Electromedicina') return (horaAhora >= 13 || horaAhora < 8);
    if (srv === 'Farmacia') return (horaAhora >= 16 || horaAhora < 8);
    if (srv === 'RX Quirofano') return (horaAhora >= 20 || horaAhora < 8);
  }

  return true;
}

function obtenerFinTurnoGuardia(guardia, fechaReferencia) {
  var ahora = fechaReferencia || new Date();
  var fFinStr = String(guardia.fechaFin || guardia.fechaInicio || '').slice(0, 10);
  if (!fFinStr) return null;

  var pFin = fFinStr.split('-');
  var yFin = parseInt(pFin[0], 10), mFin = parseInt(pFin[1], 10) - 1, dFin = parseInt(pFin[2], 10);
  var yHoy = ahora.getFullYear(), mHoy = ahora.getMonth(), dHoy = ahora.getDate();
  var horaAhora = ahora.getHours();
  var mod = String(guardia.modalidad || '');
  var srv = String(guardia.servicio || '');

  if (srv.indexOf('Ecodopler cardiaco') !== -1) {
    var f07 = new Date(yHoy, mHoy, dHoy, 7, 0, 0, 0);
    if (horaAhora >= 15) f07.setDate(f07.getDate() + 1);
    return f07;
  }

  if (mod.indexOf('18 hs') !== -1) {
    if (mod.indexOf('08:00-02:00') !== -1 || mod.indexOf('08:00 a 02:00') !== -1) {
      var f18_02 = new Date(yFin, mFin, dFin, 2, 0, 0, 0); f18_02.setDate(f18_02.getDate() + 1);
      return f18_02;
    }
    if (mod.indexOf('14:00-08:00') !== -1 || mod.indexOf('14:00 a 08:00') !== -1) {
      var f18_08 = new Date(yFin, mFin, dFin, 8, 0, 0, 0); f18_08.setDate(f18_08.getDate() + 1);
      return f18_08;
    }
  }

  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1) {
    return new Date(yFin, mFin, dFin, 20, 0, 0, 0);
  }
  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1) {
    var finNoc = new Date(yFin, mFin, dFin, 8, 0, 0, 0); finNoc.setDate(finNoc.getDate() + 1);
    return finNoc;
  }

  if (mod.indexOf('08:00-14:00') !== -1) return new Date(yFin, mFin, dFin, 14, 0, 0, 0);
  if (mod.indexOf('14:00-20:00') !== -1) return new Date(yFin, mFin, dFin, 20, 0, 0, 0);
  if (mod.indexOf('20:00-02:00') !== -1) {
    var f02 = new Date(yFin, mFin, dFin, 2, 0, 0, 0); f02.setDate(f02.getDate() + 1);
    return f02;
  }
  if (mod.indexOf('02:00-08:00') !== -1) {
    var f08 = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    if (ahora.getTime() >= f08.getTime()) f08.setDate(f08.getDate() + 1);
    return f08;
  }

  if (srv.indexOf('Cardiologia') !== -1 && guardia.tipo === 'Pasiva') {
    var f09 = new Date(yHoy, mHoy, dHoy, 9, 0, 0, 0);
    if (horaAhora >= 16) f09.setDate(f09.getDate() + 1);
    return f09;
  }

  if (srv === 'Tecnico de Imagenes') {
    var f06 = new Date(yHoy, mHoy, dHoy, 6, 0, 0, 0);
    if (horaAhora >= 22) f06.setDate(f06.getDate() + 1);
    return f06;
  }

  var finStd = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
  finStd.setDate(finStd.getDate() + 1);
  return finStd;
}

function obtenerInicioTurnoGuardia(guardia) {
  var fIniStr = String(guardia.fechaInicio || '').slice(0, 10);
  if (!fIniStr) return null;

  var pIni = fIniStr.split('-');
  var yIni = parseInt(pIni[0], 10), mIni = parseInt(pIni[1], 10) - 1, dIni = parseInt(pIni[2], 10);
  var mod = String(guardia.modalidad || '');
  var srv = String(guardia.servicio || '');
  var horaInicio = 8;

  if (mod.indexOf('18 hs') !== -1) {
    horaInicio = (mod.indexOf('14:00-08:00') !== -1 || mod.indexOf('14:00 a 08:00') !== -1) ? 14 : 8;
  } else if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1 || mod.indexOf('20:00-02:00') !== -1) {
    horaInicio = 20;
  } else if (mod.indexOf('14:00-20:00') !== -1) {
    horaInicio = 14;
  } else if (mod.indexOf('02:00-08:00') !== -1) {
    horaInicio = 2;
  } else if (srv === 'Tecnico de Imagenes') {
    horaInicio = 22;
  } else if (srv === 'Sistemas') {
    horaInicio = 15;
  } else if (srv === 'Electromedicina') {
    horaInicio = 13;
  }

  return new Date(yIni, mIni, dIni, horaInicio, 0, 0, 0);
}

function formatearTiempoRestante(ms) {
  if (ms <= 0) return 'Cambiando ahora';
  var totalMin = Math.floor(ms / 60000);
  var dias = Math.floor(totalMin / 1440);
  var horas = Math.floor((totalMin % 1440) / 60);
  var minutos = totalMin % 60;

  var partes = [];
  if (dias > 0) partes.push(dias + 'd');
  if (horas > 0 || dias > 0) partes.push(horas + 'h');
  partes.push(minutos + 'm');
  return partes.join(' ');
}

// -------------------------------------------------------------
// VARIABLES Y ESTADO
// -------------------------------------------------------------
var tokenAdmin = sessionStorage.getItem("admin_pin") || null;
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
  var elReloj = document.getElementById('reloj');
  if (elReloj) {
    elReloj.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' | ' + now.toLocaleDateString();
  }
  
  segundosDesdeUltimaSync++;
  var elStatus = document.getElementById('syncStatus');
  if (cargandoDatos) {
    if (elStatus) elStatus.innerHTML = '<i class="bi bi-arrow-repeat text-warning"></i> Sincronizando...';
  } else {
    var prox = INTERVALO_REFRESCO_SEG - segundosDesdeUltimaSync;
    if (elStatus) {
      elStatus.innerHTML = '<i class="bi bi-check-circle text-success"></i> Conectado (próximo en ' + (prox > 0 ? prox : 0) + 's)';
    }
  }

  if (segundosDesdeUltimaSync >= INTERVALO_REFRESCO_SEG && !cargandoDatos) {
    segundosDesdeUltimaSync = 0;
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

  if (bTodos) bTodos.blur();
  if (bProf) bProf.blur();
  if (bOper) bOper.blur();

  if (bTodos) bTodos.className = cat === 'todas' ? 'btn btn-switch btn-switch-active flex-fill flex-md-grow-0' : 'btn btn-switch btn-switch-inactive flex-fill flex-md-grow-0';
  if (bProf) bProf.className = cat === 'profesional' ? 'btn btn-switch btn-switch-active flex-fill flex-md-grow-0' : 'btn btn-switch btn-switch-inactive flex-fill flex-md-grow-0';
  if (bOper) bOper.className = cat === 'operativa' ? 'btn btn-switch btn-switch-active flex-fill flex-md-grow-0' : 'btn btn-switch btn-switch-inactive flex-fill flex-md-grow-0';

  renderizarTablasEnVivo(guardiasEnVivo);
}

// -------------------------------------------------------------
// CARGA RÁPIDA DE GUARDIAS
// -------------------------------------------------------------
async function cargarDatos() {
  if (cargandoDatos) return;
  cargandoDatos = true;
  segundosDesdeUltimaSync = 0;

  var elStatus = document.getElementById('syncStatus');
  if (elStatus) elStatus.innerHTML = '<i class="bi bi-arrow-repeat spin text-warning"></i> Actualizando...';

  try {
    if (!db) throw new Error("Base de datos no configurada");

    if (Object.keys(referentesCache).length === 0) {
      cargarReferentesDesdeBD();
    }

    var ahora = new Date();
    var ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);
    var ayerStr = formatearFechaLocalISO(ayer);

    const { data, error } = await db
      .from('guardias')
      .select('id, servicio, tipo, modalidad, fecha_inicio, fecha_fin, responsable, contacto, interno, observaciones')
      .gte('fecha_fin', ayerStr)
      .order('fecha_inicio', { ascending: true });

    if (error) throw error;

    todasLasGuardiasRaw = (data || []).map(function(r) {
      return {
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
    });

    guardiasEnVivo = todasLasGuardiasRaw.filter(function(g) {
      return esGuardiaVigente(g, ahora);
    });

    renderizarTablasEnVivo(guardiasEnVivo);
    cargandoDatos = false;
    if (elStatus) elStatus.innerHTML = '<i class="bi bi-check-circle text-success"></i> Conectado';

  } catch(err) {
    console.error("Error al obtener guardias:", err);
    cargandoDatos = false;
    if (elStatus) elStatus.innerHTML = '<i class="bi bi-exclamation-triangle text-danger"></i> ' + (err.message || 'Error');
  }
}

async function cargarReferentesDesdeBD() {
  try {
    const { data } = await db.from('referentes_servicios').select('*');
    if (data) {
      data.forEach(function(item) {
        referentesCache[item.servicio] = {
          id: item.id,
          nombre: item.nombre_referente,
          contacto: item.contacto
        };
      });
    }
  } catch (e) {
    console.warn("Error cargando referentes:", e);
  }
}

function buscarProximaGuardia(servicioActual, idActual, fechaFinTurnoActual) {
  var umbralTimestamp = new Date().getTime() - 300000;
  var mejorCandidata = null;
  var menorDiff = Infinity;

  for (var i = 0; i < todasLasGuardiasRaw.length; i++) {
    var g = todasLasGuardiasRaw[i];
    if (g.servicio !== servicioActual || g.id === idActual) continue;

    var ini = obtenerInicioTurnoGuardia(g);
    if (!ini) {
      var p = String(g.fechaInicio || '').slice(0, 10).split('-');
      ini = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 8, 0, 0, 0);
    }

    var t = ini.getTime();
    if (t >= umbralTimestamp && t < menorDiff) {
      menorDiff = t;
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
              '<i class="bi bi-whatsapp"></i>' +
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

  html += '<button type="button" class="btn-action-report" onclick="solicitarConfirmacionReporte(' + guardiaObjJson + ')" title="Reportar incidente">' +
            '<i class="bi bi-flag-fill"></i>' +
          '</button>';

  html += '</div>';
  return html;
}

function actualizarContadorChar(textarea) {
  document.getElementById('charCount').innerText = textarea.value.length + '/120';
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
  } catch (err) {
    console.error("Error al registrar incidente:", err);
  }

  if (modalConfirmarInstance) modalConfirmarInstance.hide();
  mostrarContactoReferente(g.servicio);
}

function mostrarContactoReferente(servicio) {
  var ref = referentesCache[servicio] || (typeof REFERENTES_SERVICIOS !== 'undefined' ? REFERENTES_SERVICIOS[servicio] : null) || { nombre: 'Dirección Médica / Guardia Central', contacto: '2914000000' };

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
  if (!tAct || !tPas) return;

  var htmlAct = '';
  var htmlPas = '';
  var activasCount = 0;
  var pasivasCount = 0;
  var listaOperativos = (typeof SERVICIOS_OPERATIVOS !== 'undefined') ? SERVICIOS_OPERATIVOS : [];
  var ahora = new Date();
  var LIMITE_48_HORAS_MS = 172800000;

  for (var i = 0; i < guardias.length; i++) {
    var g = guardias[i];
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

    var fechaFinTurno = obtenerFinTurnoGuardia(g, ahora);
    var msRestantes = fechaFinTurno ? (fechaFinTurno.getTime() - ahora.getTime()) : 0;
    var tiempoRestanteTxt = formatearTiempoRestante(msRestantes);

    var btnDesplegable = '';
    var filaCollapseHtml = '';

    if (msRestantes > 0 && msRestantes <= LIMITE_48_HORAS_MS) {
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

      var collapseId = 'collapseProx_' + (g.id || i);
      btnDesplegable = '<button class="btn btn-sm ' + btnClaseAlerta + ' py-0 px-2 ms-2" type="button" data-bs-toggle="collapse" data-bs-target="#' + collapseId + '" title="Ver próximo turno">' +
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
      htmlAct += row;
      activasCount++;
    } else {
      htmlPas += row;
      pasivasCount++;
    }
  }

  tAct.innerHTML = activasCount > 0 ? htmlAct : '<tr><td colspan="3" class="text-center tabla-vacia"><i class="bi bi-info-circle me-1"></i> Sin guardias activas vigentes.</td></tr>';
  tPas.innerHTML = pasivasCount > 0 ? htmlPas : '<tr><td colspan="3" class="text-center tabla-vacia"><i class="bi bi-info-circle me-1"></i> Sin guardias pasivas vigentes.</td></tr>';
}

// -------------------------------------------------------------
// MAPEADO DE SESIÓN PARA "MI PLANILLA"
// -------------------------------------------------------------
function obtenerServiciosSegunUsuario() {
  var user = (typeof SESION_USUARIO !== 'undefined' ? SESION_USUARIO : '').toLowerCase().trim();
  var nom = (typeof SESION_NOMBRE !== 'undefined' ? SESION_NOMBRE : '').trim();

  // Mapeo para Guardia Externa Adultos
  if (user === 'guardia' || nom.toLowerCase() === 'guardia') {
    return {
      etiqueta: 'Guardia Externa Adultos',
      servicios: ['Guardia externa Adultos']
    };
  }

  // Mapeo para Pediatría y Neonatología
  if (user === 'pediatria' || nom.toLowerCase() === 'pediatria') {
    return {
      etiqueta: 'Pediatría y Neonatología',
      servicios: ['Guardia externa Pediatrica', 'Neonatologia']
    };
  }

  // Mapeo para ECOIMAGENES (Ecodopler cardíaco y pediátrico)
  if (user === 'ecoimagenes' || nom.toLowerCase() === 'ecoimagenes') {
    return {
      etiqueta: 'Ecoimágenes',
      servicios: ['Ecodopler cardiaco', 'Ecodopler cardiaco Pediatrico']
    };
  }
  
  // Mapeo para Anestesia (Anestesista y Técnicos)
  if (user === 'anestesia' || nom.toLowerCase().includes('anestesia')) {
    return {
      etiqueta: 'Anestesiología',
      servicios: ['Anestesista', 'Tecnico de Anestesia']
    };
  }

  // Resto de los servicios por defecto
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

// -------------------------------------------------------------
// PANEL ADMINISTRADOR (SOLO CUANDO SE ACTIVA)
// -------------------------------------------------------------
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

function validarPin() {
  var pin = document.getElementById('adminPin').value;
  var pinCorrecto = (typeof ADMIN_PIN !== 'undefined') ? ADMIN_PIN : "SistemasHirs$$675";
  if (pin === pinCorrecto) {
    tokenAdmin = pin;
    sessionStorage.setItem("admin_pin", pin);
    modalInstance.hide();
    activarModoAdmin();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function activarModoAdmin() {
  document.getElementById('seccionAdmin').style.display = 'block';
  document.getElementById('btnAuth').innerHTML = '<i class="bi bi-shield-check text-success"></i> Admin Activo';

  var inputBusqueda = document.getElementById('filtroNombre');
  if (inputBusqueda) inputBusqueda.value = '';

  cargarHistorial();
  cargarAlertas();
  document.getElementById('seccionAdmin').scrollIntoView({ behavior: 'smooth' });
}

function cerrarSesionAdmin() {
  sessionStorage.removeItem("admin_pin");
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

  return [...new Set(servicios)].sort();
}

async function cargarAlertas() {
  if (!tokenAdmin || !db) return;
  try {
    var ahora = new Date();
    var inicioAuditoria = new Date(ahora);
    if (ahora.getHours() < 8) inicioAuditoria.setDate(inicioAuditoria.getDate() - 1);
    inicioAuditoria.setHours(8, 0, 0, 0);

    var finAuditoria = new Date(inicioAuditoria.getTime() + 172800000);
    var fAyerStr = formatearFechaLocalISO(inicioAuditoria);

    var { data, error } = await db
      .from('guardias')
      .select('id, servicio, tipo, modalidad, fecha_inicio, fecha_fin, responsable, contacto, interno, observaciones')
      .gte('fecha_fin', fAyerStr);

    if (error) throw error;

    var filas = (data || []).map(function(r) {
      return {
        id: r.id,
        servicio: r.servicio,
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
    var PASO_MS = 1800000; // 30 minutos

    todosLosServicios.forEach(function(srv) {
      var huecoActual = null;
      var cursor = new Date(inicioAuditoria);

      while (cursor < finAuditoria) {
        var tiempoMedio = new Date(cursor.getTime() + (PASO_MS / 2));
        var cubierto = filas.some(function(g) {
          if (g.servicio !== srv) return false;
          return esGuardiaVigente(g, tiempoMedio);
        });

        if (!cubierto) {
          if (!huecoActual) {
            huecoActual = { servicio: srv, inicio: new Date(cursor), fin: new Date(cursor.getTime() + PASO_MS) };
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

      if (huecoActual) huecosDetectadosGlobal.push(huecoActual);
    });

    poblarComboFiltroAlertas(todosLosServicios);
    renderizarListaAlertas(huecosDetectadosGlobal);

  } catch(e) {
    console.error("Error auditando alertas:", e);
  }
}

function poblarComboFiltroAlertas(servicios) {
  var sel = document.getElementById('filtroServicioAlerta');
  if (!sel) return;
  var previo = sel.value;
  sel.innerHTML = '<option value="">Todos los servicios (' + servicios.length + ')</option>';
  servicios.forEach(function(s) { sel.innerHTML += '<option value="' + s + '">' + s + '</option>'; });
  if (previo) sel.value = previo;
}

function filtrarAlertasPorServicio() {
  var srvFiltro = document.getElementById('filtroServicioAlerta').value;
  if (!srvFiltro) {
    renderizarListaAlertas(huecosDetectadosGlobal);
  } else {
    renderizarListaAlertas(huecosDetectadosGlobal.filter(function(h) { return h.servicio === srvFiltro; }));
  }
}

function formatearRangoAlerta(inicio, fin) {
  var fIniStr = inicio.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  var hIniStr = inicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  var fFinStr = fin.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  var hFinStr = fin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  var duracionHoras = Math.round((fin - inicio) / 3600000);

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
    return '<div class="mb-1 d-flex align-items-center gap-1 flex-wrap">' +
             '<span class="badge bg-danger bg-opacity-75 text-white py-1">' + h.servicio + '</span> ' +
             '<span class="text-light">Sin guardia ' + formatearRangoAlerta(h.inicio, h.fin) + '</span>' +
           '</div>';
  }).join('');

  cont.style.display = 'block';
}

async function cargarHistorial() {
  if (!tokenAdmin || !db) return;
  try {
    var { data, error } = await db.from('guardias').select('*').order('created_at', { ascending: false });
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
  if (!combo) return;
  var previo = combo.value;
  var servicios = [...new Set(data.map(function(d) { return d.servicio; }))].sort();
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
  if (!tbody) return;
  if (datos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center tabla-vacia"><i class="bi bi-info-circle me-1"></i> No se encontraron guardias con esos filtros.</td></tr>';
    return;
  }

  var html = '';
  for (var i = 0; i < datos.length; i++) {
    var d = datos[i];
    var badgeObsHist = '';
    if (d.observaciones && d.observaciones !== 'Normal Activa') {
      var cB = d.observaciones.toLowerCase().includes('rojo') ? 'bg-danger' : 'bg-warning text-dark';
      badgeObsHist = '<br><span class="badge ' + cB + ' py-0" style="font-size: 0.7rem;">' + d.observaciones + '</span>';
    }

    html += '<tr>' +
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
  }
  tbody.innerHTML = html;
}

async function eliminarFila(id) {
  if (!confirm('¿Seguro que deseas eliminar este registro de guardia?')) return;
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
  XLSX.writeFile(wb, "Reporte_Guardias_HIRS_" + new Date().toISOString().slice(0, 10) + ".xlsx");
}

async function abrirModalJefes() {
  if (!tokenAdmin) return;
  if (!modalJefesInstance) modalJefesInstance = new bootstrap.Modal(document.getElementById('modalJefes'));
  await cargarTablaJefes();
  modalJefesInstance.show();
}

async function cargarTablaJefes() {
  var tbody = document.getElementById('tablaJefesBody');
  var selServ = document.getElementById('jefeSelServicio');
  if (!tbody) return;

  try {
    const { data, error } = await db.from('referentes_servicios').select('*').order('servicio');
    if (error) throw error;

    var lista = data || [];
    var listaServiciosMaestra = obtenerTodosLosServicios();

    if (selServ) {
      selServ.innerHTML = '<option value="">-- Seleccione un Servicio --</option>';
      listaServiciosMaestra.forEach(function(s) { selServ.innerHTML += '<option value="' + s + '">' + s + '</option>'; });
    }

    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center tabla-vacia">No hay jefes registrados aún.</td></tr>';
      return;
    }

    var html = '';
    lista.forEach(function(j) {
      referentesCache[j.servicio] = { id: j.id, nombre: j.nombre_referente, contacto: j.contacto };
      html += '<tr>' +
        '<td class="fw-bold text-info">' + j.servicio + '</td>' +
        '<td>' + j.nombre_referente + '</td>' +
        '<td class="text-warning">' + j.contacto + '</td>' +
        '<td><button class="btn btn-outline-danger btn-sm py-0" onclick="eliminarJefe(' + j.id + ')"><i class="bi bi-trash"></i></button></td>' +
      '</tr>';
    });
    tbody.innerHTML = html;
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Error al conectar.</td></tr>';
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
    alert("Error: " + err.message);
  }
}

async function eliminarJefe(id) {
  if (!confirm("¿Desea eliminar esta jefatura?")) return;
  try {
    const { error } = await db.from('referentes_servicios').delete().eq('id', id);
    if (error) throw error;
    await cargarTablaJefes();
  } catch(err) {
    alert("Error: " + err.message);
  }
}

async function abrirModalIncumplidas() {
  if (!tokenAdmin) return;
  if (!modalIncumplidasInstance) modalIncumplidasInstance = new bootstrap.Modal(document.getElementById('modalIncumplidas'));
  await cargarTablaIncumplidas();
  modalIncumplidasInstance.show();
}

async function cargarTablaIncumplidas() {
  var tbody = document.getElementById('tablaIncumplidasBody');
  if (!tbody) return;

  try {
    const { data, error } = await db.from('guardias_incumplidas').select('*').order('fecha_reporte', { ascending: false });
    if (error) throw error;

    guardiasIncumplidasLista = data || [];
    if (guardiasIncumplidasLista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center tabla-vacia text-success"><i class="bi bi-check-circle me-1"></i> No se han registrado incidentes.</td></tr>';
      return;
    }

    var html = '';
    guardiasIncumplidasLista.forEach(function(item) {
      html += '<tr>' +
        '<td class="text-secondary small">' + (item.fecha_reporte ? new Date(item.fecha_reporte).toLocaleString() : '-') + '</td>' +
        '<td class="fw-bold text-danger">' + item.servicio + '</td>' +
        '<td>' + item.responsable + '</td>' +
        '<td><span class="badge bg-secondary">' + (item.tipo || '-') + '</span></td>' +
        '<td><small>' + (item.modalidad || '-') + '</small></td>' +
        '<td class="text-warning small">' + (item.motivo || 'Reportado') + '</td>' +
        '<td><button class="btn btn-outline-danger btn-sm py-0" onclick="eliminarReporteIncumplido(' + item.id + ')"><i class="bi bi-trash"></i></button></td>' +
      '</tr>';
    });
    tbody.innerHTML = html;
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-danger text-center">Error al conectar.</td></tr>';
  }
}

async function eliminarReporteIncumplido(id) {
  if (!confirm("¿Desea quitar este registro?")) return;
  try {
    const { error } = await db.from('guardias_incumplidas').delete().eq('id', id);
    if (error) throw error;
    await cargarTablaIncumplidas();
  } catch(e) {
    alert("Error: " + e.message);
  }
}

function exportarExcelIncumplidas() {
  if (!guardiasIncumplidasLista || guardiasIncumplidasLista.length === 0) return alert('Sin datos.');
  var filas = guardiasIncumplidasLista.map(function(d) {
    return {
      "Fecha Reporte": d.fecha_reporte ? new Date(d.fecha_reporte).toLocaleString() : '',
      "Servicio": d.servicio || '',
      "Responsable": d.responsable || '',
      "Tipo": d.tipo || '',
      "Modalidad": d.modalidad || '',
      "Incidente": d.motivo || ''
    };
  });
  var ws = XLSX.utils.json_to_sheet(filas);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Incidentes");
  XLSX.writeFile(wb, "Reporte_Incidentes_Guardias_HIRS_" + new Date().toISOString().slice(0, 10) + ".xlsx");
}

async function abrirModalLogs() {
  if (!tokenAdmin) return;
  if (!modalLogsInstance) modalLogsInstance = new bootstrap.Modal(document.getElementById('modalLogs'));
  await cargarTablaLogs();
  modalLogsInstance.show();
}

async function cargarTablaLogs() {
  var tbody = document.getElementById('tablaLogsBody');
  if (!tbody) return;

  try {
    const { data, error } = await db.from('logs_auditoria').select('*').order('fecha_hora', { ascending: false }).limit(100);
    if (error) throw error;

    logsAuditoriaLista = data || [];
    if (logsAuditoriaLista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center tabla-vacia text-success"><i class="bi bi-check-circle me-1"></i> Sin registros.</td></tr>';
      return;
    }

    var html = '';
    logsAuditoriaLista.forEach(function(l) {
      var badgeClass = l.operacion === 'ELIMINAR' ? 'bg-danger' : (l.operacion === 'CREAR' ? 'bg-success' : 'bg-warning text-dark');
      html += '<tr>' +
        '<td class="text-secondary">' + (l.fecha_hora ? new Date(l.fecha_hora).toLocaleString() : '-') + '</td>' +
        '<td><span class="badge ' + badgeClass + '">' + l.operacion + '</span></td>' +
        '<td class="text-secondary">' + (l.registro_id || '-') + '</td>' +
        '<td class="fw-bold text-light">' + (l.servicio || '-') + '</td>' +
        '<td>' + (l.responsable || '-') + '</td>' +
        '<td class="text-info small">Movimiento registrado</td>' +
      '</tr>';
    });
    tbody.innerHTML = html;
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-danger text-center">Error al conectar.</td></tr>';
  }
}

function exportarExcelLogs() {
  if (!logsAuditoriaLista || logsAuditoriaLista.length === 0) return alert('Sin datos.');
  var filas = logsAuditoriaLista.map(function(d) {
    return {
      "ID": d.id,
      "Fecha": d.fecha_hora ? new Date(d.fecha_hora).toLocaleString() : '',
      "Operación": d.operacion || '',
      "Servicio": d.servicio || '',
      "Responsable": d.responsable || ''
    };
  });
  var ws = XLSX.utils.json_to_sheet(filas);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
  XLSX.writeFile(wb, "Logs_Auditoria_Guardias_HIRS_" + new Date().toISOString().slice(0, 10) + ".xlsx");
}

if (tokenAdmin) activarModoAdmin();
cargarDatos();
