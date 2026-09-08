// ==========================================
// CONFIGURACIÓN MAESTRA HIRS
// ==========================================
const ADMIN_PIN = "SistemasHirs$$675";

// Servicios asistenciales considerados críticos para auditar huecos
const SERVICIOS_CRITICOS = [
  'Guardia externa Adultos',
  'Guardia externa Pediatrica',
  'Neonatologia',
  'Cirugia General',
  'Traumatologia',
  'Ginecologia',
  'Obstetricia',
  'Parteras',
  'Laboratorio',
  'Cardiologia/Unidad Coronaria',
  'Anestesista',
  'Tecnico de Anestesia',
  'Ecografia',
  'Tecnico de Imagenes',
  'Gastroenterologia'
];

// Servicios que se clasifican en la pestaña "Guardias Operativas (Apoyo)"
const SERVICIOS_OPERATIVOS = [
  'Sistemas',
  'Electromedicina',
  'Farmacia',
  'Instrumentadoras',
  'Mantenimiento',
  'Esterilizacion',
  'Hemoterapia',
  'RX Quirofano',
  'Tecnico de Imagenes'
];

// Contactos de Referentes / Jefes de Servicio para fallback si no están en Supabase
const REFERENTES_SERVICIOS = {
  'Guardia externa Adultos': { nombre: 'Jefatura Guardia Adultos', contacto: '2914000001' },
  'Guardia externa Pediatrica': { nombre: 'Jefatura Pediatría', contacto: '2914000002' },
  'Neonatologia': { nombre: 'Jefatura Neonatología', contacto: '2914000003' },
  'Cirugia General': { nombre: 'Jefatura Cirugía', contacto: '2914000004' },
  'Traumatologia': { nombre: 'Jefatura Traumatología', contacto: '2914000005' },
  'Ginecologia': { nombre: 'Jefatura Ginecología', contacto: '2914000006' },
  'Obstetricia': { nombre: 'Jefatura Obstetricia', contacto: '2914000006' },
  'Parteras': { nombre: 'Coordinación Parteras', contacto: '2914000021' },
  'Laboratorio': { nombre: 'Jefatura Laboratorio', contacto: '2914000007' },
  'Cardiologia/Unidad Coronaria': { nombre: 'Jefatura Cardiología', contacto: '2914000008' },
  'Anestesista': { nombre: 'Jefatura Anestesiología', contacto: '2914000009' },
  'Tecnico de Anestesia': { nombre: 'Coordinación Técnicos Anestesia', contacto: '2914000009' },
  'Ecografia': { nombre: 'Jefatura Ecografía', contacto: '2914000010' },
  'Tecnico de Imagenes': { nombre: 'Coordinación Imágenes', contacto: '2914000011' },
  'Gastroenterologia': { nombre: 'Referente Gastroenterología', contacto: '2914000012' },
  'Sistemas': { nombre: 'Guardia/Jefatura Sistemas', contacto: '2914000013' },
  'Electromedicina': { nombre: 'Referente Electromedicina', contacto: '2914000014' },
  'Farmacia': { nombre: 'Jefatura Farmacia', contacto: '2914000015' },
  'Instrumentadoras': { nombre: 'Coordinación Quirófano', contacto: '2914000016' },
  'Mantenimiento': { nombre: 'Jefatura Mantenimiento', contacto: '2914000017' },
  'Esterilizacion': { nombre: 'Supervisión Esterilización', contacto: '2914000018' },
  'Hemoterapia': { nombre: 'Jefatura Hemoterapia', contacto: '2914000019' },
  'RX Quirofano': { nombre: 'Coordinación RX', contacto: '2914000020' }
};

// Inicialización de cliente Supabase
const SUPABASE_URL = 'https://xunxunzlnalvsejuybga.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Yjv8upcjMsYXiwssHX5W9Q_8DVIrqSp';

const db = (typeof supabase !== 'undefined' && supabase.createClient)
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
