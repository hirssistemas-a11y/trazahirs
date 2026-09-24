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
  // 1. TURNOS FRACCIONADOS (12 hs y 6 hs)
  // -------------------------------------------------------------
  
  // 12 Horas Diurna (08:00 a 20:00 del mismo día)
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
    
    return ahoraTimestamp >= inicioNoc.getTime() && ahoraTimestamp < finNoc.getTime();
  }

  // Turnos fraccionados de 6 Horas
  if (mod.indexOf('6 hs') !== -1) {
    // 08:00 a 14:00 (mismo día)
    if (mod.indexOf('08:00-14:00') !== -1) {
      var ini08 = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
      var fin14 = new Date(yFin, mFin, dFin, 14, 0, 0, 0);
      return ahoraTimestamp >= ini08.getTime() && ahoraTimestamp < fin14.getTime();
    }
    // 14:00 a 20:00 (mismo día)
    if (mod.indexOf('14:00-20:00') !== -1) {
      var ini14 = new Date(yIni, mIni, dIni, 14, 0, 0, 0);
      var fin20 = new Date(yFin, mFin, dFin, 20, 0, 0, 0);
      return ahoraTimestamp >= ini14.getTime() && ahoraTimestamp < fin20.getTime();
    }
    // 20:00 a 02:00 (cruza la medianoche hacia el día siguiente)
    if (mod.indexOf('20:00-02:00') !== -1) {
      var ini20 = new Date(yIni, mIni, dIni, 20, 0, 0, 0);
      var fin02 = new Date(yFin, mFin, dFin, 2, 0, 0, 0);
      fin02.setDate(fin02.getDate() + 1);
      return ahoraTimestamp >= ini20.getTime() && ahoraTimestamp < fin02.getTime();
    }
    // 02:00 a 08:00 (trasnoche de la noche cargada o madrugada del día)
    if (mod.indexOf('02:00-08:00') !== -1) {
      // Cobertura si se cargó asociada a la noche previa (madrugada del día siguiente)
      var ini02Sig = new Date(yIni, mIni, dIni, 2, 0, 0, 0);
      ini02Sig.setDate(ini02Sig.getDate() + 1);
      var fin08Sig = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
      fin08Sig.setDate(fin08Sig.getDate() + 1);

      // Cobertura si se cargó directamente en la fecha del calendario
      var ini02Hoy = new Date(yIni, mIni, dIni, 2, 0, 0, 0);
      var fin08Hoy = new Date(yFin, mFin, dFin, 8, 0, 0, 0);

      var vigenteSig = (ahoraTimestamp >= ini02Sig.getTime() && ahoraTimestamp < fin08Sig.getTime());
      var vigenteHoy = (ahoraTimestamp >= ini02Hoy.getTime() && ahoraTimestamp < fin08Hoy.getTime());

      return vigenteSig || vigenteHoy;
    }
  }

  // -------------------------------------------------------------
  // 2. RÉGIMEN GENERAL: 24 HORAS CONTINUAS (08:00 AM a 08:00 AM)
  // Aplica a guardias estándar de 24 hs (Activas o Pasivas: Ecografía,
  // Sistemas, Cirugía, Imágenes, Laboratorio, Farmacia, etc.)
  // -------------------------------------------------------------
  var inicioGen = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
  var finGen = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
  finGen.setDate(finGen.getDate() + 1);

  return ahoraTimestamp >= inicioGen.getTime() && ahoraTimestamp < finGen.getTime();
}

// -------------------------------------------------------------
// 3. DETERMINACIÓN DE COBERTURA REQUERIDA
// -------------------------------------------------------------
function servicioRequiereGuardia(servicio, fechaHora) {
  // Todos los servicios asistenciales y operativos requieren cobertura 24 hs
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
  var fIniStr = String(guardia.fechaInicio || '').slice(0, 10);
  var fFinStr = String(guardia.fechaFin || guardia.fechaInicio || '').slice(0, 10);
  if (!fFinStr) return null;

  var pIni = fIniStr.split('-');
  var yIni = parseInt(pIni[0], 10), mIni = parseInt(pIni[1], 10) - 1, dIni = parseInt(pIni[2], 10);

  var pFin = fFinStr.split('-');
  var yFin = parseInt(pFin[0], 10), mFin = parseInt(pFin[1], 10) - 1, dFin = parseInt(pFin[2], 10);

  var mod = String(guardia.modalidad || '');

  // 12 hs Diurna (08:00 a 20:00)
  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1) {
    return new Date(yFin, mFin, dFin, 20, 0, 0, 0);
  }

  // 12 hs Nocturna (20:00 a 08:00 del día siguiente)
  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1) {
    var finNoc = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    finNoc.setDate(finNoc.getDate() + 1);
    return finNoc;
  }

  // 6 hs Mañana (08:00 a 14:00)
  if (mod.indexOf('08:00-14:00') !== -1) {
    return new Date(yFin, mFin, dFin, 14, 0, 0, 0);
  }

  // 6 hs Tarde (14:00 a 20:00)
  if (mod.indexOf('14:00-20:00') !== -1) {
    return new Date(yFin, mFin, dFin, 20, 0, 0, 0);
  }

  // 6 hs Noche (20:00 a 02:00 del día siguiente)
  if (mod.indexOf('20:00-02:00') !== -1) {
    var f02 = new Date(yFin, mFin, dFin, 2, 0, 0, 0);
    f02.setDate(f02.getDate() + 1);
    return f02;
  }

  // 6 hs Trasnoche (02:00 a 08:00)
  if (mod.indexOf('02:00-08:00') !== -1) {
    var f08 = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    // Si la referencia horaria ya es posterior a las 08:00 del día de inicio, corresponde al día siguiente
    var base08 = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
    if (ahora.getTime() >= base08.getTime()) {
      f08.setDate(f08.getDate() + 1);
    }
    return f08;
  }

  // Guardia estándar de 24 hs (08:00 a 08:00 del día posterior a fechaFin)
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
