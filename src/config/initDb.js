const { initializeDatabase, getDefaultDbPath } = require("./db");

const dbPath = getDefaultDbPath();
const db = initializeDatabase(dbPath, { forceReset: true, skipSeed: false });
db.close();

console.log(`Database initialized and seeded successfully at: ${dbPath}`);