// ==========================================
// LÓGICA HORARIA Y VALIDACIÓN DE GUARDIAS HIRS
// ==========================================

function formatearFechaLocalISO(d) {
  var anio = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return anio + '-' + mes + '-' + dia;
}

function esGuardiaVigente(guardia, fechaReferencia) {
  var ahora = fechaReferencia || new Date();
  var ahoraTimestamp = ahora.getTime();

  var fIniStr = String(guardia.fechaInicio || '').slice(0, 10);
  var fFinStr = String(guardia.fechaFin || guardia.fechaInicio || '').slice(0, 10);

  if (!fIniStr) return false;

  var partesIni = fIniStr.split('-');
  var partesFin = fFinStr.split('-');

  var yIni = parseInt(partesIni[0], 10);
  var mIni = parseInt(partesIni[1], 10) - 1;
  var dIni = parseInt(partesIni[2], 10);

  var yFin = parseInt(partesFin[0], 10);
  var mFin = parseInt(partesFin[1], 10) - 1;
  var dFin = parseInt(partesFin[2], 10);

  var mod = String(guardia.modalidad || '');

  // -------------------------------------------------------------
  // 1. FRANJAS FRACCIONADAS (Solo si la modalidad lo especifica)
  // -------------------------------------------------------------
  
  // 12 Horas Diurna (08:00 a 20:00)
  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1) {
    var hoyStr = formatearFechaLocalISO(ahora);
    if (hoyStr < fIniStr || hoyStr > fFinStr) return false;
    var horaD = ahora.getHours();
    return horaD >= 8 && horaD < 20;
  }

  // 12 Horas Nocturna (20:00 a 08:00 del día siguiente)
  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1) {
    var inicioNoc = new Date(yIni, mIni, dIni, 20, 0, 0, 0);
    var finNoc = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    finNoc.setDate(finNoc.getDate() + 1);
    
    if (ahoraTimestamp < inicioNoc.getTime() || ahoraTimestamp >= finNoc.getTime()) {
      return false;
    }
    var horaN = ahora.getHours();
    return horaN >= 20 || horaN < 8;
  }

  // Turnos fraccionados de 6 Horas
  if (mod.indexOf('6 hs') !== -1) {
    var hoyStr6 = formatearFechaLocalISO(ahora);
    if (hoyStr6 < fIniStr || hoyStr6 > fFinStr) return false;

    var h = ahora.getHours();
    if (mod.indexOf('08:00-14:00') !== -1) return h >= 8 && h < 14;
    if (mod.indexOf('14:00-20:00') !== -1) return h >= 14 && h < 20;
    if (mod.indexOf('20:00-02:00') !== -1) return h >= 20 || h < 2;
    if (mod.indexOf('02:00-08:00') !== -1) return h >= 2 && h < 8;
  }

  // -------------------------------------------------------------
  // 2. RÉGIMEN GENERAL: 24 HORAS CONTINUAS (08:00 AM a 08:00 AM)
  // Aplica a todas las guardias de 24 hs (Activas o Pasivas: Ecografía,
  // Sistemas, Cirugía, Imágenes, Laboratorio, Farmacia, etc.)
  // -------------------------------------------------------------
  var inicioGen = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
  var finGen = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
  finGen.setDate(finGen.getDate() + 1);

  return ahoraTimestamp >= inicioGen.getTime() && ahoraTimestamp < finGen.getTime();
}

// -------------------------------------------------------------
// 3. DETERMINACIÓN DE COBERTURA REQUERIDA
// Todo servicio que figure en el hospital requiere estar cubierto
// -------------------------------------------------------------
function servicioRequiereGuardia(servicio, fechaHora) {
  // Todos los servicios cargados requieren cobertura continua 24 hs
  return true;
}

// -------------------------------------------------------------
// 4. CÁLCULO DE HORARIOS EXACTOS (INICIO Y FIN DE TURNO)
// -------------------------------------------------------------
function obtenerInicioTurnoGuardia(guardia) {
  var fIniStr = String(guardia.fechaInicio || '').slice(0, 10);
  if (!fIniStr) return null;

  var pIni = fIniStr.split('-');
  var yIni = parseInt(pIni[0], 10), mIni = parseInt(pIni[1], 10) - 1, dIni = parseInt(pIni[2], 10);
  var mod = String(guardia.modalidad || '');

  var horaInicio = 8; // Predeterminado 08:00 AM

  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1 || mod.indexOf('20:00-02:00') !== -1) {
    horaInicio = 20;
  } else if (mod.indexOf('14:00-20:00') !== -1) {
    horaInicio = 14;
  } else if (mod.indexOf('02:00-08:00') !== -1) {
    horaInicio = 2;
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

  // Fraccionadas
  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1) {
    return new Date(yHoy, mHoy, dHoy, 20, 0, 0, 0);
  }
  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1) {
    var finNoc = new Date(yHoy, mHoy, dHoy, 8, 0, 0, 0);
    if (horaAhora >= 20) finNoc.setDate(finNoc.getDate() + 1);
    return finNoc;
  }
  if (mod.indexOf('08:00-14:00') !== -1) return new Date(yHoy, mHoy, dHoy, 14, 0, 0, 0);
  if (mod.indexOf('14:00-20:00') !== -1) return new Date(yHoy, mHoy, dHoy, 20, 0, 0, 0);
  if (mod.indexOf('20:00-02:00') !== -1) {
    var f02 = new Date(yHoy, mHoy, dHoy, 2, 0, 0, 0);
    if (horaAhora >= 20) f02.setDate(f02.getDate() + 1);
    return f02;
  }
  if (mod.indexOf('02:00-08:00') !== -1) return new Date(yHoy, mHoy, dHoy, 8, 0, 0, 0);

  // Turnos estándar 24 hs (08:00 a 08:00 del día posterior)
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
