export const formatMXN = (cents: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(cents / 100);
};

export const calculateBookingTotal = (
  baseRateCents: number,
  hours: number,
  armedSurchargeCents: number = 0,
  vehicleRateCents: number = 0,
  armoredSurchargeCents: number = 0,
  isArmed: boolean = false,
  hasVehicle: boolean = false,
  isArmored: boolean = false
) => {
  let subtotal = baseRateCents * hours;
  
  if (isArmed && armedSurchargeCents > 0) {
    subtotal += armedSurchargeCents * hours;
  }
  
  if (hasVehicle && vehicleRateCents > 0) {
    subtotal += vehicleRateCents * hours;
    
    if (isArmored && armoredSurchargeCents > 0) {
      subtotal += armoredSurchargeCents * hours;
    }
  }
  
  const serviceFee = Math.round(subtotal * 0.1); // 10% service fee
  const total = subtotal + serviceFee;
  
  return {
    subtotal,
    serviceFee,
    total,
    breakdown: {
      base: baseRateCents * hours,
      armed: isArmed ? armedSurchargeCents * hours : 0,
      vehicle: hasVehicle ? vehicleRateCents * hours : 0,
      armored: isArmored ? armoredSurchargeCents * hours : 0,
    }
  };
};