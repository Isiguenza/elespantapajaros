-- Crear empleado de prueba para testing
-- Email: test@test.com
-- PIN: 1234
-- PIN Hash: $2a$10$YourHashHere (bcrypt de "1234")

INSERT INTO user_profiles (
  id,
  email,
  name,
  role,
  pin_hash,
  active
) VALUES (
  'b0faa020-4757-4018-b6d6-a97ef5a5851f',
  'test@test.com',
  'Empleado Test',
  'cashier',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  true
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  pin_hash = EXCLUDED.pin_hash,
  active = EXCLUDED.active;
