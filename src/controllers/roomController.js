const { validateRoomPayload, validatePositiveInteger } = require("../utils/validators");

// GET /rooms (with optional ?floor= query parameter search)
function getAllRooms(req, res) {
  try {
    const db = req.app.locals.db;
    const floorParam = req.query.floor;

    let sql = "SELECT * FROM rooms";
    const params = [];

    if (floorParam !== undefined) {
      const trimmedFloor = String(floorParam).trim();
      if (trimmedFloor === "" || !Number.isInteger(Number(trimmedFloor))) {
        return res.status(400).json({
          success: false,
          message: "Query parameter 'floor' must be a valid integer.",
        });
      }
      sql += " WHERE floor = ?";
      params.push(Number(trimmedFloor));
    }

    sql += " ORDER BY id ASC";
    const rooms = db.prepare(sql).all(...params);

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// GET /rooms/:id
function getRoomById(req, res) {
  try {
    const db = req.app.locals.db;
    const idError = validatePositiveInteger(req.params.id, "Room ID");
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError,
      });
    }

    const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(Number(req.params.id));
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// POST /rooms (Includes Validation & Twist Rule: Case-Insensitive Duplicate Name Check)
function createRoom(req, res) {
  try {
    const db = req.app.locals.db;
    const payload = req.body || {};

    const validationError = validateRoomPayload(payload);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const trimmedName = payload.name.trim();
    const floorNumber = Number(payload.floor);

    // TWIST RULE: Case-insensitive duplicate room name check
    const existingRoom = db
      .prepare("SELECT * FROM rooms WHERE LOWER(name) = LOWER(?)")
      .get(trimmedName);

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: `${existingRoom.name} already exists`,
      });
    }

    const result = db
      .prepare("INSERT INTO rooms (name, floor) VALUES (?, ?)")
      .run(trimmedName, floorNumber);

    const createdRoom = db
      .prepare("SELECT * FROM rooms WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: "Room added successfully",
      data: createdRoom,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// PUT /rooms/:id (Includes Validation & Twist Rule on Rename)
function updateRoom(req, res) {
  try {
    const db = req.app.locals.db;
    const roomId = Number(req.params.id);

    const idError = validatePositiveInteger(req.params.id, "Room ID");
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError,
      });
    }

    const existingRoom = db.prepare("SELECT * FROM rooms WHERE id = ?").get(roomId);
    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const payload = req.body || {};
    const validationError = validateRoomPayload(payload);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const trimmedName = payload.name.trim();
    const floorNumber = Number(payload.floor);

    // TWIST RULE: Check if another room already has this name (case-insensitive)
    const duplicateRoom = db
      .prepare("SELECT * FROM rooms WHERE LOWER(name) = LOWER(?) AND id != ?")
      .get(trimmedName, roomId);

    if (duplicateRoom) {
      return res.status(409).json({
        success: false,
        message: `${duplicateRoom.name} already exists`,
      });
    }

    db.prepare("UPDATE rooms SET name = ?, floor = ? WHERE id = ?").run(
      trimmedName,
      floorNumber,
      roomId
    );

    const updatedRoom = db.prepare("SELECT * FROM rooms WHERE id = ?").get(roomId);

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: updatedRoom,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// DELETE /rooms/:id
function deleteRoom(req, res) {
  try {
    const db = req.app.locals.db;
    const roomId = Number(req.params.id);

    const idError = validatePositiveInteger(req.params.id, "Room ID");
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError,
      });
    }

    const existingRoom = db.prepare("SELECT * FROM rooms WHERE id = ?").get(roomId);
    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    db.prepare("DELETE FROM rooms WHERE id = ?").run(roomId);

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully",
      data: { id: roomId },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};