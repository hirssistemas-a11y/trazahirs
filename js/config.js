// ==========================================
// CONFIGURACIÓN DE SEGURIDAD Y REGLAS HIRS
// ==========================================
const ADMIN_PIN = "SistemasHirs$$675";

const SERVICIOS_CRITICOS = [
  'Guardia externa Adultos',
  'Guardia externa Pediatrica',
  'Neonatologia',
  'Cirugia General',
  'Traumatologia',
  'Obstetricia',
  'Laboratorio',
  'Cardiologia/Unidad Coronaria',
  'Anestesia'
];

const SERVICIOS_OPERATIVOS = [
  'Sistemas',
  'Electromedicina',
  'Farmacia',
  'Mantenimiento',
  'Esterilizacion',
  'Instrumentadoras',
  'Hemoterapia',
  'RX Quirofano'
];

// Credenciales de Supabase (reemplazar con las tuyas)
const SUPABASE_URL = "https://TU_PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU_ANON_KEY";

const db = (typeof window.supabase !== 'undefined' && SUPABASE_URL !== "https://TU_PROYECTO.supabase.co")
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
