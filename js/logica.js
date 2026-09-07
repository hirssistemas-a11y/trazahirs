function esGuardiaVigente(g, ahora = new Date()) {
  const horaActual = ahora.getHours();
  const diaActual = ahora.getDay(); // 0 domingo, 6 sabado

  const fInicio = new Date(g.fecha_inicio + 'T00:00:00');
  const fFin = new Date((g.fecha_fin || g.fecha_inicio) + 'T23:59:59');

  if (ahora < fInicio || ahora > fFin) return false;

  if (g.tipo === 'Activa') return true;

  const s = g.servicio;
  if (s === 'Sistemas') return (horaActual >= 15 || horaActual < 7);
  if (s === 'Electromedicina') return (horaActual >= 13 || horaActual < 7);
  if (s === 'Farmacia') return (horaActual >= 16 || horaActual < 7);
  if (s === 'Instrumentadoras') return (horaActual >= 22 || horaActual < 7);
  
  if (s === 'Esterilizacion') {
    return (diaActual === 6 || diaActual === 0 || (diaActual === 5 && horaActual >= 22) || (diaActual === 1 && horaActual < 6));
  }
  if (s === 'Anestesia') {
    return (diaActual === 6 || diaActual === 0 || diaActual === 5 || (diaActual === 1 && horaActual < 6));
  }
  if (s === 'Hemoterapia' || s === 'RX Quirofano') {
    const esFinde = (diaActual === 0 || diaActual === 6);
    return esFinde || (horaActual >= 22 || horaActual < 7);
  }

  return true;
}
// Parser seguro de fechas locales evitando desfasajes de zona horaria UTC
function parsearFechaLocal(strFecha) {
  if (!strFecha) return null;
  if (strFecha instanceof Date) {
    return new Date(strFecha.getFullYear(), strFecha.getMonth(), strFecha.getDate());
  }
  const partes = strFecha.toString().split('-');
  if (partes.length === 3) {
    return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  }
  const d = new Date(strFecha);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Evaluación exacta de turnos activos y pasivas hospitalarias
function esGuardiaVigente(g, ahora = new Date()) {
  const fInicio = parsearFechaLocal(g.fecha_inicio || g.fechaInicio);
  const fFin = parsearFechaLocal(g.fecha_fin || g.fechaFin || g.fecha_inicio || g.fechaInicio);
  
  if (!fInicio || !fFin) return false;

  const horaActual = ahora.getHours();
  const diaActual = ahora.getDay(); // 0 domingo, 6 sábado
  const modalidad = String(g.modalidad || '');
  const tipo = g.tipo;
  const servicio = g.servicio;

  if (tipo === 'Activa') {
    const matchFranja = modalidad.match(/\((\d{2}):00-(\d{2}):00\)/);
    let hInicio = 8;
    let hFin = 8;

    if (matchFranja) {
      hInicio = parseInt(matchFranja[1], 10);
      hFin = parseInt(matchFranja[2], 10);
    }

    const momentoInicio = new Date(fInicio.getFullYear(), fInicio.getMonth(), fInicio.getDate(), hInicio, 0, 0);
    const momentoFin = new Date(fInicio.getFullYear(), fInicio.getMonth(), fInicio.getDate(), hFin, 0, 0);

    // Si cruza la medianoche (ej: 20:00 a 08:00)
    if (hFin <= hInicio) {
      momentoFin.setDate(momentoFin.getDate() + 1);
    }

    return (ahora >= momentoInicio && ahora < momentoFin);

  } else if (tipo === 'Pasiva') {
    fInicio.setHours(0, 0, 0, 0);
    fFin.setHours(23, 59, 59, 999);

    if (ahora >= fInicio && ahora <= fFin) {
      if (servicio === 'Sistemas') {
        return (horaActual >= 15 || horaActual < 7);
      } else if (servicio === 'Electromedicina') {
        return (horaActual >= 13 || horaActual < 7);
      } else if (servicio === 'Farmacia') {
        return (horaActual >= 16 || horaActual < 7);
      } else if (servicio === 'Instrumentadoras') {
        return (horaActual >= 22 || horaActual < 7);
      } else if (servicio === 'Mantenimiento') {
        return (horaActual >= 22 || horaActual < 6);
      } else if (servicio === 'Esterilizacion') {
        return (diaActual === 6 || diaActual === 0 || (diaActual === 5 && horaActual >= 22) || (diaActual === 1 && horaActual < 6));
      } else if (servicio === 'Anestesia') {
        return (diaActual === 6 || diaActual === 0 || diaActual === 5 || (diaActual === 1 && horaActual < 6));
      } else if (servicio === 'Hemoterapia' || servicio === 'RX Quirofano') {
        const esFinde = (diaActual === 0 || diaActual === 6);
        return esFinde || (horaActual >= 22 || horaActual < 7);
      } else {
        return true;
      }
    }
  }

  return false;
}
