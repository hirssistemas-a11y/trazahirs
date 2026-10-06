// =========================================================
// FORMULARIO DE CARGA: PRECONFIGURACIÓN SERVICIO POR SERVICIO
// =========================================================

var CONFIG_SERVICIOS = {
  // --- SERVICIOS CON FRACCIONAMIENTO TOTAL Y ESTADOS CRÍTICOS ---
  "Guardia externa Adultos": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: true,
    nota: "Admite 6 hs, 12 hs, 18 hs y 24 hs. Habilitado para Código Rojo o Guardia Restringida." 
  },
  "Guardia externa Pediatrica": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: true,
    nota: "Admite 6 hs, 12 hs, 18 hs y 24 hs. Habilitado para Código Rojo o Guardia Restringida." 
  },
  "Neonatologia": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: false,
    nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs." 
  },
  "Terapia Intensiva (UTI)": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: false,
    nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs." 
  },
  "Terapia Intensiva Pediatrica (UTIP)": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: false,
    nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs." 
  },
  "Pediatria": { 
    tipo: "Activa", 
    fraccionable: true, 
    permiteAlertaCritica: false,
    nota: "Admite turnos de 6 hs, 12 hs, 18 hs y 24 hs." 
  },

  // --- SERVICIOS MIXTOS ---
  "Cardiologia/Unidad Coronaria": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoEditable: true, 
    permiteAlertaCritica: false,
    nota: "Pasiva lun a vie de 16:00 a 09:00 hs (o Activa en planta según profesional). Finde 24 hs." 
  },
  "Sistemas": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoBloqueado: true, 
    permiteAlertaCritica: false,
    nota: "Pasiva lun a vie de 15:00 a 08:00 hs. Finde 24 hs." 
  },
  "Electromedicina": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoBloqueado: true, 
    permiteAlertaCritica: false,
    nota: "Pasiva lun a vie de 13:00 a 08:00 hs. Finde 24 hs." 
  },
  "Farmacia": { 
    tipo: "Pasiva", 
    fraccionable: false, 
    tipoBloqueado: true, 
    permiteAlertaCritica: false,
    nota: "Pasiva lun a vie de 16:00 a 08:00 hs. Finde 24 hs." 
  },
  "Tecnico de Imagen
