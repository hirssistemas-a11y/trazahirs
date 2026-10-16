// ==========================================
// LÓGICA HORARIA Y VALIDACIÓN DE GUARDIAS HIRS
// ==========================================

function formatearFechaLocalISO(d) {
  var anio = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return anio + '-' + mes + '-' + dia;
}

function asegurarCacheFechasGuardia(guardia) {
  if (guardia._fechasCacheadas) return true;
  var fIniStr = String(guardia.fechaInicio || '').slice(0, 10);
  var fFinStr = String(guardia.fechaFin || guardia.fechaInicio || '').slice(0, 10);
  if (!fIniStr) return false;

  var pIni = fIniStr.split('-');
  var pFin = fFinStr.split('-');

  guardia._fIniStr = fIniStr;
  guardia._fFinStr = fFinStr;
  guardia._yIni = parseInt(pIni[0], 10);
  guardia._mIni = parseInt(pIni[1], 10) - 1;
  guardia._dIni = parseInt(pIni[2], 10);
  guardia._yFin = parseInt(pFin[0], 10);
  guardia._mFin = parseInt(pFin[1], 10) - 1;
  guardia._dFin = parseInt(pFin[2], 10);

  guardia._iniGenTs = new Date(guardia._yIni, guardia._mIni, guardia._dIni, 8, 0, 0, 0).getTime();
  guardia._finGenTs = new Date(guardia._yFin, guardia._mFin, guardia._dFin + 1, 8, 0, 0, 0).getTime();
  guardia._fechasCacheadas = true;
  return true;
}

function esHorarioPlantaInstitucional(servicio, fechaReferencia) {
  var fecha = fechaReferencia || new Date();
  var diaSemana = fecha.getDay();
  if (diaSemana === 0 || diaSemana === 6) return false;

  var hora = fecha.getHours();
  var srv = String(servicio || '').trim();

  if (srv === 'Farmacia' && (hora >= 8 && hora < 16)) return true;
  if (srv === 'Sistemas' && (hora >= 8 && hora < 15)) return true;
  if (srv === 'Electromedicina' && (hora >= 8 && hora < 13)) return true;
  if (srv === 'Tecnico de Imagenes' && (hora >= 6 && hora < 22)) return true;
  if (srv === 'RX Quirofano' && (hora >= 8 && hora < 20)) return true;
  if (srv.indexOf('Cardiologia') !== -1 && (hora >= 9 && hora < 16)) return true;

  return false;
}

function esGuardiaVigente(guardia, fechaReferencia) {
  if (!asegurarCacheFechasGuardia(guardia)) return false;

  var ahora = fechaReferencia || new Date();
  var ahoraTimestamp = ahora.getTime();
  var yIni = guardia._yIni, mIni = guardia._mIni, dIni = guardia._dIni;
  var yFin = guardia._yFin, mFin = guardia._mFin, dFin = guardia._dFin;
  var mod = String(guardia.modalidad || '');
  var srv = String(guardia.servicio || '').trim();
  var diaSemana = ahora.getDay();
  var esFinde = (diaSemana === 0 || diaSemana === 6);
  var horaAhora = ahora.getHours();

  if (mod.indexOf('18 hs') !== -1) {
    if (mod.indexOf('08:00-02:00') !== -1 || mod.indexOf('08:00 a 02:00') !== -1) {
      return ahoraTimestamp >= new Date(yIni, mIni, dIni, 8, 0, 0, 0).getTime() &&
             ahoraTimestamp < new Date(yFin, mFin, dFin + 1, 2, 0, 0, 0).getTime();
    }
    if (mod.indexOf('14:00-08:00') !== -1 || mod.indexOf('14:00 a 08:00') !== -1) {
      return ahoraTimestamp >= new Date(yIni, mIni, dIni, 14, 0, 0, 0).getTime() &&
             ahoraTimestamp < new Date(yFin, mFin, dFin + 1, 8, 0, 0, 0).getTime();
    }
  }

  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1 || mod.indexOf('08:00 a 20:00') !== -1) {
    var hoyStr = formatearFechaLocalISO(ahora);
    if (hoyStr < guardia._fIniStr || hoyStr > guardia._fFinStr) return false;
    return horaAhora >= 8 && horaAhora < 20;
  }

  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1 || mod.indexOf('20:00 a 08:00') !== -1) {
    return ahoraTimestamp >= new Date(yIni, mIni, dIni, 20, 0, 0, 0).getTime() &&
           ahoraTimestamp < new Date(yFin, mFin, dFin + 1, 8, 0, 0, 0).getTime();
  }

  if (mod.indexOf('6 hs') !== -1) {
    if (mod.indexOf('08:00-14:00') !== -1 || mod.indexOf('08:00 a 14:00') !== -1) {
      return ahoraTimestamp >= new Date(yIni, mIni, dIni, 8, 0, 0, 0).getTime() &&
             ahoraTimestamp < new Date(yFin, mFin, dFin, 14, 0, 0, 0).getTime();
    }
    if (mod.indexOf('14:00-20:00') !== -1 || mod.indexOf('14:00 a 20:00') !== -1) {
      return ahoraTimestamp >= new Date(yIni, mIni, dIni, 14, 0, 0, 0).getTime() &&
             ahoraTimestamp < new Date(yFin, mFin, dFin, 20, 0, 0, 0).getTime();
    }
    if (mod.indexOf('20:00-02:00') !== -1 || mod.indexOf('20:00 a 02:00') !== -1) {
      return ahoraTimestamp >= new Date(yIni, mIni, dIni, 20, 0, 0, 0).getTime() &&
             ahoraTimestamp < new Date(yFin, mFin, dFin + 1, 2, 0, 0, 0).getTime();
    }
    if (mod.indexOf('02:00-08:00') !== -1 || mod.indexOf('02:00 a 08:00') !== -1) {
      var ini02Sig = new Date(yIni, mIni, dIni + 1, 2, 0, 0, 0).getTime();
      var fin08Sig = new Date(yFin, mFin, dFin + 1, 8, 0, 0, 0).getTime();
      var ini02Hoy = new Date(yIni, mIni, dIni, 2, 0, 0, 0).getTime();
      var fin08Hoy = new Date(yFin, mFin, dFin, 8, 0, 0, 0).getTime();
      return (ahoraTimestamp >= ini02Sig && ahoraTimestamp < fin08Sig) ||
             (ahoraTimestamp >= ini02Hoy && ahoraTimestamp < fin08Hoy);
    }
  }

  if (ahoraTimestamp < guardia._iniGenTs || ahoraTimestamp >= guardia._finGenTs) {
    return false;
  }

  if (!esFinde) {
    if (srv.indexOf('Cardiologia') !== -1) {
      return guardia.tipo === 'Pasiva' ? !esHorarioPlantaInstitucional(srv, ahora) : true;
    }
    if (esHorarioPlantaInstitucional(srv, ahora)) return false;
  }

  return true;
}

function guardiaCubreHoraAuditoria(guardia, fechaHoraEval) {
  return esGuardiaVigente(guardia, fechaHoraEval);
}

function obtenerInicioTurnoGuardia(guardia) {
  if (!asegurarCacheFechasGuardia(guardia)) return null;
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

  return new Date(guardia._yIni, guardia._mIni, guardia._dIni, horaInicio, 0, 0, 0);
}

function obtenerFinTurnoGuardia(guardia, fechaReferencia) {
  if (!asegurarCacheFechasGuardia(guardia)) return null;
  var ahora = fechaReferencia || new Date();
  var yFin = guardia._yFin, mFin = guardia._mFin, dFin = guardia._dFin;
  var yHoy = ahora.getFullYear(), mHoy = ahora.getMonth(), dHoy = ahora.getDate();
  var horaAhora = ahora.getHours();
  var mod = String(guardia.modalidad || '');
  var srv = String(guardia.servicio || '').trim();

  if (mod.indexOf('18 hs') !== -1) {
    if (mod.indexOf('08:00-02:00') !== -1 || mod.indexOf('08:00 a 02:00') !== -1) return new Date(yFin, mFin, dFin + 1, 2, 0, 0, 0);
    if (mod.indexOf('14:00-08:00') !== -1 || mod.indexOf('14:00 a 08:00') !== -1) return new Date(yFin, mFin, dFin + 1, 8, 0, 0, 0);
  }
  if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1 || mod.indexOf('08:00 a 20:00') !== -1) return new Date(yFin, mFin, dFin, 20, 0, 0, 0);
  if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1 || mod.indexOf('20:00 a 08:00') !== -1) return new Date(yFin, mFin, dFin + 1, 8, 0, 0, 0);
  if (mod.indexOf('08:00-14:00') !== -1 || mod.indexOf('08:00 a 14:00') !== -1) return new Date(yFin, mFin, dFin, 14, 0, 0, 0);
  if (mod.indexOf('14:00-20:00') !== -1 || mod.indexOf('14:00 a 20:00') !== -1) return new Date(yFin, mFin, dFin, 20, 0, 0, 0);
  if (mod.indexOf('20:00-02:00') !== -1 || mod.indexOf('20:00 a 02:00') !== -1) return new Date(yFin, mFin, dFin + 1, 2, 0, 0, 0);
  if (mod.indexOf('02:00-08:00') !== -1 || mod.indexOf('02:00 a 08:00') !== -1) {
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

  return new Date(yFin, mFin, dFin + 1, 8, 0, 0, 0);
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
