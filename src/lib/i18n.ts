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
    home: 'Home',
    book: 'Book',
    bookings: 'Bookings',
    account: 'Account',
    company: 'Company',
    vehicles: 'Vehicles',
    staff: 'Staff',
    
    // Booking Form
    location: 'Location',
    pickup_location: 'Pickup Location',
    date: 'Date', 
    start_time: 'Start time',
    duration: 'Duration (hours)',
    armed_required: 'Armed protector required?',
    vehicle_required: 'Vehicle required?',
    vehicle_type: 'Vehicle type',
    armored_level: 'Armored level',
    notes: 'Notes',
    
    // Pricing
    hourly_rate_mxn: 'Hourly rate (MXN)',
    armed_surcharge_mxn: 'Armed surcharge (MXN/hr)',
    vehicle_hourly_mxn: 'Vehicle hourly (MXN)', 
    armored_surcharge_mxn: 'Armored surcharge (MXN/hr)',
    service_fee_10: 'Service fee (10%)',
    subtotal: 'Subtotal',
    total: 'Total',
    base_rate: 'Base Rate',
    
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
    no_bookings: 'No Bookings Yet',
    book_first_service: 'Book your first protection service to get started.',
    finding_guards: 'Finding Available Guards...',
    track_service: 'Track Service',
    
    // Vehicle Types
    suv: 'SUV',
    sedan: 'Sedan',
    van: 'Van',
    bike: 'Motorcycle',
    armored_car: 'Armored Car',
    
    // Armor Levels
    none: 'None',
    level_3a: 'Level IIIA',
    level_3: 'Level III',
    level_4: 'Level IV',
    nij_ii: 'NIJ Level II',
    nij_iiia: 'NIJ Level IIIA',
    nij_iii: 'NIJ Level III',
    nij_iv: 'NIJ Level IV',
    
    // Status
    matching: 'Finding Guard',
    assigned: 'Guard Assigned',
    enroute: 'En Route',
    onsite: 'On Site', 
    in_progress: 'In Progress',
    completed: 'Completed',
    canceled: 'Canceled',
    failed: 'Failed',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    suspended: 'Suspended',
    active: 'Active',
    inactive: 'Inactive',
    
    // Profile/Settings
    pricing: 'Pricing',
    personal_info: 'Personal Information',
    company_info: 'Company Information',
    guard_profile: 'Guard Profile',
    edit_profile: 'Edit Profile',
    edit_guard_settings: 'Edit Guard Settings',
    account_actions: 'Account Actions',
    documents_verification: 'Documents & Verification',
    update_profile_photo: 'Update Profile Photo',
    sign_out: 'Sign Out',
    
    // Forms
    name: 'Name',
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    rating: 'Rating',
    service_area: 'Service Area',
    
    // Language
    language: 'Language',
    english: 'English',
    spanish: 'Spanish',
    
    // Admin
    super_admin: 'Super Admin',
    companies: 'Companies',
    guards: 'Guards',
    approve: 'Approve',
    suspend: 'Suspend',
    no_pending_companies: 'No Pending Companies',
    no_pending_guards: 'No Pending Guards',
    all_reviewed: 'All applications have been reviewed.',
    
    // Errors
    error: 'Error',
    failed_to_load: 'Failed to load',
    try_again: 'Try again',
    unauthorized: 'Unauthorized',
    not_found: 'Not found',
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
    home: 'Inicio',
    book: 'Reservar',
    bookings: 'Reservas',
    account: 'Cuenta',
    company: 'Empresa',
    vehicles: 'Vehículos',
    staff: 'Personal',
    
    // Booking Form
    location: 'Ubicación',
    pickup_location: 'Ubicación de Recogida',
    date: 'Fecha',
    start_time: 'Hora de inicio',
    duration: 'Duración (horas)',
    armed_required: '¿Requiere escolta armado?',
    vehicle_required: '¿Requiere vehículo?',
    vehicle_type: 'Tipo de vehículo',
    armored_level: 'Nivel de blindaje',
    notes: 'Notas',
    
    // Pricing
    hourly_rate_mxn: 'Tarifa por hora (MXN)',
    armed_surcharge_mxn: 'Recargo por arma (MXN/hr)',
    vehicle_hourly_mxn: 'Tarifa de vehículo (MXN/hr)',
    armored_surcharge_mxn: 'Recargo por blindaje (MXN/hr)',
    service_fee_10: 'Cargo por servicio (10%)',
    subtotal: 'Subtotal',
    total: 'Total',
    base_rate: 'Tarifa Base',
    
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
    no_bookings: 'Aún No Tienes Reservas',
    book_first_service: 'Reserva tu primer servicio de protección para comenzar.',
    finding_guards: 'Buscando Escoltas Disponibles...',
    track_service: 'Rastrear Servicio',
    
    // Vehicle Types
    suv: 'Camioneta',
    sedan: 'Sedán',
    van: 'Camioneta',
    bike: 'Motocicleta',
    armored_car: 'Auto Blindado',
    
    // Armor Levels
    none: 'Ninguno',
    level_3a: 'Nivel IIIA',
    level_3: 'Nivel III', 
    level_4: 'Nivel IV',
    nij_ii: 'Nivel NIJ II',
    nij_iiia: 'Nivel NIJ IIIA',
    nij_iii: 'Nivel NIJ III',
    nij_iv: 'Nivel NIJ IV',
    
    // Status
    matching: 'Buscando Escolta',
    assigned: 'Escolta Asignado',
    enroute: 'En Camino',
    onsite: 'En Sitio',
    in_progress: 'En Progreso',
    completed: 'Completado',
    canceled: 'Cancelado',
    failed: 'Fallido',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    suspended: 'Suspendido',
    active: 'Activo',
    inactive: 'Inactivo',
    
    // Profile/Settings
    pricing: 'Precios',
    personal_info: 'Información Personal',
    company_info: 'Información de la Empresa',
    guard_profile: 'Perfil de Escolta',
    edit_profile: 'Editar Perfil',
    edit_guard_settings: 'Editar Configuración de Escolta',
    account_actions: 'Acciones de Cuenta',
    documents_verification: 'Documentos y Verificación',
    update_profile_photo: 'Actualizar Foto de Perfil',
    sign_out: 'Cerrar Sesión',
    
    // Forms
    name: 'Nombre',
    first_name: 'Nombre',
    last_name: 'Apellido',
    email: 'Correo',
    phone: 'Teléfono',
    address: 'Dirección',
    city: 'Ciudad',
    rating: 'Calificación',
    service_area: 'Área de Servicio',
    
    // Language
    language: 'Idioma',
    english: 'Inglés',
    spanish: 'Español',
    
    // Admin
    super_admin: 'Super Administrador',
    companies: 'Empresas',
    guards: 'Escoltas',
    approve: 'Aprobar',
    suspend: 'Suspender',
    no_pending_companies: 'No Hay Empresas Pendientes',
    no_pending_guards: 'No Hay Escoltas Pendientes',
    all_reviewed: 'Todas las solicitudes han sido revisadas.',
    
    // Errors
    error: 'Error',
    failed_to_load: 'Error al cargar',
    try_again: 'Inténtalo de nuevo',
    unauthorized: 'No autorizado',
    not_found: 'No encontrado',
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