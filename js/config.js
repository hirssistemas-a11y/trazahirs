// ==========================================
// CONFIGURACIÓN GENERAL Y CATÁLOGOS (HIRS)
// ==========================================

const SUPABASE_URL = "https://xunxunzlnalvsejuybga.supabase.co";
const SUPABASE_KEY = "sb_publishable_Yjv8upcjMsYXiwssHX5W9Q_8DVIrqSp";

const db = (typeof supabase !== 'undefined') 
  ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// Catálogo de Guardias Profesionales (Sin "UTI" duplicado, usando "Terapia Intensiva (UTI)")
const SERVICIOS_CRITICOS = [
  "Guardia externa Adultos",
  "Guardia externa Pediatrica",
  "Neonatologia",
  "Terapia Intensiva (UTI)",
  "Terapia Intensiva Pediatrica (UTIP)",
  "Pediatria",
  "Cardiologia/Unidad Coronaria",
  "Cirugia General",
  "Traumatologia",
  "Ginecologia",
  "Obstetricia",
  "Parteras",
  "Anestesista",
  "Tecnico de Anestesia",
  "Hemodinamia",
  "Gastroenterologia",
  "Ecografia",
  "Ecodopler cardiaco",
  "Ecodopler cardiaco Pediatrico",
  "Laboratorio"
];

// Catálogo de Guardias Operativas (Apoyo)
const SERVICIOS_OPERATIVOS = [
  "Sistemas",
  "Electromedicina",
  "Farmacia",
  "Instrumentadoras",
  "Mantenimiento",
  "Esterilizacion",
  "Hemoterapia",
  "RX Quirofano",
  "Tecnico de Imagenes"
];

// Referentes por defecto (Respaldo local si no está en BD)
const REFERENTES_SERVICIOS = {
  "Guardia externa Adultos": { nombre: "Jefatura Guardia Adultos", contacto: "2914000001" },
  "Guardia externa Pediatrica": { nombre: "Jefatura Pediatría", contacto: "2914000002" },
  "Neonatologia": { nombre: "Jefatura Neonatología", contacto: "2914000003" },
  "Terapia Intensiva (UTI)": { nombre: "Jefatura UTI", contacto: "2914000004" },
  "Sistemas": { nombre: "Franco Gayral - Sistemas", contacto: "2914617969" }
};
