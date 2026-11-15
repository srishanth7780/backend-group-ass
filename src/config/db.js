const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const projectRoot = path.resolve(__dirname, "../..");
const schemaPath = path.join(projectRoot, "src", "database", "schema.sql");
const seedPath = path.join(projectRoot, "src", "database", "seed.sql");

function getDefaultDbPath() {
  return path.join(
    projectRoot,
    "data",
    process.env.NODE_ENV === "test" ? "clinicq-test.db" : "clinicq.db"
  );
}

function initializeDatabase(dbPath = getDefaultDbPath(), options = {}) {
  const { forceReset = false, skipSeed = false } = options;

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (forceReset && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const db = new Database(dbPath);

  try {
    db.pragma("foreign_keys = ON");

    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    db.exec(schemaSql);

    if (!skipSeed) {
      const roomCount = db.prepare("SELECT COUNT(*) AS count FROM rooms").get().count;
      if (roomCount === 0) {
        const seedSql = fs.readFileSync(seedPath, "utf8");
        if (seedSql.trim()) {
          db.exec(seedSql);
        }
      }
    }

    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  getDefaultDbPath,
};