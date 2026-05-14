INSERT INTO roles (id, role_name, description)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin', 'Administrador del sistema'),
  ('22222222-2222-2222-2222-222222222222', 'doctor', 'Rol medico de ejemplo'),
  ('33333333-3333-3333-3333-333333333333', 'patient', 'Rol paciente de ejemplo')
ON CONFLICT (role_name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO users (id, email, password, name, phone, is_active)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'admin@test.com',
    '$2b$10$upEMxSMEyeCcrD6RN8SpW.8TYpZqx3UdG5IW38rSjcLIj2Ge9KVse',
    'Admin Test',
    '3001234567',
    true
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'doctor@test.com',
    '$2b$10$F0HHNm2QN63Qf.gauly76OLDwT4H5JNlnRdhuTr8Gv3Lv61ZEHOi2',
    'Doctor Test',
    '3007654321',
    true
  )
ON CONFLICT (email) DO UPDATE
SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active;

INSERT INTO users_roles (user_id, role_id)
SELECT users.id, roles.id
FROM users
CROSS JOIN roles
WHERE users.email = 'admin@test.com'
  AND roles.role_name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO users_roles (user_id, role_id)
SELECT users.id, roles.id
FROM users
CROSS JOIN roles
WHERE users.email = 'doctor@test.com'
  AND roles.role_name = 'doctor'
ON CONFLICT DO NOTHING;
