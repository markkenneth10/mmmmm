// SQLite Persistent Database Layer for Climate Action System
// Powered by sql.js (WebAssembly SQLite Relational Database Engine)

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_FILE = path.join(__dirname, 'climate_database.sqlite');
const TMP_DB_FILE = path.join('/tmp', 'climate_database.sqlite');
const DB_BACKUP_DIR = path.join(__dirname, 'db_backups');

let db = null;
let SQL = null;
let isInitialized = false;

// Ensure backup directory exists
try {
  if (!fs.existsSync(DB_BACKUP_DIR)) {
    fs.mkdirSync(DB_BACKUP_DIR, { recursive: true });
  }
} catch (_) {}

/**
 * Save SQLite binary database state to disk
 */
function persistToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
    try { fs.writeFileSync(TMP_DB_FILE, buffer); } catch (_) {}
  } catch (err) {
    console.error('[Database] Failed to persist SQLite database to disk:', err.message);
  }
}

/**
 * Initialize SQLite Database & Tables Schema
 */
async function initDatabase() {
  if (isInitialized && db) return db;

  SQL = await initSqlJs();

  let fileBuffer = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      fileBuffer = fs.readFileSync(DB_FILE);
      console.log('[Database] Loaded existing SQLite database from', DB_FILE);
    } catch (err) {
      console.warn('[Database] Could not read primary DB file:', err.message);
    }
  }

  if (!fileBuffer && fs.existsSync(TMP_DB_FILE)) {
    try {
      fileBuffer = fs.readFileSync(TMP_DB_FILE);
      console.log('[Database] Restored SQLite database from tmp backup', TMP_DB_FILE);
    } catch (_) {}
  }

  if (fileBuffer) {
    try {
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('[Database] Corrupt database file, initializing fresh SQLite database:', err.message);
      db = new SQL.Database();
    }
  } else {
    console.log('[Database] Creating new SQLite database');
    db = new SQL.Database();
  }

  // Create relational schema tables
  db.run(`
    -- 1. Admin Accounts Table
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'sub_admin',
      department TEXT,
      phone TEXT,
      permissions TEXT, -- JSON array
      status TEXT NOT NULL DEFAULT 'Active',
      created_at INTEGER NOT NULL
    );

    -- 2. Citizen Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      barangay TEXT,
      avatar_url TEXT,
      kyc_status TEXT DEFAULT 'Unverified',
      kyc_document TEXT,
      kyc_doc_type TEXT,
      kyc_submitted_at INTEGER,
      kyc_notes TEXT,
      eco_points INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      created_at INTEGER NOT NULL
    );

    -- 3. Incident Reports Table
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      reporter_name TEXT,
      reporter_phone TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      description TEXT NOT NULL,
      barangay TEXT NOT NULL,
      location_text TEXT,
      latitude REAL,
      longitude REAL,
      photo_url TEXT,
      status TEXT NOT NULL DEFAULT 'Submitted',
      assigned_unit TEXT,
      inspection_notes TEXT,
      resolution_summary TEXT,
      upvotes INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- 4. Website Configuration & Content (Key-Value Store)
    CREATE TABLE IF NOT EXISTS website_config (
      config_key TEXT PRIMARY KEY,
      config_value TEXT NOT NULL, -- JSON string
      updated_at INTEGER NOT NULL
    );

    -- 5. Dynamic Emergency Hotlines Table
    CREATE TABLE IF NOT EXISTS emergency_hotlines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      number TEXT NOT NULL,
      note TEXT,
      icon TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      sort_order INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    -- 6. Climate & Weather Advisories Table
    CREATE TABLE IF NOT EXISTS weather_advisories (
      id TEXT PRIMARY KEY,
      temperature REAL NOT NULL,
      heat_index REAL NOT NULL,
      condition TEXT NOT NULL,
      condition_icon TEXT,
      alert_level TEXT NOT NULL,
      air_quality TEXT,
      typhoon_signal TEXT,
      advisory_notice TEXT,
      safety_tip TEXT,
      updated_by TEXT,
      updated_at INTEGER NOT NULL
    );

    -- 7. Municipal Announcements Table
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      hidden INTEGER DEFAULT 0,
      created_by TEXT,
      created_at INTEGER NOT NULL
    );

    -- 8. User Guides Table
    CREATE TABLE IF NOT EXISTS user_guides (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at INTEGER NOT NULL
    );

    -- 9. Community Activities Table
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      event_date TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      organizer TEXT,
      points INTEGER DEFAULT 50,
      max_participants INTEGER DEFAULT 50,
      participants TEXT, -- JSON array
      hidden INTEGER DEFAULT 0,
      image_url TEXT,
      created_at INTEGER NOT NULL
    );

    -- 10. Activity Participations / Proof Submissions Table
    CREATE TABLE IF NOT EXISTS activity_participations (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      activity_title TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      proof_image_url TEXT NOT NULL,
      proof_description TEXT,
      status TEXT DEFAULT 'Pending',
      points_awarded INTEGER DEFAULT 0,
      submitted_at INTEGER NOT NULL,
      reviewed_at INTEGER,
      review_notes TEXT
    );

    -- 11. Admin Sessions Table
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    -- 12. Media Uploads & Assets Table
    CREATE TABLE IF NOT EXISTS media_uploads (
      filename TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      category TEXT,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      base64_data TEXT,
      timestamp INTEGER NOT NULL
    );

    -- Indices for fast searching and filtering
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
    CREATE INDEX IF NOT EXISTS idx_reports_barangay ON reports(barangay);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_kyc ON users(kyc_status);
    CREATE INDEX IF NOT EXISTS idx_part_user ON activity_participations(user_id);
    CREATE INDEX IF NOT EXISTS idx_part_activity ON activity_participations(activity_id);
  `);

  // Column Alter Migrations for existing DBs
  try { db.run("ALTER TABLE users ADD COLUMN avatar_url TEXT;"); } catch (_) {}
  try { db.run("ALTER TABLE announcements ADD COLUMN hidden INTEGER DEFAULT 0;"); } catch (_) {}
  try { db.run("ALTER TABLE activities ADD COLUMN points INTEGER DEFAULT 50;"); } catch (_) {}
  try { db.run("ALTER TABLE activities ADD COLUMN hidden INTEGER DEFAULT 0;"); } catch (_) {}
  try { db.run("ALTER TABLE activities ADD COLUMN image_url TEXT;"); } catch (_) {}

  isInitialized = true;
  persistToDisk();
  console.log('[Database] SQLite relational schema verified and ready.');
  return db;
}

// -------------------------------------------------------------
// HELPER QUERY UTILITIES
// -------------------------------------------------------------

function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  persistToDisk();
}

function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const res = query(sql, params);
  return res.length > 0 ? res[0] : null;
}

// -------------------------------------------------------------
// DOMAIN DATA REPOSITORIES
// -------------------------------------------------------------

// --- 1. Admins Repository ---
const Admins = {
  getAll() {
    const rows = query('SELECT * FROM admins ORDER BY created_at ASC');
    return rows.map(r => ({
      ...r,
      permissions: r.permissions ? JSON.parse(r.permissions) : ['all']
    }));
  },
  getById(id) {
    const row = queryOne('SELECT * FROM admins WHERE id = ?', [id]);
    if (!row) return null;
    return { ...row, permissions: row.permissions ? JSON.parse(row.permissions) : ['all'] };
  },
  getByEmail(email) {
    const row = queryOne('SELECT * FROM admins WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (!row) return null;
    return { ...row, permissions: row.permissions ? JSON.parse(row.permissions) : ['all'] };
  },
  upsert(admin) {
    const perms = Array.isArray(admin.permissions) ? JSON.stringify(admin.permissions) : JSON.stringify(['all']);
    run(`
      INSERT INTO admins (id, email, password, name, role, department, phone, permissions, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email=excluded.email,
        password=excluded.password,
        name=excluded.name,
        role=excluded.role,
        department=excluded.department,
        phone=excluded.phone,
        permissions=excluded.permissions,
        status=excluded.status;
    `, [
      admin.id,
      admin.email.trim(),
      admin.password,
      admin.name,
      admin.role || 'sub_admin',
      admin.department || '',
      admin.phone || '',
      perms,
      admin.status || 'Active',
      admin.created_at || Date.now()
    ]);
    return this.getById(admin.id);
  },
  delete(id) {
    run('DELETE FROM admins WHERE id = ?', [id]);
  }
};

// --- 2. Citizen Users Repository ---
const Users = {
  getAll() {
    return query('SELECT * FROM users ORDER BY created_at DESC');
  },
  getById(id) {
    return queryOne('SELECT * FROM users WHERE id = ?', [id]);
  },
  getByEmail(email) {
    return queryOne('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  },
  upsert(u) {
    run(`
      INSERT INTO users (id, email, password, full_name, phone, address, barangay, avatar_url, kyc_status, kyc_document, kyc_doc_type, kyc_submitted_at, kyc_notes, eco_points, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email=excluded.email,
        password=excluded.password,
        full_name=excluded.full_name,
        phone=excluded.phone,
        address=excluded.address,
        barangay=excluded.barangay,
        avatar_url=excluded.avatar_url,
        kyc_status=excluded.kyc_status,
        kyc_document=excluded.kyc_document,
        kyc_doc_type=excluded.kyc_doc_type,
        kyc_submitted_at=excluded.kyc_submitted_at,
        kyc_notes=excluded.kyc_notes,
        eco_points=excluded.eco_points,
        status=excluded.status;
    `, [
      u.id,
      u.email.toLowerCase().trim(),
      u.password,
      u.full_name || u.name || '',
      u.phone || '',
      u.address || '',
      u.barangay || '',
      u.avatar_url || u.avatarUrl || '',
      u.kyc_status || 'Unverified',
      u.kyc_document || '',
      u.kyc_doc_type || '',
      u.kyc_submitted_at || null,
      u.kyc_notes || '',
      u.eco_points || 0,
      u.status || 'Active',
      u.created_at || Date.now()
    ]);
    return this.getById(u.id);
  },
  updateKYC(id, status, notes = '') {
    run('UPDATE users SET kyc_status = ?, kyc_notes = ? WHERE id = ?', [status, notes, id]);
    return this.getById(id);
  },
  updateAvatar(id, avatarUrl) {
    run('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, id]);
    return this.getById(id);
  },
  addEcoPoints(id, points) {
    run('UPDATE users SET eco_points = eco_points + ? WHERE id = ?', [points, id]);
    return this.getById(id);
  },
  delete(id) {
    run('DELETE FROM users WHERE id = ?', [id]);
  }
};

// --- 3. Incident Reports Repository ---
const Reports = {
  getAll() {
    return query('SELECT * FROM reports ORDER BY created_at DESC');
  },
  getById(id) {
    return queryOne('SELECT * FROM reports WHERE id = ?', [id]);
  },
  upsert(r) {
    const now = Date.now();
    run(`
      INSERT INTO reports (id, user_id, reporter_name, reporter_phone, title, category, severity, description, barangay, location_text, latitude, longitude, photo_url, status, assigned_unit, inspection_notes, resolution_summary, upvotes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        category=excluded.category,
        severity=excluded.severity,
        description=excluded.description,
        barangay=excluded.barangay,
        location_text=excluded.location_text,
        latitude=excluded.latitude,
        longitude=excluded.longitude,
        photo_url=excluded.photo_url,
        status=excluded.status,
        assigned_unit=excluded.assigned_unit,
        inspection_notes=excluded.inspection_notes,
        resolution_summary=excluded.resolution_summary,
        upvotes=excluded.upvotes,
        updated_at=excluded.updated_at;
    `, [
      r.id,
      r.user_id || '',
      r.reporter_name || '',
      r.reporter_phone || '',
      r.title || '',
      r.category || '',
      r.severity || 'Moderate',
      r.description || '',
      r.barangay || '',
      r.location_text || '',
      r.latitude !== undefined ? Number(r.latitude) : 0,
      r.longitude !== undefined ? Number(r.longitude) : 0,
      r.photo_url || '',
      r.status || 'Submitted',
      r.assigned_unit || '',
      r.inspection_notes || '',
      r.resolution_summary || '',
      r.upvotes || 0,
      r.created_at || now,
      r.updated_at || now
    ]);
    return this.getById(r.id);
  },
  delete(id) {
    run('DELETE FROM reports WHERE id = ?', [id]);
  }
};

// --- 4. Website Configuration Repository ---
const Config = {
  get(key = 'main_config') {
    const row = queryOne('SELECT config_value FROM website_config WHERE config_key = ?', [key]);
    if (!row) return null;
    try {
      return JSON.parse(row.config_value);
    } catch (_) {
      return null;
    }
  },
  set(key = 'main_config', valueObj) {
    const valStr = JSON.stringify(valueObj);
    const now = Date.now();
    run(`
      INSERT INTO website_config (config_key, config_value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(config_key) DO UPDATE SET
        config_value=excluded.config_value,
        updated_at=excluded.updated_at;
    `, [key, valStr, now]);
    return valueObj;
  }
};

// --- 5. Emergency Hotlines Repository ---
const Hotlines = {
  getAll() {
    return query('SELECT * FROM emergency_hotlines ORDER BY sort_order ASC, updated_at ASC');
  },
  saveAll(list) {
    run('DELETE FROM emergency_hotlines');
    const now = Date.now();
    list.forEach((item, index) => {
      run(`
        INSERT INTO emergency_hotlines (id, name, number, note, icon, category, sort_order, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.id || ('hotline_' + index + '_' + now),
        item.name || '',
        item.number || '',
        item.note || '',
        item.icon || '',
        item.category || 'general',
        index,
        now
      ]);
    });
    return this.getAll();
  }
};

// --- 6. Weather Advisories Repository ---
const Weather = {
  get() {
    return queryOne('SELECT * FROM weather_advisories WHERE id = ?', ['current']);
  },
  set(w) {
    const now = Date.now();
    run(`
      INSERT INTO weather_advisories (id, temperature, heat_index, condition, condition_icon, alert_level, air_quality, typhoon_signal, advisory_notice, safety_tip, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        temperature=excluded.temperature,
        heat_index=excluded.heat_index,
        condition=excluded.condition,
        condition_icon=excluded.condition_icon,
        alert_level=excluded.alert_level,
        air_quality=excluded.air_quality,
        typhoon_signal=excluded.typhoon_signal,
        advisory_notice=excluded.advisory_notice,
        safety_tip=excluded.safety_tip,
        updated_by=excluded.updated_by,
        updated_at=excluded.updated_at;
    `, [
      'current',
      Number(w.temperature) || 32,
      Number(w.heatIndex || w.heat_index) || 38,
      w.condition || 'Partly Cloudy',
      w.conditionIcon || w.condition_icon || '',
      w.alertLevel || w.alert_level || 'Yellow',
      w.airQuality || w.air_quality || 'Moderate',
      w.typhoonSignal || w.typhoon_signal || 'None',
      w.advisoryNotice || w.advisory_notice || '',
      w.safetyTip || w.safety_tip || '',
      w.updatedBy || w.updated_by || 'Admin',
      now
    ]);
    return this.get();
  }
};

// --- 7. Announcements Repository (Support Add, Edit, Hide, Delete) ---
const Announcements = {
  getAll(includeHidden = false) {
    if (includeHidden) {
      return query('SELECT * FROM announcements ORDER BY created_at DESC');
    }
    return query('SELECT * FROM announcements WHERE hidden = 0 OR hidden IS NULL ORDER BY created_at DESC');
  },
  getById(id) {
    return queryOne('SELECT * FROM announcements WHERE id = ?', [id]);
  },
  upsert(a) {
    run(`
      INSERT INTO announcements (id, title, category, priority, content, image_url, hidden, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        category=excluded.category,
        priority=excluded.priority,
        content=excluded.content,
        image_url=excluded.image_url,
        hidden=excluded.hidden,
        created_by=excluded.created_by;
    `, [
      a.id,
      a.title || '',
      a.category || 'General',
      a.priority || 'Normal',
      a.content || '',
      a.image_url || a.imageUrl || '',
      a.hidden ? 1 : 0,
      a.created_by || a.createdBy || 'Super Admin',
      a.created_at || a.createdAt || Date.now()
    ]);
    return this.getById(a.id);
  },
  setHidden(id, hidden) {
    run('UPDATE announcements SET hidden = ? WHERE id = ?', [hidden ? 1 : 0, id]);
    return this.getById(id);
  },
  delete(id) {
    run('DELETE FROM announcements WHERE id = ?', [id]);
  }
};

// --- 8. User Guides Repository ---
const UserGuides = {
  getAll() {
    return query('SELECT * FROM user_guides ORDER BY created_at ASC');
  },
  getById(id) {
    return queryOne('SELECT * FROM user_guides WHERE id = ?', [id]);
  },
  upsert(g) {
    run(`
      INSERT INTO user_guides (id, title, category, summary, content, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        category=excluded.category,
        summary=excluded.summary,
        content=excluded.content,
        image_url=excluded.image_url;
    `, [
      g.id,
      g.title || '',
      g.category || 'Reporting',
      g.summary || '',
      g.content || '',
      g.image_url || g.imageUrl || '',
      g.created_at || g.createdAt || Date.now()
    ]);
    return this.getById(g.id);
  },
  delete(id) {
    run('DELETE FROM user_guides WHERE id = ?', [id]);
  }
};

// --- 9. Community Activities Repository (Support Add, Edit, Hide, Delete, Points) ---
const Activities = {
  getAll(includeHidden = false) {
    const sql = includeHidden 
      ? 'SELECT * FROM activities ORDER BY created_at DESC'
      : 'SELECT * FROM activities WHERE hidden = 0 OR hidden IS NULL ORDER BY created_at DESC';
    const rows = query(sql);
    return rows.map(r => ({
      ...r,
      participants: r.participants ? JSON.parse(r.participants) : []
    }));
  },
  getById(id) {
    const r = queryOne('SELECT * FROM activities WHERE id = ?', [id]);
    if (!r) return null;
    return { ...r, participants: r.participants ? JSON.parse(r.participants) : [] };
  },
  upsert(a) {
    const parts = Array.isArray(a.participants) ? JSON.stringify(a.participants) : '[]';
    run(`
      INSERT INTO activities (id, title, category, event_date, location, description, organizer, points, max_participants, participants, hidden, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        category=excluded.category,
        event_date=excluded.event_date,
        location=excluded.location,
        description=excluded.description,
        organizer=excluded.organizer,
        points=excluded.points,
        max_participants=excluded.max_participants,
        participants=excluded.participants,
        hidden=excluded.hidden,
        image_url=excluded.image_url;
    `, [
      a.id,
      a.title || '',
      a.category || 'Community',
      a.event_date || a.eventDate || '',
      a.location || '',
      a.description || '',
      a.organizer || '',
      Number(a.points) || 50,
      a.max_participants || a.maxParticipants || 50,
      parts,
      a.hidden ? 1 : 0,
      a.image_url || a.imageUrl || '',
      a.created_at || a.createdAt || Date.now()
    ]);
    return this.getById(a.id);
  },
  setHidden(id, hidden) {
    run('UPDATE activities SET hidden = ? WHERE id = ?', [hidden ? 1 : 0, id]);
    return this.getById(id);
  },
  delete(id) {
    run('DELETE FROM activities WHERE id = ?', [id]);
    run('DELETE FROM activity_participations WHERE activity_id = ?', [id]);
  }
};

// --- 10. Activity Participations / Proof Submissions Repository ---
const Participations = {
  getAll() {
    return query('SELECT * FROM activity_participations ORDER BY submitted_at DESC');
  },
  getByUser(userId) {
    return query('SELECT * FROM activity_participations WHERE user_id = ? ORDER BY submitted_at DESC', [userId]);
  },
  getById(id) {
    return queryOne('SELECT * FROM activity_participations WHERE id = ?', [id]);
  },
  submitProof(p) {
    run(`
      INSERT INTO activity_participations (id, activity_id, activity_title, user_id, user_name, user_email, proof_image_url, proof_description, status, points_awarded, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      p.id || ('part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
      p.activity_id || p.activityId,
      p.activity_title || p.activityTitle || 'Community Activity',
      p.user_id || p.userId,
      p.user_name || p.userName || 'Citizen Participant',
      p.user_email || p.userEmail || '',
      p.proof_image_url || p.proofImageUrl || '',
      p.proof_description || p.proofDescription || '',
      'Pending',
      Number(p.points_awarded || p.points) || 50,
      Date.now()
    ]);
    return this.getById(p.id);
  },
  reviewProof(id, status, notes = '') {
    const part = this.getById(id);
    if (!part) return null;
    const previousStatus = part.status;
    const now = Date.now();

    run('UPDATE activity_participations SET status = ?, reviewed_at = ?, review_notes = ? WHERE id = ?', [status, now, notes, id]);

    // If newly approved, award points to user
    if (status === 'Approved' && previousStatus !== 'Approved') {
      const user = Users.getById(part.user_id) || Users.getByEmail(part.user_email);
      if (user) {
        Users.addEcoPoints(user.id, Number(part.points_awarded || 50));
      }
    }

    return this.getById(id);
  },
  delete(id) {
    run('DELETE FROM activity_participations WHERE id = ?', [id]);
  }
};

// --- 11. Sessions Repository ---
const Sessions = {
  getAll() {
    return query('SELECT * FROM admin_sessions WHERE expires_at > ?', [Date.now()]);
  },
  get(token) {
    return queryOne('SELECT * FROM admin_sessions WHERE token = ? AND expires_at > ?', [token, Date.now()]);
  },
  set(token, s) {
    run(`
      INSERT INTO admin_sessions (token, admin_id, role, email, name, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(token) DO UPDATE SET
        admin_id=excluded.admin_id,
        role=excluded.role,
        email=excluded.email,
        name=excluded.name,
        expires_at=excluded.expires_at;
    `, [
      token,
      s.adminId || s.admin_id,
      s.role,
      s.email,
      s.name,
      s.expiresAt || s.expires_at,
      s.createdAt || s.created_at || Date.now()
    ]);
    return this.get(token);
  },
  delete(token) {
    run('DELETE FROM admin_sessions WHERE token = ?', [token]);
  },
  cleanup() {
    run('DELETE FROM admin_sessions WHERE expires_at <= ?', [Date.now()]);
  }
};

// --- 12. Media Uploads Repository ---
const Media = {
  getAll() {
    return query('SELECT filename, url, category, content_type, size, timestamp FROM media_uploads ORDER BY timestamp DESC');
  },
  get(filename) {
    return queryOne('SELECT * FROM media_uploads WHERE filename = ?', [filename]);
  },
  save(m) {
    run(`
      INSERT INTO media_uploads (filename, url, category, content_type, size, base64_data, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(filename) DO UPDATE SET
        url=excluded.url,
        category=excluded.category,
        content_type=excluded.content_type,
        size=excluded.size,
        base64_data=excluded.base64_data,
        timestamp=excluded.timestamp;
    `, [
      m.filename,
      m.url,
      m.category || 'media',
      m.contentType || m.content_type || 'image/png',
      m.size || 0,
      m.base64 || m.base64_data || '',
      m.timestamp || Date.now()
    ]);
    return this.get(m.filename);
  },
  delete(filename) {
    run('DELETE FROM media_uploads WHERE filename = ?', [filename]);
  }
};

/**
 * Migration helper to import existing JSON data files into SQLite tables
 */
function migrateFromJsonFiles(stores = {}) {
  try {
    // 1. Migrate Admins
    if (Array.isArray(stores.admins) && stores.admins.length > 0) {
      stores.admins.forEach(a => {
        if (a && a.email) Admins.upsert(a);
      });
    }

    // 2. Migrate Users
    if (Array.isArray(stores.users) && stores.users.length > 0) {
      stores.users.forEach(u => {
        if (u && u.email) Users.upsert(u);
      });
    }

    // 3. Migrate Reports
    if (Array.isArray(stores.reports) && stores.reports.length > 0) {
      stores.reports.forEach(r => {
        if (r && r.id) Reports.upsert(r);
      });
    }

    // 4. Migrate Config
    if (stores.config && typeof stores.config === 'object') {
      Config.set('main_config', stores.config);
      if (Array.isArray(stores.config.emergencyHotlines)) {
        Hotlines.saveAll(stores.config.emergencyHotlines);
      }
    }

    // 5. Migrate Weather
    if (stores.weather && typeof stores.weather === 'object') {
      Weather.set(stores.weather);
    }

    // 6. Migrate Announcements
    if (Array.isArray(stores.announcements) && stores.announcements.length > 0) {
      stores.announcements.forEach(a => {
        if (a && a.id) Announcements.upsert(a);
      });
    }

    // 7. Migrate Guides
    if (Array.isArray(stores.guides) && stores.guides.length > 0) {
      stores.guides.forEach(g => {
        if (g && g.id) UserGuides.upsert(g);
      });
    }

    // 8. Migrate Activities
    if (Array.isArray(stores.activities) && stores.activities.length > 0) {
      stores.activities.forEach(act => {
        if (act && act.id) Activities.upsert(act);
      });
    }

    persistToDisk();
    console.log('[Database] JSON to SQLite database migration complete.');
  } catch (err) {
    console.error('[Database] Migration error:', err.message);
  }
}

module.exports = {
  initDatabase,
  persistToDisk,
  run,
  query,
  queryOne,
  Admins,
  Users,
  Reports,
  Config,
  Hotlines,
  Weather,
  Announcements,
  UserGuides,
  Activities,
  Participations,
  Sessions,
  Media,
  migrateFromJsonFiles,
  DB_FILE
};
