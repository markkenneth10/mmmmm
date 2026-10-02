const http = require('http');
const fs = require('fs');
const path = require('path');
const database = require('./db.cjs');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const ADMIN_DIR = path.join(__dirname, 'admin');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const TMP_UPLOADS_DIR = path.join('/tmp', 'climate_uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (_) {}
}
if (!fs.existsSync(TMP_UPLOADS_DIR)) {
  try { fs.mkdirSync(TMP_UPLOADS_DIR, { recursive: true }); } catch (_) {}
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.sqlite': 'application/x-sqlite3'
};

// In-Memory Upload Cache for instant serving
const uploadedFilesCache = new Map();

// Initial Website Config
let websiteConfig = {
  websiteName: "Climate Action",
  websiteSubtitle: "Reporting & Information System • Metro Verde",
  websiteLogo: "",
  logoType: "emoji",
  logoImageUrl: "",
  heroImageUrl: "/uploads/climate_hero_banner.jpg",
  aboutImageUrl: "",
  emergencyHotline: "(02) 8888-ECO",
  denrHotline: "#911-DENR",
  healthHotline: "(02) 8888-HEALTH",
  emergencyHotlines: [
    { name: "LGU CENRO Emergency", number: "(02) 8888-ECO", note: "24/7 Environmental Incident Desk", icon: "🚨", category: "emergency" },
    { name: "DENR Environmental Hotline", number: "#911-DENR", note: "National Forestry & Coastal Desk", icon: "🌳", category: "government" },
    { name: "Metro Verde Disaster Rescue", number: "(02) 8888-RESCUE", note: "Flood & Typhoon Response", icon: "⛵", category: "rescue" }
  ],
  updatedAt: Date.now()
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 25 * 1024 * 1024) { // 25MB limit
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (_) {
        resolve({});
      }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email, Cookie'
  });
  res.end(JSON.stringify(data));
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
    });
  }
  return list;
}

function getAdminSession(req) {
  const cookies = parseCookies(req);
  const token = cookies.admin_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  return database.Sessions.get(token);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email, Cookie'
    });
    return res.end();
  }

  try {
    // -------------------------------------------------------------
    // API ROUTING
    // -------------------------------------------------------------

    // 1. Website Config
    if (pathname === '/api/config' && req.method === 'GET') {
      return sendJson(res, 200, { config: websiteConfig });
    }
    if (pathname === '/api/config' && (req.method === 'PUT' || req.method === 'POST')) {
      const updates = await parseBody(req);
      websiteConfig = { ...websiteConfig, ...updates, updatedAt: Date.now() };
      return sendJson(res, 200, { success: true, config: websiteConfig });
    }

    // 2. Weather & Advisories
    if (pathname === '/api/weather' && req.method === 'GET') {
      const weather = database.Weather.get();
      return sendJson(res, 200, { weather });
    }
    if (pathname === '/api/weather' && req.method === 'PUT') {
      const session = getAdminSession(req);
      if (!session) return sendJson(res, 401, { error: 'Admin session required' });
      const updates = await parseBody(req);
      const updated = database.Weather.set(updates);
      return sendJson(res, 200, { success: true, weather: updated });
    }

    // 3. Announcements
    if (pathname === '/api/announcements' && req.method === 'GET') {
      const session = getAdminSession(req);
      const includeHidden = !!session || parsedUrl.searchParams.get('all') === '1';
      const list = database.Announcements.getAll(includeHidden);
      return sendJson(res, 200, { announcements: list });
    }
    if (pathname === '/api/announcements' && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session) return sendJson(res, 401, { error: 'Admin session required' });
      const data = await parseBody(req);
      const saved = database.Announcements.upsert(data);
      return sendJson(res, 201, { success: true, announcement: saved });
    }
    if (pathname.startsWith('/api/announcements/') && req.method === 'PUT') {
      const annId = pathname.split('/')[3];
      const data = await parseBody(req);
      if (data.toggleHide !== undefined) {
        const updated = database.Announcements.setHidden(annId, data.toggleHide);
        return sendJson(res, 200, { success: true, announcement: updated });
      }
      const existing = database.Announcements.getById(annId);
      const updated = database.Announcements.upsert({ ...existing, ...data });
      return sendJson(res, 200, { success: true, announcement: updated });
    }
    if (pathname.startsWith('/api/announcements/') && req.method === 'DELETE') {
      const annId = pathname.split('/')[3];
      database.Announcements.delete(annId);
      return sendJson(res, 200, { success: true });
    }

    // 4. Incident Reports
    if (pathname === '/api/reports' && req.method === 'GET') {
      const reports = database.Reports.getAll();
      return sendJson(res, 200, { reports });
    }
    if (pathname === '/api/reports' && req.method === 'POST') {
      const data = await parseBody(req);
      if (!data.title || !data.category || !data.barangay) {
        return sendJson(res, 400, { error: 'Title, category, and barangay are required' });
      }
      const saved = database.Reports.upsert(data);
      return sendJson(res, 201, { success: true, report: saved });
    }
    if (pathname.startsWith('/api/reports/') && req.method === 'PUT') {
      const reportId = pathname.split('/')[3];
      const updates = await parseBody(req);
      const existing = database.Reports.getById(reportId);
      if (!existing) return sendJson(res, 404, { error: 'Report not found' });
      const updated = database.Reports.upsert({ ...existing, ...updates, updated_at: Date.now() });
      return sendJson(res, 200, { success: true, report: updated });
    }

    // 5. Community Activities & Participations
    if (pathname === '/api/activities' && req.method === 'GET') {
      const session = getAdminSession(req);
      const includeHidden = !!session || parsedUrl.searchParams.get('all') === '1';
      const list = database.Activities.getAll(includeHidden);
      return sendJson(res, 200, { activities: list });
    }
    if (pathname === '/api/activities' && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session) return sendJson(res, 401, { error: 'Admin session required' });
      const data = await parseBody(req);
      const saved = database.Activities.upsert(data);
      return sendJson(res, 201, { success: true, activity: saved });
    }
    if (pathname.startsWith('/api/activities/') && req.method === 'PUT') {
      const actId = pathname.split('/')[3];
      const data = await parseBody(req);
      if (data.toggleHide !== undefined) {
        const updated = database.Activities.setHidden(actId, data.toggleHide);
        return sendJson(res, 200, { success: true, activity: updated });
      }
      const existing = database.Activities.getById(actId);
      const updated = database.Activities.upsert({ ...existing, ...data });
      return sendJson(res, 200, { success: true, activity: updated });
    }
    if (pathname.startsWith('/api/activities/') && req.method === 'DELETE') {
      const actId = pathname.split('/')[3];
      database.Activities.delete(actId);
      return sendJson(res, 200, { success: true });
    }

    // Citizen Submission of Participation Proof
    if (pathname === '/api/activities/join-proof' && req.method === 'POST') {
      const data = await parseBody(req);
      if (!data.activityId || !data.proofImageUrl) {
        return sendJson(res, 400, { error: 'Activity ID and proof image are required' });
      }
      const proof = database.Participations.submitProof(data);
      return sendJson(res, 201, { success: true, participation: proof });
    }

    if (pathname === '/api/activities/my-participations' && req.method === 'GET') {
      const userId = parsedUrl.searchParams.get('userId') || '';
      const email = parsedUrl.searchParams.get('email') || '';
      const list = database.Participations.getByUser(userId, email);
      return sendJson(res, 200, { participations: list });
    }

    // Admin Review Participation Proofs
    if (pathname === '/api/admin/activities/participations' && req.method === 'GET') {
      const session = getAdminSession(req);
      if (!session) return sendJson(res, 401, { error: 'Admin session required' });
      const list = database.Participations.getAll();
      return sendJson(res, 200, { participations: list });
    }
    if (pathname === '/api/admin/activities/review-participation' && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session) return sendJson(res, 401, { error: 'Admin session required' });
      const data = await parseBody(req);
      const updated = database.Participations.reviewProof(data.submissionId, data.status, data.notes || '');
      if (!updated) return sendJson(res, 404, { error: 'Submission not found' });
      return sendJson(res, 200, { success: true, participation: updated });
    }

    // 6. Citizen Authentication & User Profile
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const data = await parseBody(req);
      if (!data.email || !data.password || !data.name) {
        return sendJson(res, 400, { error: 'Name, email, and password required' });
      }
      const existing = database.Users.getByEmail(data.email);
      if (existing) {
        return sendJson(res, 409, { error: 'Account with this email already exists', user: existing });
      }
      const newUser = database.Users.upsert(data);
      return sendJson(res, 201, { success: true, user: newUser });
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const data = await parseBody(req);
      const user = database.Users.getByEmail(data.email);
      if (!user || user.password !== data.password) {
        return sendJson(res, 401, { error: 'Invalid citizen email or password' });
      }
      return sendJson(res, 200, { success: true, user });
    }

    if (pathname === '/api/user/profile' && (req.method === 'GET' || req.method === 'POST' || req.method === 'PUT')) {
      if (req.method === 'GET') {
        const email = parsedUrl.searchParams.get('email') || req.headers['x-user-email'] || '';
        const user = database.Users.getByEmail(email);
        return sendJson(res, 200, { user: user || null });
      }
      const data = await parseBody(req);
      const email = data.email || parsedUrl.searchParams.get('email') || '';
      let user = database.Users.getByEmail(email);
      if (!user) {
        user = database.Users.upsert(data);
      } else {
        user = database.Users.upsert({ ...user, ...data });
      }
      return sendJson(res, 200, { success: true, user });
    }

    if (pathname === '/api/user/kyc/submit' && req.method === 'POST') {
      const data = await parseBody(req);
      const user = database.Users.getByEmail(data.email);
      if (!user) return sendJson(res, 404, { error: 'User not found' });
      
      const updated = database.Users.upsert({
        ...user,
        kyc_status: 'pending',
        kyc_document: data.frontImage,
        kyc_doc_type: data.idType,
        kyc_submitted_at: Date.now()
      });
      return sendJson(res, 200, { success: true, user: updated });
    }

    // 7. Admin Authentication & Session API
    if (pathname === '/api/admin/login' && req.method === 'POST') {
      const data = await parseBody(req);
      const admin = database.Admins.getByEmail(data.email);
      if (!admin || admin.password !== data.password) {
        return sendJson(res, 401, { error: 'Invalid administrative email or password' });
      }
      const token = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const session = database.Sessions.set(token, {
        admin_id: admin.id,
        role: admin.role,
        email: admin.email,
        name: admin.name,
        expires_at: Date.now() + 86400000
      });

      res.setHeader('Set-Cookie', `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
      return sendJson(res, 200, { success: true, token, session, admin });
    }

    if (pathname === '/api/admin/session' && req.method === 'GET') {
      const session = getAdminSession(req);
      if (!session) return sendJson(res, 401, { authenticated: false });
      const admin = database.Admins.getById(session.admin_id);
      return sendJson(res, 200, { authenticated: true, session, admin });
    }

    if (pathname === '/api/admin/logout' && req.method === 'POST') {
      const cookies = parseCookies(req);
      if (cookies.admin_session) database.Sessions.delete(cookies.admin_session);
      res.setHeader('Set-Cookie', 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return sendJson(res, 200, { success: true });
    }

    // Admin Users Management
    if (pathname === '/api/admin/users' && req.method === 'GET') {
      const session = getAdminSession(req);
      if (!session) return sendJson(res, 401, { error: 'Admin session required' });
      const users = database.Users.getAll().map(({ password, ...u }) => ({
        ...u,
        avatarUrl: u.avatar_url || u.avatar || '',
        ecoPoints: u.eco_points || 0
      }));
      return sendJson(res, 200, { users, totalUsers: users.length, activeToday: Math.floor(users.length * 0.8) });
    }

    // Media Upload API (Base64)
    if ((pathname === '/api/user/upload-media' || pathname === '/api/admin/upload-image') && req.method === 'POST') {
      const data = await parseBody(req);
      if (!data.image) return sendJson(res, 400, { error: 'Image data URL is required' });

      const matches = data.image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      const ext = matches ? matches[1] : 'png';
      const base64Data = matches ? matches[2] : data.image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = data.filename || `upload_${Date.now()}.${ext}`;
      const urlPath = `/uploads/${filename}`;

      try {
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
      } catch (_) {}
      try {
        fs.writeFileSync(path.join(TMP_UPLOADS_DIR, filename), buffer);
      } catch (_) {}

      uploadedFilesCache.set(urlPath, { buffer, mime: `image/${ext}` });
      return sendJson(res, 200, { success: true, url: urlPath, filename });
    }

    // Database Export
    if (pathname === '/api/admin/database/download' && req.method === 'GET') {
      const session = getAdminSession(req);
      if (!session) return sendJson(res, 401, { error: 'Admin session required' });
      
      let filePath = path.join(__dirname, 'climate_database.sqlite');
      if (!fs.existsSync(filePath)) filePath = path.join('/tmp', 'climate_database.sqlite');
      
      if (fs.existsSync(filePath)) {
        res.writeHead(200, {
          'Content-Type': 'application/x-sqlite3',
          'Content-Disposition': `attachment; filename="climate_database_${Date.now()}.sqlite"`
        });
        return fs.createReadStream(filePath).pipe(res);
      } else {
        return sendJson(res, 404, { error: 'Database file not found on disk' });
      }
    }

    // -------------------------------------------------------------
    // STATIC FILE SERVING
    // -------------------------------------------------------------
    if (uploadedFilesCache.has(pathname)) {
      const cached = uploadedFilesCache.get(pathname);
      res.writeHead(200, { 'Content-Type': cached.mime });
      return res.end(cached.buffer);
    }

    let filePath = '';
    if (pathname.startsWith('/admin')) {
      filePath = path.join(ADMIN_DIR, pathname.replace('/admin', '') || 'index.html');
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
    } else {
      filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
      if (!fs.existsSync(filePath) && pathname === '/') {
        filePath = path.join(__dirname, 'index.html');
      }
    }

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      return fs.createReadStream(filePath).pipe(res);
    }

    // SPA / Index Fallback
    const fallbackPath = pathname.startsWith('/admin') ? path.join(ADMIN_DIR, 'index.html') : path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(fallbackPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(fallbackPath).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');

  } catch (err) {
    console.error('Server Internal Error:', err);
    sendJson(res, 500, { error: 'Internal server error', details: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Climate Action Server running on http://localhost:${PORT}`);
});
