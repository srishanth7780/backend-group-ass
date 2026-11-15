const express = require("express");
const { initializeDatabase, getDefaultDbPath } = require("./config/db");
const doctorRoutes = require("./routes/doctorRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

function createApp(databasePath = getDefaultDbPath()) {
  const db = initializeDatabase(databasePath, {
    forceReset: process.env.NODE_ENV === "test",
    skipSeed: false,
  });

  const app = express();
  app.locals.db = db;

  app.use(express.json());

  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "ClinicQ Health Centre backend is running",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/doctors", doctorRoutes);
  app.use("/rooms", roomRoutes);
  app.use("/bookings", bookingRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  return app;
}

module.exports = { createApp };