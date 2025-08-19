-- Insert test user profiles for companies
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@securecorp.mx', '$2a$10$fake.hash.here', now(), now(), now(), '{"first_name": "Carlos", "last_name": "Rodriguez"}'),
  ('22222222-2222-2222-2222-222222222222', 'manager@eliteguard.mx', '$2a$10$fake.hash.here', now(), now(), now(), '{"first_name": "Maria", "last_name": "Gonzalez"}'),
  ('33333333-3333-3333-3333-333333333333', 'director@protectionplus.mx', '$2a$10$fake.hash.here', now(), now(), now(), '{"first_name": "Roberto", "last_name": "Martinez"}'),
  ('44444444-4444-4444-4444-444444444444', 'guard1@email.com', '$2a$10$fake.hash.here', now(), now(), now(), '{"first_name": "Diego", "last_name": "Lopez"}'),
  ('55555555-5555-5555-5555-555555555555', 'guard2@email.com', '$2a$10$fake.hash.here', now(), now(), now(), '{"first_name": "Ana", "last_name": "Silva"}'),
  ('66666666-6666-6666-6666-666666666666', 'guard3@email.com', '$2a$10$fake.hash.here', now(), now(), now(), '{"first_name": "Miguel", "last_name": "Herrera"}');

-- Insert companies
INSERT INTO companies (id, name, tax_id, contact_name, contact_email, contact_phone, cities, status, created_by)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SecureCorp Mexico', 'RFC123456789', 'Carlos Rodriguez', 'admin@securecorp.mx', '+52-998-123-4567', ARRAY['Playa del Carmen', 'Cancun', 'Tulum'], 'active', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Elite Guard Services', 'RFC987654321', 'Maria Gonzalez', 'manager@eliteguard.mx', '+52-984-765-4321', ARRAY['Mexico City', 'Guadalajara'], 'active', '22222222-2222-2222-2222-222222222222'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Protection Plus', 'RFC456789123', 'Roberto Martinez', 'director@protectionplus.mx', '+52-55-987-6543', ARRAY['Monterrey', 'Tijuana'], 'pending_review', '33333333-3333-3333-3333-333333333333');

-- Insert profiles for company admins
INSERT INTO profiles (id, email, first_name, last_name, role, company_id, phone_e164, kyc_status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@securecorp.mx', 'Carlos', 'Rodriguez', 'company_admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+529981234567', 'approved'),
  ('22222222-2222-2222-2222-222222222222', 'manager@eliteguard.mx', 'Maria', 'Gonzalez', 'company_admin', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '+529847654321', 'approved'),
  ('33333333-3333-3333-3333-333333333333', 'director@protectionplus.mx', 'Roberto', 'Martinez', 'company_admin', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '+525598765432', 'pending');

-- Insert profiles for freelancer guards
INSERT INTO profiles (id, email, first_name, last_name, role, phone_e164, kyc_status)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'guard1@email.com', 'Diego', 'Lopez', 'guard', '+529981111111', 'approved'),
  ('55555555-5555-5555-5555-555555555555', 'guard2@email.com', 'Ana', 'Silva', 'guard', '+529982222222', 'approved'),
  ('66666666-6666-6666-6666-666666666666', 'guard3@email.com', 'Miguel', 'Herrera', 'guard', '+529983333333', 'pending');

-- Insert user roles
INSERT INTO user_roles (user_id, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'company_admin'),
  ('22222222-2222-2222-2222-222222222222', 'company_admin'),
  ('33333333-3333-3333-3333-333333333333', 'company_admin'),
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
  ('doc11111-1111-1111-1111-111111111111', 'profile', '44444444-4444-4444-4444-444444444444', 'id', 'licenses/profiles/users/44444444-4444-4444-4444-444444444444/id_document.pdf', 'approved', '2020-01-15', '2030-01-15'),
  ('doc22222-2222-2222-2222-222222222222', 'profile', '44444444-4444-4444-4444-444444444444', 'proof_of_residence', 'licenses/profiles/users/44444444-4444-4444-4444-444444444444/residence_proof.pdf', 'approved', '2024-01-01', '2024-12-31'),
  ('doc33333-3333-3333-3333-333333333333', 'profile', '55555555-5555-5555-5555-555555555555', 'id', 'licenses/profiles/users/55555555-5555-5555-5555-555555555555/passport.pdf', 'approved', '2019-06-10', '2029-06-10'),
  ('doc44444-4444-4444-4444-444444444444', 'profile', '55555555-5555-5555-5555-555555555555', 'proof_of_residence', 'licenses/profiles/users/55555555-5555-5555-5555-555555555555/utility_bill.pdf', 'approved', '2024-02-15', '2024-12-31');