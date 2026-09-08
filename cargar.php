<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carga de Guardias - Hospital Italiano</title>
  <link rel="icon" type="image/png" href="https://lh3.googleusercontent.com/d/1USDxCpANAUHIePsWM-mHkF6We3Ugo-jL">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <link rel="stylesheet" href="https://npmcdn.com/flatpickr/dist/themes/dark.css">
  <style>
    body { background-color: #0b1329; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 16px; }
    .card-form { border-radius: 12px; background-color: #162238; border: 1px solid #223454; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    
    .form-control, .form-select { 
      background-color: #0f172a !important; 
      border: 1px solid #334155 !important; 
      color: #ffffff !important; 
    }
    .form-control::placeholder { 
      color: #94a3b8 !important; 
      opacity: 0.9; 
    }
    .form-control:focus, .form-select:focus { 
      background-color: #0f172a !important; 
      color: #ffffff !important; 
      border-color: #38bdf8 !important; 
      box-shadow: 0 0 0 0.2rem rgba(56, 189, 248, 0.25) !important; 
    }
    .form-select option, .form-select optgroup {
      background-color: #0f172a !important;
      color: #ffffff !important;
    }
    .form-select:disabled, .form-control:disabled {
      background-color: #1e293b !important;
      color: #cbd5e1 !important;
      opacity: 0.85;
    }
    .form-text { color: #94a3b8; }
    .logo-img { height: 50px; width: auto; object-fit: contain; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>

  <div class="container py-4" style="max-width: 760px;">
    
    <div class="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary pb-3">
      <div class="d-flex align-items-center gap-3">
        <img src="https://lh3.googleusercontent.com/d/1USDxCpANAUHIePsWM-mHkF6We3Ugo-jL" alt="HIRS" class="logo-img">
        <div>
          <h3 class="mb-0 text-white fw-bold fs-4">Carga de Guardias Hospitalarias</h3>
          <small class="text-secondary">Hospital Italiano Regional del Sur</small>
        </div>
      </div>
      <a href="index.php" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-arrow-left"></i> Volver al Monitor
      </a>
    </div>

    <div class="card card-form p-4">
      <form id="formGuardia" autocomplete="off">

        <!-- Servicio -->
        <div class="mb-3">
          <label class="form-label text-light fw-bold small">Servicio *</label>
          <select id="servicio" class="form-select" required>
            <option value="">-- Seleccione un Servicio --</option>
            <optgroup label="Servicios Médicos / Asistenciales">
              <option value="Guardia externa Adultos">Guardia externa Adultos</option>
              <option value="Guardia externa Pediatrica">Guardia externa Pediatrica</option>
              <option value="Neonatologia">Neonatologia</option>
              <option value="Cirugia General">Cirugia General</option>
              <option value="Traumatologia">Traumatologia</option>
              <option value="Ginecologia">Ginecologia</option>
              <option value="Obstetricia">Obstetricia</option>
              <option value="Parteras">Parteras</option>
              <option value="Laboratorio">Laboratorio</option>
              <option value="Cardiologia/Unidad Coronaria">Cardiologia/Unidad Coronaria</option>
              <option value="Anestesista">Anestesista</option>
              <option value="Tecnico de Anestesia">Tecnico de Anestesia</option>
              <option value="Ecografia">Ecografia</option>
              <option value="Gastroenterologia">Gastroenterologia</option>
              <option value="Tecnico de Imagenes">Tecnico de Imagenes</option>
            </optgroup>
            <optgroup label="Servicios Operativos / Apoyo">
              <option value="Sistemas">Sistemas</option>
              <option value="Electromedicina">Electromedicina</option>
              <option value="Farmacia">Farmacia</option>
              <option value="Instrumentadoras">Instrumentadoras</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Esterilizacion">Esterilizacion</option>
              <option value="Hemoterapia">Hemoterapia</option>
              <option value="RX Quirofano">RX Quirofano</option>
            </optgroup>
          </select>
        </div>

        <div class="row g-3 mb-3">
          <!-- Tipo de Guardia -->
          <div class="col-md-4" id="colTipo">
            <label class="form-label text-light fw-bold small">Tipo de Guardia *</label>
            <select id="tipo" class="form-select" required>
              <option value="Activa">Activa (En Planta)</option>
              <option value="Pasiva">Pasiva (A demanda)</option>
            </select>
          </div>

          <!-- Duración del Turno (Visible SOLO para Guardia Externa) -->
          <div class="col-md-4" id="colDuracion" style="display: none;">
            <label class="form-label text-light fw-bold small">Duración del Turno *</label>
            <select id="duracionTurno" class="form-select">
              <option value="24">24 Horas</option>
              <option value="12">12 Horas</option>
              <option value="6">6 Horas</option>
            </select>
          </div>

          <!-- Modalidad / Franja Horaria -->
          <div class="col-md-8" id="colModalidad">
            <label class="form-label text-light fw-bold small">Modalidad / Franja Horaria *</label>
            <select id="modalidad" class="form-select" required>
              <option value="24 hs (08:00-08:00)">24 hs (08:00 a 08:00)</option>
            </select>
          </div>
        </div>

        <!-- Selección de Fechas -->
        <div class="mb-3">
          <label class="form-label text-light fw-bold small">Fecha o Rango de Cobertura *</label>
          <div class="d-flex gap-2 mb-2">
            <button type="button" class="btn btn-outline-info btn-sm" id="btnModoRango" onclick="cambiarModoCalendario('range')">
              <i class="bi bi-calendar-range"></i> Rango Continuo
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" id="btnModoDias" onclick="cambiarModoCalendario('multiple')">
              <i class="bi bi-calendar-week"></i> Días Específicos
            </button>
          </div>
          <input type="text" id="selectorFechas" class="form-control" placeholder="Seleccione fecha(s)..." required autocomplete="off">
          <div class="form-text" id="ayudaFechas">Seleccione una fecha de inicio y una de fin para cubrir el bloque.</div>
        </div>

        <!-- Profesional / Responsable -->
        <div class="mb-3">
          <label class="form-label text-light fw-bold small">Nombre y Apellido del Responsable *</label>
          <input type="text" id="responsable" name="responsable_nombre" class="form-control" placeholder="Ej: Dr. Pérez Juan" required autocomplete="off">
        </div>

        <!-- Contactos -->
        <div class="row g-3 mb-4">
          <div class="col-md-7">
            <label class="form-label text-light fw-bold small">WhatsApp / Teléfono Móvil *</label>
            <input type="tel" id="contacto" name="telefono_guardia" class="form-control" placeholder="Ej: 2914123456" required autocomplete="off">
            <div class="form-text">Sin 0 ni 15. Usado para llamadas y chat directo de WhatsApp.</div>
          </div>

          <div class="col-md-5">
            <label class="form-label text-light fw-bold small">Número Interno (Opcional)</label>
            <input 
              type="text" 
              id="interno" 
              name="interno_hospitalario_hirs" 
              class="form-control" 
              placeholder="Ej: 1420" 
              autocomplete="off" 
              autocorrect="off" 
              autocapitalize="off" 
              spellcheck="false" 
              inputmode="numeric">
            <div class="form-text">Interno estático para consulta visual en planta.</div>
          </div>
        </div>

        <!-- Alertas y Feedback -->
        <div id="alertaFeedback" style="display: none;" class="alert mb-3"></div>

        <button type="submit" id="btnGuardar" class="btn btn-primary w-100 py-2 fw-bold">
          <i class="bi bi-check-circle"></i> Confirmar Asignación de Guardia
        </button>
      </form>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  <script src="https://npmcdn.com/flatpickr/dist/l10n/es.js"></script>
  <script src="js/config.js"></script>
  <script src="js/logica.js"></script>
  <script src="js/formulario.js?v=7"></script>
</body>
</html>
