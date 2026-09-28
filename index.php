<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monitor de Guardias - HIRS</title>
  
  <base href="./">

  <!-- CSS Bootstrap & Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  
  <!-- Nombre real del archivo CSS -->
  <link rel="stylesheet" href="./css/styles.css?v=2.4.49">
</head>
<body class="bg-dark-theme text-white">

  <!-- Navbar / Header de Guardia -->
  <nav class="navbar navbar-dark bg-panel px-3 shadow-sm border-bottom border-secondary">
    <div class="container-fluid">
      <span class="navbar-brand mb-0 h1 d-flex align-items-center gap-2">
        <i class="bi bi-shield-check text-info"></i> Monitor de Guardias TI — HIRS
      </span>
      <div class="d-flex align-items-center gap-3 text-white-50 small">
        <span class="clock-display text-info"><i class="bi bi-calendar3 me-1"></i> 28/09/2026</span>
        <span class="badge bg-secondary">v2.4.49</span>
      </div>
    </div>
  </nav>

  <!-- Contenedor Principal del Dashboard -->
  <main class="container-fluid py-4" style="max-width: 1400px;">
    
    <!-- Alertas y Métricas Rápidas -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-4">
        <div class="card shadow-sm border-0 border-start border-danger border-4 bg-panel text-white">
          <div class="card-body">
            <span class="text-white-50 small text-uppercase fw-bold">Pendientes Urgentes</span>
            <h3 class="fw-bold mb-0 text-danger" id="count-urgentes">0</h3>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card shadow-sm border-0 border-start border-warning border-4 bg-panel text-white">
          <div class="card-body">
            <span class="text-white-50 small text-uppercase fw-bold">En Diagnóstico / Reparación</span>
            <h3 class="fw-bold mb-0 text-warning" id="count-proceso">0</h3>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card shadow-sm border-0 border-start border-success border-4 bg-panel text-white">
          <div class="card-body">
            <span class="text-white-50 small text-uppercase fw-bold">Finalizadas Hoy</span>
            <h3 class="fw-bold mb-0 text-success" id="count-finalizadas">0</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de Filtro y Acciones -->
    <div class="card shadow-sm border-0 mb-4 bg-panel text-white">
      <div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="d-flex gap-2 flex-grow-1" style="max-width: 450px;">
          <input type="text" id="filtro-busqueda" class="form-control bg-dark text-white border-secondary" placeholder="Buscar por servicio, ítem o detalle...">
        </div>
        <div class="d-flex gap-2">
          <button id="btn-recargar" class="btn btn-outline-info btn-sm">
            <i class="bi bi-arrow-clockwise me-1"></i> Actualizar
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla Dinámica de Guardia -->
    <div class="card shadow-sm border-0 bg-panel text-white">
      <div class="table-responsive">
        <table class="table table-dark table-hover align-middle mb-0" id="tabla-guardia">
          <thead>
            <tr>
              <th style="width: 10%;">Fecha</th>
              <th style="width: 20%;">Servicio</th>
              <th style="width: 20%;">Ítem / Equipo</th>
              <th style="width: 30%;">Inconveniente / Diagnóstico</th>
              <th style="width: 10%;" class="text-center">Estado</th>
              <th style="width: 10%;" class="text-center">Acción</th>
            </tr>
          </thead>
          <tbody id="tbody-guardia">
            <tr>
              <td colspan="6" class="text-center text-muted p-4">
                <span class="spinner-border spinner-border-sm me-2 text-info"></span> Cargando tareas de guardia...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </main>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="./js/logica.js?v=2.4.49"></script>
  <script src="./js/dashboard.js?v=2.4.49"></script>
</body>
</html>
