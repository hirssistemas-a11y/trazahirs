function actualizarReloj() {
  const now = new Date();
  const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
  document.getElementById('reloj').innerText = `${now.toLocaleTimeString([], options)} | ${now.toLocaleDateString()}`;
}
setInterval(actualizarReloj, 1000);
actualizarReloj();

async function obtenerGuardias() {
  if (!db) {
    console.warn("Base de datos no configurada todavia.");
    return [];
  }
  const hoyStr = new Date().toISOString().split('T')[0];
  const { data, error } = await db
    .from('guardias')
    .select('*')
    .gte('fecha_fin', hoyStr);

  if (error) {
    console.error("Error al obtener guardias:", error);
    return [];
  }
  return data || [];
}

async function renderDashboard() {
  const todas = await obtenerGuardias();
  const ahora = new Date();
  const vigentes = todas.filter(g => esGuardiaVigente(g, ahora));

  const tAct = document.getElementById('tablaActivas');
  const tPas = document.getElementById('tablaPasivas');

  const activas = vigentes.filter(g => g.tipo === 'Activa');
  const pasivas = vigentes.filter(g => g.tipo === 'Pasiva');

  tAct.innerHTML = activas.length ? activas.map(g => `
    <tr>
      <td class="fw-semibold text-light">${g.servicio}</td>
      <td>${g.responsable}</td>
      <td class="text-warning fw-semibold">${g.contacto}</td>
    </tr>
  `).join('') : '<tr><td colspan="3" class="text-center text-muted py-3">Sin guardias activas registradas para este horario.</td></tr>';

  tPas.innerHTML = pasivas.length ? pasivas.map(g => `
    <tr>
      <td class="fw-semibold text-light">${g.servicio}</td>
      <td>${g.responsable}</td>
      <td class="text-warning fw-semibold">${g.contacto}</td>
    </tr>
  `).join('') : '<tr><td colspan="3" class="text-center text-muted py-3">Sin pasivas en cobertura en este horario.</td></tr>';
}

renderDashboard();
setInterval(renderDashboard, 60000);