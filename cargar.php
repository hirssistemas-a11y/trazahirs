<?php
$authFile = __DIR__ . '/../../includes/auth.php';
if (file_exists($authFile)) {
    require_once $authFile;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$USUARIO_LOGUEADO = $_SESSION['username'] ?? '';
$NOMBRE_SERVICIO  = $_SESSION['name'] ?? '';

$APP_VERSION = "v2.6.0";
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <base href="/services/guardias/">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cargar Guardia - Hospital Italiano Regional del Sur</title>
  <link rel="icon" type="image/png" href="https://lh3.googleusercontent.com/d/1USDxCpANAUHIePsWM-mHkF6We3Ugo-jL">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css">
  <style>
    body { background-color: #0b1329; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; }
    .panel-card { border-radius: 12px; background-color: #162238; border: 1px solid #223454; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 820px; margin: 0 auto; }
    .form-control, .form-select, textarea { 
      background-color: #0f172a !important; 
      border: 1px solid #334155 !important; 
      color: #ffffff !important; 
    }
    .form-control:focus, .form-select:focus, textarea:focus { 
      background-color: #0f172a !important; 
      color: #ffffff !important; 
      border-color: #38bdf8 !important; 
      box-shadow: 0 0 0 0.2rem rgba(56, 189, 248, 0.25) !important; 
    }
    .btn-modo-fecha {
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: 6px;
      padding: 5px 12px;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/es.js"></script>
</head>
<body>

<div class="container py-3">
  <div class="card panel-card p-4 p-md-5">
    
    <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
      <div class="d-flex align-items-center gap-3">
        <img src="https://lh3.googleusercontent.com/d/1USDxCpANAUHIePsWM-mHkF6We3Ugo-jL" alt="HIRS" height="42">
        <div>
          <h4 class="mb-0 text-white fw-bold">Carga de Guardia Médica / Operativa</h4>
          <small class="text-secondary">Hospital Italiano Regional del Sur</small>
        </div>
      </div>
      <a href="index.php" class="btn btn-outline-secondary btn-sm fw-bold">
        <i class="bi bi-arrow-left"></i> Volver al Panel
      </a>
    </div>

    <form id="formGuardia">
      
      <!-- Fila 1: Servicio -->
      <div class="mb-3">
        <label for="servicio" class="form-label text-light fw-bold small">Servicio *</label>
        <select id="servicio" class="form-select" required>
          <option value="">-- Seleccione un Servicio --</option>
        </select>
        <div id="servicioAyuda" class="form-text text-info small mt-1"></div>
      </div>

      <!-- Fila 2: Los 3 Casilleros Encadenados (Tipo / Duración / Franja) -->
      <div class="row g-2 mb-3">
        <div class="col-md-4">
          <label for="tipo" class="form-label text-light fw-bold small">Tipo de Guardia *</label>
          <select id="tipo" class="form-select" required>
            <option value="Activa">Activa (En Planta)</option>
            <option value="Pasiva">Pasiva (A demanda)</option>
          </select>
        </div>
        <div class="col-md-4">
          <label for="duracion" class="form-label text-light fw-bold small">Duración del Turno *</label>
          <select id="duracion" class="form-select" required>
            <!-- Se puebla dinámicamente según el servicio -->
          </select>
        </div>
        <div class="col-md-4">
          <label for="franja" class="form-label text-light fw-bold small">Franja del Turno *</label>
          <select id="franja" class="form-select" required>
            <!-- Se puebla dinámicamente según la duración -->
          </select>
        </div>
      </div>

      <!-- Fila 3: Rango de Cobertura o Días Específicos -->
      <div class="mb-3">
        <label class="form-label text-light fw-bold small d-flex justify-content-between align-items-center">
          <span>Fecha o Rango de Cobertura *</span>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-sm btn-outline-info btn-modo-fecha active" id="btnModoRango" onclick="cambiarModoFecha('rango')">
              <i class="bi bi-calendar-range"></i> Rango Continuo
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary btn-modo-fecha" id="btnModoDias" onclick="cambiarModoFecha('multiple')">
              <i class="bi bi-calendar3"></i> Días Específicos
            </button>
          </div>
        </label>
        
        <input type="text" id="selectorFechas" class="form-control" placeholder="Seleccione fecha(s)..." required readonly>
        <div id="rangoAyuda" class="form-text text-secondary small mt-1">Seleccione una fecha de inicio y una de fin para cubrir el bloque.</div>

        <input type="hidden" id="fecha_inicio">
        <input type="hidden" id="fecha_fin">
      </div>

      <!-- Fila 4: Responsable / Teléfono / Interno -->
      <div class="row g-2 mb-3">
        <div class="col-md-5">
          <label for="responsable" class="form-label text-light fw-bold small">Nombre y Apellido del Responsable *</label>
          <input type="text" id="responsable" class="form-control" placeholder="Ej: Dr. Pérez Juan" required>
        </div>
        <div class="col-md-4">
          <label for="contacto" class="form-label text-light fw-bold small">Teléfono / WhatsApp de Contacto *</label>
          <input type="tel" id="contacto" class="form-control" placeholder="Ej: 2914123456" required>
        </div>
        <div class="col-md-3">
          <label for="interno" class="form-label text-light fw-bold small">Interno Hospitalario</label>
          <input type="text" id="interno" class="form-control" placeholder="Ej: 314">
        </div>
      </div>

      <!-- Fila 5: Observaciones / Estado Operativo -->
      <div class="mb-4">
        <label for="observaciones" class="form-label text-light fw-bold small">Observaciones / Estado Operativo Especial</label>
        <select id="observaciones" class="form-select">
          <option value="Normal Activa">Normal Activa (Sin Novedad)</option>
          <option value="Código Rojo">Código Rojo (Sin Cobertura / Crítico)</option>
          <option value="Guardia Restringida">Guardia Restringida / Refuerzo</option>
        </select>
      </div>

      <div class="d-flex justify-content-end gap-2 pt-3 border-top border-secondary">
        <a href="index.php" class="btn btn-secondary btn-sm">Cancelar</a>
        <button type="submit" class="btn btn-primary btn-sm fw-bold px-4">
          <i class="bi bi-save me-1"></i> Guardar Guardia
        </button>
      </div>

    </form>
  </div>
</div>

<script src="js/config.js?v=<?php echo $APP_VERSION; ?>"></script>
<script src="js/formulario.js?v=<?php echo $APP_VERSION; ?>"></script>
</body>
</html>
