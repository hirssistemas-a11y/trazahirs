// ==========================================
// CONTROLADOR DEL FORMULARIO DE CARGA (HIRS)
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  var selServicio = document.getElementById('servicio');
  var selModalidad = document.getElementById('modalidad');
  var selTipo = document.getElementById('tipo');
  var txtFechaInicio = document.getElementById('fecha_inicio');
  var txtFechaFin = document.getElementById('fecha_fin');
  var formCarga = document.getElementById('formGuardia');

  // Servicios que permiten turnos fraccionados (6 hs, 12 hs, 18 hs y 24 hs)
  var serviciosFraccionables = [
    'Guardia externa Adultos',
    'Guardia externa Pediatrica',
    'Neonatologia',
    'Terapia Intensiva (UTI)',
    'Pediatria'
  ];

  function actualizarOpcionesModalidad() {
    if (!selServicio || !selModalidad) return;

    var srv = selServicio.value;
    var esFraccionable = serviciosFraccionables.some(function(s) {
      return srv.toLowerCase().indexOf(s.toLowerCase()) !== -1;
    });

    var valorPrevio = selModalidad.value;
    selModalidad.innerHTML = '';

    if (esFraccionable) {
      // 24 Horas
      selModalidad.innerHTML += '<option value="24 hs (08:00 a 08:00)">24 hs (08:00 a 08:00)</option>';
      
      // 18 Horas (Nuevas)
      selModalidad.innerHTML += '<option value="18 hs (08:00 a 02:00)">18 hs (08:00 a 02:00)</option>';
      selModalidad.innerHTML += '<option value="18 hs (14:00 a 08:00)">18 hs (14:00 a 08:00)</option>';

      // 12 Horas
      selModalidad.innerHTML += '<option value="12 hs Diurna (08:00-20:00)">12 hs Diurna (08:00-20:00)</option>';
      selModalidad.innerHTML += '<option value="12 hs Nocturna (20:00-08:00)">12 hs Nocturna (20:00-08:00)</option>';

      // 6 Horas
      selModalidad.innerHTML += '<option value="6 hs (08:00-14:00)">6 hs (08:00-14:00)</option>';
      selModalidad.innerHTML += '<option value="6 hs (14:00-20:00)">6 hs (14:00-20:00)</option>';
      selModalidad.innerHTML += '<option value="6 hs (20:00-02:00)">6 hs (20:00-02:00)</option>';
      selModalidad.innerHTML += '<option value="6 hs (02:00-08:00)">6 hs (02:00-08:00)</option>';
    } else {
      selModalidad.innerHTML += '<option value="Semanal/Bloque">Semanal / Bloque Continuo (24 hs)</option>';
      selModalidad.innerHTML += '<option value="24 hs (08:00 a 08:00)">24 hs (08:00 a 08:00)</option>';
      selModalidad.innerHTML += '<option value="12 hs Diurna (08:00-20:00)">12 hs Diurna (08:00-20:00)</option>';
      selModalidad.innerHTML += '<option value="12 hs Nocturna (20:00-08:00)">12 hs Nocturna (20:00-08:00)</option>';
    }

    if (valorPrevio && selModalidad.querySelector('option[value="' + valorPrevio + '"]')) {
      selModalidad.value = valorPrevio;
    }
  }

  if (selServicio) {
    selServicio.addEventListener('change', actualizarOpcionesModalidad);
    actualizarOpcionesModalidad();
  }

  if (txtFechaInicio && txtFechaFin) {
    txtFechaInicio.addEventListener('change', function() {
      // Para turnos que se cargan por día, sincroniza la fecha fin por defecto
      if (!txtFechaFin.value || txtFechaFin.value < txtFechaInicio.value) {
        txtFechaFin.value = txtFechaInicio.value;
      }
    });
  }

  if (formCarga) {
    formCarga.addEventListener('submit', async function(e) {
      e.preventDefault();

      var btnGuardar = formCarga.querySelector('button[type="submit"]');
      if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';
      }

      var payload = {
        servicio: document.getElementById('servicio').value,
        tipo: document.getElementById('tipo').value,
        modalidad: document.getElementById('modalidad').value,
        fecha_inicio: document.getElementById('fecha_inicio').value,
        fecha_fin: document.getElementById('fecha_fin').value || document.getElementById('fecha_inicio').value,
        responsable: document.getElementById('responsable').value.trim(),
        contacto: document.getElementById('contacto').value.trim(),
        interno: document.getElementById('interno') ? document.getElementById('interno').value.trim() : '',
        observaciones: document.getElementById('observaciones') ? document.getElementById('observaciones').value.trim() : ''
      };

      try {
        const { error } = await db.from('guardias').insert([payload]);
        if (error) throw error;

        alert('Guardia registrada correctamente.');
        window.location.href = 'index.php';
      } catch (err) {
        alert('Error al guardar la guardia: ' + (err.message || err));
        if (btnGuardar) {
          btnGuardar.disabled = false;
          btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i> Guardar Guardia';
        }
      }
    });
  }
});
