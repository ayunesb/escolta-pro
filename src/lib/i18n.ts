export type Lang = 'en' | 'es';

export const t = (key: string, lang: Lang): string => {
  return dict[lang]?.[key] ?? dict.en[key] ?? key;
};

export const dict: Record<Lang, Record<string, string>> = {
  en: {
    // Navigation & General
    book_protector: 'Book a Protector',
    instant_quote: 'Instant Quote',
    confirm: 'Confirm',
    next: 'Next',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    
    // Booking Form
    location: 'Location',
    date: 'Date', 
    start_time: 'Start time',
    duration: 'Duration (hours)',
    armed_required: 'Armed protector required?',
    vehicle_required: 'Vehicle required?',
    vehicle_type: 'Vehicle type',
    armored_level: 'Armored level',
    
    // Pricing
    hourly_rate_mxn: 'Hourly rate (MXN)',
    armed_surcharge_mxn: 'Armed surcharge (MXN/hr)',
    vehicle_hourly_mxn: 'Vehicle hourly (MXN)', 
    armored_surcharge_mxn: 'Armored surcharge (MXN/hr)',
    service_fee_10: 'Service fee (10%)',
    subtotal: 'Subtotal',
    total: 'Total',
    
    // Quote Details
    protector_base: 'Protector',
    armed_surcharge: 'Armed surcharge',
    vehicle_service: 'Vehicle service',
    armored_surcharge: 'Armored surcharge',
    
    // Messages
    request_submitted: 'Request submitted. We\'ll contact you shortly.',
    booking_summary: 'Booking Summary',
    price_breakdown: 'Price Breakdown',
    confirm_request: 'Confirm Request',
    
    // Vehicle Types
    suv: 'SUV',
    sedan: 'Sedan',
    armored_car: 'Armored Car',
    
    // Armor Levels
    none: 'None',
    level_3a: 'Level IIIA',
    level_3: 'Level III',
    level_4: 'Level IV',
    
    // Profile/Settings
    pricing: 'Pricing',
    personal_info: 'Personal Information',
    company_info: 'Company Information',
    
    // Forms
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    
    // Language
    language: 'Language',
    english: 'English',
    spanish: 'Spanish',
  },
  es: {
    // Navigation & General
    book_protector: 'Reservar un Escolta',
    instant_quote: 'Cotización Instantánea',
    confirm: 'Confirmar',
    next: 'Siguiente',
    back: 'Atrás',
    save: 'Guardar',
    cancel: 'Cancelar',
    loading: 'Cargando...',
    
    // Booking Form
    location: 'Ubicación',
    date: 'Fecha',
    start_time: 'Hora de inicio',
    duration: 'Duración (horas)',
    armed_required: '¿Requiere escolta armado?',
    vehicle_required: '¿Requiere vehículo?',
    vehicle_type: 'Tipo de vehículo',
    armored_level: 'Nivel de blindaje',
    
    // Pricing
    hourly_rate_mxn: 'Tarifa por hora (MXN)',
    armed_surcharge_mxn: 'Recargo por arma (MXN/hr)',
    vehicle_hourly_mxn: 'Tarifa de vehículo (MXN/hr)',
    armored_surcharge_mxn: 'Recargo por blindaje (MXN/hr)',
    service_fee_10: 'Cargo por servicio (10%)',
    subtotal: 'Subtotal',
    total: 'Total',
    
    // Quote Details
    protector_base: 'Escolta',
    armed_surcharge: 'Recargo armado',
    vehicle_service: 'Servicio de vehículo',
    armored_surcharge: 'Recargo blindado',
    
    // Messages
    request_submitted: 'Solicitud enviada. Nos pondremos en contacto pronto.',
    booking_summary: 'Resumen de Reserva',
    price_breakdown: 'Desglose de Precios',
    confirm_request: 'Confirmar Solicitud',
    
    // Vehicle Types
    suv: 'Camioneta',
    sedan: 'Sedán',
    armored_car: 'Auto Blindado',
    
    // Armor Levels
    none: 'Ninguno',
    level_3a: 'Nivel IIIA',
    level_3: 'Nivel III', 
    level_4: 'Nivel IV',
    
    // Profile/Settings
    pricing: 'Precios',
    personal_info: 'Información Personal',
    company_info: 'Información de la Empresa',
    
    // Forms
    name: 'Nombre',
    email: 'Correo',
    phone: 'Teléfono',
    address: 'Dirección',
    
    // Language
    language: 'Idioma',
    english: 'Inglés',
    spanish: 'Español',
  }
};

// Currency formatting for MXN
export const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

export const formatMXN = (cents: number): string => {
  return mxn.format(cents / 100);
};

// Get user's preferred language
export const getPreferredLanguage = (): Lang => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preferred-language');
    if (stored && (stored === 'en' || stored === 'es')) {
      return stored;
    }
    return navigator.language.startsWith('es') ? 'es' : 'en';
  }
  return 'en';
};

// Set user's preferred language
export const setPreferredLanguage = (lang: Lang): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred-language', lang);
  }
};