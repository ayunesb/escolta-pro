-- Add MXN pricing fields to guards table
ALTER TABLE guards ADD COLUMN hourly_rate_mxn_cents integer DEFAULT 80000;
ALTER TABLE guards ADD COLUMN armed_hourly_surcharge_mxn_cents integer DEFAULT 20000;

-- Add MXN pricing fields to vehicles table  
ALTER TABLE vehicles ADD COLUMN vehicle_hourly_rate_mxn_cents integer DEFAULT 350000;
ALTER TABLE vehicles ADD COLUMN armored_hourly_surcharge_mxn_cents integer DEFAULT 150000;

-- Add pricing fields to bookings table for server-side calculation
ALTER TABLE bookings ADD COLUMN subtotal_mxn_cents integer;
ALTER TABLE bookings ADD COLUMN service_fee_mxn_cents integer;
ALTER TABLE bookings ADD COLUMN total_mxn_cents integer;

-- Update existing guards with default pricing
UPDATE guards SET 
  hourly_rate_mxn_cents = 80000,
  armed_hourly_surcharge_mxn_cents = 20000
WHERE hourly_rate_mxn_cents IS NULL;

-- Update existing vehicles with default pricing
UPDATE vehicles SET 
  vehicle_hourly_rate_mxn_cents = 350000,
  armored_hourly_surcharge_mxn_cents = 150000
WHERE vehicle_hourly_rate_mxn_cents IS NULL;