const { validateBookingPayload } = require("../utils/validators");

// GET /bookings (SQL JOIN endpoint returning doctor_name and room_name)
function getAllBookings(req, res) {
  try {
    const db = req.app.locals.db;

    const bookings = db
      .prepare(
        `
        SELECT
          b.id,
          b.doctor_id,
          d.name AS doctor_name,
          d.specialty AS doctor_specialty,
          b.room_id,
          r.name AS room_name,
          r.floor AS room_floor,
          b.booking_date,
          b.booking_hour
        FROM bookings b
        INNER JOIN doctors d ON d.id = b.doctor_id
        INNER JOIN rooms r ON r.id = b.room_id
        ORDER BY b.id ASC
      `
      )
      .all();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// POST /bookings (Includes foreign key check & prevents double-booking same room at same hour)
function createBooking(req, res) {
  try {
    const db = req.app.locals.db;
    const payload = req.body || {};

    const validationError = validateBookingPayload(payload);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const doctorId = Number(payload.doctor_id);
    const roomId = Number(payload.room_id);
    const bookingDate = String(payload.booking_date).trim();
    const bookingHour = String(payload.booking_hour).trim();

    const doctor = db.prepare("SELECT * FROM doctors WHERE id = ?").get(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Referenced doctor not found.",
      });
    }

    const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Referenced room not found.",
      });
    }

    // Prevent two doctors from being assigned the same room at the same date & hour
    const existingBooking = db
      .prepare(
        "SELECT * FROM bookings WHERE room_id = ? AND booking_date = ? AND booking_hour = ?"
      )
      .get(roomId, bookingDate, bookingHour);

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: `${room.name} is already booked on ${bookingDate} at ${bookingHour}.`,
      });
    }

    const result = db
      .prepare(
        "INSERT INTO bookings (doctor_id, room_id, booking_date, booking_hour) VALUES (?, ?, ?, ?)"
      )
      .run(doctorId, roomId, bookingDate, bookingHour);

    const createdBooking = db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: createdBooking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getAllBookings,
  createBooking,
};