# ClinicQ Health Centre – Consultation Room Management System

## 1. Project overview

ClinicQ Health Centre is a backend-only Consultation Room Management API designed for the Backend Development Fundamentals group assignment (`NU-AIML2E-G08`, Theme 23 of 30). The system manages doctors, consultation rooms, and hourly room bookings while preventing double-bookings and enforcing case-insensitive unique room names.

## 2. Project objectives

- Build a modular Express.js backend.
- Use SQLite (`better-sqlite3`) for persistent relational storage.
- Implement full CRUD operations for consultation rooms and management endpoints for doctors.
- Support room bookings with SQL `INNER JOIN` queries returning doctor and room names.
- Add input validation and query parameter search (`?floor=`).
- Enforce the **Twist Rule**: No duplicate room names (case-insensitive) returning `409 Conflict` with `"Room 3 already exists"`.

## 3. Technologies used

- Node.js
- Express.js
- SQLite (`better-sqlite3`)
- JavaScript (CommonJS)
- Postman

## 4. Folder structure

```text
clinicq-health-centre/
├── data/
│   └── clinicq.db
├── postman/
│   └── clinicq-centre.postman_collection.json
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── initDb.js
│   ├── controllers/
│   │   ├── bookingController.js
│   │   ├── doctorController.js
│   │   └── roomController.js
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── routes/
│   │   ├── bookingRoutes.js
│   │   ├── doctorRoutes.js
│   │   └── roomRoutes.js
│   ├── utils/
│   │   └── validators.js
│   ├── app.js
│   └── server.js
├── package.json
└── README.md
```

## 5. Installation and setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd clinicq-health-centre
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize and seed the database (optional — runs automatically on server startup):
   ```bash
   npm run db:init
   ```
4. Start the server:
   ```bash
   npm start
   ```
   The server runs at `http://localhost:3000`.
5. Run the API tests:
   ```bash
   npm test
   ```

## 6. API endpoints

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Check server health status | `200` |
| `GET` | `/rooms` | Retrieve all consultation rooms | `200` |
| `GET` | `/rooms?floor=1` | Filter consultation rooms by floor | `200`, `400` |
| `GET` | `/rooms/:id` | Retrieve a single room by ID | `200`, `400`, `404` |
| `POST` | `/rooms` | Create a new consultation room | `201`, `400`, `409` |
| `PUT` | `/rooms/:id` | Update an existing consultation room | `200`, `400`, `404`, `409` |
| `DELETE` | `/rooms/:id` | Delete a consultation room | `200`, `400`, `404` |
| `GET` | `/doctors` | Retrieve all doctors | `200` |
| `GET` | `/doctors/:id` | Retrieve a single doctor by ID | `200`, `400`, `404` |
| `POST` | `/doctors` | Add a new doctor | `201`, `400` |
| `GET` | `/bookings` | **JOIN Endpoint**: Retrieve bookings with `doctor_name` and `room_name` | `200` |
| `POST` | `/bookings` | Create a room booking (prevents same-hour room conflict) | `201`, `400`, `404`, `409` |

## 7. Twist rule verification (No duplicate room names)

Two rooms cannot share a name, even with different capital letters. A duplicate returns HTTP `409` and the message `"Room 3 already exists"`.

1. **Test 1 — Add Room 3 (`POST /rooms`)**
   - Body: `{"name": "Room 3", "floor": 1}`
   - Response: `201 Created`
2. **Test 2 — Add "room 3" (`POST /rooms`)**
   - Body: `{"name": "room 3", "floor": 2}`
   - Response: `409 Conflict` (`{"success": false, "message": "Room 3 already exists"}`)
3. **Test 3 — Rename another room to the same name (`PUT /rooms/1`)**
   - Body: `{"name": "room 3", "floor": 1}`
   - Response: `409 Conflict` (`{"success": false, "message": "Room 3 already exists"}`)

## 8. Postman testing

Import `postman/clinicq-centre.postman_collection.json` into Postman and execute the folders in order (`01` through `06`).