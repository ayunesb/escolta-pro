-- Insert companies
INSERT INTO companies (id, name, tax_id, contact_name, contact_email, contact_phone, cities, status, created_by)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SecureCorp Mexico', 'RFC123456789', 'Carlos Rodriguez', 'admin@securecorp.mx', '+52-998-123-4567', ARRAY['Playa del Carmen', 'Cancun', 'Tulum'], 'active', gen_random_uuid()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Elite Guard Services', 'RFC987654321', 'Maria Gonzalez', 'manager@eliteguard.mx', '+52-984-765-4321', ARRAY['Mexico City', 'Guadalajara'], 'active', gen_random_uuid()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Protection Plus', 'RFC456789123', 'Roberto Martinez', 'director@protectionplus.mx', '+52-55-987-6543', ARRAY['Monterrey', 'Tijuana'], 'pending_review', gen_random_uuid());

-- Insert profiles for company admins (using existing user IDs and valid kyc_status)
INSERT INTO profiles (id, email, first_name, last_name, role, company_id, phone_e164, kyc_status)
VALUES 
  (gen_random_uuid(), 'admin@securecorp.mx', 'Carlos', 'Rodriguez', 'company_admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+529981234567', 'none'),
  (gen_random_uuid(), 'manager@eliteguard.mx', 'Maria', 'Gonzalez', 'company_admin', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '+529847654321', 'none'),
  (gen_random_uuid(), 'director@protectionplus.mx', 'Roberto', 'Martinez', 'company_admin', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '+525598765432', 'none');

-- Insert profiles for freelancer guards
INSERT INTO profiles (id, email, first_name, last_name, role, phone_e164, kyc_status)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'guard1@email.com', 'Diego', 'Lopez', 'guard', '+529981111111', 'none'),
  ('55555555-5555-5555-5555-555555555555', 'guard2@email.com', 'Ana', 'Silva', 'guard', '+529982222222', 'none'),
  ('66666666-6666-6666-6666-666666666666', 'guard3@email.com', 'Miguel', 'Herrera', 'guard', '+529983333333', 'none');

-- Insert user roles for guards
INSERT INTO user_roles (user_id, role)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'guard'),
  ('55555555-5555-5555-5555-555555555555', 'guard'),
  ('66666666-6666-6666-6666-666666666666', 'guard');

-- Insert freelancer guard profiles
INSERT INTO guards (id, user_id, city, hourly_rate, skills, rating, active, availability_status, photo_url)
VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'Playa del Carmen', 150.00, '{"armed": true, "unarmed": true, "vehicle": true, "languages": ["Spanish", "English"], "experience_years": 8, "specialties": ["VIP Protection", "Event Security"]}', 4.8, true, 'available', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'Cancun', 140.00, '{"armed": true, "unarmed": true, "vehicle": false, "languages": ["Spanish", "English", "French"], "experience_years": 5, "specialties": ["Personal Protection", "Corporate Security"]}', 4.9, true, 'available', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '66666666-6666-6666-6666-666666666666', 'Tulum', 160.00, '{"armed": true, "unarmed": true, "vehicle": true, "languages": ["Spanish"], "experience_years": 12, "specialties": ["Executive Protection", "Residential Security"]}', 4.7, true, 'busy', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face');

-- Insert some sample vehicles for companies
INSERT INTO vehicles (id, company_id, type, plates, armored, active, owned_by)
VALUES 
  ('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SUV', 'ABC-123-MX', false, true, 'company'),
  ('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sedan', 'DEF-456-MX', true, true, 'company'),
  ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SUV', 'GHI-789-MX', false, true, 'company');

-- Insert some sample documents
INSERT INTO documents (id, owner_type, owner_id, doc_type, file_path, status, issued_on, valid_to)
VALUES 
  ('doc11111-1111-1111-1111-111111111111', 'profile', '44444444-4444-4444-4444-444444444444', 'id', 'licenses/profiles/users/44444444-4444-4444-4444-444444444444/id_document.pdf', 'pending', '2020-01-15', '2030-01-15'),
  ('doc22222-2222-2222-2222-222222222222', 'profile', '44444444-4444-4444-4444-444444444444', 'proof_of_residence', 'licenses/profiles/users/44444444-4444-4444-4444-444444444444/residence_proof.pdf', 'pending', '2024-01-01', '2024-12-31'),
  ('doc33333-3333-3333-3333-333333333333', 'profile', '55555555-5555-5555-5555-555555555555', 'id', 'licenses/profiles/users/55555555-5555-5555-5555-555555555555/passport.pdf', 'pending', '2019-06-10', '2029-06-10'),
  ('doc44444-4444-4444-4444-444444444444', 'profile', '55555555-5555-5555-5555-555555555555', 'proof_of_residence', 'licenses/profiles/users/55555555-5555-5555-5555-555555555555/utility_bill.pdf', 'pending', '2024-02-15', '2024-12-31');

-- Insert guard licenses
INSERT INTO licenses (id, guard_id, type, number, issuer, valid_from, valid_to, status)
VALUES 
  ('lic11111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'security', 'SEC12345', 'SEDENA', '2023-01-01', '2025-12-31', 'valid'),
  ('lic22222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'firearms', 'ARM67890', 'SEDENA', '2023-06-01', '2025-05-31', 'valid'),
  ('lic33333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'security', 'SEC54321', 'SEDENA', '2022-03-15', '2024-03-14', 'expired'),
  ('lic44444-4444-4444-4444-444444444444', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'security', 'SEC99999', 'SEDENA', '2023-09-01', '2025-08-31', 'valid'),
  ('lic55555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'firearms', 'ARM11111', 'SEDENA', '2023-09-01', '2025-08-31', 'valid');