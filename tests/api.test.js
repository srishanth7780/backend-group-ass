const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const { createApp } = require("../src/app");

let testDatabases = [];

beforeEach(() => {
  testDatabases = [];
});

afterEach(() => {
  for (const { db, dbPath } of testDatabases) {
    try {
      if (db && db.open) {
        db.close();
      }
    } finally {
      for (const filePath of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`, `${dbPath}-journal`]) {
        fs.rmSync(filePath, { force: true });
        assert.equal(fs.existsSync(filePath), false, `Test database file was not removed: ${filePath}`);
      }
    }
  }
});

function buildApp() {
  const dbPath = path.join(os.tmpdir(), `clinicq-test-${process.pid}-${randomUUID()}.db`);
  const testDatabase = { db: null, dbPath };
  testDatabases.push(testDatabase);

  const app = createApp(dbPath);
  testDatabase.db = app.locals.db;
  return app;
}

test("GET /health returns backend status", async () => {
  const app = buildApp();
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, "ClinicQ Health Centre backend is running");
  assert.ok(response.body.timestamp);
});

test("GET /doctors returns seeded doctors", async () => {
  const app = buildApp();
  const response = await request(app).get("/doctors");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data));
  assert.ok(response.body.data.length >= 3);
});

test("POST /doctors creates a doctor", async () => {
  const app = buildApp();
  const response = await request(app)
    .post("/doctors")
    .send({ name: "Dr. Sofia Ahmed", specialty: "Dermatology" });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.name, "Dr. Sofia Ahmed");
  assert.equal(response.body.data.specialty, "Dermatology");
});

test("GET /rooms?floor=1 filters rooms by floor", async () => {
  const app = buildApp();
  const response = await request(app).get("/rooms?floor=1");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.length > 0);
  assert.ok(response.body.data.every((room) => room.floor === 1));
});

test("POST /rooms creates a room", async () => {
  const app = buildApp();
  const response = await request(app)
    .post("/rooms")
    .send({ name: "Room 4", floor: 2 });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.name, "Room 4");
  assert.equal(response.body.data.floor, 2);
});

test("POST /rooms rejects duplicate names without regard to case", async () => {
  const app = buildApp();
  const response = await request(app)
    .post("/rooms")
    .send({ name: "room 1", floor: 3 });

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
});

test("POST /rooms validates required fields", async () => {
  const app = buildApp();
  const response = await request(app)
    .post("/rooms")
    .send({ name: "Room 4" });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("PUT /rooms/:id updates a room", async () => {
  const app = buildApp();
  const response = await request(app)
    .put("/rooms/2")
    .send({ name: "Room 2 Updated", floor: 3 });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.name, "Room 2 Updated");
  assert.equal(response.body.data.floor, 3);
});

test("PUT /rooms/:id rejects an invalid ID", async () => {
  const app = buildApp();
  const response = await request(app)
    .put("/rooms/not-a-number")
    .send({ name: "New Room", floor: 1 });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("DELETE /rooms/:id deletes an existing room", async () => {
  const app = buildApp();
  const response = await request(app).delete("/rooms/2");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);

  const roomsResponse = await request(app).get("/rooms");
  assert.ok(roomsResponse.body.data.every((room) => room.id !== 2));
});

test("GET /bookings returns joined doctor and room details", async () => {
  const app = buildApp();
  const response = await request(app).get("/bookings");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data));
  assert.ok(response.body.data.length >= 2);
  assert.ok(response.body.data[0].doctor_name);
  assert.ok(response.body.data[0].room_name);
});

test("POST /bookings creates a booking", async () => {
  const app = buildApp();
  const response = await request(app)
    .post("/bookings")
    .send({
      doctor_id: 3,
      room_id: 1,
      booking_date: "2099-12-30",
      booking_hour: "14:00",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.doctor_id, 3);
  assert.equal(response.body.data.room_id, 1);
});

test("POST /bookings rejects a room that is already booked at the same time", async () => {
  const app = buildApp();
  const response = await request(app)
    .post("/bookings")
    .send({
      doctor_id: 2,
      room_id: 1,
      booking_date: "2026-11-16",
      booking_hour: "09:00",
    });

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
});

test("POST /bookings rejects missing required fields", async () => {
  const app = buildApp();
  const response = await request(app)
    .post("/bookings")
    .send({ doctor_id: 1, room_id: 1 });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("POST /bookings rejects unknown doctor references", async () => {
  const app = buildApp();
  const response = await request(app)
    .post("/bookings")
    .send({
      doctor_id: 999,
      room_id: 1,
      booking_date: "2099-12-30",
      booking_hour: "14:00",
    });

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /doctor not found/i);
});

test("Unknown routes return 404", async () => {
  const app = buildApp();
  const response = await request(app).get("/not-a-route");

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});
