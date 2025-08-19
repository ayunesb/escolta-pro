-- Insert companies
INSERT INTO companies (id, name, tax_id, contact_name, contact_email, contact_phone, cities, status)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SecureCorp Mexico', 'RFC123456789', 'Carlos Rodriguez', 'admin@securecorp.mx', '+52-998-123-4567', ARRAY['Playa del Carmen', 'Cancun', 'Tulum'], 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Elite Guard Services', 'RFC987654321', 'Maria Gonzalez', 'manager@eliteguard.mx', '+52-984-765-4321', ARRAY['Mexico City', 'Guadalajara'], 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Protection Plus', 'RFC456789123', 'Roberto Martinez', 'director@protectionplus.mx', '+52-55-987-6543', ARRAY['Monterrey', 'Tijuana'], 'pending_review');

-- Insert some sample vehicles for companies
INSERT INTO vehicles (id, company_id, type, plates, armored, active, owned_by)
VALUES 
  ('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SUV', 'ABC-123-MX', false, true, 'company'),
  ('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sedan', 'DEF-456-MX', true, true, 'company'),
  ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SUV', 'GHI-789-MX', false, true, 'company'),
  ('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Armored Car', 'ARM-001-MX', true, true, 'company');

-- Insert pricing rules for different cities and tiers
INSERT INTO pricing_rules (id, city, tier, base_rate_guard, armed_multiplier, vehicle_rate_suv, vehicle_rate_armored, min_hours)
VALUES 
  (gen_random_uuid(), 'Playa del Carmen', 'direct', 150.00, 1.2, 100.00, 250.00, 4),
  (gen_random_uuid(), 'Cancun', 'direct', 140.00, 1.2, 90.00, 240.00, 4),
  (gen_random_uuid(), 'Tulum', 'direct', 160.00, 1.2, 110.00, 260.00, 4),
  (gen_random_uuid(), 'Mexico City', 'direct', 180.00, 1.3, 120.00, 300.00, 4),
  (gen_random_uuid(), 'Guadalajara', 'direct', 170.00, 1.3, 115.00, 280.00, 4),
  (gen_random_uuid(), 'Monterrey', 'direct', 175.00, 1.3, 118.00, 290.00, 4);