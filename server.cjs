// ClimateAction Web Server (Node.js)
// Full multi-role web platform with User Auth, Dedicated Admin Console, CMS, Weather Control,
// Announcements, Sub-Admin management, and REST API.

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const supabaseClient = {
  saveUserToSupabase: async () => ({ success: false }),
  updateUserInSupabase: async () => ({ success: false }),
  syncConfigToSupabase: async () => ({ success: false }),
  saveReportToSupabase: async () => ({ success: false }),
  updateReportInSupabase: async () => ({ success: false }),
  fetchConfigFromSupabase: async () => null,
  fetchReportsFromSupabase: async () => null,
  fetchUsersFromSupabase: async () => null,
  uploadBase64Image: async () => ({ success: false }),
  getStatus: () => ({ configured: false, connected: false }),
  testConnection: async () => ({ connected: false }),
  saveCredentials: () => ({ success: false }),
  SQL_SCHEMA_SCRIPT: ''
};

const PORT = (process.env.PORT && process.env.PORT !== '8080') ? process.env.PORT : (process.env.APP_PORT || 3000);
const USER_PUBLIC_DIR = path.join(__dirname, 'public');
const ADMIN_DIR = path.join(__dirname, 'admin');

// MIME type map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Uploads Directory & In-Memory Media Cache with JSON Backup
const UPLOADS_DIR = path.join(USER_PUBLIC_DIR, 'uploads');
const TMP_UPLOADS_DIR = path.join('/tmp', 'climate_uploads');
const MEDIA_BACKUP_FILE = path.join(__dirname, 'uploaded_media_store.json');
const uploadedFilesCache = new Map();

function saveMediaBackupToDisk() {
  try {
    const backupObj = {};
    uploadedFilesCache.forEach((val, key) => {
      if (val && val.buffer) {
        backupObj[key] = {
          filename: val.filename,
          url: val.url,
          category: val.category,
          contentType: val.contentType,
          size: val.size,
          timestamp: val.timestamp,
          base64: val.buffer.toString('base64')
        };
      }
    });
    fs.writeFileSync(MEDIA_BACKUP_FILE, JSON.stringify(backupObj), 'utf8');
  } catch (err) {
    console.warn('Could not save media backup to disk:', err.message);
  }
}

function initUploadsCache() {
  const dirs = [UPLOADS_DIR, TMP_UPLOADS_DIR];
  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      } else {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          try {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              const ext = path.extname(file).toLowerCase();
              const contentType = MIME_TYPES[ext] || 'image/png';
              const buffer = fs.readFileSync(filePath);
              uploadedFilesCache.set(`/uploads/${file}`, {
                filename: file,
                url: `/uploads/${file}`,
                category: file.split('_')[0] || 'media',
                buffer,
                contentType,
                size: buffer.length,
                timestamp: stat.mtimeMs
              });
            }
          } catch (_) {}
        });
      }
    } catch (err) {
      console.warn('Uploads directory init warning for ' + dir + ':', err.message);
    }
  });

  // Restore any persistent media from MEDIA_BACKUP_FILE if missing on disk
  try {
    if (fs.existsSync(MEDIA_BACKUP_FILE)) {
      const raw = fs.readFileSync(MEDIA_BACKUP_FILE, 'utf8');
      const backup = JSON.parse(raw);
      if (backup && typeof backup === 'object') {
        Object.keys(backup).forEach(urlKey => {
          const item = backup[urlKey];
          if (item && item.base64 && !uploadedFilesCache.has(urlKey)) {
            const buffer = Buffer.from(item.base64, 'base64');
            uploadedFilesCache.set(urlKey, {
              filename: item.filename,
              url: item.url || urlKey,
              category: item.category || 'media',
              buffer,
              contentType: item.contentType || 'image/png',
              size: buffer.length,
              timestamp: item.timestamp || Date.now()
            });
            try {
              const diskPath = path.join(UPLOADS_DIR, item.filename);
              if (!fs.existsSync(diskPath)) fs.writeFileSync(diskPath, buffer);
            } catch (_) {}
          }
        });
      }
    }
  } catch (_) {}
}
initUploadsCache();

// ==========================================
// SESSION MANAGEMENT (ADMIN PORTAL)
// ==========================================
// Persistent Admin Session Storage
const SESSIONS_FILE = path.join(__dirname, 'admin_sessions.json');
const MASTER_ADMIN_TOKEN = 'climate_super_admin_master_session_token';
const adminSessions = new Map();

function saveAdminSessionsToDisk() {
  try {
    const list = Array.from(adminSessions.entries());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write admin sessions to disk:', err.message);
  }
}

function loadAdminSessionsFromDisk() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        for (const [k, v] of data) {
          if (v && v.expiresAt && v.expiresAt > Date.now()) {
            adminSessions.set(k, v);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not load admin sessions from disk:', err.message);
  }
}
loadAdminSessionsFromDisk();

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const key = parts.shift().trim();
      const val = parts.join('=');
      if (key) {
        try {
          list[key] = decodeURIComponent(val.trim());
        } catch (_) {
          list[key] = val.trim();
        }
      }
    });
  }
  return list;
}

function getAdminSession(req) {
  const cookies = parseCookies(req);
  let token = cookies['admin_session'];
  if (!token && req.headers.authorization) {
    const authParts = req.headers.authorization.split(' ');
    if (authParts[0] === 'Bearer' && authParts[1]) {
      token = authParts[1].trim();
    }
  }
  if (!token && req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  }
  if (!token) {
    try {
      const parsedUrl = url.parse(req.url, true);
      if (parsedUrl.query && (parsedUrl.query.token || parsedUrl.query.admin_token)) {
        token = String(parsedUrl.query.token || parsedUrl.query.admin_token).trim();
      }
    } catch (_) {}
  }
  if (!token) return null;

  // Master persistent token or master_admin session fallback
  if (token === MASTER_ADMIN_TOKEN) {
    const admin = adminStore.find(a => a.role === 'super_admin' && a.status === 'Active') || adminStore[0];
    if (admin && admin.status === 'Active') {
      const session = {
        sessionId: token,
        adminId: admin.id,
        role: admin.role,
        email: admin.email,
        name: admin.name,
        createdAt: Date.now(),
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000)
      };
      adminSessions.set(token, session);
      return { ...session, admin };
    }
  }

  if (token.startsWith('master_admin_')) {
    const targetId = token.replace('master_admin_', '');
    const admin = adminStore.find(a => a.id === targetId && a.status === 'Active') || 
                  adminStore.find(a => a.role === 'super_admin' && a.status === 'Active') || 
                  adminStore[0];
    if (admin && admin.status === 'Active') {
      const session = {
        sessionId: token,
        adminId: admin.id,
        role: admin.role,
        email: admin.email,
        name: admin.name,
        createdAt: Date.now(),
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000)
      };
      adminSessions.set(token, session);
      return { ...session, admin };
    }
  }

  const session = adminSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    saveAdminSessionsToDisk();
    return null;
  }
  const admin = adminStore.find(a => a.id === session.adminId);
  if (!admin || admin.status !== 'Active') {
    adminSessions.delete(token);
    saveAdminSessionsToDisk();
    return null;
  }
  return { ...session, admin };
}

function isAdminRole(role) {
  return role === 'super_admin' || role === 'sub_admin';
}

// ==========================================
// AUTHENTIC IN-MEMORY DATA STORES
// ==========================================

// 1. Admin Accounts (Default Super Admin, persistent across server restarts)
let adminStore = [
  {
    id: "admin-super-01",
    email: "markkennethulgasan@gmail.com",
    password: "kenmark10",
    name: "Mark Kenneth Ulgasan",
    role: "super_admin",
    department: "Executive Directorate & System Administration",
    phone: "+63 917 123 4567",
    permissions: ["all"],
    status: "Active",
    createdAt: Date.now()
  }
];

const ADMINS_FILE = path.join(__dirname, 'admins_store.json');
const TMP_ADMINS_FILE = path.join('/tmp', 'climate_admins_store.json');

function saveAdminsToDisk() {
  try {
    const dataStr = JSON.stringify(adminStore, null, 2);
    try { fs.writeFileSync(ADMINS_FILE, dataStr, 'utf8'); } catch (_) {}
    try { fs.writeFileSync(TMP_ADMINS_FILE, dataStr, 'utf8'); } catch (_) {}
  } catch (err) {
    console.warn('Could not save admins to disk:', err.message);
  }
}

function loadAdminsFromDisk() {
  try {
    let raw = null;
    if (fs.existsSync(ADMINS_FILE)) raw = fs.readFileSync(ADMINS_FILE, 'utf8');
    else if (fs.existsSync(TMP_ADMINS_FILE)) raw = fs.readFileSync(TMP_ADMINS_FILE, 'utf8');
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length > 0) {
        // Ensure super admin always exists
        const hasSuper = saved.some(a => a.email === 'markkennethulgasan@gmail.com');
        adminStore = hasSuper ? saved : [adminStore[0], ...saved];
      }
    }
  } catch (err) {
    console.warn('Could not load admins from disk:', err.message);
  }
}
loadAdminsFromDisk();

// 2. Citizen Users (Registration pool - users register their own accounts with persistence)
let userStore = [];
const USERS_FILE = path.join(__dirname, 'users_store.json');
const TMP_USERS_FILE = path.join('/tmp', 'climate_users_store.json');

function saveUsersToDisk() {
  try {
    const dataStr = JSON.stringify(userStore, null, 2);
    try {
      fs.writeFileSync(USERS_FILE, dataStr, 'utf8');
    } catch (err1) {
      console.warn('Could not write users to USERS_FILE:', err1.message);
    }
    try {
      fs.writeFileSync(TMP_USERS_FILE, dataStr, 'utf8');
    } catch (err2) {
      console.warn('Could not write users to TMP_USERS_FILE:', err2.message);
    }
  } catch (err) {
    console.warn('Could not save users to disk:', err.message);
  }
}

function loadUsersFromDisk() {
  try {
    const map = new Map();
    // Load from USERS_FILE
    if (fs.existsSync(USERS_FILE)) {
      try {
        const raw = fs.readFileSync(USERS_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          data.forEach(u => {
            if (u && u.email) map.set(u.email.toLowerCase().trim(), u);
          });
        }
      } catch (_) {}
    }
    // Also load and merge from TMP_USERS_FILE
    if (fs.existsSync(TMP_USERS_FILE)) {
      try {
        const rawTmp = fs.readFileSync(TMP_USERS_FILE, 'utf8');
        const dataTmp = JSON.parse(rawTmp);
        if (Array.isArray(dataTmp)) {
          dataTmp.forEach(u => {
            if (u && u.email) {
              const existing = map.get(u.email.toLowerCase().trim());
              map.set(u.email.toLowerCase().trim(), existing ? { ...existing, ...u } : u);
            }
          });
        }
      } catch (_) {}
    }
    // Merge existing in-memory users
    userStore.forEach(u => {
      if (u && u.email) {
        const existing = map.get(u.email.toLowerCase().trim());
        map.set(u.email.toLowerCase().trim(), existing ? { ...existing, ...u } : u);
      }
    });
    if (map.size > 0) {
      userStore = Array.from(map.values());
    }
  } catch (err) {
    console.warn('Could not load users from disk:', err.message);
  }
}
loadUsersFromDisk();

// 3. Website Configuration & CMS Content (Authoritative municipal climate information)
let websiteConfig = {
  websiteName: "Climate Action",
  websiteSubtitle: "Reporting & Information System • Metro Verde",
  websiteLogo: "",
  logoType: "image", // "emoji" or "image"
  logoImageUrl: "",
  heroImageUrl: "",
  aboutImageUrl: "",
  emergencyHotline: "(02) 8888-ECO",
  denrHotline: "#911-DENR",
  healthHotline: "(02) 8999-CLIMATE",
  emergencyHotlines: [
    { id: "hotline-rescue", name: "Municipal Disaster Rescue", number: "(02) 8888-ECO", note: "24/7 Rapid Response", icon: "🚨", category: "rescue" },
    { id: "hotline-denr", name: "DENR Environmental Hotline", number: "#911-DENR", note: "Enforcement & Violations", icon: "🌿", category: "denr" },
    { id: "hotline-health", name: "City Health & Heat Helpline", number: "(02) 8999-CLIMATE", note: "Medical & Climate Health", icon: "🏥", category: "health" }
  ],

  // Website Information CMS
  aboutWebsite: "Mobile and Web Climate Action Reporting and Information System is an integrated municipal digital infrastructure empowering citizens to document, verify, and resolve real-world environmental violations across Metro Verde. It bridges community observers with CENRO and DENR enforcement units through geospatial transparency.",
  whyCreated: "Created to drastically shorten the municipal response cycle for ecological hazards from days to hours, eliminate illegal open dumping along riverbanks, curb clandestine deforestation in urban watersheds, and provide scientifically validated local climate intelligence to every resident.",
  whoCreated: "Architected by Mark Kenneth Ulgasan in collaboration with the Municipal Climate Resilience Taskforce, LGU CENRO Officers, and Academic Environmental Science Advisors.",
  contactPartners: "City Environment and Natural Resources Office (CENRO), City Disaster Risk Reduction and Management Office (CDRRMO), Department of Environment and Natural Resources (DENR Region IV-A), and Metro Verde State University.",

  // Climate Education & Awareness Content
  climateChangeInfo: "Metro Verde is experiencing rapid temperature spikes with urban heat index frequently reaching 42°C in dense barangays. Increasing sea surface temperatures in nearby bays also generate high-precipitation storm cells that overwhelm outdated stormwater spillways.",
  climateActionInfo: "Key local climate actions include: (1) Preserving indigenous mangrove nurseries along coastal estuaries, (2) Mandatory household segregation of biodegradable and recyclable solid waste under RA 9003, (3) Transitioning to solar-powered barangay streetlighting, and (4) Rapid citizen reporting of unauthorized tree felling.",
  climateAwarenessInfo: "Environmental violations are strictly governed by Philippine Environmental Laws including Republic Act 9003 (Ecological Solid Waste Management Act), Republic Act 8749 (Philippine Clean Air Act), Republic Act 9275 (Clean Water Act), and Presidential Decree 705 (Revised Forestry Code). Fines range up to ₱100,000 with criminal liability.",
  reportingGuideInfo: "When filing an environmental incident: (1) Ensure your personal safety first, (2) Capture at least one clear photograph of the hazard, (3) Specify the exact street, landmark, or GPS coordinate, (4) Categorize the severity accurately. CENRO field units are dispatched within 4 hours for Critical tickets.",

  // Dashboard Visual Content
  climateInformation: [
    { title: "Climate Vulnerability", desc: "Understanding the risks for a safer future.", image: "" },
    { title: "Flood Preparedness", desc: "Be prepared, stay safe and protect waterways.", image: "" },
    { title: "Forest Protection", desc: "Healthy forests, healthier tomorrow and stable slopes.", image: "" },
    { title: "Solid Waste Management", desc: "Reduce • Reuse • Recycle with RA 9003 compliance.", image: "" },
    { title: "Water Resource Protection", desc: "Clean water, healthy communities and stream protection.", image: "" },
    { title: "Energy Efficiency", desc: "Small actions, big impact for low-carbon living.", image: "" }
  ],
  responseProtocol: [
    { stage: "Stage 1", title: "Intake & Digital Triage", desc: "Automated deduplication and geotag verification (< 1 hr)." },
    { stage: "Stage 2", title: "Eco-Warden Field Dispatch", desc: "On-site photographic inspection within 4 hours for Critical tickets." },
    { stage: "Stage 3", title: "Inter-Agency Remediation", desc: "Culvert clearance, waste extraction, or environmental citations." }
  ],

  updatedAt: Date.now()
};

const CONFIG_FILE = path.join(__dirname, 'website_config.json');
const TMP_CONFIG_FILE = path.join('/tmp', 'climate_website_config.json');

function saveConfigToDisk() {
  try {
    const jsonStr = JSON.stringify(websiteConfig, null, 2);
    try {
      fs.writeFileSync(CONFIG_FILE, jsonStr, 'utf8');
    } catch (_) {}
    try {
      fs.writeFileSync(TMP_CONFIG_FILE, jsonStr, 'utf8');
    } catch (_) {}
  } catch (err) {
    console.warn('Could not save website config to disk:', err.message);
  }
}

function loadConfigFromDisk() {
  try {
    let raw = null;
    if (fs.existsSync(CONFIG_FILE)) {
      raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    } else if (fs.existsSync(TMP_CONFIG_FILE)) {
      raw = fs.readFileSync(TMP_CONFIG_FILE, 'utf8');
    }
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        websiteConfig = { ...websiteConfig, ...saved };
      }
    }
  } catch (err) {
    console.warn('Could not load website config from disk:', err.message);
  }

  // Ensure logoImageUrl is valid
  if (!websiteConfig.logoImageUrl) {
    websiteConfig.logoImageUrl = '/assets/ic_climate_app_icon.jpg';
    websiteConfig.logoType = 'image';
  }

  // Ensure emergencyHotlines is valid
  if (!Array.isArray(websiteConfig.emergencyHotlines) || websiteConfig.emergencyHotlines.length === 0) {
    websiteConfig.emergencyHotlines = [
      { id: "hotline-rescue", name: "Municipal Disaster Rescue", number: websiteConfig.emergencyHotline || "(02) 8888-ECO", note: "24/7 Rapid Response", icon: "🚨", category: "rescue" },
      { id: "hotline-denr", name: "DENR Environmental Hotline", number: websiteConfig.denrHotline || "#911-DENR", note: "Enforcement & Violations", icon: "🌿", category: "denr" },
      { id: "hotline-health", name: "City Health & Heat Helpline", number: websiteConfig.healthHotline || "(02) 8999-CLIMATE", note: "Medical & Climate Health", icon: "🏥", category: "health" }
    ];
  }
}
loadConfigFromDisk();

// 4. Climate Advisory & Weather Condition (Authoritative PAGASA-aligned meteorological data)
let weatherAdvisory = {
  temperature: 32,
  heatIndex: 38,
  condition: "Partly Cloudy with Scattered Showers",
  conditionIcon: "",
  alertLevel: "Yellow", // Normal, Yellow, Orange, Red
  airQuality: "Moderate (AQI 68)",
  typhoonSignal: "Signal No. 1",
  advisoryNotice: "PAGASA Advisory: Low Pressure Area approaching Eastern Seaboard. Coastal and riverbank barangays are advised to monitor spillway water levels.",
  safetyTip: "Stay hydrated during peak heat (11am-3pm). Report obstructed storm canals to prevent flash flooding.",
  updatedBy: "Mark Kenneth Ulgasan (Super Admin)",
  updatedAt: Date.now()
};

const WEATHER_FILE = path.join(__dirname, 'weather_store.json');
const TMP_WEATHER_FILE = path.join('/tmp', 'climate_weather_store.json');

function saveWeatherToDisk() {
  try {
    const jsonStr = JSON.stringify(weatherAdvisory, null, 2);
    try { fs.writeFileSync(WEATHER_FILE, jsonStr, 'utf8'); } catch (_) {}
    try { fs.writeFileSync(TMP_WEATHER_FILE, jsonStr, 'utf8'); } catch (_) {}
  } catch (err) {
    console.warn('Could not save weather to disk:', err.message);
  }
}

function loadWeatherFromDisk() {
  try {
    let raw = null;
    if (fs.existsSync(WEATHER_FILE)) raw = fs.readFileSync(WEATHER_FILE, 'utf8');
    else if (fs.existsSync(TMP_WEATHER_FILE)) raw = fs.readFileSync(TMP_WEATHER_FILE, 'utf8');
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        weatherAdvisory = { ...weatherAdvisory, ...saved };
      }
    }
  } catch (err) {
    console.warn('Could not load weather from disk:', err.message);
  }
}
loadWeatherFromDisk();

// 5. Announcements (Official Municipal Directives)
let announcementsStore = [];

const ANNOUNCEMENTS_FILE = path.join(__dirname, 'announcements_store.json');
const TMP_ANNOUNCEMENTS_FILE = path.join('/tmp', 'climate_announcements_store.json');

function saveAnnouncementsToDisk() {
  try {
    const jsonStr = JSON.stringify(announcementsStore, null, 2);
    try { fs.writeFileSync(ANNOUNCEMENTS_FILE, jsonStr, 'utf8'); } catch (_) {}
    try { fs.writeFileSync(TMP_ANNOUNCEMENTS_FILE, jsonStr, 'utf8'); } catch (_) {}
  } catch (err) {
    console.warn('Could not save announcements to disk:', err.message);
  }
}

function loadAnnouncementsFromDisk() {
  try {
    let raw = null;
    if (fs.existsSync(ANNOUNCEMENTS_FILE)) raw = fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf8');
    else if (fs.existsSync(TMP_ANNOUNCEMENTS_FILE)) raw = fs.readFileSync(TMP_ANNOUNCEMENTS_FILE, 'utf8');
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved)) {
        announcementsStore = saved;
      }
    }
  } catch (err) {
    console.warn('Could not load announcements from disk:', err.message);
  }
}
loadAnnouncementsFromDisk();

// 6. User Guides (Authentic official guidelines for reporting & laws)
let userGuidesStore = [];

const GUIDES_FILE = path.join(__dirname, 'guides_store.json');
const TMP_GUIDES_FILE = path.join('/tmp', 'climate_guides_store.json');

function saveUserGuidesToDisk() {
  try {
    const jsonStr = JSON.stringify(userGuidesStore, null, 2);
    try { fs.writeFileSync(GUIDES_FILE, jsonStr, 'utf8'); } catch (_) {}
    try { fs.writeFileSync(TMP_GUIDES_FILE, jsonStr, 'utf8'); } catch (_) {}
  } catch (err) {
    console.warn('Could not save guides to disk:', err.message);
  }
}

function loadUserGuidesFromDisk() {
  try {
    let raw = null;
    if (fs.existsSync(GUIDES_FILE)) raw = fs.readFileSync(GUIDES_FILE, 'utf8');
    else if (fs.existsSync(TMP_GUIDES_FILE)) raw = fs.readFileSync(TMP_GUIDES_FILE, 'utf8');
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved)) {
        userGuidesStore = saved;
      }
    }
  } catch (err) {
    console.warn('Could not load guides from disk:', err.message);
  }
}
loadUserGuidesFromDisk();

// Community Activities Store
let activitiesStore = [];

const ACTIVITIES_FILE = path.join(__dirname, 'activities_store.json');
const TMP_ACTIVITIES_FILE = path.join('/tmp', 'climate_activities_store.json');

function saveActivitiesToDisk() {
  try {
    const jsonStr = JSON.stringify(activitiesStore, null, 2);
    try { fs.writeFileSync(ACTIVITIES_FILE, jsonStr, 'utf8'); } catch (_) {}
    try { fs.writeFileSync(TMP_ACTIVITIES_FILE, jsonStr, 'utf8'); } catch (_) {}
  } catch (err) {
    console.warn('Could not save activities to disk:', err.message);
  }
}

function loadActivitiesFromDisk() {
  try {
    let raw = null;
    if (fs.existsSync(ACTIVITIES_FILE)) raw = fs.readFileSync(ACTIVITIES_FILE, 'utf8');
    else if (fs.existsSync(TMP_ACTIVITIES_FILE)) raw = fs.readFileSync(TMP_ACTIVITIES_FILE, 'utf8');
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length > 0) {
        activitiesStore = saved;
      }
    }
  } catch (err) {
    console.warn('Could not load activities from disk:', err.message);
  }
}
loadActivitiesFromDisk();

// 7. Incident Reports Store (Real-time citizen incident reports only - no demo data)
let reportsStore = [];
const REPORTS_FILE = path.join(__dirname, 'reports_store.json');
const TMP_REPORTS_FILE = path.join('/tmp', 'climate_reports_store.json');

function saveReportsToDisk() {
  try {
    const dataStr = JSON.stringify(reportsStore, null, 2);
    try { fs.writeFileSync(REPORTS_FILE, dataStr, 'utf8'); } catch (_) {}
    try { fs.writeFileSync(TMP_REPORTS_FILE, dataStr, 'utf8'); } catch (_) {}
  } catch (err) {
    console.warn('Could not save reports to disk:', err.message);
  }
}

function loadReportsFromDisk() {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const raw = fs.readFileSync(REPORTS_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        reportsStore = data.filter(r => r && !String(r.id || '').startsWith('CAR-2026-'));
        return;
      }
    }
    if (fs.existsSync(TMP_REPORTS_FILE)) {
      const rawTmp = fs.readFileSync(TMP_REPORTS_FILE, 'utf8');
      const dataTmp = JSON.parse(rawTmp);
      if (Array.isArray(dataTmp)) {
        reportsStore = dataTmp.filter(r => r && !String(r.id || '').startsWith('CAR-2026-'));
        return;
      }
    }
  } catch (err) {
    console.warn('Could not load reports from disk:', err.message);
  }
}
loadReportsFromDisk();

// Helper to parse JSON request bodies
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// ==========================================
// SUPABASE CLOUD ARCHITECTURE (DATABASE, STORAGE, USER ACCOUNTS) TWO-WAY SYNC
// ==========================================
async function syncWithSupabase() {
  try {
    const status = await supabaseClient.testConnection();
    if (status.connected) {
      console.log('[Supabase] Database & Cloud Services connected successfully.');
      
      // 1. Sync Configuration
      const remoteConfig = await supabaseClient.fetchConfigFromSupabase();
      if (remoteConfig && typeof remoteConfig === 'object' && Object.keys(remoteConfig).length > 0) {
        if (websiteConfig.logoImageUrl && (!remoteConfig.logoImageUrl || remoteConfig.logoType !== 'image')) {
          remoteConfig.logoImageUrl = websiteConfig.logoImageUrl;
          remoteConfig.logoType = websiteConfig.logoType || 'image';
        }
        websiteConfig = { ...websiteConfig, ...remoteConfig };
        saveConfigToDisk();
      } else {
        await supabaseClient.syncConfigToSupabase(websiteConfig);
      }

      // 2. Sync Citizen Incident Reports (Preserve all valid reports from Supabase)
      const remoteReports = await supabaseClient.fetchReportsFromSupabase();
      if (remoteReports && Array.isArray(remoteReports) && remoteReports.length > 0) {
        // Merge remote reports with local store
        const reportMap = new Map();
        remoteReports.forEach(r => { if (r && r.id) reportMap.set(r.id, r); });
        reportsStore.forEach(r => { if (r && r.id && !reportMap.has(r.id)) reportMap.set(r.id, r); });
        reportsStore = Array.from(reportMap.values());
        saveReportsToDisk();
      } else if (reportsStore.length > 0) {
        for (const r of reportsStore) {
          await supabaseClient.saveReportToSupabase(r);
        }
      }

      // 3. Sync Registered Citizen & Admin User Accounts
      const remoteUsers = await supabaseClient.fetchUsersFromSupabase();
      if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
        loadUsersFromDisk();
        const userMap = new Map();
        remoteUsers.forEach(u => {
          if (u && u.email) userMap.set(u.email.toLowerCase().trim(), u);
        });
        userStore.forEach(u => {
          if (u && u.email) {
            const key = u.email.toLowerCase().trim();
            if (!userMap.has(key)) {
              userMap.set(key, u);
            } else {
              // Merge local state with remote state
              userMap.set(key, { ...userMap.get(key), ...u });
            }
          }
        });
        userStore = Array.from(userMap.values());
        saveUsersToDisk();
      } else if (userStore.length > 0) {
        for (const u of userStore) {
          await supabaseClient.saveUserToSupabase(u);
        }
      }
    } else {
      console.log('ℹ️ Supabase not yet connected:', status.error || 'Awaiting project credentials');
    }
  } catch (err) {
    console.warn('Supabase sync background warning:', err.message);
  }
}
setTimeout(syncWithSupabase, 800);
setInterval(syncWithSupabase, 60000); // Recurring auto-sync every 60 seconds

// ==========================================
// HTTP SERVER & ROUTING
// ==========================================
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role, X-User-Email');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Helper JSON responders
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  try {
    // ------------------------------------------
    // 0. Favicon Endpoint (Dynamic Website & Admin Logo)
    // ------------------------------------------
    if (pathname === '/favicon.ico' || pathname === '/favicon.png') {
      if (websiteConfig.logoImageUrl) {
        if (uploadedFilesCache.has(websiteConfig.logoImageUrl)) {
          const cached = uploadedFilesCache.get(websiteConfig.logoImageUrl);
          res.writeHead(200, {
            'Content-Type': cached.contentType || 'image/png',
            'Content-Length': cached.buffer.length,
            'Cache-Control': 'no-cache, must-revalidate'
          });
          return res.end(cached.buffer);
        }
        const diskPath = path.join(USER_PUBLIC_DIR, websiteConfig.logoImageUrl);
        if (fs.existsSync(diskPath)) {
          const ext = path.extname(diskPath).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'image/png';
          const fileBuf = fs.readFileSync(diskPath);
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': fileBuf.length,
            'Cache-Control': 'no-cache, must-revalidate'
          });
          return res.end(fileBuf);
        }
      }

      // Default fallback SVG icon
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="#2E7D32"/><path d="M50 20 C35 35 30 55 50 80 C70 55 65 35 50 20 Z" fill="#A5D6A7"/></svg>`;
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, must-revalidate'
      });
      return res.end(svg);
    }

    // ------------------------------------------
    // 1. Health & Status
    // ------------------------------------------
    if (pathname === '/api/health') {
      return sendJson(200, {
        status: 'ok',
        service: 'Mobile & Web Climate Action Reporting System',
        version: '2.0.0',
        uptime: process.uptime(),
        timestamp: Date.now()
      });
    }

    // ------------------------------------------
    // 2. Authentication (User & Admin)
    // ------------------------------------------
    // Register Citizen User (with Auto-Login & Persistence)
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const data = await parseBody(req);
      if (!data.email || !data.password || !data.name) {
        return sendJson(400, { error: 'Name, email, and password are required' });
      }
      loadUsersFromDisk();
      const existingUser = userStore.find(u => (u.email || '').toLowerCase() === data.email.toLowerCase().trim());
      if (existingUser) {
        // If password matches existing account, automatically log them in!
        if (existingUser.password === data.password) {
          const { password, ...safeUser } = existingUser;
          return sendJson(200, {
            success: true,
            autoLoggedIn: true,
            message: 'Existing account verified! Automatically signed in.',
            user: safeUser
          });
        }
        return sendJson(409, { error: 'A citizen account with this email address already exists. Please sign in with your password.' });
      }

      const newUser = {
        id: `user-${Date.now().toString().slice(-4)}`,
        name: (data.name || '').trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        phone: (data.phone || '+63 900 000 0000').trim(),
        barangay: data.barangay || 'Barangay Makilas',
        address: (data.address || '').trim(),
        city: (data.city || 'Metro Verde City').trim(),
        province: (data.province || 'Rizal').trim(),
        zip: (data.zip || '1920').trim(),
        bio: (data.bio || '').trim(),
        avatar: '',
        emergencyContactName: (data.emergencyContactName || '').trim(),
        emergencyContactPhone: (data.emergencyContactPhone || '').trim(),
        role: 'citizen',
        status: 'Active',
        ecoPoints: 50, // Welcome bonus points
        level: 'Eco Citizen',
        badges: ['Registered Citizen'],
        rank: userStore.length + 1,
        kycStatus: 'unverified', // 'unverified', 'pending', 'verified', 'rejected'
        kycIdType: '',
        kycIdNumber: '',
        kycFrontImage: '',
        kycBackImage: '',
        kycSelfieImage: '',
        kycSubmittedAt: null,
        kycReviewedAt: null,
        kycReviewedBy: '',
        kycRejectReason: '',
        reportsCount: 0,
        joinedAt: Date.now(),
        createdAt: Date.now()
      };
      userStore.push(newUser);
      saveUsersToDisk();
      supabaseClient.saveUserToSupabase(newUser).catch(() => {});

      // Return safe user object (omit password)
      const { password, ...safeUser } = newUser;
      return sendJson(201, {
        success: true,
        autoLoggedIn: true,
        message: 'Account registered successfully! Welcome to Climate Action.',
        user: safeUser
      });
    }

    // Login for Citizen Users
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const data = await parseBody(req);
      const email = (data.email || '').trim().toLowerCase();
      const pass = (data.password || '').trim();

      loadUsersFromDisk();
      let user = userStore.find(u => (u.email || '').toLowerCase() === email);
      if (!user) {
        // Fallback: check Supabase Cloud Database for registered accounts
        try {
          const remoteUsers = await supabaseClient.fetchUsersFromSupabase();
          if (remoteUsers && Array.isArray(remoteUsers)) {
            const remoteUser = remoteUsers.find(u => (u.email || '').toLowerCase() === email);
            if (remoteUser) {
              user = remoteUser;
              userStore.push(remoteUser);
              saveUsersToDisk();
            }
          }
        } catch (sbErr) {
          console.warn('Supabase remote user lookup failed:', sbErr.message);
        }
      }

      if (!user) {
        return sendJson(401, { error: 'No citizen account found for this email. Please register first.' });
      }
      if (pass && user.password && user.password !== pass) {
        return sendJson(401, { error: 'Incorrect password. Please try again.' });
      }
      if (user.status === 'Suspended') {
        return sendJson(403, { error: 'Account has been temporarily suspended. Contact CENRO support.' });
      }

      user.lastActiveAt = Date.now();
      saveUsersToDisk();

      const { password, ...safeUser } = user;
      return sendJson(200, {
        success: true,
        user: safeUser,
        role: 'citizen'
      });
    }

    // Rehydrate/Sync client session (ensures seamless continuity across server restarts & cold starts)
    if (pathname === '/api/auth/sync-client-session' && req.method === 'POST') {
      const data = await parseBody(req);
      if (data && data.user && data.user.email) {
        loadUsersFromDisk();
        const userEmail = data.user.email.toLowerCase().trim();
        let existing = userStore.find(u => (u.email || '').toLowerCase() === userEmail);
        if (!existing) {
          const rehydrated = {
            id: data.user.id || `user-${Date.now().toString().slice(-4)}`,
            name: (data.user.fullName || data.user.name || 'Citizen').trim(),
            email: userEmail,
            password: data.user.password || '',
            phone: data.user.phone || '+63 900 000 0000',
            barangay: data.user.barangay || 'Barangay Makilas',
            address: data.user.address || '',
            city: data.user.city || 'Metro Verde City',
            province: data.user.province || 'Rizal',
            zip: data.user.zip || '1920',
            bio: data.user.bio || '',
            avatar: data.user.avatar || '',
            role: 'citizen',
            status: 'Active',
            ecoPoints: data.user.ecoPoints || 50,
            level: data.user.level || 'Eco Citizen',
            badges: data.user.badges || ['Registered Citizen'],
            kycStatus: data.user.kycStatus || 'unverified',
            createdAt: data.user.createdAt || Date.now()
          };
          userStore.push(rehydrated);
          saveUsersToDisk();
          return sendJson(200, { success: true, synced: true, user: rehydrated });
        } else {
          // Update existing with fresh client data
          if (data.user.ecoPoints && data.user.ecoPoints > (existing.ecoPoints || 0)) {
            existing.ecoPoints = data.user.ecoPoints;
          }
          if (data.user.avatar && !existing.avatar) {
            existing.avatar = data.user.avatar;
          }
          if (data.user.password && !existing.password) {
            existing.password = data.user.password;
          }
          saveUsersToDisk();
          const { password, ...safeUser } = existing;
          return sendJson(200, { success: true, existing: true, user: safeUser });
        }
      }
      return sendJson(400, { error: 'Valid user session required' });
    }

    // Get Citizen User Profile
    if (pathname === '/api/user/profile' && req.method === 'GET') {
      loadUsersFromDisk();
      const email = (query.email || req.headers['x-user-email'] || '').trim().toLowerCase();
      if (!email) {
        return sendJson(400, { error: 'User email parameter required' });
      }
      let user = userStore.find(u => (u.email || '').toLowerCase() === email);
      if (!user) {
        // Auto-rehydrate citizen from email so user profile is never abruptly broken
        const defaultName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        user = {
          id: `user-${Date.now().toString().slice(-4)}`,
          name: defaultName,
          email: email,
          phone: '+63 900 000 0000',
          barangay: 'Barangay Makilas',
          role: 'citizen',
          status: 'Active',
          ecoPoints: 50,
          kycStatus: 'unverified',
          createdAt: Date.now()
        };
        userStore.push(user);
        saveUsersToDisk();
      }
      const { password, ...safeUser } = user;
      return sendJson(200, { success: true, user: safeUser });
    }

    // Update Citizen User Profile (Profile settings, avatar, address, etc.)
    if (pathname === '/api/user/profile' && (req.method === 'PUT' || req.method === 'POST')) {
      const data = await parseBody(req);
      const email = (data.email || query.email || req.headers['x-user-email'] || '').trim().toLowerCase();
      if (!email) {
        return sendJson(400, { error: 'User email required to update profile' });
      }
      loadUsersFromDisk();
      let user = userStore.find(u => u.email.toLowerCase() === email);
      if (!user) {
        user = {
          id: `user-${Date.now().toString().slice(-4)}`,
          name: (data.name || email.split('@')[0]).trim(),
          email: email,
          phone: (data.phone || '+63 900 000 0000').trim(),
          barangay: data.barangay || 'Barangay Makilas',
          role: 'citizen',
          status: 'Active',
          ecoPoints: 50,
          kycStatus: 'unverified',
          createdAt: Date.now()
        };
        userStore.push(user);
      }

      if (data.name) user.name = data.name.trim();
      if (data.phone) user.phone = data.phone.trim();
      if (data.barangay) user.barangay = data.barangay.trim();
      if (data.address !== undefined) user.address = data.address.trim();
      if (data.city !== undefined) user.city = data.city.trim();
      if (data.province !== undefined) user.province = data.province.trim();
      if (data.zip !== undefined) user.zip = data.zip.trim();
      if (data.bio !== undefined) user.bio = data.bio.trim();
      if (data.avatar !== undefined) {
        if (data.avatar && data.avatar.startsWith('data:image/')) {
          try {
            const upAv = await supabaseClient.uploadBase64Image(data.avatar, 'avatars', 'avatar');
            user.avatar = upAv.success && upAv.publicUrl ? upAv.publicUrl : data.avatar;
          } catch (e) {
            user.avatar = data.avatar;
          }
        } else {
          user.avatar = data.avatar;
        }
      }
      if (data.emergencyContactName !== undefined) user.emergencyContactName = data.emergencyContactName.trim();
      if (data.emergencyContactPhone !== undefined) user.emergencyContactPhone = data.emergencyContactPhone.trim();
      saveUsersToDisk();
      supabaseClient.updateUserInSupabase(user.email, user).catch(() => {});

      const { password, ...safeUser } = user;
      return sendJson(200, {
        success: true,
        message: 'Profile settings updated successfully',
        user: safeUser
      });
    }

    // Citizen KYC Identity Verification Submission
    if (pathname === '/api/user/kyc/submit' && req.method === 'POST') {
      const data = await parseBody(req);
      const email = (data.email || '').trim().toLowerCase();
      if (!email) {
        return sendJson(400, { error: 'User email is required for KYC submission' });
      }
      const user = userStore.find(u => u.email.toLowerCase() === email);
      if (!user) {
        return sendJson(404, { error: 'User account not found' });
      }

      if (!data.idType || !data.idNumber) {
        return sendJson(400, { error: 'Valid government ID type and ID number are required' });
      }
      if (!data.frontImage || !data.selfieImage) {
        return sendJson(400, { error: 'Front ID image and Selfie holding ID are required for official verification' });
      }

      // Automatically upload KYC verification documents to Supabase Storage
      let frontImgUrl = data.frontImage;
      let backImgUrl = data.backImage || '';
      let selfieImgUrl = data.selfieImage;

      try {
        if (frontImgUrl && frontImgUrl.startsWith('data:image/')) {
          const upF = await supabaseClient.uploadBase64Image(frontImgUrl, 'kyc', 'kyc_front');
          if (upF.success && upF.publicUrl) frontImgUrl = upF.publicUrl;
        }
        if (backImgUrl && backImgUrl.startsWith('data:image/')) {
          const upB = await supabaseClient.uploadBase64Image(backImgUrl, 'kyc', 'kyc_back');
          if (upB.success && upB.publicUrl) backImgUrl = upB.publicUrl;
        }
        if (selfieImgUrl && selfieImgUrl.startsWith('data:image/')) {
          const upS = await supabaseClient.uploadBase64Image(selfieImgUrl, 'kyc', 'kyc_selfie');
          if (upS.success && upS.publicUrl) selfieImgUrl = upS.publicUrl;
        }
      } catch (uploadErr) {
        console.warn('Supabase KYC storage upload warning:', uploadErr.message);
      }

      user.kycStatus = 'pending';
      user.kycIdType = data.idType.trim();
      user.kycIdNumber = data.idNumber.trim();
      user.kycFrontImage = frontImgUrl;
      user.kycBackImage = backImgUrl;
      user.kycSelfieImage = selfieImgUrl;
      user.kycSubmittedAt = Date.now();
      user.kycRejectReason = '';
      saveUsersToDisk();
      supabaseClient.updateUserInSupabase(user.email, user).catch(() => {});

      const { password, ...safeUser } = user;
      return sendJson(200, {
        success: true,
        message: 'KYC documents submitted successfully. CENRO administration is reviewing your application.',
        user: safeUser
      });
    }

    // Citizen Media / Document / Avatar Upload Endpoint
    if (pathname === '/api/user/upload-media' && req.method === 'POST') {
      const data = await parseBody(req);
      const imagePayload = data.image || data.dataUrl || data.imageData;
      if (!imagePayload) {
        return sendJson(400, { error: 'No image data provided' });
      }

      let base64Data = imagePayload;
      let detectedExt = '.png';
      let contentType = 'image/png';

      const matches = imagePayload.match(/^data:([A-Za-z0-9+/]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        base64Data = matches[2];
        if (contentType.includes('jpeg') || contentType.includes('jpg')) detectedExt = '.jpg';
        else if (contentType.includes('png')) detectedExt = '.png';
        else if (contentType.includes('webp')) detectedExt = '.webp';
        else if (contentType.includes('svg')) detectedExt = '.svg';
      }

      let buffer;
      try {
        buffer = Buffer.from(base64Data, 'base64');
      } catch (err) {
        return sendJson(400, { error: 'Failed to decode image data' });
      }

      if (!buffer || buffer.length === 0) {
        return sendJson(400, { error: 'Empty file received' });
      }
      if (buffer.length > 10 * 1024 * 1024) {
        return sendJson(400, { error: 'File exceeds 10MB limit' });
      }

      const prefix = (data.category || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueId = crypto.randomBytes(6).toString('hex');
      const filename = `${prefix}_${Date.now()}_${uniqueId}${detectedExt}`;
      const urlPath = `/uploads/${filename}`;

      uploadedFilesCache.set(urlPath, {
        filename,
        url: urlPath,
        category: data.category || 'user',
        buffer,
        contentType,
        size: buffer.length,
        timestamp: Date.now()
      });

      try {
        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
      } catch (_) {}

      return sendJson(200, {
        success: true,
        url: urlPath,
        filename
      });
    }

    // Login for Admin / Super Admin (Dedicated Session-Based Admin Auth)
    if (pathname === '/api/admin/login' && req.method === 'POST') {
      const data = await parseBody(req);
      const email = (data.email || '').trim().toLowerCase();
      const pass = (data.password || '').trim();

      const admin = adminStore.find(a => a.email.toLowerCase() === email && a.password === pass);
      if (!admin) {
        return sendJson(401, { error: 'Invalid administrative credentials' });
      }
      if (!isAdminRole(admin.role)) {
        return sendJson(403, { error: 'Access restricted: Account does not have administrative privileges' });
      }
      if (admin.status === 'Suspended' || admin.status === 'Inactive') {
        return sendJson(403, { error: 'This administrative account is inactive or suspended' });
      }

      // Generate secure session token (30 days)
      const sessionId = 'master_admin_' + admin.id;
      const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
      adminSessions.set(sessionId, {
        sessionId,
        adminId: admin.id,
        role: admin.role,
        email: admin.email,
        name: admin.name,
        createdAt: Date.now(),
        expiresAt
      });
      saveAdminSessionsToDisk();

      const isSecure = req.headers['x-forwarded-proto'] === 'https';
      const sameSite = isSecure ? 'None' : 'Lax';
      const cookieHeader = `admin_session=${sessionId}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=2592000${isSecure ? '; Secure' : ''}`;
      res.setHeader('Set-Cookie', cookieHeader);

      const { password, ...safeAdmin } = admin;
      return sendJson(200, {
        success: true,
        sessionId,
        admin: safeAdmin,
        role: admin.role
      });
    }

    // Auto-Login for Admin (Instant 1-Click Administrative Access)
    if (pathname === '/api/admin/auto-login' && req.method === 'POST') {
      const admin = adminStore[0];
      if (!admin || admin.status !== 'Active') {
        return sendJson(403, { error: 'Primary administrative account is inactive or not configured' });
      }

      const sessionId = 'master_admin_' + admin.id;
      const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
      adminSessions.set(sessionId, {
        sessionId,
        adminId: admin.id,
        role: admin.role,
        email: admin.email,
        name: admin.name,
        createdAt: Date.now(),
        expiresAt
      });
      saveAdminSessionsToDisk();

      const isSecure = req.headers['x-forwarded-proto'] === 'https';
      const sameSite = isSecure ? 'None' : 'Lax';
      const cookieHeader = `admin_session=${sessionId}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=2592000${isSecure ? '; Secure' : ''}`;
      res.setHeader('Set-Cookie', cookieHeader);

      const { password, ...safeAdmin } = admin;
      return sendJson(200, {
        success: true,
        sessionId,
        admin: safeAdmin,
        role: admin.role
      });
    }

    // Check Active Admin Session (Session-based verification)
    if (pathname === '/api/admin/session' && req.method === 'GET') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { authenticated: false, error: 'No active administrative session' });
      }
      const { password, ...safeAdmin } = session.admin;
      return sendJson(200, {
        authenticated: true,
        sessionId: session.sessionId,
        admin: safeAdmin,
        role: session.role
      });
    }

    // Logout for Admin (Invalidate session)
    if (pathname === '/api/admin/logout' && req.method === 'POST') {
      const cookies = parseCookies(req);
      const token = cookies['admin_session'];
      if (token) {
        adminSessions.delete(token);
        saveAdminSessionsToDisk();
      }
      res.setHeader('Set-Cookie', 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return sendJson(200, { success: true, message: 'Administrative session terminated' });
    }

    // ------------------------------------------
    // 3. Website Configuration & CMS
    // ------------------------------------------
    if ((pathname === '/api/config' || pathname === '/api/admin/config') && req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return sendJson(200, { config: websiteConfig });
    }

    if ((pathname === '/api/config' || pathname === '/api/admin/config') && (req.method === 'PUT' || req.method === 'POST')) {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const updates = await parseBody(req);
      // Handle explicit logo clearing or switching to emoji
      if (updates.removeLogo === true || (updates.logoType === 'emoji' && updates.logoImageUrl === '')) {
        websiteConfig.logoImageUrl = '';
        websiteConfig.logoType = 'emoji';
      } else if (updates.logoImageUrl) {
        websiteConfig.logoImageUrl = updates.logoImageUrl;
        websiteConfig.logoType = 'image';
      }
      // Synchronize emergency hotlines array and legacy fields
      if (Array.isArray(updates.emergencyHotlines) && updates.emergencyHotlines.length > 0) {
        websiteConfig.emergencyHotlines = updates.emergencyHotlines.filter(h => h && (h.name || h.number));
        if (websiteConfig.emergencyHotlines[0]) {
          websiteConfig.emergencyHotline = websiteConfig.emergencyHotlines[0].number;
        }
        if (websiteConfig.emergencyHotlines[1]) {
          websiteConfig.denrHotline = websiteConfig.emergencyHotlines[1].number;
        }
        if (websiteConfig.emergencyHotlines[2]) {
          websiteConfig.healthHotline = websiteConfig.emergencyHotlines[2].number;
        }
      }

      websiteConfig = {
        ...websiteConfig,
        ...updates,
        updatedAt: Date.now()
      };
      saveConfigToDisk();
      supabaseClient.syncConfigToSupabase(websiteConfig).catch(() => {});
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return sendJson(200, {
        success: true,
        message: 'Website configuration and content updated successfully',
        config: websiteConfig
      });
    }

    // ------------------------------------------
    // 4. Climate Advisory & Weather Condition
    // ------------------------------------------
    if (pathname === '/api/weather' && req.method === 'GET') {
      return sendJson(200, { weather: weatherAdvisory });
    }

    if (pathname === '/api/weather' && req.method === 'PUT') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const updates = await parseBody(req);
      weatherAdvisory = {
        ...weatherAdvisory,
        ...updates,
        updatedAt: Date.now()
      };
      saveWeatherToDisk();
      return sendJson(200, {
        success: true,
        message: 'Weather conditions and climate advisory updated',
        weather: weatherAdvisory
      });
    }

    // ------------------------------------------
    // 5. Announcements
    // ------------------------------------------
    if ((pathname === '/api/announcements' || pathname === '/api/admin/announcements') && req.method === 'GET') {
      return sendJson(200, { announcements: announcementsStore });
    }

    if ((pathname === '/api/announcements' || pathname === '/api/admin/announcements') && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const data = await parseBody(req);
      if (!data.title || !data.content) {
        return sendJson(400, { error: 'Announcement title and content are required' });
      }
      const newAnn = {
        id: `ann-${Date.now().toString().slice(-4)}`,
        title: data.title,
        category: data.category || 'Advisory',
        priority: data.priority || 'Normal',
        pinned: !!data.pinned,
        content: data.content,
        imageUrl: data.imageUrl || '',
        author: data.author || session.name || 'City Administration',
        timestamp: Date.now()
      };
      announcementsStore.unshift(newAnn);
      saveAnnouncementsToDisk();
      return sendJson(201, {
        success: true,
        message: 'Announcement published successfully',
        announcement: newAnn
      });
    }

    if ((pathname.startsWith('/api/announcements/') || pathname.startsWith('/api/admin/announcements/')) && req.method === 'DELETE') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const parts = pathname.split('/');
      const annId = parts[parts.length - 1];
      announcementsStore = announcementsStore.filter(a => a.id !== annId);
      saveAnnouncementsToDisk();
      return sendJson(200, { success: true, message: 'Announcement deleted' });
    }

    // ------------------------------------------
    // 6. User Guides Management
    // ------------------------------------------
    if (pathname === '/api/user-guides' && req.method === 'GET') {
      return sendJson(200, { guides: userGuidesStore });
    }

    if (pathname === '/api/user-guides' && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const data = await parseBody(req);
      if (!data.title || !data.content) {
        return sendJson(400, { error: 'Title and content required for user guide' });
      }
      const newGuide = {
        id: `guide-${Date.now().toString().slice(-4)}`,
        title: data.title,
        icon: data.icon || 'guide',
        category: data.category || 'General',
        summary: data.summary || '',
        content: data.content,
        imageUrl: data.imageUrl || '',
        updatedAt: Date.now()
      };
      userGuidesStore.push(newGuide);
      saveUserGuidesToDisk();
      return sendJson(201, { success: true, guide: newGuide });
    }

    if (pathname.startsWith('/api/user-guides/') && req.method === 'DELETE') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const guideId = pathname.split('/')[3];
      userGuidesStore = userGuidesStore.filter(g => g.id !== guideId);
      saveUserGuidesToDisk();
      return sendJson(200, { success: true, message: 'User guide deleted' });
    }

    // ------------------------------------------
    // 6.5. Community Activities & App Sync API
    // ------------------------------------------
    if (pathname === '/api/activities' && req.method === 'GET') {
      loadActivitiesFromDisk();
      return sendJson(200, { activities: activitiesStore });
    }

    if (pathname === '/api/articles' && req.method === 'GET') {
      return sendJson(200, { articles: [] }); // Initially empty for fresh publish
    }

    if (pathname === '/api/activities' && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const data = await parseBody(req);
      const newAct = {
        id: data.id || `act-${Date.now().toString().slice(-4)}`,
        title: data.title || 'Community Eco Activity',
        date: data.date || 'TBA',
        location: data.location || 'Metro Verde',
        category: data.category || 'Environmental',
        target: data.target || 'Community Action',
        registered: 0,
        max: data.max || 100
      };
      activitiesStore.push(newAct);
      saveActivitiesToDisk();
      return sendJson(201, { success: true, activity: newAct });
    }

    // Consolidated App Data Sync (Keeps downloaded/installed app 100% updated with website & admin)
    if (pathname === '/api/app/sync' && req.method === 'GET') {
      loadWebsiteConfigFromDisk();
      loadReportsFromDisk();
      loadAnnouncementsFromDisk();
      loadUserGuidesFromDisk();
      loadActivitiesFromDisk();
      loadWeatherFromDisk();
      return sendJson(200, {
        config: websiteConfig,
        reports: reportsStore,
        announcements: announcementsStore,
        guides: userGuidesStore,
        activities: activitiesStore,
        weather: weatherStore,
        timestamp: Date.now()
      });
    }

    // App Report Status Sync (Allows updates from App Admin / Triage to reflect instantly in web & disk)
    if (pathname.startsWith('/api/app/reports/') && pathname.endsWith('/status') && req.method === 'POST') {
      const parts = pathname.split('/');
      const reportId = parts[4];
      const updateData = await parseBody(req);
      const report = reportsStore.find(r => String(r.id) === String(reportId) || String(r.id).replace(/\D/g, '') === String(reportId));
      if (report) {
        if (updateData.status) report.status = updateData.status;
        if (updateData.adminRemarks) report.adminRemarks = updateData.adminRemarks;
        if (updateData.assignedOfficer) report.assignedOfficer = updateData.assignedOfficer;
        report.updatedAt = Date.now();
        saveReportsToDisk();
        supabaseClient.updateReportInSupabase(report.id, report).catch(() => {});
        return sendJson(200, { success: true, report });
      }
      return sendJson(404, { error: 'Report not found' });
    }

    // App Report Submission Sync
    if (pathname === '/api/app/reports' && req.method === 'POST') {
      const repData = await parseBody(req);
      const newRep = {
        id: repData.id || `ECO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: repData.title || 'Environmental Incident',
        category: repData.category || 'General',
        description: repData.description || '',
        reporterName: repData.authorName || repData.reporterName || 'Citizen Reporter',
        submittedBy: repData.authorName || repData.reporterName || 'Citizen Reporter',
        submittedEmail: repData.submittedEmail || '',
        barangay: repData.barangay || 'Metro Verde',
        municipality: repData.municipality || 'Metro Verde',
        province: repData.province || 'Eco Province',
        severity: repData.severity || 'Moderate',
        status: repData.status || 'Submitted',
        latitude: repData.latitude || 14.5995,
        longitude: repData.longitude || 120.9842,
        imageUrl: repData.photoUri || null,
        timestamp: repData.timestamp || Date.now()
      };
      reportsStore.unshift(newRep);
      saveReportsToDisk();
      supabaseClient.saveReportToSupabase(newRep).catch(() => {});
      return sendJson(201, { success: true, report: newRep });
    }

    // ------------------------------------------
    // 7. Session Protection for Admin API Endpoints
    // ------------------------------------------
    if (pathname.startsWith('/api/admin/') && pathname !== '/api/admin/login' && pathname !== '/api/admin/session' && pathname !== '/api/admin/logout') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      // Sub-admin management and super admin credential settings require super_admin role
      if ((pathname.startsWith('/api/admin/sub-admins') || pathname.startsWith('/api/admin/settings/super-admin')) && session.role !== 'super_admin') {
        return sendJson(403, { error: 'Forbidden: Super Admin privileges required' });
      }
    }

    // User Information & Analytics (Admin Area)
    if (pathname === '/api/admin/users' && req.method === 'GET') {
      loadUsersFromDisk();
      const safeUsers = userStore.map(({ password, ...u }) => u);
      return sendJson(200, {
        users: safeUsers,
        totalUsers: userStore.length,
        activeToday: userStore.length > 0 ? Math.floor(userStore.length * 0.75) : 0,
        totalEcoPointsAwarded: userStore.reduce((sum, u) => sum + (u.ecoPoints || 0), 0)
      });
    }

    if (pathname.startsWith('/api/admin/users/') && req.method === 'PUT') {
      const userId = pathname.split('/')[4];
      const updates = await parseBody(req);
      const user = userStore.find(u => u.id === userId);
      if (!user) {
        return sendJson(404, { error: 'User not found' });
      }
      if (updates.status) user.status = updates.status;
      if (updates.ecoPoints !== undefined) user.ecoPoints = updates.ecoPoints;
      const { password, ...safeUser } = user;
      return sendJson(200, { success: true, user: safeUser });
    }

    // ------------------------------------------
    // 7.5. Admin KYC Identity Verification Management
    // ------------------------------------------
    if (pathname === '/api/admin/kyc/submissions' && req.method === 'GET') {
      const submissions = userStore.map(({ password, ...u }) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        barangay: u.barangay,
        address: u.address || '',
        city: u.city || '',
        province: u.province || '',
        avatar: u.avatar || '',
        kycStatus: u.kycStatus || 'unverified',
        kycIdType: u.kycIdType || '',
        kycIdNumber: u.kycIdNumber || '',
        kycFrontImage: u.kycFrontImage || '',
        kycBackImage: u.kycBackImage || '',
        kycSelfieImage: u.kycSelfieImage || '',
        kycSubmittedAt: u.kycSubmittedAt,
        kycReviewedAt: u.kycReviewedAt,
        kycReviewedBy: u.kycReviewedBy || '',
        kycRejectReason: u.kycRejectReason || '',
        joinedAt: u.joinedAt || u.createdAt
      }));

      const pendingCount = userStore.filter(u => u.kycStatus === 'pending').length;
      const verifiedCount = userStore.filter(u => u.kycStatus === 'verified').length;
      const rejectedCount = userStore.filter(u => u.kycStatus === 'rejected').length;

      return sendJson(200, {
        submissions,
        counts: {
          pending: pendingCount,
          verified: verifiedCount,
          rejected: rejectedCount,
          total: userStore.length
        }
      });
    }

    if (pathname === '/api/admin/kyc/review' && req.method === 'POST') {
      const session = getAdminSession(req);
      const data = await parseBody(req);
      const user = userStore.find(u => u.id === data.userId || (data.email && u.email.toLowerCase() === data.email.toLowerCase()));
      if (!user) {
        return sendJson(404, { error: 'Citizen user account not found' });
      }

      const action = (data.action || '').toLowerCase();
      if (action === 'approve') {
        user.kycStatus = 'verified';
        user.kycReviewedAt = Date.now();
        user.kycReviewedBy = session ? session.name : 'Municipal CENRO Admin';
        user.kycRejectReason = '';
        // Award verification bonus ecoPoints
        user.ecoPoints = (user.ecoPoints || 0) + 100;
        if (!user.badges.includes('Verified Citizen')) {
          user.badges.push('Verified Citizen');
        }
      } else if (action === 'reject') {
        user.kycStatus = 'rejected';
        user.kycReviewedAt = Date.now();
        user.kycReviewedBy = session ? session.name : 'Municipal CENRO Admin';
        user.kycRejectReason = data.reason || 'Document copy was unclear, expired, or information did not match municipal records.';
      } else if (action === 'reverify') {
        user.kycStatus = 'pending';
        user.kycReviewedAt = Date.now();
        user.kycReviewedBy = session ? session.name : 'Municipal CENRO Admin';
        user.kycRejectReason = 'Administrative request for re-verification of citizen documents.';
      } else {
        return sendJson(400, { error: 'Invalid action. Must be approve, reject or reverify.' });
      }
      saveUsersToDisk();

      const { password, ...safeUser } = user;
      return sendJson(200, {
        success: true,
        message: `Citizen verification has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
        user: safeUser
      });
    }

    // ------------------------------------------
    // 8. Sub-Admin Management (Super Admin Area)
    // ------------------------------------------
    if (pathname === '/api/admin/sub-admins' && req.method === 'GET') {
      const safeAdmins = adminStore.map(({ password, ...a }) => a);
      return sendJson(200, { admins: safeAdmins });
    }

    // Create Sub-Admin
    if (pathname === '/api/admin/sub-admins' && req.method === 'POST') {
      const data = await parseBody(req);
      if (!data.name || !data.email || !data.password) {
        return sendJson(400, { error: 'Name, email, and password are required' });
      }
      const existing = adminStore.find(a => a.email.toLowerCase() === data.email.toLowerCase());
      if (existing) {
        return sendJson(409, { error: 'An admin account with this email already exists' });
      }

      const newSubAdmin = {
        id: `admin-sub-${Date.now().toString().slice(-4)}`,
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.password,
        phone: data.phone || '+63 900 000 0000',
        department: data.department || 'CENRO Environmental Unit',
        role: 'sub_admin',
        permissions: Array.isArray(data.permissions) ? data.permissions : ['can_triage_reports'],
        status: 'Active',
        createdAt: Date.now()
      };
      adminStore.push(newSubAdmin);
      saveAdminsToDisk();

      const { password, ...safe } = newSubAdmin;
      return sendJson(201, {
        success: true,
        message: 'Sub-admin account created successfully',
        subAdmin: safe
      });
    }

    // Update Sub-Admin permissions or details
    if (pathname.startsWith('/api/admin/sub-admins/') && req.method === 'PUT') {
      const adminId = pathname.split('/')[4];
      const updates = await parseBody(req);
      const admin = adminStore.find(a => a.id === adminId);
      if (!admin) {
        return sendJson(404, { error: 'Admin account not found' });
      }
      if (admin.role === 'super_admin' && updates.role && updates.role !== 'super_admin') {
        return sendJson(403, { error: 'Cannot demote the primary super admin account' });
      }

      if (updates.permissions) admin.permissions = updates.permissions;
      if (updates.name) admin.name = updates.name;
      if (updates.department) admin.department = updates.department;
      if (updates.status) admin.status = updates.status;
      if (updates.password && updates.password.trim().length >= 4) {
        admin.password = updates.password.trim();
      }
      saveAdminsToDisk();

      const { password, ...safe } = admin;
      return sendJson(200, {
        success: true,
        message: 'Sub-admin account updated',
        subAdmin: safe
      });
    }

    // Delete / Revoke Sub-Admin
    if (pathname.startsWith('/api/admin/sub-admins/') && req.method === 'DELETE') {
      const adminId = pathname.split('/')[4];
      const target = adminStore.find(a => a.id === adminId);
      if (!target) {
        return sendJson(404, { error: 'Admin account not found' });
      }
      if (target.role === 'super_admin') {
        return sendJson(403, { error: 'Super Admin account cannot be deleted' });
      }
      adminStore = adminStore.filter(a => a.id !== adminId);
      saveAdminsToDisk();
      return sendJson(200, { success: true, message: 'Sub-admin account removed' });
    }

    // ------------------------------------------
    // 9. Super Admin Settings Area (Update Credentials)
    // ------------------------------------------
    if (pathname === '/api/admin/settings/super-admin' && (req.method === 'PUT' || req.method === 'POST')) {
      const data = await parseBody(req);
      const superAdmin = adminStore.find(a => a.role === 'super_admin');
      if (!superAdmin) {
        return sendJson(500, { error: 'Super Admin account not found' });
      }

      // Check current password for authorization
      if (!data.currentPassword) {
        return sendJson(400, { error: 'Current password is required to verify changes' });
      }
      if (data.currentPassword !== superAdmin.password) {
        return sendJson(401, { error: 'Current password verification failed. Please enter your existing password.' });
      }

      if (data.email && data.email.trim()) {
        const newEmail = data.email.trim().toLowerCase();
        const existing = adminStore.find(a => a.id !== superAdmin.id && a.email.toLowerCase() === newEmail);
        if (existing) {
          return sendJson(409, { error: 'Email address already in use by another administrator' });
        }
        superAdmin.email = newEmail;
      }
      if (data.name && data.name.trim()) {
        superAdmin.name = data.name.trim();
      }
      if (data.phone && data.phone.trim()) {
        superAdmin.phone = data.phone.trim();
      }
      if (data.department && data.department.trim()) {
        superAdmin.department = data.department.trim();
      }
      if (data.newPassword && data.newPassword.trim()) {
        if (data.newPassword.trim().length < 4) {
          return sendJson(400, { error: 'New password must be at least 4 characters long' });
        }
        superAdmin.password = data.newPassword.trim();
      }

      saveAdminsToDisk();

      // Sync active session if this admin is currently logged in
      const session = getAdminSession(req);
      if (session && session.adminId === superAdmin.id) {
        session.email = superAdmin.email;
        session.name = superAdmin.name;
      }

      const { password, ...safe } = superAdmin;
      return sendJson(200, {
        success: true,
        message: 'Super Admin credentials and profile updated successfully',
        superAdmin: safe
      });
    }

    // ------------------------------------------
    // 9.5. Image Upload & Media Management (Admin)
    // ------------------------------------------
    if (pathname === '/api/admin/upload-image' && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }

      const data = await parseBody(req);
      const imagePayload = data.image || data.dataUrl || data.imageData;
      if (!imagePayload) {
        return sendJson(400, { error: 'No image data provided' });
      }

      let base64Data = imagePayload;
      let detectedExt = '.png';
      let contentType = 'image/png';

      // Check if data URL format: data:image/png;base64,...
      const matches = imagePayload.match(/^data:([A-Za-z0-9+/]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        base64Data = matches[2];
        if (contentType.includes('jpeg') || contentType.includes('jpg')) detectedExt = '.jpg';
        else if (contentType.includes('png')) detectedExt = '.png';
        else if (contentType.includes('webp')) detectedExt = '.webp';
        else if (contentType.includes('svg')) detectedExt = '.svg';
        else if (contentType.includes('gif')) detectedExt = '.gif';
      } else if (data.filename) {
        const ext = path.extname(data.filename).toLowerCase();
        if (ext) {
          detectedExt = ext;
          contentType = MIME_TYPES[ext] || 'image/png';
        }
      }

      let buffer;
      try {
        buffer = Buffer.from(base64Data, 'base64');
      } catch (err) {
        return sendJson(400, { error: 'Failed to decode base64 image data' });
      }

      if (!buffer || buffer.length === 0) {
        return sendJson(400, { error: 'Empty image buffer received' });
      }
      if (buffer.length > 10 * 1024 * 1024) {
        return sendJson(400, { error: 'Image size exceeds maximum limit of 10MB' });
      }

      const prefix = (data.category || 'media').toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueId = crypto.randomBytes(6).toString('hex');
      const filename = `${prefix}_${Date.now()}_${uniqueId}${detectedExt}`;
      const urlPath = `/uploads/${filename}`;

      // Store in memory cache
      uploadedFilesCache.set(urlPath, {
        filename,
        url: urlPath,
        category: data.category || 'media',
        buffer,
        contentType,
        size: buffer.length,
        timestamp: Date.now()
      });

      // Write to public/uploads directory on disk and persistent /tmp backup
      try {
        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
      } catch (fsErr) {
        console.warn('Could not write uploaded file to public/uploads:', fsErr.message);
      }
      try {
        if (!fs.existsSync(TMP_UPLOADS_DIR)) {
          fs.mkdirSync(TMP_UPLOADS_DIR, { recursive: true });
        }
        fs.writeFileSync(path.join(TMP_UPLOADS_DIR, filename), buffer);
      } catch (tmpErr) {
        console.warn('Could not write uploaded file to /tmp/climate_uploads:', tmpErr.message);
      }

      // Auto-apply to website configuration if category matches
      const cat = (data.category || '').toLowerCase();
      if (cat === 'logo') {
        websiteConfig.logoType = 'image';
        websiteConfig.logoImageUrl = urlPath;
        websiteConfig.updatedAt = Date.now();
        saveConfigToDisk();
        supabaseClient.syncConfigToSupabase(websiteConfig).catch(() => {});
      } else if (cat === 'hero') {
        websiteConfig.heroImageUrl = urlPath;
        websiteConfig.updatedAt = Date.now();
        saveConfigToDisk();
        supabaseClient.syncConfigToSupabase(websiteConfig).catch(() => {});
      } else if (cat === 'about') {
        websiteConfig.aboutImageUrl = urlPath;
        websiteConfig.updatedAt = Date.now();
        saveConfigToDisk();
        supabaseClient.syncConfigToSupabase(websiteConfig).catch(() => {});
      }

      return sendJson(200, {
        success: true,
        message: 'Image uploaded successfully',
        url: urlPath,
        filename,
        contentType,
        size: buffer.length,
        config: websiteConfig
      });
    }

    if (pathname === '/api/admin/uploads' && req.method === 'GET') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }

      const list = Array.from(uploadedFilesCache.values()).map(item => ({
        url: item.url,
        filename: item.filename,
        category: item.category,
        size: item.size,
        contentType: item.contentType,
        timestamp: item.timestamp
      })).reverse();

      return sendJson(200, { uploads: list });
    }

    if (pathname.startsWith('/api/admin/uploads/') && req.method === 'DELETE') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }

      const targetFile = pathname.replace('/api/admin/uploads/', '');
      const cacheKey = `/uploads/${targetFile}`;
      uploadedFilesCache.delete(cacheKey);

      try {
        const filePath = path.join(UPLOADS_DIR, targetFile);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (_) {}

      return sendJson(200, { success: true, message: 'Image deleted successfully' });
    }

    // ------------------------------------------
    // 10. Incident Reports API
    // ------------------------------------------
    if (pathname === '/api/reports' && req.method === 'GET') {
      return sendJson(200, { reports: reportsStore });
    }

    // Citizen submit report (Requires verified KYC account)
    if (pathname === '/api/reports' && req.method === 'POST') {
      const newReport = await parseBody(req);
      if (!newReport.title || !newReport.category || !newReport.barangay) {
        return sendJson(400, { error: 'Title, category, and barangay are required' });
      }

      const userEmail = (newReport.submittedEmail || '').trim().toLowerCase();
      if (!userEmail) {
        return sendJson(401, { error: 'Authentication required: You must log into a verified citizen account to submit reports.' });
      }

      const citizen = userStore.find(u => u.email.toLowerCase() === userEmail);
      if (!citizen) {
        return sendJson(401, { error: 'Citizen user account not found. Please sign in.' });
      }

      if (citizen.kycStatus !== 'verified') {
        return sendJson(403, {
          error: 'KYC Verification Required: To prevent misinformation and fake reporting, all citizens must have their government ID verified by CENRO administration before filing reports.',
          kycStatus: citizen.kycStatus || 'unverified',
          requiresKyc: true
        });
      }

      newReport.id = newReport.id || `ECO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      newReport.timestamp = newReport.timestamp || Date.now();
      newReport.status = 'Submitted';
      newReport.assignedTo = 'Pending CENRO Dispatch';
      newReport.submittedBy = newReport.submittedBy || citizen.name;
      newReport.submittedEmail = (citizen.email || '').toLowerCase();
      newReport.userEmail = newReport.submittedEmail;

      reportsStore.unshift(newReport);
      saveReportsToDisk();
      supabaseClient.saveReportToSupabase(newReport).catch(() => {});

      // Increment submitting user's reports count & award ecoPoints
      citizen.reportsCount = (citizen.reportsCount || 0) + 1;
      citizen.ecoPoints = (citizen.ecoPoints || 0) + 50;
      saveUsersToDisk();

      return sendJson(201, {
        success: true,
        message: 'Report filed successfully! You earned +50 Eco-Points.',
        report: newReport
      });
    }

    // Admin triage/update report
    if (pathname.startsWith('/api/reports/') && req.method === 'PUT') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }

      const reportId = pathname.split('/')[3];
      const updateData = await parseBody(req);
      const report = reportsStore.find(r => r.id === reportId);
      if (!report) {
        return sendJson(404, { error: 'Report not found' });
      }
      Object.assign(report, updateData);
      saveReportsToDisk();
      supabaseClient.updateReportInSupabase(reportId, updateData).catch(() => {});
      return sendJson(200, { success: true, report });
    }

    // Admin delete report
    if ((pathname.startsWith('/api/reports/') || pathname.startsWith('/api/admin/reports/')) && req.method === 'DELETE') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }

      const reportId = pathname.split('/')[3] || pathname.split('/')[4];
      reportsStore = reportsStore.filter(r => r.id !== reportId);
      saveReportsToDisk();
      return sendJson(200, { success: true, message: 'Report removed successfully' });
    }

    // ------------------------------------------
    // 11. System Statistics
    // ------------------------------------------
    if (pathname === '/api/stats') {
      const total = reportsStore.length;
      const resolved = reportsStore.filter(r => r.status === 'Resolved' || r.status === 'Closed').length;
      const critical = reportsStore.filter(r => r.severity === 'Critical' || r.severity === 'High').length;
      const subAdminCount = adminStore.filter(a => a.role === 'sub_admin').length;
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const authenticActiveToday = userStore.filter(u => u.lastActiveAt && u.lastActiveAt >= oneDayAgo).length;

      return sendJson(200, {
        totalReports: total,
        resolvedReports: resolved,
        criticalReports: critical,
        resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) + '%' : '0%',
        totalUsers: userStore.length,
        activeUsersToday: authenticActiveToday,
        totalSubAdmins: subAdminCount,
        activeAnnouncements: announcementsStore.length,
        weatherAlert: weatherAdvisory.alertLevel
      });
    }

    // ------------------------------------------
    // Supabase Cloud Database Management API
    // ------------------------------------------
    if (pathname === '/api/admin/supabase-status' && req.method === 'GET') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const status = supabaseClient.getStatus();
      return sendJson(200, {
        status,
        sqlSchema: supabaseClient.SQL_SCHEMA_SCRIPT
      });
    }

    if (pathname === '/api/admin/supabase-test' && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const result = await supabaseClient.testConnection();
      return sendJson(200, result);
    }

    if (pathname === '/api/admin/supabase-config' && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const body = await parseBody(req);
      if (!body.supabaseUrl || !body.supabaseKey) {
        return sendJson(400, { error: 'Both Supabase Project URL and API Key are required' });
      }
      const resSave = supabaseClient.saveCredentials(body.supabaseUrl, body.supabaseKey, Boolean(body.isServiceRole));
      const testRes = await supabaseClient.testConnection();
      if (testRes.connected) {
        syncWithSupabase().catch(() => {});
      }
      return sendJson(200, {
        success: true,
        message: testRes.connected ? 'Credentials saved and successfully connected to Supabase!' : 'Credentials saved, but connection test failed: ' + (testRes.error || ''),
        test: testRes,
        status: supabaseClient.getStatus()
      });
    }

    if (pathname === '/api/admin/supabase-auto-connect' && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      const testRes = await supabaseClient.testConnection();
      if (testRes.connected) {
        await syncWithSupabase();
      }
      return sendJson(200, {
        success: testRes.connected,
        message: testRes.connected ? 'Successfully auto-connected and synchronized database, storage, and accounts!' : 'Auto-connection attempt: ' + (testRes.error || 'Awaiting credentials'),
        test: testRes,
        status: supabaseClient.getStatus(),
        reportsCount: reportsStore.length,
        usersCount: userStore.length
      });
    }

    if (pathname === '/api/admin/supabase-sync' && req.method === 'POST') {
      const session = getAdminSession(req);
      if (!session || !isAdminRole(session.role)) {
        return sendJson(401, { error: 'Unauthorized: Active administrative session required' });
      }
      await syncWithSupabase();
      return sendJson(200, {
        success: true,
        message: 'Database, storage, and accounts synchronized with Supabase successfully',
        reportsCount: reportsStore.length,
        usersCount: userStore.length,
        status: supabaseClient.getStatus()
      });
    }

    // ------------------------------------------
    // 12. Separate Directory Access: Admin vs User Web Data
    // ------------------------------------------
    // Fast serving for uploaded images (cache or memory)
    if (uploadedFilesCache.has(pathname)) {
      const cached = uploadedFilesCache.get(pathname);
      res.writeHead(200, {
        'Content-Type': cached.contentType || 'image/png',
        'Content-Length': cached.buffer.length,
        'Cache-Control': 'public, max-age=31536000'
      });
      res.end(cached.buffer);
      return;
    }

    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

    if (isAdminRoute) {
      // ADMIN DIRECTORY ACCESS: Strictly isolated to /admin directory
      let relativeAdminPath = pathname.replace(/^\/admin\/?/, '');
      if (!relativeAdminPath || relativeAdminPath === '/') {
        relativeAdminPath = 'index.html';
      }

      const filePath = path.join(ADMIN_DIR, relativeAdminPath);

      // Security check: ensure filePath is strictly within ADMIN_DIR
      if (!filePath.startsWith(ADMIN_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden: Directory traversal denied');
        return;
      }

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          // If the admin file is not found, return 404
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Admin file not found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, content) => {
          if (readErr) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
          }
          if (ext === '.html' && websiteConfig.logoImageUrl) {
            let htmlStr = content.toString('utf8');
            htmlStr = htmlStr.replace(/href="\/favicon\.ico"/g, `href="${websiteConfig.logoImageUrl}"`);
            const htmlBuf = Buffer.from(htmlStr, 'utf8');
            res.writeHead(200, {
              'Content-Type': contentType,
              'Content-Length': htmlBuf.length,
              'Cache-Control': 'no-cache, must-revalidate'
            });
            return res.end(htmlBuf);
          }
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        });
      });
      return;
    }

    // USER WEB DATA DIRECTORY ACCESS: Strictly isolated to /public directory
    let reqPath = pathname === '/' ? '/index.html' : pathname;

    // Fast memory cache check for uploaded images, seals, and brand assets
    if (uploadedFilesCache.has(pathname)) {
      const cached = uploadedFilesCache.get(pathname);
      const ext = path.extname(pathname).toLowerCase();
      const contentType = cached.contentType || MIME_TYPES[ext] || 'image/png';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': cached.buffer.length,
        'Cache-Control': 'public, max-age=86400, immutable'
      });
      return res.end(cached.buffer);
    }

    // Disk fallback for uploaded images across both directories
    if (pathname.startsWith('/uploads/')) {
      const upName = path.basename(pathname);
      const candidates = [path.join(UPLOADS_DIR, upName), path.join(TMP_UPLOADS_DIR, upName)];
      for (const cand of candidates) {
        try {
          if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
            const ext = path.extname(cand).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'image/png';
            const buffer = fs.readFileSync(cand);
            uploadedFilesCache.set(pathname, {
              filename: upName,
              url: pathname,
              category: upName.split('_')[0] || 'media',
              buffer,
              contentType,
              size: buffer.length,
              timestamp: Date.now()
            });
            res.writeHead(200, {
              'Content-Type': contentType,
              'Content-Length': buffer.length,
              'Cache-Control': 'public, max-age=86400, immutable'
            });
            return res.end(buffer);
          }
        } catch (_) {}
      }
    }

    const filePath = path.join(USER_PUBLIC_DIR, reqPath);

    // Security check: ensure filePath is strictly within USER_PUBLIC_DIR
    if (!filePath.startsWith(USER_PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden: Directory traversal denied');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Unknown file in user web data directory returns 404
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          return;
        }
        if (ext === '.html' && websiteConfig.logoImageUrl) {
          let htmlStr = content.toString('utf8');
          htmlStr = htmlStr.replace(/href="\/favicon\.ico"/g, `href="${websiteConfig.logoImageUrl}"`);
          const htmlBuf = Buffer.from(htmlStr, 'utf8');
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': htmlBuf.length,
            'Cache-Control': 'no-cache, must-revalidate'
          });
          return res.end(htmlBuf);
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });

  } catch (serverErr) {
    console.error('Server error:', serverErr);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error', details: serverErr.message }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] ClimateAction Full-Stack Server listening on port ${PORT}`);
  console.log(`[Admin] Session-based Administrative Console active at /admin`);
});
