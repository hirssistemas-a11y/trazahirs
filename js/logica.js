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