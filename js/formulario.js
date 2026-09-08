const selServicio = document.getElementById('servicio');
const campoMod = document.getElementById('campoModalidad');
const selMod = document.getElementById('modalidad');
const colFin = document.getElementById('colFechaFin');
const lblInicio = document.getElementById('lblFechaInicio');

selServicio.addEventListener('change', () => {
  const opt = selServicio.options[selServicio.selectedIndex];
  if (!opt.value) return;

  const modo = opt.dataset.modo;
  const val = selServicio.value;

  if (modo === 'semanal') {
    colFin.style.display = 'block';
    lblInicio.innerText = 'Semana Desde (Lunes):';
    campoMod.style.display = 'none';
  } else if (modo === 'finde') {
    colFin.style.display = 'block';
    lblInicio.innerText = 'Viernes de Inicio:';
    campoMod.style.display = 'none';
  } else {
    colFin.style.display = 'none';
    lblInicio.innerText = 'Fecha de Guardia:';
    campoMod.style.display = 'block';
    selMod.innerHTML = val.includes('Guardia externa') 
      ? '<option value="24hs">24 hs</option><option value="12hs">12 hs</option><option value="6hs">6 hs</option>'
      : '<option value="24hs">24 hs</option><option value="12hs">12 hs</option>';
  }
});

document.getElementById('formGuardia').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnGuardar');
  btn.disabled = true;
  btn.innerText = 'Guardando...';

  const opt = selServicio.options[selServicio.selectedIndex];
  const fInicio = document.getElementById('fechaInicio').value;
  const fFin = document.getElementById('fechaFin').value || fInicio;

  const payload = {
    servicio: selServicio.value,
    tipo: opt.dataset.tipo,
    modalidad: selMod.value || 'Semanal/Bloque',
    fecha_inicio: fInicio,
    fecha_fin: fFin,
    responsable: document.getElementById('responsable').value,
    contacto: document.getElementById('contacto').value
  };

  if (!db) {
    alert('Base de datos no configurada en js/config.js. Por favor, agregá tus credenciales.');
    btn.disabled = false;
    btn.innerText = 'Registrar Guardia';
    return;
  }

  const { error } = await db.from('guardias').insert([payload]);

  if (error) {
    alert('Error al guardar: ' + error.message);
  } else {
    alert('Guardia registrada correctamente');
    document.getElementById('formGuardia').reset();
    colFin.style.display = 'none';
    campoMod.style.display = 'none';
  }

  btn.disabled = false;
  btn.innerText = 'Registrar Guardia';
});