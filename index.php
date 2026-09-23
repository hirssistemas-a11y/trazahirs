<?php
require '../defs/auth.php';

// Captura de datos de sesión autenticados por auth.php
$USUARIO_LOGUEADO = $_SESSION['username'] ?? '';
$NOMBRE_SERVICIO  = $_SESSION['name'] ?? '';

// Control central de versión
$APP_VERSION = "v2.4.39";
$APP_FECHA   = "22/09/2026";
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Guardias - Hospital Italiano</title>
  <link rel="icon" type="image/png" href="https://lh3.googleusercontent.com/d/1USDxCpANAUHIePsWM-mHkF6We3Ugo-jL">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
  <style>
    body { background-color: #0b1329; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 16px; }
    .panel-card { border-radius: 12px; background-color: #162238; border: 1px solid #223454; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .table { color: #f8fafc; vertical-align: middle; }
    .clock-box { font-size: 1.2rem; font-weight: bold; color: #38bdf8; font-variant-numeric: tabular-nums; }
    .btn-admin { border-color: #334155; color: #94a3b8; font-size: 0.85rem; }
    .btn-admin:hover { background-color: #1e293b; color: #f8fafc; }

    .form-control, .form-select, textarea, .filtro-input { 
      background-color: #0f172a !important; 
      border: 1px solid #334155 !important; 
      color: #ffffff !important; 
    }
    .form-control::placeholder, textarea::placeholder { 
      color: #94a3b8 !important; 
      opacity: 1 !important; 
    }
    .form-control:focus, textarea:focus, .filtro-input:focus { 
      background-color: #0f172a !important; 
      color: #ffffff !important; 
      border-color: #38bdf8 !important; 
      box-shadow: 0 0 0 0.2rem rgba(56, 189, 248, 0.25) !important; 
    }

    .sync-badge { font-size: 0.75rem; color: #94a3b8; }
    
    .logo-desktop { height: 60px; width: auto; object-fit: contain; }
    .logo-mobile { height: 40px; width: auto; object-fit: contain; }

    .btn-switch {
      padding: 9px 18px;
      font-weight: 700;
      font-size: 0.9rem;
      border-radius: 10px;
      transition: background-color 0.2s, color 0.2s;
      outline: none !important;
      box-shadow: none !important;
      -webkit-tap-highlight-color: transparent;
    }
    
    .btn-switch-active,
    .btn-switch-active:focus,
    .btn-switch-active:active {
      background-color: #38bdf8 !important;
      color: #0b1329 !important;
      border: 1px solid #38bdf8 !important;
    }
    
    .btn-switch-inactive,
    .btn-switch-inactive:focus {
      background-color: #162238 !important;
      color: #94a3b8 !important;
      border: 1px solid #334155 !important;
    }

    @media (hover: hover) and (pointer: fine) {
      .btn-switch-inactive:hover {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border-color: #475569 !important;
      }
    }

    .btn-action-tel {
      background-color: #0284c7;
      color: #fff;
      border: none;
      padding: 4px 10px;
      font-size: 0.82rem;
      border-radius: 6px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .btn-action-tel:hover { background-color: #0369a1; color: #fff; }
    
    .btn-action-wsp {
      background-color: #16a34a;
      color: #fff;
      border: none;
      padding: 4px 10px;
      font-size: 0.82rem;
      border-radius: 6px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .btn-action-wsp:hover { background-color: #15803d; color: #fff; }

    .btn-action-report {
      background-color: #334155;
      color: #f87171;
      border: 1px solid #475569;
      padding: 4px 9px;
      font-size: 0.82rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-action-report:hover {
      background-color: #dc2626;
      border-color: #dc2626;
      color: #ffffff;
    }

    .badge-interno {
      background-color: #1e293b;
      color: #94a3b8;
      border: 1px solid #334155;
      font-size: 0.78rem;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      user-select: none;
    }

    .tabla-vacia { color: #94a3b8 !important; font-size: 0.92rem; padding: 24px 0 !important; }

    .alerta-oscura {
      background-color: rgba(220, 38, 38, 0.12) !important;
      border: 1px solid rgba(239, 68, 68, 0.45) !important;
      border-radius: 10px;
      color: #cbd5e1 !important;
      padding: 16px 20px;
    }
    .alerta-oscura strong { color: #ffffff !important; }
    .alerta-oscura u { color: #f87171 !important; text-decoration: none; font-weight: 600; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
</head>
<body>

  <!-- Barra Superior -->
  <div class="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3 flex-wrap gap-3">
    <div class="d-flex align-items-center gap-3">
      <img src="https://lh3.googleusercontent.com/d/1NQG63WbeI_nf1gDNrC5HR_JO2ieY0ohL" 
           alt="Hospital Italiano Regional del Sur" 
           class="logo-desktop d-none d-md-block">

      <img src="https://lh3.googleusercontent.com/d/1USDxCpANAUHIePsWM-mHkF6We3Ugo-jL" 
           alt="HIRS" 
           class="logo-mobile d-block d-md-none">

      <div>
        <h2 class="mb-0 text-white fw-bold fs-4">PANEL DE GUARDIAS VIGENTES</h2>
        <div class="d-flex align-items-center gap-2 mt-1 flex-wrap">
          <small class="text-secondary">Hospital Italiano - Tiempo Real</small>
          <span class="text-secondary d-none d-sm-inline">•</span>
          <span id="syncStatus" class="sync-badge"><i class="bi bi-arrow-repeat spin"></i> Conectando...</span>
        </div>
      </div>
    </div>
    
    <div class="d-flex align-items-center gap-2 ms-auto flex-wrap">
      <!-- Botón Descargar Mi Planilla (Autoservicio) -->
      <button class="btn btn-outline-success btn-sm fw-bold" type="button" onclick="abrirModalMiPlanilla()" title="Descargar planilla de mi servicio">
        <i class="bi bi-file-earmark-spreadsheet"></i> <span class="d-none d-sm-inline">Mi Planilla</span>
      </button>

      <!-- Botón Ayuda / Soporte Directo -->
      <a href="https://wa.me/5492914617969?text=Hola!%20Necesito%20asistencia%20o%20soporte%20con%20el%20Panel%20de%20Guardias%20del%20Hospital%20Italiano." target="_blank" rel="noopener noreferrer" class="btn btn-outline-info btn-sm fw-bold" title="Contactar a Sistemas por WhatsApp">
        <i class="bi bi-question-circle"></i> <span class="d-none d-sm-inline">Ayuda</span>
      </a>

      <!-- Botón Cargar Guardia -->
      <a href="cargar.php" class="btn btn-primary btn-sm fw-bold">
        <i class="bi bi-plus-circle"></i> <span class="d-none d-sm-inline">Cargar Guardia</span>
      </a>

      <!-- Botón Actualizar -->
      <button class="btn btn-outline-secondary btn-sm" onclick="forzarRefresco()" title="Actualizar datos ahora">
        <i class="bi bi-arrow-clockwise"></i> <span class="d-none d-sm-inline">Actualizar</span>
      </button>

      <div id="reloj" class="clock-box px-2"></div>

      <!-- Botón Administrador -->
      <button class="btn btn-admin btn-sm" onclick="abrirModalLogin()" id="btnAuth">
        <i class="bi bi-shield-lock"></i> <span class="d-none d-sm-inline">Administrador</span>
      </button>

      <!-- Botón Cerrar Sesión General -->
      <a href="logout.php" class="btn btn-outline-danger btn-sm" title="Cerrar Sesión de Traza HIRS">
        <i class="bi bi-box-arrow-right"></i> <span class="d-none d-sm-inline">Salir</span>
      </a>
    </div>
  </div>

  <!-- Selector Principal de Categorías -->
  <div class="d-flex gap-2 mb-4 flex-wrap">
    <button class="btn btn-switch btn-switch-active flex-fill flex-md-grow-0" id="btnTabTodos" onclick="filtrarCategoria('todas')">
      <i class="bi bi-grid-fill me-1"></i> Toda la Guardia
    </button>
    <button class="btn btn-switch btn-switch-inactive flex-fill flex-md-grow-0" id="btnTabProf" onclick="filtrarCategoria('profesional')">
      <i class="bi bi-heart-pulse-fill me-1"></i> Guardias Profesionales
    </button>
    <button class="btn btn-switch btn-switch-inactive flex-fill flex-md-grow-0" id="btnTabOper" onclick="filtrarCategoria('operativa')">
      <i class="bi bi-tools me-1"></i> Guardias Operativas (Apoyo)
    </button>
  </div>

  <!-- Vista Monitor Principal -->
  <div class="row g-4 mb-5" id="vistaMonitor">
    <div class="col-lg-6" id="colActivas">
      <div class="card panel-card p-3 p-md-4 h-100">
        <h4 class="text-success mb-3 d-flex align-items-center gap-2 fs-5">
          <span class="spinner-grow spinner-grow-sm text-success" role="status"></span>
          Guardias Activas (En Planta)
        </h4>
        <div class="table-responsive">
          <table class="table table-dark table-hover mb-0">
            <thead>
              <tr class="text-secondary border-secondary">
                <th>Servicio</th>
                <th>Responsable</th>
                <th>Comunicarse / Reporte</th>
              </tr>
            </thead>
            <tbody id="tablaActivas">
              <tr><td colspan="3" class="text-center tabla-vacia">Cargando datos...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="col-lg-6" id="colPasivas">
      <div class="card panel-card p-3 p-md-4 h-100">
        <h4 class="text-info mb-3 d-flex align-items-center gap-2 fs-5">
          <span class="spinner-grow spinner-grow-sm text-info" role="status"></span>
          Guardias Pasivas (A demanda)
        </h4>
        <div class="table-responsive">
          <table class="table table-dark table-hover mb-0">
            <thead>
              <tr class="text-secondary border-secondary">
                <th>Servicio</th>
                <th>Responsable</th>
                <th>Comunicarse / Reporte</th>
              </tr>
            </thead>
            <tbody id="tablaPasivas">
              <tr><td colspan="3" class="text-center tabla-vacia">Cargando datos...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Sección Administrador -->
  <div id="seccionAdmin" style="display: none;" class="card panel-card p-4 mb-4 border-info">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="text-warning mb-0 fs-5"><i class="bi bi-shield-check"></i> Panel de Control y Auditoria</h4>
      <button class="btn btn-outline-danger btn-sm" onclick="cerrarSesionAdmin()">Cerrar Sesion Admin</button>
    </div>

    <!-- Alertas de Descubiertos -->
    <div id="contenedorAlertas" class="mb-4" style="display: none;">
      <div class="alerta-oscura d-flex align-items-start gap-3">
        <i class="bi bi-exclamation-triangle-fill text-danger fs-4 mt-0"></i>
        <div class="w-100">
          <h6 class="text-danger fw-bold mb-2 fs-6">Servicios Críticos Sin Cobertura Detectada (Próximas 24/48 hs):</h6>
          <div id="listaHuecos" class="small" style="line-height: 1.6;"></div>
        </div>
      </div>
    </div>

    <!-- Barra de Acciones del Administrador -->
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 pt-2 border-top border-secondary">
      <h5 class="text-white mb-0 fs-6"><i class="bi bi-clock-history me-1"></i> Historial y Auditoria de Guardias</h5>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-danger btn-sm fw-bold" onclick="abrirModalLogs()">
          <i class="bi bi-journal-text"></i> Logs de Auditoría
        </button>
        <button class="btn btn-outline-warning btn-sm fw-bold" onclick="abrirModalIncumplidas()">
          <i class="bi bi-exclamation-octagon-fill"></i> Incidentes de Guardia
        </button>
        <button class="btn btn-outline-info btn-sm fw-bold" onclick="abrirModalJefes()">
          <i class="bi bi-person-lines-fill"></i> Administrar Jefes de Servicio
        </button>
        <button class="btn btn-success btn-sm fw-bold" onclick="exportarExcelFiltrado()">
          <i class="bi bi-file-earmark-excel"></i> Exportar a Excel
        </button>
        <a href="cargar.php" class="btn btn-primary btn-sm fw-bold">
          <i class="bi bi-plus-circle"></i> Cargar Nueva Guardia
        </a>
      </div>
    </div>

    <!-- Filtros del Historial -->
    <div class="row g-2 mb-3">
      <div class="col-md-3">
        <label class="form-label text-secondary small">Buscar por Nombre o Contacto:</label>
        <input type="text" id="filtroNombre" class="form-control" placeholder="..." autocomplete="new-password" oninput="filtrarHistorial()">
      </div>
      <div class="col-md-3">
        <label class="form-label text-secondary small">Servicio:</label>
        <select id="filtroServicio" class="form-select form-select-sm filtro-input" onchange="filtrarHistorial()">
          <option value="">Todos los servicios</option>
        </select>
      </div>
      <div class="col-md-3">
        <label class="form-label text-secondary small">Desde:</label>
        <input type="date" id="filtroDesde" class="form-control form-control-sm filtro-input" onchange="filtrarHistorial()">
      </div>
      <div class="col-md-3">
        <label class="form-label text-secondary small">Hasta:</label>
        <input type="date" id="filtroHasta" class="form-control form-control-sm filtro-input" onchange="filtrarHistorial()">
      </div>
    </div>

    <!-- Tabla Historial -->
    <div class="table-responsive" style="max-height: 480px; overflow-y: auto;">
      <table class="table table-dark table-hover table-striped mb-0">
        <thead class="sticky-top bg-dark">
          <tr class="text-secondary border-secondary">
            <th>Fecha Carga</th>
            <th>Servicio</th>
            <th>Tipo</th>
            <th>Modalidad</th>
            <th>Rango Cobertura</th>
            <th>Responsable</th>
            <th>WhatsApp / Tel</th>
            <th>Interno</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody id="tablaHistorial">
          <tr><td colspan="9" class="text-center tabla-vacia">Cargando historial...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <footer class="text-center text-secondary py-3 my-4 border-top border-secondary small">
    <span>HIRS Monitor de Guardias • <strong id="lblVersion"><?php echo $APP_VERSION; ?></strong></span>
    <span class="mx-2">•</span>
    <span>Última versión: <strong id="lblFechaUpdate"><?php echo $APP_FECHA; ?></strong></span>
  </footer>

  <!-- Modal Descargar Mi Planilla (Filtrado estricto por Servicio Autenticado) -->
  <div class="modal fade" id="modalMiPlanilla" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-dark border-secondary text-white">
        <div class="modal-header border-secondary">
          <h5 class="modal-title fs-6 text-info">
            <i class="bi bi-file-earmark-spreadsheet me-2"></i> Descargar Planilla de mi Servicio
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label small text-secondary">Servicio autenticado:</label>
            <input type="text" id="miServicioNombre" class="form-control form-control-sm bg-secondary bg-opacity-25 text-white fw-bold" readonly>
            <div class="form-text" style="font-size: 0.75rem;">Solo se exportarán registros correspondientes a su área asignada.</div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="form-label small text-secondary">Desde:</label>
              <input type="date" id="miPlanillaDesde" class="form-control form-control-sm filtro-input">
            </div>
            <div class="col-6">
              <label class="form-label small text-secondary">Hasta:</label>
              <input type="date" id="miPlanillaHasta" class="form-control form-control-sm filtro-input">
            </div>
          </div>
        </div>
        <div class="modal-footer border-secondary">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-success btn-sm fw-bold" onclick="exportarExcelMiServicio()">
            <i class="bi bi-file-earmark-excel"></i> Descargar Excel (.xlsx)
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Login Admin -->
  <div class="modal fade" id="modalLogin" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content bg-dark border-secondary text-white">
        <div class="modal-header border-secondary">
          <h5 class="modal-title fs-6">PIN de Administrador</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="password" id="adminPin" class="form-control filtro-input text-center fs-5" placeholder="••••" maxlength="20">
          <div id="loginError" class="text-danger small mt-2 text-center" style="display:none;">PIN incorrecto</div>
        </div>
        <div class="modal-footer border-secondary">
          <button type="button" class="btn btn-primary w-100" onclick="validarPin()">Ingresar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 1: Reportar Incidente de Guardia -->
  <div class="modal fade" id="modalConfirmarReporte" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-dark border-danger text-white">
        <div class="modal-header border-secondary">
          <h5 class="modal-title fs-6 text-danger">
            <i class="bi bi-exclamation-triangle-fill me-2"></i> Reportar Incidente de Guardia
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <p class="mb-2 fs-6">¿Está seguro que desea reportar un incidente sobre esta guardia?</p>
          <div class="p-2 rounded bg-black bg-opacity-50 border border-secondary small text-secondary mb-3">
            <div>Servicio: <strong id="confRepServicio" class="text-white"></strong></div>
            <div>Responsable: <strong id="confRepResponsable" class="text-white"></strong></div>
          </div>

          <div class="mb-1">
            <label class="form-label small text-secondary d-flex justify-content-between">
              <span>Detalle del incidente (Opcional):</span>
              <span id="charCount" class="text-info fw-bold">0/120</span>
            </label>
            <textarea id="motivoIncidente" class="form-control" rows="3" maxlength="120" placeholder="Escriba brevemente el inconveniente o novedad..." oninput="actualizarContadorChar(this)"></textarea>
          </div>
        </div>
        <div class="modal-footer border-secondary d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">No, cancelar</button>
          <button type="button" class="btn btn-danger btn-sm fw-bold" onclick="confirmarReporteIncumplimiento()">Sí, reportar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 2: Contacto del Jefe de Servicio -->
  <div class="modal fade" id="modalContactoReferente" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-dark border-secondary text-white">
        <div class="modal-header border-secondary">
          <h5 class="modal-title fs-6 text-success">
            <i class="bi bi-check-circle-fill me-1"></i> Reporte Registrado
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <p class="mb-2 text-light">Gracias por su aporte. Le dejamos el contacto del Responsable del Servicio:</p>
          <div class="p-3 rounded bg-black bg-opacity-50 border border-secondary my-3">
            <div class="text-secondary small mb-1">Servicio:</div>
            <div id="repServicio" class="fw-bold text-info fs-5 mb-2"></div>
            
            <div class="text-secondary small mb-1">Responsable / Jefe de Servicio:</div>
            <div id="repNombre" class="fw-bold text-white fs-6 mb-3"></div>
            
            <div class="text-secondary small mb-1">Contacto directo:</div>
            <div id="repAccionesContacto" class="d-flex align-items-center gap-2 flex-wrap mt-1"></div>
          </div>
        </div>
        <div class="modal-footer border-secondary">
          <button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="modal">Entendido</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 3: Administrar Jefes de Servicio -->
  <div class="modal fade" id="modalJefes" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content bg-dark border-secondary text-white">
        <div class="modal-header border-secondary">
          <h5 class="modal-title fs-6 text-info">
            <i class="bi bi-person-lines-fill me-2"></i> Administrar Jefes / Referentes de Servicio
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="formJefe" class="row g-2 mb-3 align-items-end p-2 border border-secondary rounded bg-black bg-opacity-25" onsubmit="guardarJefeServicio(event)">
            <div class="col-md-4">
              <label class="form-label small text-secondary">Servicio:</label>
              <select id="jefeSelServicio" class="form-select form-select-sm" required>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-secondary">Nombre Jefe / Referente:</label>
              <input type="text" id="jefeNombre" class="form-control form-control-sm" placeholder="Ej: Dr. Gómez Juan" required>
            </div>
            <div class="col-md-3">
              <label class="form-label small text-secondary">Teléfono / WhatsApp:</label>
              <input type="tel" id="jefeContacto" class="form-control form-control-sm" placeholder="Ej: 2914123456" required>
            </div>
            <div class="col-md-1">
              <button type="submit" class="btn btn-success btn-sm w-100" title="Guardar cambios">
                <i class="bi bi-save"></i>
              </button>
            </div>
          </form>

          <div class="table-responsive" style="max-height: 320px; overflow-y: auto;">
            <table class="table table-dark table-sm table-striped mb-0">
              <thead class="sticky-top bg-dark text-secondary">
                <tr>
                  <th>Servicio</th>
                  <th>Jefe / Referente</th>
                  <th>Contacto</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody id="tablaJefesBody">
                <tr><td colspan="4" class="text-center tabla-vacia">Cargando jefaturas...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 4: Incidentes de Guardia -->
  <div class="modal fade" id="modalIncumplidas" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content bg-dark border-danger text-white">
        <div class="modal-header border-secondary">
          <div class="d-flex align-items-center justify-content-between w-100 pe-3 flex-wrap gap-2">
            <h5 class="modal-title fs-6 text-warning">
              <i class="bi bi-exclamation-octagon-fill me-2"></i> Auditoría de Incidentes de Guardia
            </h5>
            <button class="btn btn-success btn-sm fw-bold" onclick="exportarExcelIncumplidas()">
              <i class="bi bi-file-earmark-excel"></i> Exportar Incidentes (.xlsx)
            </button>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive" style="max-height: 420px; overflow-y: auto;">
            <table class="table table-dark table-hover table-striped mb-0">
              <thead class="sticky-top bg-dark text-secondary">
                <tr>
                  <th>Fecha de Reporte</th>
                  <th>Servicio</th>
                  <th>Responsable</th>
                  <th>Tipo</th>
                  <th>Modalidad</th>
                  <th>Detalle / Incidente</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody id="tablaIncumplidasBody">
                <tr><td colspan="7" class="text-center tabla-vacia">Cargando incidentes...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 5: Historial de Logs Irreplicable -->
  <div class="modal fade" id="modalLogs" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content bg-dark border-secondary text-white">
        <div class="modal-header border-secondary">
          <div class="d-flex align-items-center justify-content-between w-100 pe-3 flex-wrap gap-2">
            <h5 class="modal-title fs-6 text-danger">
              <i class="bi bi-shield-lock-fill me-2"></i> Historial Inmutable de Acciones y Modificaciones (Logs)
            </h5>
            <button class="btn btn-success btn-sm fw-bold" onclick="exportarExcelLogs()">
              <i class="bi bi-file-earmark-excel"></i> Exportar Logs (.xlsx)
            </button>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive" style="max-height: 460px; overflow-y: auto;">
            <table class="table table-dark table-hover table-striped mb-0">
              <thead class="sticky-top bg-dark text-secondary small">
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Acción</th>
                  <th>ID Reg.</th>
                  <th>Servicio</th>
                  <th>Responsable</th>
                  <th>Detalle Operativo</th>
                </tr>
              </thead>
              <tbody id="tablaLogsBody" class="small">
                <tr><td colspan="6" class="text-center tabla-vacia">Cargando logs de auditoría...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

<!-- Variables inyectadas por sesión de PHP -->
<script>
  const SESION_USUARIO = "<?php echo addslashes($USUARIO_LOGUEADO); ?>";
  const SESION_NOMBRE  = "<?php echo addslashes($NOMBRE_SERVICIO); ?>";
</script>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/config.js?v=<?php echo $APP_VERSION; ?>"></script>
<script src="js/logica.js?v=<?php echo $APP_VERSION; ?>"></script>
<script src="js/dashboard.js?v=<?php echo $APP_VERSION; ?>"></script>
</body>
</html>
