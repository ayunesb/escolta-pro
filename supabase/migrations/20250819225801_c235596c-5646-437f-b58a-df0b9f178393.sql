-- Insert companies (without created_by foreign key reference)
INSERT INTO companies (id, name, tax_id, contact_name, contact_email, contact_phone, cities, status)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SecureCorp Mexico', 'RFC123456789', 'Carlos Rodriguez', 'admin@securecorp.mx', '+52-998-123-4567', ARRAY['Playa del Carmen', 'Cancun', 'Tulum'], 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Elite Guard Services', 'RFC987654321', 'Maria Gonzalez', 'manager@eliteguard.mx', '+52-984-765-4321', ARRAY['Mexico City', 'Guadalajara'], 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Protection Plus', 'RFC456789123', 'Roberto Martinez', 'director@protectionplus.mx', '+52-55-987-6543', ARRAY['Monterrey', 'Tijuana'], 'pending_review');

-- Insert freelancer guard profiles
INSERT INTO guards (id, user_id, city, hourly_rate, skills, rating, active, availability_status, photo_url)
VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', gen_random_uuid(), 'Playa del Carmen', 150.00, '{"armed": true, "unarmed": true, "vehicle": true, "languages": ["Spanish", "English"], "experience_years": 8, "specialties": ["VIP Protection", "Event Security"]}', 4.8, true, 'available', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', gen_random_uuid(), 'Cancun', 140.00, '{"armed": true, "unarmed": true, "vehicle": false, "languages": ["Spanish", "English", "French"], "experience_years": 5, "specialties": ["Personal Protection", "Corporate Security"]}', 4.9, true, 'available', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', gen_random_uuid(), 'Tulum', 160.00, '{"armed": true, "unarmed": true, "vehicle": true, "languages": ["Spanish"], "experience_years": 12, "specialties": ["Executive Protection", "Residential Security"]}', 4.7, true, 'busy', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face');

-- Insert some sample vehicles for companies
INSERT INTO vehicles (id, company_id, type, plates, armored, active, owned_by)
VALUES 
  ('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SUV', 'ABC-123-MX', false, true, 'company'),
  ('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sedan', 'DEF-456-MX', true, true, 'company'),
  ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SUV', 'GHI-789-MX', false, true, 'company'),
  ('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Armored Car', 'ARM-001-MX', true, true, 'company');

-- Insert guard licenses
INSERT INTO licenses (id, guard_id, type, number, issuer, valid_from, valid_to, status)
VALUES 
  ('lic11111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'security', 'SEC12345', 'SEDENA', '2023-01-01', '2025-12-31', 'valid'),
  ('lic22222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'firearms', 'ARM67890', 'SEDENA', '2023-06-01', '2025-05-31', 'valid'),
  ('lic33333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'security', 'SEC54321', 'SEDENA', '2022-03-15', '2024-03-14', 'expired'),
  ('lic44444-4444-4444-4444-444444444444', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'security', 'SEC99999', 'SEDENA', '2023-09-01', '2025-08-31', 'valid'),
  ('lic55555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'firearms', 'ARM11111', 'SEDENA', '2023-09-01', '2025-08-31', 'valid');

-- Insert pricing rules for different cities and tiers
INSERT INTO pricing_rules (id, city, tier, base_rate_guard, armed_multiplier, vehicle_rate_suv, vehicle_rate_armored, min_hours)
VALUES 
  (gen_random_uuid(), 'Playa del Carmen', 'direct', 150.00, 1.2, 100.00, 250.00, 4),
  (gen_random_uuid(), 'Cancun', 'direct', 140.00, 1.2, 90.00, 240.00, 4),
  (gen_random_uuid(), 'Tulum', 'direct', 160.00, 1.2, 110.00, 260.00, 4),
  (gen_random_uuid(), 'Mexico City', 'direct', 180.00, 1.3, 120.00, 300.00, 4),
  (gen_random_uuid(), 'Guadalajara', 'direct', 170.00, 1.3, 115.00, 280.00, 4),
  (gen_random_uuid(), 'Monterrey', 'direct', 175.00, 1.3, 118.00, 290.00, 4);