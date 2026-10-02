const fs = require('fs');
const path = require('path');

let db = null;
const DB_FILE = path.join(__dirname, 'climate_database.sqlite');
const TMP_DB_FILE = path.join('/tmp', 'climate_database.sqlite');

try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(DB_FILE);
  console.log('SQLite initialized using native node:sqlite engine.');
} catch (err) {
  console.warn('Native node:sqlite engine warning:', err.message);
  try {
    const { DatabaseSync } = require('node:sqlite');
    db = new DatabaseSync(TMP_DB_FILE);
  } catch (err2) {
    console.warn('In-memory fallback mode enabled for SQLite:', err2.message);
  }
}

function run(sql, params = []) {
  if (!db) return;
  try {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } catch (e) {
    console.error('SQL Exec Error:', e.message, 'SQL:', sql);
  }
}

function query(sql, params = []) {
  if (!db) return [];
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (e) {
    console.error('SQL Query Error:', e.message, 'SQL:', sql);
    return [];
  }
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// -------------------------------------------------------------
// TABLE SCHEMAS INITIALIZATION
// -------------------------------------------------------------
function initTables() {
  if (!db) return;

  // 1. Admins Table
  run(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'sub_admin',
      department TEXT,
      phone TEXT,
      permissions TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at INTEGER
    );
  `);

  // 2. Citizen Users Table
  run(`
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
      created_at INTEGER
    );
  `);

  // 3. Incident Reports Table
  run(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      reporter_name TEXT,
      reporter_phone TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'Moderate',
      description TEXT,
      barangay TEXT NOT NULL,
      location_text TEXT,
      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0,
      photo_url TEXT,
      status TEXT NOT NULL DEFAULT 'Submitted',
      assigned_unit TEXT,
      inspection_notes TEXT,
      resolution_summary TEXT,
      upvotes INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  // 4. Website Configuration Table
  run(`
    CREATE TABLE IF NOT EXISTS website_config (
      config_key TEXT PRIMARY KEY,
      config_value TEXT NOT NULL,
      updated_at INTEGER
    );
  `);

  // 5. Emergency Hotlines Table
  run(`
    CREATE TABLE IF NOT EXISTS emergency_hotlines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      number TEXT NOT NULL,
      note TEXT,
      icon TEXT,
      category TEXT DEFAULT 'general',
      sort_order INTEGER DEFAULT 0,
      updated_at INTEGER
    );
  `);

  // 6. Weather Advisories Table
  run(`
    CREATE TABLE IF NOT EXISTS weather_advisories (
      id TEXT PRIMARY KEY,
      temperature REAL DEFAULT 32,
      heat_index REAL DEFAULT 38,
      condition TEXT DEFAULT 'Partly Cloudy',
      condition_icon TEXT,
      alert_level TEXT DEFAULT 'Yellow',
      air_quality TEXT DEFAULT 'Moderate',
      typhoon_signal TEXT DEFAULT 'None',
      advisory_notice TEXT,
      safety_tip TEXT,
      updated_by TEXT,
      updated_at INTEGER
    );
  `);

  // 7. Announcements Table
  run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      priority TEXT DEFAULT 'Normal',
      content TEXT NOT NULL,
      image_url TEXT,
      hidden INTEGER DEFAULT 0,
      created_by TEXT,
      created_at INTEGER
    );
  `);

  // 8. User Guides Table
  run(`
    CREATE TABLE IF NOT EXISTS user_guides (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Reporting',
      summary TEXT,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at INTEGER
    );
  `);

  // 9. Community Activities Table
  run(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Community',
      event_date TEXT,
      location TEXT,
      description TEXT,
      organizer TEXT,
      points INTEGER DEFAULT 50,
      max_participants INTEGER DEFAULT 50,
      participants TEXT,
      hidden INTEGER DEFAULT 0,
      image_url TEXT,
      created_at INTEGER
    );
  `);

  // 10. Activity Participations / Proof Submissions Table
  run(`
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
      points_awarded INTEGER DEFAULT 50,
      submitted_at INTEGER,
      reviewed_at INTEGER,
      review_notes TEXT
    );
  `);

  // 11. Admin Sessions Table
  run(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Default Seed Data Insertion
  seedDefaultData();
}

function seedDefaultData() {
  // Super Admin Default
  const adminCount = queryOne('SELECT COUNT(*) as count FROM admins');
  if (!adminCount || adminCount.count === 0) {
    run(`
      INSERT INTO admins (id, email, password, name, role, department, phone, permissions, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'admin-super-001',
      'cenro@metroverde.gov.ph',
      'cenro123',
      'Super Admin Director',
      'super_admin',
      'LGU CENRO Operations',
      '+63 2 8888 1234',
      JSON.stringify(['all']),
      'Active',
      Date.now()
    ]);
  }

  // Initial Sample Activities
  const actCount = queryOne('SELECT COUNT(*) as count FROM activities');
  if (!actCount || actCount.count === 0) {
    run(`
      INSERT INTO activities (id, title, category, event_date, location, description, organizer, points, max_participants, participants, hidden, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'act-101',
      'River Dredging & Mangrove Tree Planting Drive',
      'Tree Planting',
      'Saturday, Oct 24 • 7:00 AM - 11:00 AM',
      'Barangay Makilas Riverside',
      'Join LGU CENRO in planting 500 mangrove saplings along the riverbank to restore natural flood barriers and prevent soil erosion.',
      'CENRO Environmental Unit',
      100,
      150,
      '[]',
      0,
      '/uploads/tree_planting_banner.jpg',
      Date.now()
    ]);

    run(`
      INSERT INTO activities (id, title, category, event_date, location, description, organizer, points, max_participants, participants, hidden, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'act-102',
      'Coastal Zero Waste & Plastic Clean-up Campaign',
      'River Cleanup',
      'Sunday, Nov 01 • 6:00 AM - 9:30 AM',
      'Metro Verde Coastal Bay',
      'Community beach cleanup to collect marine plastics, sort recyclable materials, and promote eco-friendly waste management.',
      'Metro Verde Eco Volunteers',
      150,
      200,
      '[]',
      0,
      '/uploads/coastal_cleanup.jpg',
      Date.now()
    ]);
  }

  // Initial Weather
  const weatherCount = queryOne('SELECT COUNT(*) as count FROM weather_advisories');
  if (!weatherCount || weatherCount.count === 0) {
    run(`
      INSERT INTO weather_advisories (id, temperature, heat_index, condition, condition_icon, alert_level, air_quality, typhoon_signal, advisory_notice, safety_tip, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'current',
      32,
      38,
      'Partly Cloudy with Scattered Showers',
      '⛅',
      'Yellow',
      'Moderate',
      'None',
      'Yellow rainfall advisory in effect for low-lying coastal barangays. River monitoring units are deployed.',
      'Stay hydrated, avoid prolonged sun exposure during peak hours, and report clogging in drainage canals.',
      'LGU CENRO Weather Desk',
      Date.now()
    ]);
  }
}

initTables();

// -------------------------------------------------------------
// REPOSITORIES
// -------------------------------------------------------------
const Admins = {
  getAll() {
    return query('SELECT * FROM admins ORDER BY created_at ASC').map(r => ({
      ...r,
      permissions: r.permissions ? JSON.parse(r.permissions) : ['all']
    }));
  },
  getById(id) {
    const r = queryOne('SELECT * FROM admins WHERE id = ?', [id]);
    return r ? { ...r, permissions: r.permissions ? JSON.parse(r.permissions) : ['all'] } : null;
  },
  getByEmail(email) {
    const r = queryOne('SELECT * FROM admins WHERE LOWER(email) = LOWER(?)', [(email || '').trim()]);
    return r ? { ...r, permissions: r.permissions ? JSON.parse(r.permissions) : ['all'] } : null;
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
      admin.id || ('admin-' + Date.now().toString().slice(-4)),
      (admin.email || '').trim(),
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

const Users = {
  getAll() {
    return query('SELECT * FROM users ORDER BY created_at DESC');
  },
  getById(id) {
    return queryOne('SELECT * FROM users WHERE id = ?', [id]);
  },
  getByEmail(email) {
    return queryOne('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [(email || '').trim()]);
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
      u.id || ('user-' + Date.now().toString().slice(-4)),
      (u.email || '').toLowerCase().trim(),
      u.password || 'password123',
      u.full_name || u.name || 'Citizen',
      u.phone || '',
      u.address || '',
      u.barangay || 'Barangay Makilas',
      u.avatar_url || u.avatarUrl || u.avatar || '',
      u.kyc_status || 'Unverified',
      u.kyc_document || '',
      u.kyc_doc_type || '',
      u.kyc_submitted_at || null,
      u.kyc_notes || '',
      u.eco_points || u.ecoPoints || 50,
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
      r.id || ('rep-' + Date.now().toString().slice(-6)),
      r.user_id || '',
      r.reporter_name || '',
      r.reporter_phone || '',
      r.title || '',
      r.category || 'General Hazard',
      r.severity || 'Moderate',
      r.description || '',
      r.barangay || 'Metro Verde',
      r.location_text || '',
      r.latitude !== undefined ? Number(r.latitude) : 0,
      r.longitude !== undefined ? Number(r.longitude) : 0,
      r.photo_url || r.photoUrl || '',
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

const Announcements = {
  getAll(includeHidden = false) {
    if (includeHidden) return query('SELECT * FROM announcements ORDER BY created_at DESC');
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
      a.id || ('ann-' + Date.now().toString().slice(-6)),
      a.title || '',
      a.category || 'Advisory',
      a.priority || 'Normal',
      a.content || a.body || '',
      a.image_url || a.imageUrl || '',
      a.hidden ? 1 : 0,
      a.created_by || a.author || 'Super Admin',
      a.created_at || Date.now()
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

const Activities = {
  getAll(includeHidden = false) {
    const sql = includeHidden 
      ? 'SELECT * FROM activities ORDER BY created_at DESC'
      : 'SELECT * FROM activities WHERE hidden = 0 OR hidden IS NULL ORDER BY created_at DESC';
    return query(sql).map(r => ({
      ...r,
      participants: r.participants ? JSON.parse(r.participants) : []
    }));
  },
  getById(id) {
    const r = queryOne('SELECT * FROM activities WHERE id = ?', [id]);
    return r ? { ...r, participants: r.participants ? JSON.parse(r.participants) : [] } : null;
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
      a.id || ('act-' + Date.now().toString().slice(-6)),
      a.title || '',
      a.category || 'Environmental Drive',
      a.event_date || a.eventDate || '',
      a.location || '',
      a.description || '',
      a.organizer || '',
      Number(a.points) || 50,
      Number(a.max_participants || a.maxParticipants) || 100,
      parts,
      a.hidden ? 1 : 0,
      a.image_url || a.imageUrl || '',
      a.created_at || Date.now()
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

const Participations = {
  getAll() {
    return query('SELECT * FROM activity_participations ORDER BY submitted_at DESC');
  },
  getByUser(userId, email = '') {
    return query('SELECT * FROM activity_participations WHERE user_id = ? OR LOWER(user_email) = LOWER(?) ORDER BY submitted_at DESC', [userId, email.trim()]);
  },
  getById(id) {
    return queryOne('SELECT * FROM activity_participations WHERE id = ?', [id]);
  },
  submitProof(p) {
    const id = p.id || ('part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    run(`
      INSERT INTO activity_participations (id, activity_id, activity_title, user_id, user_name, user_email, proof_image_url, proof_description, status, points_awarded, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      p.activity_id || p.activityId,
      p.activity_title || p.activityTitle || 'Community Activity',
      p.user_id || p.userId,
      p.user_name || p.userName || 'Citizen',
      p.user_email || p.userEmail || '',
      p.proof_image_url || p.proofImageUrl || '',
      p.proof_description || p.proofDescription || '',
      'Pending',
      Number(p.points_awarded || p.points) || 50,
      Date.now()
    ]);
    return this.getById(id);
  },
  reviewProof(id, status, notes = '') {
    const part = this.getById(id);
    if (!part) return null;
    const previousStatus = part.status;
    const now = Date.now();

    run('UPDATE activity_participations SET status = ?, reviewed_at = ?, review_notes = ? WHERE id = ?', [status, now, notes, id]);

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
      w.conditionIcon || w.condition_icon || '⛅',
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

const Sessions = {
  get(token) {
    return queryOne('SELECT * FROM admin_sessions WHERE token = ? AND expires_at > ?', [token, Date.now()]);
  },
  set(token, s) {
    run(`
      INSERT INTO admin_sessions (token, admin_id, role, email, name, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(token) DO UPDATE SET
        expires_at=excluded.expires_at;
    `, [
      token,
      s.admin_id || s.adminId,
      s.role || 'sub_admin',
      s.email,
      s.name,
      s.expires_at || s.expiresAt || (Date.now() + 86400000),
      Date.now()
    ]);
    return this.get(token);
  },
  delete(token) {
    run('DELETE FROM admin_sessions WHERE token = ?', [token]);
  }
};

function persistToDisk() {
  // SQLite handles disk persistence automatically
}

module.exports = {
  Admins,
  Users,
  Reports,
  Announcements,
  Activities,
  Participations,
  Weather,
  Sessions,
  persistToDisk
};
