function validatePositiveInteger(value, fieldName = "ID") {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return `${fieldName} must be a positive integer.`;
  }
  return null;
}

function validateRoomPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Request body is required.";
  }

  const { name, floor } = payload;

  if (name === undefined || name === null || typeof name !== "string" || name.trim() === "") {
    return "Room name is required and must be a non-empty string.";
  }

  if (floor === undefined || floor === null || floor === "" || !Number.isInteger(Number(floor))) {
    return "Floor is required and must be a valid integer.";
  }

  return null;
}

function validateDoctorPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Request body is required.";
  }

  const { name, specialty } = payload;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return "Doctor name is required.";
  }

  if (!specialty || typeof specialty !== "string" || specialty.trim() === "") {
    return "Doctor specialty is required.";
  }

  return null;
}

function validateBookingPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Request body is required.";
  }

  const { doctor_id, room_id, booking_date, booking_hour } = payload;

  if (!doctor_id || !room_id || !booking_date || !booking_hour) {
    return "doctor_id, room_id, booking_date, and booking_hour are all required.";
  }

  if (validatePositiveInteger(doctor_id, "doctor_id")) {
    return "doctor_id must be a positive integer.";
  }

  if (validatePositiveInteger(room_id, "room_id")) {
    return "room_id must be a positive integer.";
  }

  return null;
}

module.exports = {
  validatePositiveInteger,
  validateRoomPayload,
  validateDoctorPayload,
  validateBookingPayload,
};