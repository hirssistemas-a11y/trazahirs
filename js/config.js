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

// Credenciales de Supabase
const SUPABASE_URL = "https://xunxunzlnalvsejuybga.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Yjv8upcjMsYXiwssHX5W9Q_8DVIrqSp";

// Inicialización directa del cliente
const db = (typeof window.supabase !== 'undefined')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
