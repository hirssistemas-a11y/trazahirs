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

  // -------------------------------------------------------------
  // 1. GUARDIAS ACTIVAS (EN PLANTA)
  // -------------------------------------------------------------
  if (guardia.tipo === 'Activa') {
    var mod = guardia.modalidad || '24 hs (08:00-08:00)';

    // Caso A: 24 Horas (08:00 AM a 08:00 AM del día posterior a fechaFin)
    if (mod.indexOf('24 hs') !== -1 || mod.indexOf('08:00-08:00') !== -1) {
      var inicio = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
      var fin = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
      fin.setDate(fin.getDate() + 1);
      return ahoraTimestamp >= inicio.getTime() && ahoraTimestamp < fin.getTime();
    }

    // Caso B: 12 Horas Diurna (08:00 a 20:00 de cada día del rango)
    if (mod.indexOf('12 hs Diurna') !== -1 || mod.indexOf('08:00-20:00') !== -1) {
      var hoyStr = formatearFechaLocalISO(ahora);
      if (hoyStr < fIniStr || hoyStr > fFinStr) return false;

      var hora = ahora.getHours();
      return hora >= 8 && hora < 20;
    }

    // Caso C: 12 Horas Nocturna (20:00 a 08:00 del día siguiente)
    if (mod.indexOf('12 hs Nocturna') !== -1 || mod.indexOf('20:00-08:00') !== -1) {
      var inicioNoc = new Date(yIni, mIni, dIni, 20, 0, 0, 0);
      var finNoc = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
      finNoc.setDate(finNoc.getDate() + 1);
      
      if (ahoraTimestamp < inicioNoc.getTime() || ahoraTimestamp >= finNoc.getTime()) {
        return false;
      }
      var horaActual = ahora.getHours();
      return horaActual >= 20 || horaActual < 8;
    }

    // Caso D: Turnos Fraccionados de 6 Horas (base 08:00 AM)
    if (mod.indexOf('6 hs') !== -1) {
      var hoyStr6 = formatearFechaLocalISO(ahora);
      if (hoyStr6 < fIniStr || hoyStr6 > fFinStr) return false;

      var h = ahora.getHours();

      // 08:00 a 14:00
      if (mod.indexOf('08:00-14:00') !== -1) {
        return h >= 8 && h < 14;
      }
      // 14:00 a 20:00
      if (mod.indexOf('14:00-20:00') !== -1) {
        return h >= 14 && h < 20;
      }
      // 20:00 a 02:00 (Cruza medianoche)
      if (mod.indexOf('20:00-02:00') !== -1) {
        return h >= 20 || h < 2;
      }
      // 02:00 a 08:00
      if (mod.indexOf('02:00-08:00') !== -1) {
        return h >= 2 && h < 8;
      }
    }

    // Fallback Activa por defecto
    var iniDef = new Date(yIni, mIni, dIni, 8, 0, 0, 0);
    var finDef = new Date(yFin, mFin, dFin, 8, 0, 0, 0);
    finDef.setDate(finDef.getDate() + 1);
    return ahoraTimestamp >= iniDef.getTime() && ahoraTimestamp < finDef.getTime();
  }

  // -------------------------------------------------------------
  // 2. GUARDIAS PASIVAS (A DEMANDA)
  // -------------------------------------------------------------
  var hoyStrLocal = formatearFechaLocalISO(ahora);
  if (hoyStrLocal < fIniStr || hoyStrLocal > fFinStr) {
    return false;
  }

  var diaSemana = ahora.getDay(); // 0 = Domingo, 6 = Sábado
  var horaAhora = ahora.getHours();
  var esFinde = (diaSemana === 0 || diaSemana === 6);
  var srv = guardia.servicio || '';

  // REGLA TÉCNICO DE IMÁGENES: Lunes a Viernes de 20:00 a 08:00 hs; Fines de semana las 24 hs
  if (srv === 'Tecnico de Imagenes') {
    if (esFinde) return true;
    return horaAhora >= 20 || horaAhora < 8;
  }

  // REGLA RX QUIRÓFANO: Lunes a Viernes pasiva nocturna (20:00 a 08:00 hs); Fines de semana las 24 hs
  if (srv === 'RX Quirofano') {
    if (esFinde) return true;
    return horaAhora >= 20 || horaAhora < 8;
  }

  // REGLA ECOGRAFÍA: Días de semana de 12:00 a 20:00 hs; Fines de semana las 24 hs
  if (srv === 'Ecografia') {
    if (esFinde) return true;
    return horaAhora >= 12 && horaAhora < 20;
  }

  // Sistemas: Lunes a Viernes pasiva desde las 15:00 hs; Fines de semana las 24 hs
  if (srv === 'Sistemas') {
    if (esFinde) return true;
    return horaAhora >= 15;
  }

  // Electromedicina: Lunes a Viernes pasiva desde las 13:00 hs; Fines de semana las 24 hs
  if (srv === 'Electromedicina') {
    if (esFinde) return true;
    return horaAhora >= 13;
  }

  // Farmacia: Lunes a Viernes pasiva desde las 16:00 hs; Fines de semana las 24 hs
  if (srv === 'Farmacia') {
    if (esFinde) return true;
    return horaAhora >= 16;
  }

  // Resto de servicios pasivos continuos (Gastroenterologia, Ginecologia, Obstetricia, Mantenimiento, etc.):
  return true;
}
