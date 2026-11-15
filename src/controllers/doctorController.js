const { validateDoctorPayload, validatePositiveInteger } = require("../utils/validators");

function getAllDoctors(req, res) {
  try {
    const db = req.app.locals.db;
    const doctors = db.prepare("SELECT * FROM doctors ORDER BY id ASC").all();

    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

function getDoctorById(req, res) {
  try {
    const db = req.app.locals.db;
    const idError = validatePositiveInteger(req.params.id, "Doctor ID");
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError,
      });
    }

    const doctor = db.prepare("SELECT * FROM doctors WHERE id = ?").get(Number(req.params.id));
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

function createDoctor(req, res) {
  try {
    const db = req.app.locals.db;
    const payload = req.body || {};

    const validationError = validateDoctorPayload(payload);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const result = db
      .prepare("INSERT INTO doctors (name, specialty) VALUES (?, ?)")
      .run(payload.name.trim(), payload.specialty.trim());

    const createdDoctor = db
      .prepare("SELECT * FROM doctors WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: "Doctor added successfully",
      data: createdDoctor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
};