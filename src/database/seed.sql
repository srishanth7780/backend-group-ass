INSERT OR IGNORE INTO doctors (id, name, specialty) VALUES
  (1, 'Dr. Asha Mehta', 'Cardiology'),
  (2, 'Dr. Rohan Verma', 'Pediatrics'),
  (3, 'Dr. Vikram Rao', 'Orthopedics');

INSERT OR IGNORE INTO rooms (id, name, floor) VALUES
  (1, 'Room 1', 1),
  (2, 'Room 2', 2);

INSERT OR IGNORE INTO bookings (id, doctor_id, room_id, booking_date, booking_hour) VALUES
  (1, 1, 1, '2026-11-16', '09:00'),
  (2, 2, 2, '2026-11-16', '10:00');