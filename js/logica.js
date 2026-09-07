function parsearFechaLocal(strFecha) {
  if (!strFecha) return null;
  if (strFecha instanceof Date) {
    return new Date(strFecha.getFullYear(), strFecha.getMonth(), strFecha.getDate());
  }
  const partes = strFecha.toString().slice(0, 10).split('-');
  if (partes.length === 3) {
    return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  }
  const d = new Date(strFecha);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatearFechaLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

function esGuardiaVigente(g, ahora = new Date()) {
  const fInicio = parsearFechaLocal(g.fecha_inicio || g.fechaInicio);
  const fFin = parsearFechaLocal(g.fecha_fin || g.fechaFin || g.fecha_inicio || g.fechaInicio);
  
  if (!fInicio || !fFin) return false;

  const horaActual = ahora.getHours();
  const diaActual = ahora.getDay(); // 0: domingo, 6: sábado
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

    // Evaluamos si el momento actual cae dentro de la franja correspondiente a "hoy" o al turno iniciado "ayer"
    const hoyCero = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);

    // Caso A: Turno que arrancó en la fecha de hoy
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hInicio, 0, 0);
    const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hFin, 0, 0);
    if (hFin <= hInicio) finHoy.setDate(finHoy.getDate() + 1);

    const cubreHoy = (hoyCero >= fInicio && hoyCero <= fFin && ahora >= inicioHoy && ahora < finHoy);

    // Caso B: Turno que arrancó ayer y finaliza en la mañana de hoy (cruce de medianoche)
    let cubreAyer = false;
    if (hFin <= hInicio) {
      const ayerCero = new Date(hoyCero);
      ayerCero.setDate(ayerCero.getDate() - 1);
      const inicioAyer = new Date(ayerCero.getFullYear(), ayerCero.getMonth(), ayerCero.getDate(), hInicio, 0, 0);
      const finAyer = new Date(hoyCero.getFullYear(), hoyCero.getMonth(), hoyCero.getDate(), hFin, 0, 0);
      cubreAyer = (ayerCero >= fInicio && ayerCero <= fFin && ahora >= inicioAyer && ahora < finAyer);
    }

    return (cubreHoy || cubreAyer);

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
