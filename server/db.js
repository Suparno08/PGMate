
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'pgmate.db');
const seedPath = path.join(__dirname, 'pgmate.json');
const wasmPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'sql.js',
  'dist',
  'sql-wasm.wasm'
);

let SQL;
let db;

// Initialize database
export async function initializeDatabase() {
  SQL = await initSqlJs({
    locateFile: (file) => {
      if (file === 'sql-wasm.wasm') {
        return wasmPath;
      }
      return file;
    }
  });

  // Load existing database or create a new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('Existing SQLite database loaded.');
  } else {
    db = new SQL.Database();
    console.log('New SQLite database created.');
  }

  createTables();
  syncSeedData();
}

// Create tables if they do not exist
function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS pgs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      rent INTEGER NOT NULL,
      distance REAL NOT NULL,
      rating REAL NOT NULL,
      description TEXT,
      facilities TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS preferences (
      user_id TEXT PRIMARY KEY,
      preferred_location TEXT,
      max_budget INTEGER,
      required_facilities TEXT
    )
  `);
}

// Read JSON and synchronize initial PG data
function syncSeedData() {
  if (!fs.existsSync(seedPath)) {
    throw new Error('Seed file not found: server/pgmate.json');
  }

  const seedData = JSON.parse(
    fs.readFileSync(seedPath, 'utf8')
  );

  if (!Array.isArray(seedData.pgs)) {
    throw new Error('Invalid pgmate.json: pgs must be an array');
  }

  // Detect old Bangalore sample records
  const oldData = db.exec(`
    SELECT COUNT(*) AS total
    FROM pgs
    WHERE LOWER(location) LIKE '%bangalore%'
  `);

  const oldBangaloreCount = oldData[0]?.values[0][0] || 0;

  // Remove only legacy Bangalore sample records
  if (oldBangaloreCount > 0) {
    console.log('Removing old Bangalore sample records...');
    db.run(`
      DELETE FROM pgs
      WHERE LOWER(location) LIKE '%bangalore%'
    `);
  }

  // Insert or update the 9 seed PGs
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO pgs
    (id, name, location, rent, distance, rating, description, facilities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    for (const pg of seedData.pgs) {
      if (
        !pg.id ||
        !pg.name ||
        !pg.location ||
        !Array.isArray(pg.facilities)
      ) {
        throw new Error(`Invalid PG seed data: ${pg.id || 'unknown ID'}`);
      }

      stmt.run([
        pg.id,
        pg.name,
        pg.location,
        pg.rent,
        pg.distance,
        pg.rating,
        pg.description || '',
        pg.facilities.join(',')
      ]);
    }
  } finally {
    stmt.free();
  }

  saveDatabase();

  console.log(`Seed data synchronized: ${seedData.pgs.length} PGs.`);
}

// Save SQLite database to disk
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Search PGs by location and optional budget
export function searchPGs(location, maxBudget = null) {
  let query = `
    SELECT * FROM pgs
    WHERE LOWER(location) LIKE LOWER(?)
  `;

  const params = [`%${location}%`];

  if (maxBudget !== null) {
    query += ' AND rent <= ?';
    params.push(maxBudget);
  }

  query += ' ORDER BY rating DESC, rent ASC';

  const stmt = db.prepare(query);
  stmt.bind(params);

  const results = [];

  try {
    while (stmt.step()) {
      const row = stmt.getAsObject();

      results.push({
        id: row.id,
        name: row.name,
        location: row.location,
        rent: row.rent,
        distance: row.distance,
        rating: row.rating,
        description: row.description,
        facilities: row.facilities
          ? row.facilities.split(',')
          : []
      });
    }
  } finally {
    stmt.free();
  }

  return results;
}

// Get one PG by ID
export function getPGById(id) {
  const stmt = db.prepare(
    'SELECT * FROM pgs WHERE id = ?'
  );

  stmt.bind([id]);

  try {
    if (stmt.step()) {
      const row = stmt.getAsObject();

      return {
        id: row.id,
        name: row.name,
        location: row.location,
        rent: row.rent,
        distance: row.distance,
        rating: row.rating,
        description: row.description,
        facilities: row.facilities
          ? row.facilities.split(',')
          : []
      };
    }

    return null;
  } finally {
    stmt.free();
  }
}

// Get multiple PGs by IDs
export function getPGsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const placeholders = ids.map(() => '?').join(',');

  const stmt = db.prepare(
    `SELECT * FROM pgs WHERE id IN (${placeholders})`
  );

  stmt.bind(ids);

  const results = [];

  try {
    while (stmt.step()) {
      const row = stmt.getAsObject();

      results.push({
        id: row.id,
        name: row.name,
        location: row.location,
        rent: row.rent,
        distance: row.distance,
        rating: row.rating,
        description: row.description,
        facilities: row.facilities
          ? row.facilities.split(',')
          : []
      });
    }
  } finally {
    stmt.free();
  }

  return results;
}

// Get user preferences
export function getPreferences(userId) {
  const stmt = db.prepare(
    'SELECT * FROM preferences WHERE user_id = ?'
  );

  stmt.bind([userId]);

  try {
    if (stmt.step()) {
      const row = stmt.getAsObject();

      return {
        user_id: row.user_id,
        preferred_location: row.preferred_location,
        max_budget: row.max_budget,
        required_facilities: row.required_facilities
          ? row.required_facilities.split(',')
          : []
      };
    }

    return null;
  } finally {
    stmt.free();
  }
}

// Save user preferences
export function setPreferences(userId, prefs) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO preferences
    (user_id, preferred_location, max_budget, required_facilities)
    VALUES (?, ?, ?, ?)
  `);

  try {
    stmt.run([
      userId,
      prefs.preferred_location || null,
      prefs.max_budget || null,
      Array.isArray(prefs.required_facilities)
        ? prefs.required_facilities.join(',')
        : null
    ]);
  } finally {
    stmt.free();
  }

  saveDatabase();
}
