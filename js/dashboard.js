// ==========================================
// CONTROLADOR DEL MONITOR EN VIVO (HIRS)
// ==========================================

var tokenAdmin = sessionStorage.getItem("admin_pin") || null;
var historialCompleto = [];
var guardiasEnVivo = [];
var guardiasIncumplidasLista = [];
var referentesCache = {};

var modalInstance = null;
var modalConfirmarInstance = null;
var modalContactoInstance = null;
var modalJefesInstance = null;
var modalIncumplidasInstance = null;

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

// Carga de guardias vigentes y jefaturas dinámicas
async function cargarDatos() {
  if (cargandoDatos) return;
  cargandoDatos = true;
  var elStatus = document.getElementById('syncStatus');
  if (elStatus) elStatus.innerHTML = '<i class="bi bi-arrow-repeat spin text-warning"></i> Actualizando...';

  try {
    if (!db) throw new Error("Base de datos no configurada en js/config.js");

    // Sincronizar jefaturas desde Supabase en background
    await cargarReferentesDesdeBD();

    var ahora = new Date();
    var ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);
    var ayerStr = formatearFechaLocalISO(ayer);

    const { data, error } = await db
      .from('guardias')
      .select('*')
      .gte('fecha_fin', ayerStr);

    if (error) throw error;

    var listaRaw = data || [];
    guardiasEnVivo = listaRaw
      .map(function(r) {
        return {
          id: r.id,
          servicio: r.servicio,
          tipo: r.tipo,
          modalidad: r.modalidad,
          fechaInicio: r.fecha_inicio,
          fechaFin: r.fecha_fin,
          responsable: r.responsable,
          contacto: r.contacto,
          interno: r.interno
        };
      })
      .filter(function(g) {
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

// Obtener jefaturas de la base de datos
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

  // Llamar
  if (limpio) {
    html += '<a href="tel:' + limpio.replace(/\s+/g, '') + '" class="btn-action-tel" title="Llamar">' +
              '<i class="bi bi-telephone-fill"></i> ' + limpio +
            '</a>';
  }

  // WhatsApp
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

  // Interno Hospitalario
  if (interno && String(interno).trim() !== '') {
    html += '<span class="badge-interno" title="Interno hospitalario">' +
              '<i class="bi bi-telephone-inbound"></i> Int. ' + String(interno).trim() +
            '</span>';
  }

  // Botón Reportar Guardia (Abre modal de confirmación)
  var guardiaObjJson = JSON.stringify({
    id: idGuardia,
    servicio: servicio,
    responsable: responsable,
    tipo: tipo,
    modalidad: modalidad
  }).replace(/"/g, '&quot;');

  html += '<button type="button" class="btn-action-report" onclick="solicitarConfirmacionReporte(' + guardiaObjJson + ')" title="Reportar guardia incumplida">' +
            '<i class="bi bi-flag-fill"></i> Reportar' +
          '</button>';

  html += '</div>';
  return html;
}

// -------------------------------------------------------------
// FLUJO: REPORTAR GUARDIA INCUMPLIDA
// -------------------------------------------------------------

function solicitarConfirmacionReporte(guardia) {
  guardiaPendienteReporte = guardia;
  document.getElementById('confRepServicio').innerText = guardia.servicio;
  document.getElementById('confRepResponsable').innerText = guardia.responsable;

  if (!modalConfirmarInstance) {
    modalConfirmarInstance = new bootstrap.Modal(document.getElementById('modalConfirmarReporte'));
  }
  modalConfirmarInstance.show();
}

async function confirmarReporteIncumplimiento() {
  if (!guardiaPendienteReporte) return;
  var g = guardiaPendienteReporte;

  try {
    // 1. Registrar en la tabla guardias_incumplidas
    if (db) {
      await db.from('guardias_incumplidas').insert([{
        guardia_id: g.id || null,
        servicio: g.servicio,
        responsable: g.responsable,
        tipo: g.tipo,
        modalidad: g.modalidad,
        motivo: 'Incumplimiento reportado desde el monitor público'
      }]);
    }

    // 2. Cerrar modal de confirmación
    if (modalConfirmarInstance) modalConfirmarInstance.hide();

    // 3. Abrir el modal con los datos del Jefe de Servicio
    mostrarContactoReferente(g.servicio);

  } catch (err) {
    console.error("Error al registrar incumplimiento:", err);
    if (modalConfirmarInstance) modalConfirmarInstance.hide();
    mostrarContactoReferente(g.servicio);
  }
}

function mostrarContactoReferente(servicio) {
  var ref = referentesCache[servicio];

  // Si no está en BD, buscar en el config estático o valor por defecto
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

  guardias.forEach(function(g) {
    var esOperativo = listaOperativos.includes(g.servicio);
    
    if (filtroCategoriaActual === 'profesional' && esOperativo) return;
    if (filtroCategoriaActual === 'operativa' && !esOperativo) return;

    var btns = generarBotonesContacto(g.contacto, g.servicio, g.responsable, g.interno, g.id, g.tipo, g.modalidad);
    var row = '<tr>' +
      '<td class="fw-bold text-white">' + g.servicio + '</td>' +
      '<td>' + g.responsable + '</td>' +
      '<td>' + btns + '</td>' +
    '</tr>';

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

// -------------------------------------------------------------
// PANEL ADMINISTRADOR
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

async function cargarAlertas() {
  if (!tokenAdmin || !db) return;
  try {
    var hoy = new Date();
    var manana = new Date();
    manana.setDate(manana.getDate() + 1);

    var hoyStr = formatearFechaLocalISO(hoy);
    var mananaStr = formatearFechaLocalISO(manana);

    var { data, error } = await db
      .from('guardias')
      .select('servicio, fecha_inicio, fecha_fin')
      .gte('fecha_fin', hoyStr);

    if (error) throw error;

    var listaCriticos = (typeof SERVICIOS_CRITICOS !== 'undefined') ? SERVICIOS_CRITICOS : [];
    var huecos = [];
    var filas = data || [];

    [hoyStr, mananaStr].forEach(function(fechaEval) {
      listaCriticos.forEach(function(srv) {
        var cubierto = filas.some(function(r) {
          var fIni = String(r.fecha_inicio).slice(0, 10);
          var fFin = String(r.fecha_fin || r.fecha_inicio).slice(0, 10);
          return r.servicio === srv && fechaEval >= fIni && fechaEval <= fFin;
        });

        if (!cubierto) {
          huecos.push({ servicio: srv, fecha: fechaEval });
        }
      });
    });

    var cont = document.getElementById('contenedorAlertas');
    var lista = document.getElementById('listaHuecos');
    if (huecos.length > 0) {
      lista.innerHTML = huecos.map(function(h) {
        return '• <strong>' + h.servicio + '</strong> sin guardia cargada para la fecha: <u>' + h.fecha + '</u>';
      }).join('<br>');
      cont.style.display = 'block';
    } else {
      cont.style.display = 'none';
    }
  } catch(e) {
    console.error("Error al cargar alertas:", e);
  }
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
        interno: d.interno || ''
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
      item.interno.toLowerCase().includes(txt);

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
    tbody.innerHTML += '<tr>' +
      '<td class="text-secondary small">' + d.timestamp + '</td>' +
      '<td class="fw-bold">' + d.servicio + '</td>' +
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
      item.interno.toLowerCase().includes(txt);

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
    { wch: 18 }, { wch: 26 }, { wch: 10 }, { wch: 22 },
    { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 12 }
  ];

  var fechaHoy = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, "Reporte_Guardias_HIRS_" + fechaHoy + ".xlsx");
}

// -------------------------------------------------------------
// GESTIÓN DINÁMICA: JEFES DE SERVICIO
// -------------------------------------------------------------

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

    // Poblar desplegable de servicios en el modal de jefes
    var listaServiciosMaestra = (typeof SERVICIOS_CRITICOS !== 'undefined' && typeof SERVICIOS_OPERATIVOS !== 'undefined')
      ? [...new Set([...SERVICIOS_CRITICOS, ...SERVICIOS_OPERATIVOS])].sort()
      : [];

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

// -------------------------------------------------------------
// AUDITORÍA: GUARDIAS INCUMPLIDAS
// -------------------------------------------------------------

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
  tbody.innerHTML = '<tr><td colspan="7" class="text-center tabla-vacia">Cargando incumplimientos...</td></tr>';

  try {
    const { data, error } = await db
      .from('guardias_incumplidas')
      .select('*')
      .order('fecha_reporte', { ascending: false });

    if (error) throw error;

    guardiasIncumplidasLista = data || [];
    tbody.innerHTML = '';

    if (guardiasIncumplidasLista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center tabla-vacia text-success"><i class="bi bi-check-circle me-1"></i> No se han registrado guardias incumplidas.</td></tr>';
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
    console.error("Error al cargar incumplidas:", e);
    tbody.innerHTML = '<tr><td colspan="7" class="text-danger text-center">Error al conectar con la base de datos.</td></tr>';
  }
}

async function eliminarReporteIncumplido(id) {
  if (!confirm("¿Desea quitar este registro de guardia incumplida?")) return;
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
    alert('No hay registros de guardias incumplidas para exportar.');
    return;
  }

  var filas = guardiasIncumplidasLista.map(function(d) {
    return {
      "Fecha de Reporte": d.fecha_reporte ? new Date(d.fecha_reporte).toLocaleString() : '',
      "Servicio": d.servicio || '',
      "Responsable Reportado": d.responsable || '',
      "Tipo de Guardia": d.tipo || '',
      "Modalidad": d.modalidad || '',
      "Motivo": d.motivo || 'Incumplimiento reportado'
    };
  });

  var ws = XLSX.utils.json_to_sheet(filas);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Incumplidas");

  ws['!cols'] = [
    { wch: 22 }, { wch: 26 }, { wch: 24 }, { wch: 14 }, { wch: 22 }, { wch: 35 }
  ];

  var fechaHoy = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, "Reporte_Guardias_Incumplidas_HIRS_" + fechaHoy + ".xlsx");
}

if (tokenAdmin) activarModoAdmin();
cargarDatos();
