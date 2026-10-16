// ==========================================
// LÓGICA HORARIA Y VALIDACIÓN DE GUARDIAS HIRS
// ==========================================

function formatearFechaLocalISO(d) {
  var anio = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return anio + '-' + mes + '-' + dia;
}

// -------------------------------------------------------------
// 0. VERIFICACIÓN DE HORARIO DE PLANTA DEL HOSPITAL (Lunes a Viernes)
// En estos horarios el personal trabaja normalmente en planta:
// -> NO se muestra en la tabla de guardias pasivas
// -> NO debe disparar alerta de "Sin cobertura" en la auditoría de 48 hs
// -------------------------------------------------------------
function esHorarioPlantaInstitucional(servicio, fechaReferencia) {
  var fecha = fechaReferencia || new Date();
  var diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado
  if (diaSemana === 0 || diaSemana === 6) return false; // Sábados y domingos es guardia 24 hs

  var hora = fecha.getHours();
  var srv = String(servicio || '').trim();

  // Farmacia: Planta de 08:00 a 16:00 hs
  if (srv === 'Farmacia' && (hora >= 8 && hora < 16)) return true;

  // Sistemas: Planta de 08:00 a 15:00 hs
  if (srv === 'Sistemas' && (hora >= 8 && hora < 15)) return true;

  // Electromedicina: Planta de 08:00 a 13:00 hs
  if (srv === 'Electromedicina' && (hora >= 8 && hora < 13)) return true;

  // Técnico de Imágenes: Planta de 06:00 a 22:00 hs
  if (srv === 'Tecnico de Imagenes' && (hora >= 6 && hora < 22)) return true;

  // RX Quirófano: Planta de 08:00 a 20:00 hs
  if (srv === 'RX Quirofano' && (hora >= 8 && hora < 20)) return true;

  // Cardiología / Unidad Coronaria: Planta de 09:00 a 16:00 hs
  if (srv.indexOf('Cardiologia') !== -1 && (hora >= 9 && hora < 16)) return true;

  return false;
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
  var srv = String(guardia.servicio || '').trim();
  var diaSemana = ahora.getDay();
  var esFinde = (diaSemana === 0 || diaSemana === 6);
  var horaAhora = ahora.getHours();

  // A. TURNOS DE 18 HORAS
  if (mod.indexOf('18 hs') !== -1) {
    // 08:00 a 02:00 (del día siguiente)
    if (mod.indexOf('08:00-02:00') !== -1 || mod.indexOf('08:00 a 02:00') !== -1) {
      var ini18_1 = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
      var fin18_1 = new Date(yFin, mFin, dFin, 2, 0, 0, 0);
      fin18_1.setDate(fin18_1.getDate() + 1);
      return ahoraTimestamp >= ini18_1.getTime() && ahoraTimestamp < fin18_1.getTime();
    }
    // 14:00 a 08:00 (del día siguiente)
    if (mod.indexOf('14:00-08:00') !== -1 || mod.indexOf('14:00 a 08:00') !== -1) {
      var ini18_2 = new Date(yIni, mIni, dIni, 14, 0, 0, 0);
      var fin18_2 = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
      fin18_2.setDate(fin18_2.getDate() + 1);
      return ahoraTimestamp >= ini18_2.getTime() && ahoraTimestamp < fin18_2.getTime();
    }
  }

  // B. TURNOS DE 12 HORAS
  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1 || mod.indexOf('08:00 a 20:00') !== -1) {
    var hoyStr = formatearFechaLocalISO(ahora);
    if (hoyStr < fIniStr || hoyStr > fFinStr) return false;
    return horaAhora >= 8 && horaAhora < 20;
  }

  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1 || mod.indexOf('20:00 a 08:00') !== -1) {
    var inicioNoc = new Date(yIni, mIni, dIni, 20, 0, 0, 0);
    var finNoc = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    finNoc.setDate(finNoc.getDate() + 1);
    return ahoraTimestamp >= inicioNoc.getTime() && ahoraTimestamp < finNoc.getTime();
  }

  // C. TURNOS DE 6 HORAS
  if (mod.indexOf('6 hs') !== -1) {
    if (mod.indexOf('08:00-14:00') !== -1 || mod.indexOf('08:00 a 14:00') !== -1) {
      var ini08 = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
      var fin14 = new Date(yFin, mFin, dFin, 14, 0, 0, 0);
      return ahoraTimestamp >= ini08.getTime() && ahoraTimestamp < fin14.getTime();
    }
    if (mod.indexOf('14:00-20:00') !== -1 || mod.indexOf('14:00 a 20:00') !== -1) {
      var ini14 = new Date(yIni, mIni, dIni, 14, 0, 0, 0);
      var fin20 = new Date(yFin, mFin, dFin, 20, 0, 0, 0);
      return ahoraTimestamp >= ini14.getTime() && ahoraTimestamp < fin20.getTime();
    }
    if (mod.indexOf('20:00-02:00') !== -1 || mod.indexOf('20:00 a 02:00') !== -1) {
      var ini20 = new Date(yIni, mIni, dIni, 20, 0, 0, 0);
      var fin02 = new Date(yFin, mFin, dFin, 2, 0, 0, 0);
      fin02.setDate(fin02.getDate() + 1);
      return ahoraTimestamp >= ini20.getTime() && ahoraTimestamp < fin02.getTime();
    }
    if (mod.indexOf('02:00-08:00') !== -1 || mod.indexOf('02:00 a 08:00') !== -1) {
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

  // D. REGLA BASE DE FECHAS (24 hs base 08:00 a 08:00)
  var inicioGen = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
  var finGen = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
  finGen.setDate(finGen.getDate() + 1);

  if (ahoraTimestamp < inicioGen.getTime() || ahoraTimestamp >= finGen.getTime()) {
    return false;
  }

  // E. OCULTAR EN EL MONITOR DURANTE EL HORARIO DE PLANTA (Lunes a Viernes)
  if (!esFinde) {
    if (srv.indexOf('Cardiologia') !== -1) {
      if (guardia.tipo === 'Pasiva') {
        return !esHorarioPlantaInstitucional(srv, ahora);
      }
      return true;
    }
    if (esHorarioPlantaInstitucional(srv, ahora)) {
      return false;
    }
  }

  return true;
}

// -------------------------------------------------------------
// 2. AUDITORÍA: ¿El servicio está cubierto en esta hora específica?
// -------------------------------------------------------------
function guardiaCubreHoraAuditoria(guardia, fechaHoraEval) {
  var srv = String(guardia.servicio || '').trim();

  // Si es horario de trabajo de planta en el hospital, siempre está cubierto
  if (esHorarioPlantaInstitucional(srv, fechaHoraEval)) {
    return true;
  }

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
  var srv = String(guardia.servicio || '').trim();

  var horaInicio = 8;

  if (mod.indexOf('18 hs') !== -1) {
    horaInicio = (mod.indexOf('14:00-08:00') !== -1 || mod.indexOf('14:00 a 08:00') !== -1) ? 14 : 8;
  } else if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1 || mod.indexOf('20:00 a 08:00') !== -1 || mod.indexOf('20:00-02:00') !== -1 || mod.indexOf('20:00 a 02:00') !== -1) {
    horaInicio = 20;
  } else if (mod.indexOf('14:00-20:00') !== -1 || mod.indexOf('14:00 a 20:00') !== -1) {
    horaInicio = 14;
  } else if (mod.indexOf('02:00-08:00') !== -1 || mod.indexOf('02:00 a 08:00') !== -1) {
    horaInicio = 2;
  } else if (srv === 'Tecnico de Imagenes') {
    horaInicio = 22;
  } else if (srv === 'RX Quirofano') {
    horaInicio = 20;
  } else if (srv === 'Farmacia' || (srv.indexOf('Cardiologia') !== -1 && guardia.tipo === 'Pasiva')) {
    horaInicio = 16;
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
  var srv = String(guardia.servicio || '').trim();

  // 18 Horas
  if (mod.indexOf('18 hs') !== -1) {
    if (mod.indexOf('08:00-02:00') !== -1 || mod.indexOf('08:00 a 02:00') !== -1) {
      var f18_02 = new Date(yFin, mFin, dFin, 2, 0, 0, 0);
      f18_02.setDate(f18_02.getDate() + 1);
      return f18_02;
    }
    if (mod.indexOf('14:00-08:00') !== -1 || mod.indexOf('14:00 a 08:00') !== -1) {
      var f18_08 = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
      f18_08.setDate(f18_08.getDate() + 1);
      return f18_08;
    }
  }

  // 12 Horas
  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1 || mod.indexOf('08:00 a 20:00') !== -1) {
    return new Date(yFin, mFin, dFin, 20, 0, 0, 0);
  }
  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1 || mod.indexOf('20:00 a 08:00') !== -1) {
    var finNoc = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    finNoc.setDate(finNoc.getDate() + 1);
    return finNoc;
  }

  // 6 Horas
  if (mod.indexOf('08:00-14:00') !== -1 || mod.indexOf('08:00 a 14:00') !== -1) return new Date(yFin, mFin, dFin, 14, 0, 0, 0);
  if (mod.indexOf('14:00-20:00') !== -1 || mod.indexOf('14:00 a 20:00') !== -1) return new Date(yFin, mFin, dFin, 20, 0, 0, 0);
  if (mod.indexOf('20:00-02:00') !== -1 || mod.indexOf('20:00 a 02:00') !== -1) {
    var f02 = new Date(yFin, mFin, dFin, 2, 0, 0, 0);
    f02.setDate(f02.getDate() + 1);
    return f02;
  }
  if (mod.indexOf('02:00-08:00') !== -1 || mod.indexOf('02:00 a 08:00') !== -1) {
    var f08 = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    var base08 = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    if (ahora.getTime() >= base08.getTime()) f08.setDate(f08.getDate() + 1);
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
