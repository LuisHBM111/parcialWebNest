CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  datetime TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

INSERT INTO appointments (datetime, status, patient_id, doctor_id)
SELECT
  '2026-05-14T15:30:00Z',
  'pending',
  patient.id,
  doctor.id
FROM users patient
CROSS JOIN users doctor
WHERE patient.email = 'admin@test.com'
  AND doctor.email = 'doctor@test.com'
  AND NOT EXISTS (
    SELECT 1
    FROM appointments appointment
    WHERE appointment.datetime = '2026-05-14T15:30:00Z'
      AND appointment.patient_id = patient.id
      AND appointment.doctor_id = doctor.id
  );

INSERT INTO appointments (datetime, status, patient_id, doctor_id)
SELECT
  '2026-05-15T16:00:00Z',
  'pending',
  patient.id,
  doctor.id
FROM users patient
CROSS JOIN users doctor
WHERE patient.email = 'admin@test.com'
  AND doctor.email = 'doctor@test.com'
  AND NOT EXISTS (
    SELECT 1
    FROM appointments appointment
    WHERE appointment.datetime = '2026-05-15T16:00:00Z'
      AND appointment.patient_id = patient.id
      AND appointment.doctor_id = doctor.id
  );
