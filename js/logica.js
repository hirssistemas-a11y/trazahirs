// ==========================================
// LÓGICA HORARIA Y VALIDACIÓN DE GUARDIAS HIRS.
// ==========================================

function formatearFechaLocalISO(d) {
  var anio = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return anio + '-' + mes + '-' + dia;
}

// -------------------------------------------------------------
// 1. VIGENCIA PARA EL MONITOR EN VIVO (¿Debe verse en pantalla ahora?)
// -------------------------------------------------------------
function esGuardiaVigente(guardia, fechaReferencia) {
  var ahora = fechaReferencia || new Date();
  var ahoraTimestamp = ahora.getTime();

  var fIniStr = String(guardia.fechaInicio || '').slice(0, 10);
  var fFinStr = String(guardia.fechaFin || guardia.fechaInicio || '').slice(0, 10);

  if (!fIniStr) return false;

  var partesIni = fIniStr.split('-');
  var partesFin = fFinStr.split('-');

  var yIni = parseInt(partesIni[0], 10), mIni = parseInt(partesIni[1], 10) - 1, dIni = parseInt(partesIni[2], 10);
  var yFin = parseInt(partesFin[0], 10), mFin = parseInt(partesFin[1], 10) - 1, dFin = parseInt(partesFin[2], 10);

  var mod = String(guardia.modalidad || '');
  var srv = String(guardia.servicio || '');
  var diaSemana = ahora.getDay(); // 0 = Domingo, 6 = Sábado
  var esFinde = (diaSemana === 0 || diaSemana === 6);
  var horaAhora = ahora.getHours();

  // A. TURNOS FRACCIONADOS (Guardia Externa / UTI / Neo)
  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1) {
    var hoyStr = formatearFechaLocalISO(ahora);
    if (hoyStr < fIniStr || hoyStr > fFinStr) return false;
    return horaAhora >= 8 && horaAhora < 20;
  }

  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1) {
    var inicioNoc = new Date(yIni, mIni, dIni, 20, 0, 0, 0);
    var finNoc = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    finNoc.setDate(finNoc.getDate() + 1);
    return ahoraTimestamp >= inicioNoc.getTime() && ahoraTimestamp < finNoc.getTime();
  }

  if (mod.indexOf('6 hs') !== -1) {
    if (mod.indexOf('08:00-14:00') !== -1) {
      var ini08 = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
      var fin14 = new Date(yFin, mFin, dFin, 14, 0, 0, 0);
      return ahoraTimestamp >= ini08.getTime() && ahoraTimestamp < fin14.getTime();
    }
    if (mod.indexOf('14:00-20:00') !== -1) {
      var ini14 = new Date(yIni, mIni, dIni, 14, 0, 0, 0);
      var fin20 = new Date(yFin, mFin, dFin, 20, 0, 0, 0);
      return ahoraTimestamp >= ini14.getTime() && ahoraTimestamp < fin20.getTime();
    }
    if (mod.indexOf('20:00-02:00') !== -1) {
      var ini20 = new Date(yIni, mIni, dIni, 20, 0, 0, 0);
      var fin02 = new Date(yFin, mFin, dFin, 2, 0, 0, 0);
      fin02.setDate(fin02.getDate() + 1);
      return ahoraTimestamp >= ini20.getTime() && ahoraTimestamp < fin02.getTime();
    }
    if (mod.indexOf('02:00-08:00') !== -1) {
      var ini02Sig = new Date(yIni, mIni, dIni, 2, 0, 0, 0);
      ini02Sig.setDate(ini02Sig.getDate() + 1);
      var fin08Sig = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
      fin08Sig.setDate(fin08Sig.getDate() + 1);

      var ini02Hoy = new Date(yIni, mIni, dIni, 2, 0, 0, 0);
      var fin08Hoy = new Date(yFin, mFin, dFin, 8, 0, 0, 0);

      return (ahoraTimestamp >= ini02Sig.getTime() && ahoraTimestamp < fin08Sig.getTime()) ||
             (ahoraTimestamp >= ini02Hoy.getTime() && ahoraTimestamp < fin08Hoy.getTime());
    }
  }

  // B. REGLA BASE DE FECHAS (24 hs base 08:00 a 08:00)
  var inicioGen = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
  var finGen = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
  finGen.setDate(finGen.getDate() + 1);

  if (ahoraTimestamp < inicioGen.getTime() || ahoraTimestamp >= finGen.getTime()) {
    return false;
  }

  // C. HORARIOS ESPECÍFICOS DE PLANTA VS GUARDIA PASIVA (Lunes a Viernes)
  if (!esFinde) {
    // Técnico de Imágenes: Pasiva de 22:00 a 06:00 hs
    if (srv === 'Tecnico de Imagenes') {
      return (horaAhora >= 22 || horaAhora < 6);
    }
    // Sistemas: Pasiva de 15:00 a 08:00 hs del día siguiente
    if (srv === 'Sistemas') {
      return (horaAhora >= 15 || horaAhora < 8);
    }
    // Electromedicina: Pasiva de 13:00 a 08:00 hs del día siguiente
    if (srv === 'Electromedicina') {
      return (horaAhora >= 13 || horaAhora < 8);
    }
    // Farmacia: Pasiva de 16:00 a 08:00 hs del día siguiente
    if (srv === 'Farmacia') {
      return (horaAhora >= 16 || horaAhora < 8);
    }
    // RX Quirófano: Pasiva de 20:00 a 08:00 hs
    if (srv === 'RX Quirofano') {
      return (horaAhora >= 20 || horaAhora < 8);
    }
  }

  // Fines de semana o servicios continuos de 24 hs (Clínica, Cirugía, Laboratorio, etc.)
  return true;
}

// -------------------------------------------------------------
// 2. AUDITORÍA: ¿El servicio está cubierto en esta hora específica?
// -------------------------------------------------------------
function guardiaCubreHoraAuditoria(guardia, fechaHoraEval) {
  var evalTimestamp = fechaHoraEval.getTime();
  var srv = String(guardia.servicio || '');
  var mod = String(guardia.modalidad || '');
  var diaSemana = fechaHoraEval.getDay();
  var esFinde = (diaSemana === 0 || diaSemana === 6);
  var hora = fechaHoraEval.getHours();

  var fIniStr = String(guardia.fechaInicio || '').slice(0, 10);
  var fFinStr = String(guardia.fechaFin || guardia.fechaInicio || '').slice(0, 10);
  if (!fIniStr) return false;

  var pIni = fIniStr.split('-');
  var pFin = fFinStr.split('-');
  var yIni = parseInt(pIni[0], 10), mIni = parseInt(pIni[1], 10) - 1, dIni = parseInt(pIni[2], 10);
  var yFin = parseInt(pFin[0], 10), mFin = parseInt(pFin[1], 10) - 1, dFin = parseInt(pFin[2], 10);

  var inicioGen = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
  var finGen = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
  finGen.setDate(finGen.getDate() + 1);

  // Si está dentro de las fechas de asignación del servicio pasivo:
  if (evalTimestamp >= inicioGen.getTime() && evalTimestamp < finGen.getTime()) {
    // Si es un servicio con horario diurno de planta cubierto por la institución:
    if (!esFinde) {
      if (srv === 'Tecnico de Imagenes' && (hora >= 6 && hora < 22)) return true; // Horario de planta
      if (srv === 'Sistemas' && (hora >= 8 && hora < 15)) return true;           // Horario de planta
      if (srv === 'Electromedicina' && (hora >= 8 && hora < 13)) return true;    // Horario de planta
      if (srv === 'Farmacia' && (hora >= 8 && hora < 16)) return true;           // Horario de planta
      if (srv === 'RX Quirofano' && (hora >= 8 && hora < 20)) return true;       // Horario de planta
    }
  }

  // Para el resto de horas o servicios fraccionados, usa la validación exacta:
  return esGuardiaVigente(guardia, fechaHoraEval);
}

// -------------------------------------------------------------
// 3. CÁLCULO DE HORARIOS EXACTOS (INICIO Y FIN DE TURNO)
// -------------------------------------------------------------
function obtenerInicioTurnoGuardia(guardia) {
  var fIniStr = String(guardia.fechaInicio || '').slice(0, 10);
  if (!fIniStr) return null;

  var pIni = fIniStr.split('-');
  var yIni = parseInt(pIni[0], 10), mIni = parseInt(pIni[1], 10) - 1, dIni = parseInt(pIni[2], 10);
  var mod = String(guardia.modalidad || '');
  var srv = String(guardia.servicio || '');

  var horaInicio = 8;

  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1 || mod.indexOf('20:00-02:00') !== -1) {
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

  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1) {
    return new Date(yFin, mFin, dFin, 20, 0, 0, 0);
  }
  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1) {
    var finNoc = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    finNoc.setDate(finNoc.getDate() + 1);
    return finNoc;
  }
  if (mod.indexOf('08:00-14:00') !== -1) return new Date(yFin, mFin, dFin, 14, 0, 0, 0);
  if (mod.indexOf('14:00-20:00') !== -1) return new Date(yFin, mFin, dFin, 20, 0, 0, 0);
  if (mod.indexOf('20:00-02:00') !== -1) {
    var f02 = new Date(yFin, mFin, dFin, 2, 0, 0, 0);
    f02.setDate(f02.getDate() + 1);
    return f02;
  }
  if (mod.indexOf('02:00-08:00') !== -1) {
    var f08 = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    var base08 = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    if (ahora.getTime() >= base08.getTime()) f08.setDate(f08.getDate() + 1);
    return f08;
  }

  // Pasivas con corte matutino
  if (srv === 'Tecnico de Imagenes') {
    var f06 = new Date(yHoy, mHoy, dHoy, 6, 0, 0, 0);
    if (horaAhora >= 22) f06.setDate(f06.getDate() + 1);
    return f06;
  }

  var finStd = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
  finStd.setDate(finStd.getDate() + 1);
  return finStd;
}

function formatearTiempoRestante(ms) {
  if (ms <= 0) return 'Cambiando ahora';
  var totalMin = Math.floor(ms / (1000 * 60));
  var dias = Math.floor(totalMin / (60 * 24));
  var horas = Math.floor((totalMin % (60 * 24)) / 60);
  var minutos = totalMin % 60;

  var partes = [];
  if (dias > 0) partes.push(dias + 'd');
  if (horas > 0 || dias > 0) partes.push(horas + 'h');
  partes.push(minutos + 'm');

  return partes.join(' ');
}
