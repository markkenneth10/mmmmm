// LGU CENRO Administrative Command Console JavaScript
// Handles Admin Authentication, CMS editing, Weather control, Announcements,
// Sub-Admin delegation, and Super Admin credential settings.

const ADMIN_STORAGE_KEY = 'climate_admin_session';
const ADMIN_TOKEN_KEY = 'climate_admin_token';
const MASTER_ADMIN_TOKEN = 'climate_super_admin_master_session_token';

let currentAdmin = null;
let activeTriageReportId = null;
let allReports = [];
let allUsers = [];
let allSubAdmins = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
 loadAdminBrandingAndFavicon();
 checkAdminSession();
});

// Real-time synchronization of website configuration and logo across tabs
if (window.BroadcastChannel) {
 try {
 const bc = new BroadcastChannel('climate_config_channel');
 bc.onmessage = (event) => {
 if (event.data) {
 loadAdminBrandingAndFavicon();
 }
 };
 } catch (_) {}
}

window.addEventListener('storage', (e) => {
 if (e.key === 'climate_brand_logo_updated' || e.key === 'climate_config_updated') {
 loadAdminBrandingAndFavicon();
 }
});

window.addEventListener('focus', () => { loadAdminBrandingAndFavicon(); });
document.addEventListener('visibilitychange', () => {
 if (!document.hidden) loadAdminBrandingAndFavicon();
});

// Centralized authenticated fetch helper with cookie credentials & bearer token
async function adminFetch(url, options = {}) {
 const token = localStorage.getItem(ADMIN_TOKEN_KEY) || MASTER_ADMIN_TOKEN;
 const customHeaders = {
 'Content-Type': 'application/json',
 ...(options.headers || {})
 };
 if (token) {
 customHeaders['Authorization'] = `Bearer ${token}`;
 customHeaders['X-Admin-Token'] = token;
 }

 const opts = {
 ...options,
 credentials: 'include',
 headers: customHeaders
 };

 try {
 const res = await fetch(url, opts);
 if (res.status === 401 && !url.includes('/api/admin/login') && !url.includes('/api/admin/auto-login')) {
 console.warn('Admin API 401 for', url, '- executing silent auto-login re-authentication...');
 const recovered = await tryAutoLoginSilent();
 if (recovered) {
 const retryToken = localStorage.getItem(ADMIN_TOKEN_KEY) || MASTER_ADMIN_TOKEN;
 customHeaders['Authorization'] = `Bearer ${retryToken}`;
 customHeaders['X-Admin-Token'] = retryToken;
 return await fetch(url, { ...options, credentials: 'include', headers: customHeaders });
 } else {
 console.warn('Silent session recovery was not completed.');
 }
 }
 return res;
 } catch (err) {
 console.error('adminFetch error:', err);
 throw err;
 }
}

// Session Check: Verify against backend session store without forcing auto-login on page refresh
async function checkAdminSession() {
 let token = localStorage.getItem(ADMIN_TOKEN_KEY);
 if (!token) {
 showAdminLogin();
 return;
 }

 // 1. Check existing server session with bearer token & cookie
 try {
 const headers = {
 'Authorization': `Bearer ${token}`,
 'X-Admin-Token': token
 };
 const res = await fetch('/api/admin/session', { 
 credentials: 'include',
 headers
 });
 if (res.ok) {
 const data = await res.json();
 if (data.authenticated && data.admin && (data.role === 'super_admin' || data.role === 'sub_admin')) {
 currentAdmin = data.admin;
 if (data.sessionId) localStorage.setItem(ADMIN_TOKEN_KEY, data.sessionId);
 localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(currentAdmin));
 showAdminWorkspace();
 return;
 }
 }
 } catch (e) {
 console.warn('Session verification check failed:', e);
 }

 // Clear session on refresh/failure so no silent auto-login occurs
 localStorage.removeItem(ADMIN_STORAGE_KEY);
 localStorage.removeItem(ADMIN_TOKEN_KEY);
 showAdminLogin();
}

// Silent automatic login helper
async function tryAutoLoginSilent() {
 try {
 const res = await fetch('/api/admin/auto-login', {
 method: 'POST',
 credentials: 'include',
 headers: { 
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${MASTER_ADMIN_TOKEN}`,
 'X-Admin-Token': MASTER_ADMIN_TOKEN
 }
 });
 if (res.ok) {
 const data = await res.json();
 if (data.success && data.admin) {
 currentAdmin = data.admin;
 if (data.sessionId) localStorage.setItem(ADMIN_TOKEN_KEY, data.sessionId);
 localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(currentAdmin));
 showAdminWorkspace();
 return true;
 }
 }
 } catch (err) {
 console.warn('Silent auto-login error:', err);
 }
 return false;
}

// 1-Click Instant Login from Authentication View
async function handleQuickAutoLogin() {
 const errBox = document.getElementById('admin-login-error');
 if (errBox) errBox.style.display = 'none';

 const btn = document.getElementById('btn-auto-login');
 if (btn) {
 btn.disabled = true;
 btn.textContent = ' Signing in as Super Admin...';
 }

 try {
 const success = await tryAutoLoginSilent();
 if (!success) {
 const emailInput = document.getElementById('admin-email-input');
 const passInput = document.getElementById('admin-password-input');
 if (emailInput && !emailInput.value) emailInput.value = '';
 if (passInput && !passInput.value) passInput.value = '';
 await handleAdminLogin();
 }
 } finally {
 if (btn) {
 btn.disabled = false;
 btn.textContent = ' 1-Click Auto Login as Super Admin';
 }
 }
}

// Exit Dashboard back to public citizen web portal with confirmation safeguard
async function exitDashboard(signOut = false) {
 if (signOut) {
 const confirmed = confirm('Are you sure you want to sign out of the Administrative Command Console?');
 if (!confirmed) return;

 try {
 await fetch('/api/admin/logout', {
 method: 'POST',
 credentials: 'include'
 });
 } catch (_) {}
 localStorage.removeItem(ADMIN_STORAGE_KEY);
 localStorage.removeItem(ADMIN_TOKEN_KEY);
 currentAdmin = null;
 showAdminLogin();
 return;
 }

 const confirmed = confirm('Leave Administrative Console and visit the public citizen website?');
 if (!confirmed) return;
 window.location.href = '/';
}

function showAdminLogin() {
 document.getElementById('admin-auth-view').style.display = 'flex';
 document.getElementById('admin-workspace-view').style.display = 'none';
}

function showAdminWorkspace() {
 const authView = document.getElementById('admin-auth-view');
 if (authView) authView.style.display = 'none';
 const workView = document.getElementById('admin-workspace-view');
 if (workView) workView.style.display = 'flex';

 // Set Profile info in Topbar safely
 const profName = document.getElementById('admin-profile-name');
 if (profName) profName.textContent = currentAdmin.name || 'Administrator';
 const profDept = document.getElementById('admin-profile-dept');
 if (profDept) profDept.textContent = currentAdmin.department || 'LGU CENRO';

 const avatar = document.getElementById('admin-header-avatar');
 if (avatar) {
 const initials = (currentAdmin.name || 'Admin').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
 avatar.textContent = initials || 'SA';
 }

 const badge = document.getElementById('admin-role-badge');
 if (badge) {
 if (currentAdmin.role === 'super_admin') {
 badge.textContent = 'SUPER ADMIN';
 badge.className = 'admin-badge-super';
 const subNav = document.getElementById('nav-subadmins');
 if (subNav) subNav.style.display = 'flex';
 const setNav = document.getElementById('nav-settings');
 if (setNav) setNav.style.display = 'flex';
 } else {
 badge.textContent = 'SUB-ADMIN';
 badge.className = 'admin-badge-sub';
 // Sub-admins cannot see super admin settings or manage sub-admins
 const subNav = document.getElementById('nav-subadmins');
 if (subNav) subNav.style.display = 'none';
 const setNav = document.getElementById('nav-settings');
 if (setNav) setNav.style.display = 'none';
 }
 }

 // Load all data
 refreshAllAdminData();
}

// Handle Admin Login
async function handleAdminLogin(e) {
 if (e) e.preventDefault();
 const emailInput = document.getElementById('admin-email-input');
 const passInput = document.getElementById('admin-password-input');
 const email = (emailInput ? emailInput.value : '').trim();
 const password = (passInput ? passInput.value : '').trim();
 const errBox = document.getElementById('admin-login-error');
 if (errBox) errBox.style.display = 'none';

 try {
 const res = await fetch('/api/admin/login', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, password })
 });
 const data = await res.json();

 if (!res.ok) {
 if (errBox) {
 errBox.textContent = data.error || 'Administrative login failed';
 errBox.style.display = 'block';
 }
 return;
 }

 currentAdmin = data.admin;
 if (data.sessionId) {
 localStorage.setItem(ADMIN_TOKEN_KEY, data.sessionId);
 }
 localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(currentAdmin));
 showAdminWorkspace();
 } catch (err) {
 if (errBox) {
 errBox.textContent = 'Network error connecting to administrative server';
 errBox.style.display = 'block';
 }
 }
}

// Handle Admin Logout
async function handleAdminLogout() {
 try {
 await fetch('/api/admin/logout', {
 method: 'POST',
 credentials: 'include'
 });
 } catch (e) {
 console.error('Logout error:', e);
 }
 localStorage.removeItem(ADMIN_STORAGE_KEY);
 localStorage.removeItem(ADMIN_TOKEN_KEY);
 currentAdmin = null;
 showAdminLogin();
}

// Tab Switching
function switchAdminTab(tabName) {
 if (tabName === 'tickets') tabName = 'triage';

 // Update sidebar nav buttons
 document.querySelectorAll('.admin-nav-item').forEach(btn => btn.classList.remove('active'));
 const clicked = Array.from(document.querySelectorAll('.admin-nav-item')).find(b => b.getAttribute('onclick')?.includes(tabName));
 if (clicked) clicked.classList.add('active');

 // Update footer navbar buttons
 document.querySelectorAll('.admin-footer-nav-item').forEach(btn => {
 const btnTab = btn.getAttribute('data-tab');
 if (btnTab === tabName || (btnTab === 'tickets' && tabName === 'triage')) {
 btn.classList.add('active');
 } else if (btnTab) {
 btn.classList.remove('active');
 }
 });

 // Hide all sections
 document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
 const target = document.getElementById(`tab-${tabName}`);
 if (target) target.style.display = 'block';

 // Automatically close mobile sidebar when tab clicked
 closeAdminMobileSidebar();

 // Load tab-specific data if needed
 if (tabName === 'triage') renderFullReportsTable();
 if (tabName === 'kyc') loadKycSubmissions();
 if (tabName === 'cms') {
 loadCMSData();
 loadMediaGallery();
 }
 if (tabName === 'weather') loadWeatherData();
 if (tabName === 'announcements') loadAnnouncements();
 if (tabName === 'activities') {
 loadAdminActivities();
 loadAdminParticipations();
 }
 if (tabName === 'users') loadUsersData();
 if (tabName === 'guides') loadUserGuides();
 if (tabName === 'subadmins' && currentAdmin && currentAdmin.role === 'super_admin') loadSubAdminsData();
 if (tabName === 'settings' && currentAdmin && currentAdmin.role === 'super_admin') {
 loadSuperAdminSettings();
 loadDatabaseStatus();
 loadSupabaseStatus();
 }
}

// Admin Mobile Sidebar Navigation Controls
function toggleAdminMobileSidebar() {
 const sidebar = document.querySelector('.admin-sidebar');
 const backdrop = document.querySelector('.admin-sidebar-backdrop');
 const isOpen = sidebar && sidebar.classList.contains('mobile-open');
 if (isOpen) {
 closeAdminMobileSidebar();
 } else {
 if (sidebar) sidebar.classList.add('mobile-open');
 if (backdrop) backdrop.classList.add('active');
 document.body.classList.add('admin-drawer-open');
 }
}

function closeAdminMobileSidebar() {
 const sidebar = document.querySelector('.admin-sidebar');
 const backdrop = document.querySelector('.admin-sidebar-backdrop');
 if (sidebar) sidebar.classList.remove('mobile-open');
 if (backdrop) backdrop.classList.remove('active');
 document.body.classList.remove('admin-drawer-open');
}

// Refresh all telemetry
async function refreshAllAdminData() {
 await Promise.all([
 loadStats(),
 loadReports(),
 loadCMSData(),
 loadWeatherData()
 ]);
}

// 1. Stats & Telemetry
async function loadStats() {
 try {
 const res = await fetch('/api/stats');
 const data = await res.json();
 document.getElementById('kpi-admin-total-reports').textContent = data.totalReports || 0;
 document.getElementById('kpi-admin-resolution-rate').textContent = `Resolution: ${data.resolutionRate || '0%'}`;
 document.getElementById('kpi-admin-critical-reports').textContent = data.criticalReports || 0;
 document.getElementById('kpi-admin-total-users').textContent = data.totalUsers || 0;
 document.getElementById('kpi-admin-active-today').textContent = `Active today: ${data.activeUsersToday || 0} users`;
 document.getElementById('kpi-admin-weather-alert').textContent = data.weatherAlert || 'Normal';
 } catch (e) {
 console.error('Failed to load stats:', e);
 }
}

// 2. Reports
async function loadReports() {
 try {
 const res = await fetch('/api/reports');
 const data = await res.json();
 allReports = data.reports || [];
 renderQuickTriageTable();
 renderFullReportsTable();
 } catch (e) {
 console.error('Failed to load reports:', e);
 }
}

function renderQuickTriageTable() {
 const tbody = document.getElementById('admin-quick-triage-table');
 if (!tbody) return;

 const unresolved = allReports.filter(r => r.status !== 'Resolved' && r.status !== 'Closed').slice(0, 5);
 if (unresolved.length === 0) {
 tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 1.5rem; color:#94a3b8;"> All reported hazards are currently resolved or verified!</td></tr>`;
 return;
 }

 tbody.innerHTML = unresolved.map(r => `
 <tr>
 <td style="font-weight:700; color:#38bdf8;">${r.id}</td>
 <td>${r.category}</td>
 <td><strong>${r.barangay}</strong><br><span style="font-size:0.75rem; color:#94a3b8;">${r.landmark || ''}</span></td>
 <td><span class="badge-${(r.severity || 'low').toLowerCase()}">${r.severity}</span></td>
 <td><span class="status-pill status-${(r.status || 'submitted').toLowerCase().replace(' ', '-')}">${r.status}</span></td>
 <td style="font-size:0.8rem;">${r.assignedTo || 'Unassigned'}</td>
 <td>
 <button onclick="openAdminTriageModal('${r.id}')" class="btn-admin-primary" style="padding:0.35rem 0.75rem; font-size:0.75rem;">
 Triage
 </button>
 </td>
 </tr>
 `).join('');
}

function renderFullReportsTable() {
 const tbody = document.getElementById('admin-full-reports-table');
 if (!tbody) return;

 if (allReports.length === 0) {
 tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:#94a3b8;">No reports logged yet.</td></tr>`;
 return;
 }

 tbody.innerHTML = allReports.map(r => `
 <tr>
 <td style="font-weight:800; color:#38bdf8;">${r.id}</td>
 <td>
 <strong>${r.title}</strong>
 <div style="font-size:0.75rem; color:#94a3b8; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
 ${r.description || ''}
 </div>
 </td>
 <td>
 ${r.submittedBy || 'Citizen'}
 <div style="font-size:0.72rem; color:#64748b;">${r.submittedEmail || ''}</div>
 </td>
 <td>${r.barangay}</td>
 <td><span class="badge-${(r.severity || 'low').toLowerCase()}">${r.severity}</span></td>
 <td><span class="status-pill status-${(r.status || 'submitted').toLowerCase().replace(' ', '-')}">${r.status}</span></td>
 <td style="font-size:0.8rem; color:#cbd5e1;">${r.assignedTo || 'Pending'}</td>
 <td>
 <button onclick="openAdminTriageModal('${r.id}')" class="btn-admin-primary" style="padding:0.4rem 0.8rem; font-size:0.78rem;">
 Update Status
 </button>
 </td>
 </tr>
 `).join('');
}

function openAdminTriageModal(reportId) {
 activeTriageReportId = reportId;
 const report = allReports.find(r => r.id === reportId);
 if (!report) return;

 document.getElementById('triage-modal-ticket-id').textContent = `Ticket ID: ${report.id} • ${report.category}`;
 document.getElementById('triage-modal-title').textContent = report.title;
 document.getElementById('triage-select-status').value = report.status || 'Submitted';
 document.getElementById('triage-assigned-unit').value = report.assignedTo || '';
 document.getElementById('triage-inspection-notes').value = report.inspectionNotes || '';

 document.getElementById('admin-triage-modal').style.display = 'flex';
}

function closeAdminTriageModal() {
 document.getElementById('admin-triage-modal').style.display = 'none';
 activeTriageReportId = null;
}

async function saveAdminTriageUpdate() {
 if (!activeTriageReportId) return;

 const newStatus = document.getElementById('triage-select-status').value;
 const assignedUnit = document.getElementById('triage-assigned-unit').value.trim();
 const notes = document.getElementById('triage-inspection-notes').value.trim();

 try {
 const res = await adminFetch(`/api/reports/${activeTriageReportId}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 status: newStatus,
 assignedTo: assignedUnit,
 inspectionNotes: notes
 })
 });

 if (res.ok) {
 closeAdminTriageModal();
 await loadReports();
 await loadStats();
 alert(`Report ${activeTriageReportId} updated to ${newStatus}!`);
 } else {
 alert('Failed to update report status.');
 }
 } catch (err) {
 alert('Network error saving triage update.');
 }
}

// Helper: Read file as Base64 Data URL
function readFileAsDataUrl(file) {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = () => resolve(reader.result);
 reader.onerror = (err) => reject(err);
 reader.readAsDataURL(file);
 });
}

// Centralized image uploader to /api/admin/upload-image
async function uploadImageFile(file, category = 'media') {
 if (!file) throw new Error('No file selected');
 if (file.size > 10 * 1024 * 1024) {
 throw new Error('File size exceeds 10MB limit. Please choose a smaller image.');
 }
 const dataUrl = await readFileAsDataUrl(file);
 const res = await adminFetch('/api/admin/upload-image', {
 method: 'POST',
 body: JSON.stringify({
 image: dataUrl,
 filename: file.name,
 category: category
 })
 });
 if (!res.ok) {
 const err = await res.json().catch(() => ({ error: 'Upload failed' }));
 throw new Error(err.error || 'Failed to upload image file');
 }
 return await res.json();
}

// Safe HTML escape to prevent XSS and prevent undefined function errors in KYC & user cards
function escapeHtml(str) {
 if (str === null || str === undefined) return '';
 return String(str)
 .replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;')
 .replace(/"/g, '&quot;')
 .replace(/'/g, '&#039;');
}

// Updates the dynamic browser tab favicon for the admin console
function updateAdminFavicon(config) {
 if (!config) return;
 const isImageMode = Boolean(config.logoImageUrl && (config.logoType === 'image' || !config.logoType || config.logoType !== 'emoji'));

 // Remove existing icon links to force browser tab refresh
 const existingLinks = document.querySelectorAll("link[rel*='icon']");
 existingLinks.forEach(el => el.remove());

 const newLink = document.createElement('link');
 newLink.id = 'admin-favicon';
 newLink.rel = 'icon';

 if (isImageMode) {
 newLink.type = 'image/png';
 const cacheBuster = (config.logoImageUrl.includes('?') ? '&' : '?') + 'fav=' + (config.updatedAt || Date.now());
 newLink.href = config.logoImageUrl + cacheBuster;
 } else {
 const fallbackEmoji = config.websiteLogo || '';
 newLink.type = 'image/svg+xml';
 newLink.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${fallbackEmoji}</text></svg>`;
 }

 document.head.appendChild(newLink);
}

// Updates the administrative login card brand icon
function updateAdminAuthCardLogo(config) {
 const authLogoEl = document.getElementById('admin-auth-logo');
 if (!authLogoEl) return;
 const logoUrl = config.logoImageUrl || '/assets/ic_climate_app_icon.jpg';
 const isImageMode = Boolean(config.logoImageUrl && config.logoType !== 'emoji');
 if (isImageMode || logoUrl) {
 authLogoEl.style.background = 'transparent';
 authLogoEl.style.boxShadow = 'none';
 authLogoEl.style.border = 'none';
 authLogoEl.style.borderRadius = '0';
 authLogoEl.style.width = 'auto';
 authLogoEl.style.maxWidth = '220px';
 authLogoEl.style.height = '72px';
 authLogoEl.style.overflow = 'visible';
 authLogoEl.innerHTML = `<img src="${logoUrl}" alt="Logo" style="width:auto!important; height:100%!important; max-width:220px!important; max-height:72px!important; object-fit:contain!important; display:block!important; margin:auto; background:transparent!important; box-shadow:none!important; border:none!important; border-radius:0!important;" onerror="this.onerror=null; this.src='/assets/ic_climate_app_icon.jpg';">`;
 } else {
 authLogoEl.style.background = 'linear-gradient(135deg, #16A34A, #15803D)';
 authLogoEl.style.boxShadow = '0 0 20px rgba(22,163,74,0.3)';
 authLogoEl.style.border = '';
 authLogoEl.style.borderRadius = '16px';
 authLogoEl.style.width = '64px';
 authLogoEl.style.height = '64px';
 authLogoEl.style.maxWidth = '';
 authLogoEl.style.overflow = 'hidden';
 authLogoEl.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#fff" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
 }
}

// Pre-load website configuration for immediate branding & favicon rendering
async function loadAdminBrandingAndFavicon() {
 try {
 const res = await fetch('/api/config?_t=' + Date.now(), { cache: 'no-store' });
 const data = await res.json();
 const config = data.config || {};
 updateAdminFavicon(config);
 updateAdminHeaderLogo(config);
 updateAdminAuthCardLogo(config);
 if (config.websiteName) {
 document.title = `${config.websiteName} | Administrative Command Console`;
 }
 } catch (e) {
 console.warn('Could not pre-load admin branding:', e);
 }
}

// Updates the admin top header logo based on configuration
function updateAdminHeaderLogo(config) {
 if (!config) return;
 updateAdminFavicon(config);
 updateAdminAuthCardLogo(config);

 const headerLogoEl = document.getElementById('admin-header-logo');
 if (!headerLogoEl) return;

 const logoUrl = config.logoImageUrl || '/assets/ic_climate_app_icon.jpg';
 const isImageMode = Boolean(config.logoImageUrl && config.logoType !== 'emoji');
 if (isImageMode || logoUrl) {
 headerLogoEl.classList.add('has-image');
 headerLogoEl.style.background = 'transparent';
 headerLogoEl.style.backgroundImage = 'none';
 headerLogoEl.style.boxShadow = 'none';
 headerLogoEl.style.border = 'none';
 headerLogoEl.style.padding = '0';
 headerLogoEl.style.borderRadius = '0';
 headerLogoEl.style.overflow = 'visible';
 headerLogoEl.style.width = 'auto';
 headerLogoEl.style.maxWidth = '220px';
 headerLogoEl.style.height = '52px';
 headerLogoEl.innerHTML = `<img src="${logoUrl}" alt="Logo" class="admin-logo-img" style="height:100%!important; max-height:52px!important; width:auto!important; max-width:220px!important; object-fit:contain!important; display:block!important; margin:auto; background:transparent!important; background-image:none!important; border:none!important; border-radius:0!important; box-shadow:none!important;" onerror="this.onerror=null; this.src='/assets/ic_climate_app_icon.jpg';">`;
 } else {
 headerLogoEl.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
 headerLogoEl.classList.remove('has-image');
 headerLogoEl.style.background = '';
 headerLogoEl.style.backgroundImage = '';
 headerLogoEl.style.boxShadow = '';
 headerLogoEl.style.border = '';
 headerLogoEl.style.padding = '';
 headerLogoEl.style.borderRadius = '';
 headerLogoEl.style.overflow = '';
 headerLogoEl.style.width = '';
 headerLogoEl.style.maxWidth = '';
 headerLogoEl.style.height = '';
 }
}

// Logo Mode & Emoji Handlers
function setLogoMode(mode) {
 const hiddenType = document.getElementById('cms-logo-type');
 if (hiddenType) hiddenType.value = mode;

 const btnImage = document.getElementById('btn-mode-image-logo');
 const btnEmoji = document.getElementById('btn-mode-emoji-logo');
 const panelImage = document.getElementById('cms-logo-image-panel');
 const panelEmoji = document.getElementById('cms-logo-emoji-panel');

 if (mode === 'image') {
 if (btnImage) {
 btnImage.style.borderColor = '#10b981';
 btnImage.style.color = '#34d399';
 }
 if (btnEmoji) {
 btnEmoji.style.borderColor = '#1c4228';
 btnEmoji.style.color = '#94a3b8';
 }
 if (panelImage) panelImage.style.display = 'block';
 if (panelEmoji) panelEmoji.style.display = 'none';
 } else {
 if (btnEmoji) {
 btnEmoji.style.borderColor = '#10b981';
 btnEmoji.style.color = '#34d399';
 }
 if (btnImage) {
 btnImage.style.borderColor = '#1c4228';
 btnImage.style.color = '#94a3b8';
 }
 if (panelImage) panelImage.style.display = 'none';
 if (panelEmoji) panelEmoji.style.display = 'block';
 }
}

function setLogoEmoji(emoji) {
 const logoInput = document.getElementById('cms-website-logo');
 if (logoInput) logoInput.value = emoji;
 setLogoMode('emoji');
 updateAdminHeaderLogo({ logoType: 'emoji', websiteLogo: emoji });
}

// Handle Logo File Upload
async function handleLogoFileSelect(event) {
 const file = event.target.files[0];
 if (!file) return;

 const statusEl = document.getElementById('cms-logo-status');
 if (statusEl) statusEl.textContent = ' Uploading logo image...';

 try {
 const result = await uploadImageFile(file, 'logo');
 const logoUrl = result.url;

 document.getElementById('cms-logo-image-url').value = logoUrl;
 const previewImg = document.getElementById('cms-logo-preview-img');
 const previewPh = document.getElementById('cms-logo-preview-placeholder');
 if (previewImg) {
 previewImg.src = logoUrl;
 previewImg.style.display = 'block';
 }
 if (previewPh) previewPh.style.display = 'none';

 const removeBtn = document.getElementById('btn-remove-logo-img');
 if (removeBtn) removeBtn.style.display = 'inline-block';

 setLogoMode('image');
 updateAdminHeaderLogo({ logoType: 'image', logoImageUrl: logoUrl });

 // Auto-persist logo settings to backend
 try {
 await adminFetch('/api/config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 logoType: 'image',
 logoImageUrl: logoUrl
 })
 });
 } catch (_) {}

 // Instant cross-tab broadcast so website updates without refreshing
 try {
 localStorage.setItem('climate_brand_logo_updated', JSON.stringify({
 logoType: 'image',
 logoImageUrl: logoUrl,
 timestamp: Date.now()
 }));
 if (window.BroadcastChannel) {
 const bc = new BroadcastChannel('climate_config_channel');
 bc.postMessage({ type: 'LOGO_UPDATED', logoImageUrl: logoUrl, logoType: 'image', timestamp: Date.now() });
 bc.close();
 }
 } catch (_) {}

 if (statusEl) statusEl.textContent = ` Uploaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`;
 loadMediaGallery();
 } catch (err) {
 if (statusEl) statusEl.textContent = ` ${err.message}`;
 alert(err.message);
 } finally {
 event.target.value = '';
 }
}

function handleRemoveLogoImage() {
 document.getElementById('cms-logo-image-url').value = '';
 const previewImg = document.getElementById('cms-logo-preview-img');
 const previewPh = document.getElementById('cms-logo-preview-placeholder');
 if (previewImg) {
 previewImg.src = '';
 previewImg.style.display = 'none';
 }
 if (previewPh) previewPh.style.display = 'block';

 const removeBtn = document.getElementById('btn-remove-logo-img');
 if (removeBtn) removeBtn.style.display = 'none';

 setLogoMode('emoji');
 const currentEmoji = document.getElementById('cms-website-logo').value || '';
 updateAdminHeaderLogo({ logoType: 'emoji', websiteLogo: currentEmoji });

 // Auto-sync removal to backend
 try {
 adminFetch('/api/config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 logoType: 'emoji',
 logoImageUrl: '',
 removeLogo: true,
 websiteLogo: currentEmoji
 })
 });
 } catch (_) {}

 // Broadcast removal to citizen portal
 try {
 localStorage.setItem('climate_brand_logo_updated', JSON.stringify({
 logoType: 'emoji',
 logoImageUrl: '',
 websiteLogo: currentEmoji,
 timestamp: Date.now()
 }));
 if (window.BroadcastChannel) {
 const bc = new BroadcastChannel('climate_config_channel');
 bc.postMessage({ type: 'LOGO_UPDATED', logoImageUrl: '', logoType: 'emoji', websiteLogo: currentEmoji, timestamp: Date.now() });
 bc.close();
 }
 } catch (_) {}

 const statusEl = document.getElementById('cms-logo-status');
 if (statusEl) statusEl.textContent = 'Image logo removed. Switched to symbol mode.';
}

// Hero Banner Image Upload
async function handleHeroFileSelect(event) {
 const file = event.target.files[0];
 if (!file) return;

 try {
 const result = await uploadImageFile(file, 'hero');
 document.getElementById('cms-hero-image-url').value = result.url;
 const img = document.getElementById('cms-hero-preview-img');
 const ph = document.getElementById('cms-hero-placeholder');
 if (img) {
 img.src = result.url;
 img.style.display = 'block';
 }
 if (ph) ph.style.display = 'none';
 const removeBtn = document.getElementById('btn-remove-hero-img');
 if (removeBtn) removeBtn.style.display = 'inline-block';
 loadMediaGallery();
 } catch (err) {
 alert(err.message);
 } finally {
 event.target.value = '';
 }
}

function handleRemoveHeroImage() {
 document.getElementById('cms-hero-image-url').value = '';
 const img = document.getElementById('cms-hero-preview-img');
 const ph = document.getElementById('cms-hero-placeholder');
 if (img) {
 img.src = '';
 img.style.display = 'none';
 }
 if (ph) ph.style.display = 'block';
 const removeBtn = document.getElementById('btn-remove-hero-img');
 if (removeBtn) removeBtn.style.display = 'none';
}

// About System Graphic Upload
async function handleAboutFileSelect(event) {
 const file = event.target.files[0];
 if (!file) return;

 try {
 const result = await uploadImageFile(file, 'about');
 document.getElementById('cms-about-image-url').value = result.url;
 const img = document.getElementById('cms-about-preview-img');
 const ph = document.getElementById('cms-about-placeholder');
 if (img) {
 img.src = result.url;
 img.style.display = 'block';
 }
 if (ph) ph.style.display = 'none';
 const removeBtn = document.getElementById('btn-remove-about-img');
 if (removeBtn) removeBtn.style.display = 'inline-block';
 loadMediaGallery();
 } catch (err) {
 alert(err.message);
 } finally {
 event.target.value = '';
 }
}

function handleRemoveAboutImage() {
 document.getElementById('cms-about-image-url').value = '';
 const img = document.getElementById('cms-about-preview-img');
 const ph = document.getElementById('cms-about-placeholder');
 if (img) {
 img.src = '';
 img.style.display = 'none';
 }
 if (ph) ph.style.display = 'block';
 const removeBtn = document.getElementById('btn-remove-about-img');
 if (removeBtn) removeBtn.style.display = 'none';
}

let activeInfoCardIdx = null;
function triggerInfoCardUpload(idx) {
 activeInfoCardIdx = idx;
 document.getElementById('cms-info-card-file-input').click();
}

async function handleInfoCardFileSelect(event) {
 const file = event.target.files[0];
 if (!file || activeInfoCardIdx === null) return;
 const statusEl = document.getElementById(`info-card-img-status-${activeInfoCardIdx}`);
 if (statusEl) statusEl.textContent = ' Uploading...';

 try {
 const result = await uploadImageFile(file, 'info_card');
 document.getElementById(`info-card-image-${activeInfoCardIdx}`).value = result.url;
 if (statusEl) statusEl.textContent = ' Uploaded!';
 loadMediaGallery();
 } catch (err) {
 alert(err.message);
 if (statusEl) statusEl.textContent = ' Error';
 } finally {
 event.target.value = '';
 activeInfoCardIdx = null;
 }
}

// Media Gallery Loader
async function loadMediaGallery() {
 const grid = document.getElementById('admin-media-gallery-grid');
 if (!grid) return;

 try {
 const res = await adminFetch('/api/admin/uploads');
 if (!res.ok) return;
 const data = await res.json();
 const uploads = data.uploads || [];

 if (uploads.length === 0) {
 grid.innerHTML = `<div style="grid-column: 1/-1; color:#94a3b8; font-size:0.85rem; padding:1.5rem; text-align:center; background:#061009; border-radius:8px;">No media files uploaded yet. Upload a logo, hero banner, announcement poster, or guide diagram to see it here.</div>`;
 return;
 }

 grid.innerHTML = uploads.map(item => `
 <div class="media-gallery-card">
 <div class="media-thumb-box">
 <img src="${item.url}" alt="${item.filename}">
 </div>
 <div style="font-size:0.75rem; font-weight:700; color:#fff; word-break:break-all; line-height:1.2;">
 ${item.filename}
 </div>
 <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#94a3b8;">
 <span style="background:#133320; color:#34d399; padding:0.1rem 0.4rem; border-radius:4px; text-transform:uppercase;">${item.category || 'media'}</span>
 <span>${(item.size / 1024).toFixed(1)} KB</span>
 </div>
 <div style="display:flex; gap:0.35rem; margin-top:0.25rem;">
 <button type="button" onclick="copyMediaUrl('${item.url}')" class="btn-admin-outline" style="flex:1; font-size:0.7rem; padding:0.25rem 0.4rem;">
 Copy Link
 </button>
 <button type="button" onclick="deleteMediaAsset('${item.filename}')" class="btn-admin-danger" style="font-size:0.7rem; padding:0.25rem 0.45rem;">
 
 </button>
 </div>
 </div>
 `).join('');
 } catch (err) {
 console.error('Failed to load media gallery:', err);
 }
}

function copyMediaUrl(url) {
 const full = window.location.origin + url;
 navigator.clipboard.writeText(full).then(() => {
 alert(`Copied image URL to clipboard:\n${full}`);
 }).catch(() => {
 alert(`Image URL: ${full}`);
 });
}

async function deleteMediaAsset(filename) {
 if (!confirm(`Delete image asset "${filename}"?`)) return;
 try {
 const res = await adminFetch(`/api/admin/uploads/${encodeURIComponent(filename)}`, { method: 'DELETE' });
 if (res.ok) {
 loadMediaGallery();
 }
 } catch (e) {
 alert('Failed to delete image asset.');
 }
}

// 3. Website CMS & Branding (Dynamic Hotlines & Municipal Content)
let adminHotlinesList = [];

const HOTLINE_CATEGORY_OPTIONS = [
  { value: 'rescue', label: 'Disaster & Rescue (CDRRMO / Emergency)', category: 'rescue' },
  { value: 'denr', label: 'Environmental Protection (DENR / CENRO)', category: 'denr' },
  { value: 'health', label: 'Health & Heat Helpline (DOH / City Health)', category: 'health' },
  { value: 'fire', label: 'Fire Department (BFP)', category: 'fire' },
  { value: 'police', label: 'Police Assistance (PNP)', category: 'police' },
  { value: 'water', label: 'Coast Guard & Water Search (PCG)', category: 'water' },
  { value: 'ambulance', label: 'Medical Ambulance Dispatch', category: 'ambulance' },
  { value: 'general', label: 'General Municipal Helpline', category: 'general' }
];

function renderAdminHotlinesUI() {
  const container = document.getElementById('cms-hotlines-list-container');
  if (!container) return;

  if (adminHotlinesList.length === 0) {
    container.innerHTML = `
      <div style="background: var(--surface-alt); border: 1.5px dashed var(--border); border-radius: 10px; padding: 1.5rem; text-align: center; color: var(--text-muted);">
        <p style="margin-bottom: 0.75rem; font-size: 0.88rem; font-weight: 600; color: var(--text-main);">No emergency hotlines currently configured.</p>
        <button type="button" class="btn-admin-primary" onclick="addNewHotlineRow()" style="font-size: 0.82rem; padding: 0.5rem 1rem;">Add First Emergency Hotline</button>
      </div>
    `;
    return;
  }

  container.innerHTML = adminHotlinesList.map((item, idx) => `
    <div class="admin-hotline-card" data-index="${idx}" style="background: #FFFFFF; border: 1.5px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.04); border-radius: 12px; padding: 1.25rem; position: relative;">
      <!-- Card Header: Index Badge & Reordering / Delete -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; border-bottom: 1px solid var(--border); padding-bottom: 0.65rem; flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="status-pill status-verified" style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase;">HOTLINE #${idx + 1}</span>
          <strong style="font-size: 0.92rem; color: var(--text-main);">${escapeHtml(item.name || 'Emergency Contact')}</strong>
          ${item.note ? `<span style="font-size: 0.72rem; background: var(--primary-tint); color: var(--primary-dark); padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700;">${escapeHtml(item.note)}</span>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          <button type="button" class="btn-admin-outline" onclick="moveHotlineRow(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.35; cursor:not-allowed;"' : ''} title="Move Up" style="padding: 0.3rem 0.65rem; font-size: 0.75rem; font-weight: 700;">Move Up</button>
          <button type="button" class="btn-admin-outline" onclick="moveHotlineRow(${idx}, 1)" ${idx === adminHotlinesList.length - 1 ? 'disabled style="opacity:0.35; cursor:not-allowed;"' : ''} title="Move Down" style="padding: 0.3rem 0.65rem; font-size: 0.75rem; font-weight: 700;">Move Down</button>
          <button type="button" class="btn-admin-danger" onclick="deleteHotlineRow(${idx})" title="Delete Hotline" style="padding: 0.3rem 0.75rem; font-size: 0.75rem; margin-left: 0.25rem;">Delete</button>
        </div>
      </div>

      <!-- Card Inputs Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
        <div>
          <label style="display:block; font-size:0.78rem; font-weight:700; margin-bottom:0.35rem; color:var(--text-main);">Agency / Service Name</label>
          <input type="text" class="admin-input" value="${escapeHtml(item.name || '')}" oninput="updateHotlineField(${idx}, 'name', this.value)" placeholder="e.g. Municipal Disaster Rescue" required style="font-size:0.85rem; padding:0.6rem 0.85rem;">
        </div>
        <div>
          <label style="display:block; font-size:0.78rem; font-weight:700; margin-bottom:0.35rem; color:var(--text-main);">Hotline / Contact Number</label>
          <input type="text" class="admin-input" value="${escapeHtml(item.number || '')}" oninput="updateHotlineField(${idx}, 'number', this.value)" placeholder="e.g. (02) 8888-ECO or 911" required style="font-size:0.85rem; padding:0.6rem 0.85rem; font-weight:800; color:var(--primary-dark);">
        </div>
        <div>
          <label style="display:block; font-size:0.78rem; font-weight:700; margin-bottom:0.35rem; color:var(--text-main);">Availability / Schedule Note</label>
          <input type="text" class="admin-input" value="${escapeHtml(item.note || '')}" oninput="updateHotlineField(${idx}, 'note', this.value)" placeholder="e.g. 24/7 Rapid Response, Toll-Free" style="font-size:0.85rem; padding:0.6rem 0.85rem;">
        </div>
        <div>
          <label style="display:block; font-size:0.78rem; font-weight:700; margin-bottom:0.35rem; color:var(--text-main);">Service Category</label>
          <select class="admin-select" onchange="updateHotlineCategory(${idx}, this.value)" style="font-size:0.85rem; padding:0.6rem 0.85rem;">
            ${HOTLINE_CATEGORY_OPTIONS.map(opt => `
              <option value="${opt.category}" ${item.category === opt.category ? 'selected' : ''}>${opt.label}</option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>
  `).join('');

  // Sync legacy hidden inputs
  if (document.getElementById('cms-emergency-hotline')) {
    document.getElementById('cms-emergency-hotline').value = adminHotlinesList[0]?.number || '';
  }
  if (document.getElementById('cms-denr-hotline')) {
    document.getElementById('cms-denr-hotline').value = adminHotlinesList[1]?.number || '';
  }
  if (document.getElementById('cms-health-hotline')) {
    document.getElementById('cms-health-hotline').value = adminHotlinesList[2]?.number || '';
  }
}

function addNewHotlineRow(initialData) {
  const newHotline = initialData || {
    id: 'hotline_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: 'Municipal Emergency Service',
    number: '',
    note: '24/7 Rapid Response',
    icon: '',
    category: 'rescue'
  };
  adminHotlinesList.push(newHotline);
  renderAdminHotlinesUI();

  setTimeout(() => {
    const inputs = document.querySelectorAll('#cms-hotlines-list-container input[type="text"]');
    if (inputs.length > 0) {
      inputs[inputs.length - 3].focus();
    }
  }, 60);
}

function deleteHotlineRow(index) {
  if (adminHotlinesList.length <= 1) {
    if (!confirm('This is the only configured emergency hotline. Are you sure you want to remove it?')) return;
  }
  adminHotlinesList.splice(index, 1);
  renderAdminHotlinesUI();
}

function moveHotlineRow(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= adminHotlinesList.length) return;
  const temp = adminHotlinesList[index];
  adminHotlinesList[index] = adminHotlinesList[targetIndex];
  adminHotlinesList[targetIndex] = temp;
  renderAdminHotlinesUI();
}

function updateHotlineField(index, field, value) {
  if (adminHotlinesList[index]) {
    adminHotlinesList[index][field] = value;
    if (field === 'number') {
      if (index === 0 && document.getElementById('cms-emergency-hotline')) {
        document.getElementById('cms-emergency-hotline').value = value;
      } else if (index === 1 && document.getElementById('cms-denr-hotline')) {
        document.getElementById('cms-denr-hotline').value = value;
      } else if (index === 2 && document.getElementById('cms-health-hotline')) {
        document.getElementById('cms-health-hotline').value = value;
      }
    }
  }
}

function updateHotlineCategory(index, categoryValue) {
  if (adminHotlinesList[index]) {
    adminHotlinesList[index].category = categoryValue;
    adminHotlinesList[index].icon = '';
    renderAdminHotlinesUI();
  }
}

// 3. Website CMS & Branding
async function loadCMSData() {
 try {
 const res = await fetch('/api/config');
 const data = await res.json();
 const config = data.config || {};

 // Header branding sync
 document.getElementById('admin-header-title').textContent = config.websiteName || 'Climate Action';
 updateAdminHeaderLogo(config);

 // Form inputs
 document.getElementById('cms-website-name').value = config.websiteName || '';
 document.getElementById('cms-website-subtitle').value = config.websiteSubtitle || '';
 document.getElementById('cms-website-logo').value = config.websiteLogo || '';

  // Populate dynamic hotlines
  if (Array.isArray(config.emergencyHotlines) && config.emergencyHotlines.length > 0) {
    adminHotlinesList = JSON.parse(JSON.stringify(config.emergencyHotlines));
  } else {
    adminHotlinesList = [
      { id: 'hotline-rescue', name: 'Municipal Disaster Rescue', number: config.emergencyHotline || '(02) 8888-ECO', note: '24/7 Rapid Response', icon: '', category: 'rescue' },
      { id: 'hotline-denr', name: 'DENR Environmental Hotline', number: config.denrHotline || '#911-DENR', note: 'Enforcement & Violations', icon: '', category: 'denr' },
      { id: 'hotline-health', name: 'City Health & Heat Helpline', number: config.healthHotline || '(02) 8999-CLIMATE', note: 'Medical & Climate Health', icon: '', category: 'health' }
    ];
  }
  renderAdminHotlinesUI();

  // Climate Info Cards
  const infoCards = config.climateInformation || [];
  for (let i = 1; i <= 6; i++) {
    const item = infoCards[i - 1] || {};
    if (document.getElementById(`info-card-title-${i}`)) {
      document.getElementById(`info-card-title-${i}`).value = item.title || '';
      document.getElementById(`info-card-desc-${i}`).value = item.desc || '';
      document.getElementById(`info-card-image-${i}`).value = item.image || '';
      if (item.image) {
        document.getElementById(`info-card-img-status-${i}`).textContent = ' Image Set';
        document.getElementById(`info-card-img-status-${i}`).style.color = '#34d399';
      }
    }
  }

  // Animation Toggle
  document.getElementById('cms-enable-animation').checked = config.enableNatureAnimations || false;

  // Response Protocol
  const protocol = config.responseProtocol || [];
  for (let i = 1; i <= 3; i++) {
    const item = protocol[i - 1] || {};
    if (document.getElementById(`protocol-title-${i}`)) {
      document.getElementById(`protocol-title-${i}`).value = item.title || '';
      document.getElementById(`protocol-desc-${i}`).value = item.desc || '';
    }
  }

 // Logo state & Image preview
 const logoUrl = config.logoImageUrl || '';
 const logoType = (logoUrl && config.logoType !== 'emoji') ? 'image' : (config.logoType || (logoUrl ? 'image' : 'emoji'));
 document.getElementById('cms-logo-type').value = logoType;
 document.getElementById('cms-logo-image-url').value = logoUrl;

 const previewImg = document.getElementById('cms-logo-preview-img');
 const previewPh = document.getElementById('cms-logo-preview-placeholder');
 const removeBtn = document.getElementById('btn-remove-logo-img');

 if (logoUrl) {
 if (previewImg) {
 previewImg.src = logoUrl;
 previewImg.style.display = 'block';
 }
 if (previewPh) previewPh.style.display = 'none';
 if (removeBtn) removeBtn.style.display = 'inline-block';
 setLogoMode('image');
 } else {
 if (previewImg) previewImg.style.display = 'none';
 if (previewPh) previewPh.style.display = 'block';
 if (removeBtn) removeBtn.style.display = 'none';
 setLogoMode(logoType);
 }

 // Hero Banner Image
 const heroUrl = config.heroImageUrl || '';
 document.getElementById('cms-hero-image-url').value = heroUrl;
 const heroImg = document.getElementById('cms-hero-preview-img');
 const heroPh = document.getElementById('cms-hero-placeholder');
 const removeHeroBtn = document.getElementById('btn-remove-hero-img');
 if (heroUrl) {
 if (heroImg) {
 heroImg.src = heroUrl;
 heroImg.style.display = 'block';
 }
 if (heroPh) heroPh.style.display = 'none';
 if (removeHeroBtn) removeHeroBtn.style.display = 'inline-block';
 } else {
 if (heroImg) heroImg.style.display = 'none';
 if (heroPh) heroPh.style.display = 'block';
 if (removeHeroBtn) removeHeroBtn.style.display = 'none';
 }

 // About System Graphic
 const aboutUrl = config.aboutImageUrl || '';
 document.getElementById('cms-about-image-url').value = aboutUrl;
 const aboutImg = document.getElementById('cms-about-preview-img');
 const aboutPh = document.getElementById('cms-about-placeholder');
 const removeAboutBtn = document.getElementById('btn-remove-about-img');
 if (aboutUrl) {
 if (aboutImg) {
 aboutImg.src = aboutUrl;
 aboutImg.style.display = 'block';
 }
 if (aboutPh) aboutPh.style.display = 'none';
 if (removeAboutBtn) removeAboutBtn.style.display = 'inline-block';
 } else {
 if (aboutImg) aboutImg.style.display = 'none';
 if (aboutPh) aboutPh.style.display = 'block';
 if (removeAboutBtn) removeAboutBtn.style.display = 'none';
 }

 document.getElementById('cms-climate-change').value = config.climateChangeInfo || '';
 document.getElementById('cms-climate-action').value = config.climateActionInfo || '';
 document.getElementById('cms-climate-awareness').value = config.climateAwarenessInfo || '';
 document.getElementById('cms-reporting-guide').value = config.reportingGuideInfo || '';

 document.getElementById('cms-about-website').value = config.aboutWebsite || '';
 document.getElementById('cms-why-created').value = config.whyCreated || '';
 document.getElementById('cms-who-created').value = config.whoCreated || '';
 document.getElementById('cms-partners').value = config.contactPartners || '';
 } catch (e) {
 console.error('Failed to load CMS data:', e);
 }
}

async function handleSaveCMS(e) {
 e.preventDefault();

 const logoUrlVal = document.getElementById('cms-logo-image-url').value.trim();
 let logoTypeVal = document.getElementById('cms-logo-type').value || (logoUrlVal ? 'image' : 'emoji');
 if (logoUrlVal) {
 logoTypeVal = 'image';
 }

  // Clean and validate emergency hotlines list
  const cleanHotlines = adminHotlinesList
    .filter(h => h && ((h.name && h.name.trim()) || (h.number && h.number.trim())))
    .map(h => ({
      id: h.id || ('hotline_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
      name: (h.name || '').trim(),
      number: (h.number || '').trim(),
      note: (h.note || '').trim(),
      icon: '',
      category: h.category || 'general'
    }));

  const primaryRescue = cleanHotlines[0]?.number || (document.getElementById('cms-emergency-hotline') ? document.getElementById('cms-emergency-hotline').value.trim() : '');
  const primaryDenr = cleanHotlines[1]?.number || (document.getElementById('cms-denr-hotline') ? document.getElementById('cms-denr-hotline').value.trim() : '');
  const primaryHealth = cleanHotlines[2]?.number || (document.getElementById('cms-health-hotline') ? document.getElementById('cms-health-hotline').value.trim() : '');

  const updates = {
    websiteName: document.getElementById('cms-website-name').value.trim(),
    websiteSubtitle: document.getElementById('cms-website-subtitle').value.trim(),
    websiteLogo: document.getElementById('cms-website-logo').value.trim(),
    logoType: logoTypeVal,
    logoImageUrl: logoUrlVal,
    heroImageUrl: document.getElementById('cms-hero-image-url').value.trim(),
    aboutImageUrl: document.getElementById('cms-about-image-url').value.trim(),
    emergencyHotlines: cleanHotlines,
    emergencyHotline: primaryRescue,
    denrHotline: primaryDenr,
    healthHotline: primaryHealth,

    climateChangeInfo: document.getElementById('cms-climate-change').value.trim(),
    climateActionInfo: document.getElementById('cms-climate-action').value.trim(),
    climateAwarenessInfo: document.getElementById('cms-climate-awareness').value.trim(),
    reportingGuideInfo: document.getElementById('cms-reporting-guide').value.trim(),

    aboutWebsite: document.getElementById('cms-about-website').value.trim(),
    whyCreated: document.getElementById('cms-why-created').value.trim(),
    whoCreated: document.getElementById('cms-who-created').value.trim(),
    contactPartners: document.getElementById('cms-partners').value.trim(),
    enableNatureAnimations: document.getElementById('cms-enable-animation').checked,

    climateInformation: [],
    responseProtocol: []
  };

  // Collect Climate Info Cards
  for (let i = 1; i <= 6; i++) {
    if (document.getElementById(`info-card-title-${i}`)) {
      updates.climateInformation.push({
        title: document.getElementById(`info-card-title-${i}`).value.trim(),
        desc: document.getElementById(`info-card-desc-${i}`).value.trim(),
        image: document.getElementById(`info-card-image-${i}`).value.trim()
      });
    }
  }

  // Collect Response Protocol
  for (let i = 1; i <= 3; i++) {
    if (document.getElementById(`protocol-title-${i}`)) {
      updates.responseProtocol.push({
        stage: `Stage ${i}`,
        title: document.getElementById(`protocol-title-${i}`).value.trim(),
        desc: document.getElementById(`protocol-desc-${i}`).value.trim()
      });
    }
  }

 try {
 const res = await adminFetch('/api/config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(updates)
 });
 if (res.ok) {
 document.getElementById('admin-header-title').textContent = updates.websiteName;
 updateAdminHeaderLogo(updates);

 // Broadcast changes across browser tabs immediately
 try {
 localStorage.setItem('climate_site_config', JSON.stringify(updates));
 localStorage.setItem('climate_config_updated', String(Date.now()));
 localStorage.setItem('climate_brand_logo_updated', JSON.stringify({
 logoType: updates.logoType,
 logoImageUrl: updates.logoImageUrl,
 websiteName: updates.websiteName,
 timestamp: Date.now()
 }));
 if (window.BroadcastChannel) {
 const bc = new BroadcastChannel('climate_config_channel');
 bc.postMessage({ type: 'CONFIG_UPDATED', config: updates, timestamp: Date.now() });
 bc.close();
 }
 } catch (_) {}

 alert(' All Website Information, Logo & Media Branding updated successfully! These changes are immediately active on the citizen website.');
 } else {
 alert('Failed to save website configuration.');
 }
 } catch (err) {
  alert('Network error saving CMS configuration.');
  }
}

// 4. Weather & Climate Advisory
async function loadWeatherData() {
 try {
 const res = await fetch('/api/weather');
 const data = await res.json();
 const w = data.weather || {};

 document.getElementById('kpi-admin-temp').textContent = `${w.temperature || 32}°C (Heat Index ${w.heatIndex || 38}°C)`;

 document.getElementById('weather-temp').value = w.temperature || 32;
 document.getElementById('weather-heat-index').value = w.heatIndex || 38;
 document.getElementById('weather-alert-level').value = w.alertLevel || 'Yellow';
 document.getElementById('weather-aqi').value = w.airQuality || 'Moderate (AQI 68)';
 document.getElementById('weather-typhoon').value = w.typhoonSignal || 'None';
 document.getElementById('weather-condition').value = w.condition || 'Partly Cloudy';
 document.getElementById('weather-advisory-notice').value = w.advisoryNotice || '';
 document.getElementById('weather-safety-tip').value = w.safetyTip || '';
 } catch (e) {
 console.error('Failed to load weather data:', e);
 }
}

async function handleSaveWeather(e) {
 e.preventDefault();

 const updates = {
 temperature: parseInt(document.getElementById('weather-temp').value) || 32,
 heatIndex: parseInt(document.getElementById('weather-heat-index').value) || 38,
 alertLevel: document.getElementById('weather-alert-level').value,
 airQuality: document.getElementById('weather-aqi').value.trim(),
 typhoonSignal: document.getElementById('weather-typhoon').value.trim(),
 condition: document.getElementById('weather-condition').value.trim(),
 advisoryNotice: document.getElementById('weather-advisory-notice').value.trim(),
 safetyTip: document.getElementById('weather-safety-tip').value.trim(),
 updatedBy: currentAdmin ? currentAdmin.name : 'Administrator'
 };

 try {
 const res = await adminFetch('/api/weather', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(updates)
 });
 if (res.ok) {
 alert(' Climate Advisory and Weather Condition broadcasted successfully to all users!');
 loadStats();
 } else {
 alert('Failed to update weather condition.');
 }
 } catch (err) {
 alert('Network error saving weather advisory.');
 }
}

// 5. Announcements & Notifications
async function handleAnnouncementImageSelect(event) {
 const file = event.target.files[0];
 if (!file) return;

 try {
 const result = await uploadImageFile(file, 'announcement');
 document.getElementById('ann-image-url').value = result.url;
 const previewBox = document.getElementById('ann-image-preview-box');
 const previewThumb = document.getElementById('ann-image-preview-thumb');
 const filenameEl = document.getElementById('ann-image-filename');

 if (previewThumb) previewThumb.src = result.url;
 if (filenameEl) filenameEl.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
 if (previewBox) previewBox.style.display = 'flex';
 loadMediaGallery();
 } catch (err) {
 alert(err.message);
 } finally {
 event.target.value = '';
 }
}

function clearAnnouncementImage() {
 const urlInput = document.getElementById('ann-image-url');
 if (urlInput) urlInput.value = '';
 const previewBox = document.getElementById('ann-image-preview-box');
 if (previewBox) previewBox.style.display = 'none';
 const fileInput = document.getElementById('ann-image-file');
 if (fileInput) fileInput.value = '';
}

async function loadAnnouncements() {
  try {
    const res = await adminFetch('/api/announcements?all=1');
    const data = await res.json();
    const list = data.announcements || [];

    const container = document.getElementById('admin-announcements-list');
    if (list.length === 0) {
      container.innerHTML = `<div style="color:#94a3b8; font-size:0.85rem;">No announcements published yet.</div>`;
      return;
    }

    container.innerHTML = list.map(a => `
      <div style="background:#09160d; border:1px solid #1c4228; border-radius:10px; padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; opacity: ${a.hidden ? '0.6' : '1'};">
        <div style="flex:1; min-width:250px;">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap;">
            <span class="badge-${(a.priority || 'normal').toLowerCase()}">${a.priority || 'Normal'}</span>
            <span style="font-weight:700; color:#fff; font-size:0.95rem;">${escapeHtml(a.title)}</span>
            <span style="font-size:0.75rem; color:#94a3b8;">(${escapeHtml(a.category || 'General')})</span>
            ${a.hidden ? `<span style="font-size:0.7rem; padding:0.1rem 0.4rem; border-radius:4px; background:#7f1d1d; color:#fca5a5; font-weight:700;">Hidden</span>` : `<span style="font-size:0.7rem; padding:0.1rem 0.4rem; border-radius:4px; background:#065f46; color:#a7f3d0; font-weight:700;">Public</span>`}
          </div>
          <p style="font-size:0.85rem; color:#cbd5e1; line-height:1.5;">${escapeHtml(a.content || a.body || '')}</p>
          ${(a.image_url || a.imageUrl) ? `
            <div style="margin-top:0.6rem;">
              <img src="${a.image_url || a.imageUrl}" alt="${escapeHtml(a.title)}" style="max-height:120px; max-width:240px; border-radius:6px; object-fit:cover; border:1px solid #1c4228;">
            </div>
          ` : ''}
          <div style="font-size:0.75rem; color:#64748b; margin-top:0.4rem;">
            By ${escapeHtml(a.created_by || a.author || 'Super Admin')} • ${new Date(a.created_at || a.timestamp || Date.now()).toLocaleString()}
          </div>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button onclick="toggleHideAnnouncement('${a.id}', ${!!a.hidden})" class="btn-admin-outline" style="font-size:0.75rem; padding:0.35rem 0.7rem;">
            ${a.hidden ? 'Unhide' : 'Hide'}
          </button>
          <button onclick="deleteAnnouncement('${a.id}')" class="btn-admin-danger" style="font-size:0.75rem; padding:0.35rem 0.7rem;">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load announcements:', e);
  }
}

async function toggleHideAnnouncement(id, isCurrentlyHidden) {
  try {
    const res = await adminFetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleHide: !isCurrentlyHidden })
    });
    if (res.ok) {
      loadAnnouncements();
    }
  } catch (e) {
    alert('Network error toggling announcement visibility.');
  }
}

async function handleCreateAnnouncement(e) {
  e.preventDefault();

  const newAnn = {
    title: document.getElementById('ann-title').value.trim(),
    category: document.getElementById('ann-category').value,
    priority: document.getElementById('ann-priority').value,
    content: document.getElementById('ann-content').value.trim(),
    imageUrl: document.getElementById('ann-image-url').value.trim(),
    author: currentAdmin ? currentAdmin.name : 'Administration',
    pinned: true
  };

  try {
    const res = await adminFetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnn)
    });

    if (res.ok) {
      document.getElementById('admin-announcement-form').reset();
      clearAnnouncementImage();
      await loadAnnouncements();
      alert('Announcement published successfully! All online and visiting citizens will receive this update.');
    } else {
      alert('Failed to publish announcement.');
    }
  } catch (err) {
    alert('Network error publishing announcement.');
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Are you sure you want to delete this announcement?')) return;
  try {
    const res = await adminFetch(`/api/announcements/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadAnnouncements();
    }
  } catch (e) {
    alert('Network error deleting announcement.');
  }
}

// 6. User Information & Guides
async function loadUsersData() {
  try {
    const res = await adminFetch('/api/admin/users');
    const data = await res.json();
    allUsers = data.users || [];

    document.getElementById('admin-user-count-badge').textContent = `Total Registered Users: ${data.totalUsers} • Active Today: ${data.activeToday}`;

    const tbody = document.getElementById('admin-users-table-body');
    if (allUsers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:1.5rem; color:#94a3b8;">No registered citizens yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allUsers.map(u => {
      const userPhoto = u.avatar || u.avatar_url || u.avatarUrl || '';
      const initials = (u.fullName || u.name || 'C').split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase();

      return `
        <tr>
          <td style="font-weight:700; color:#38bdf8;">${escapeHtml(u.id)}</td>
          <td style="font-weight:700; color:#fff;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              ${userPhoto ? `
                <img src="${userPhoto}" alt="${escapeHtml(u.name)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border:1px solid #10b981;">
              ` : `
                <div style="width:32px; height:32px; border-radius:50%; background:#1e293b; color:#10b981; font-weight:800; font-size:0.75rem; display:flex; align-items:center; justify-content:center; border:1px solid #334155;">
                  ${initials}
                </div>
              `}
              <span>${escapeHtml(u.fullName || u.name)}</span>
            </div>
          </td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.phone || 'N/A')}</td>
          <td>${escapeHtml(u.barangay || 'Metro Verde')}</td>
          <td>
            <span style="padding:0.2rem 0.5rem; border-radius:4px; font-size:0.72rem; font-weight:700; background:${u.kycStatus === 'verified' ? '#065f46' : (u.kycStatus === 'pending' ? '#b45309' : '#334155')}; color:#fff;">
              ${escapeHtml(u.kycStatus || 'unverified')}
            </span>
          </td>
          <td><span style="color:#10b981; font-weight:800;">${u.ecoPoints || u.eco_points || 0} pts</span></td>
          <td>${u.reportsCount || 0}</td>
          <td>
            <span style="padding:0.2rem 0.5rem; border-radius:4px; font-size:0.75rem; font-weight:700; background:${u.status === 'Active' ? '#065f46' : '#7f1d1d'}; color:#fff;">
              ${escapeHtml(u.status)}
            </span>
          </td>
          <td>
            <button onclick="toggleUserStatus('${u.id}', '${u.status}')" class="btn-admin-outline" style="padding:0.3rem 0.65rem; font-size:0.75rem;">
              ${u.status === 'Active' ? 'Suspend' : 'Activate'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    console.error('Failed to load users data:', e);
  }
}

async function toggleUserStatus(userId, currentStatus) {
 const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
 try {
 const res = await adminFetch(`/api/admin/users/${userId}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: newStatus })
 });
 if (res.ok) {
 loadUsersData();
 }
 } catch (e) {
 alert('Network error updating user status.');
 }
}

// =========================================================================
// 6.5. CITIZEN KYC IDENTITY VERIFICATION MANAGEMENT
// =========================================================================
let allKycSubmissions = [];
let kycCurrentFilter = 'all';

async function loadKycSubmissions() {
 try {
 const res = await adminFetch('/api/admin/kyc/submissions');
 if (!res.ok) throw new Error('Failed to fetch KYC queue');
 const data = await res.json();
 allKycSubmissions = data.submissions || [];

 // Update KPI Counters
 const counts = data.counts || {};
 const pendingCount = counts.pending || 0;
 const verifiedCount = counts.verified || 0;
 const rejectedCount = counts.rejected || 0;
 const totalCount = counts.total || allKycSubmissions.length;

 const pendEl = document.getElementById('admin-kyc-pending-count');
 const verEl = document.getElementById('admin-kyc-verified-count');
 const rejEl = document.getElementById('admin-kyc-rejected-count');
 const totEl = document.getElementById('admin-kyc-total-count');
 const pillEl = document.getElementById('admin-kyc-pending-pill');

 if (pendEl) pendEl.textContent = pendingCount;
 if (verEl) verEl.textContent = verifiedCount;
 if (rejEl) rejEl.textContent = rejectedCount;
 if (totEl) totEl.textContent = totalCount;

 if (pillEl) {
 if (pendingCount > 0) {
 pillEl.textContent = pendingCount;
 pillEl.style.display = 'inline-block';
 } else {
 pillEl.style.display = 'none';
 }
 }

 renderKycCards();
 } catch (e) {
 console.error('Error loading KYC submissions:', e);
 }
}

function filterKycSubmissions(filter) {
 kycCurrentFilter = filter;
 ['all', 'pending', 'verified', 'rejected'].forEach(f => {
 const btn = document.getElementById(`btn-filter-kyc-${f}`);
 if (btn) {
 if (f === filter) btn.classList.add('active');
 else btn.classList.remove('active');
 }
 });
 renderKycCards();
}

function renderKycCards() {
 const container = document.getElementById('admin-kyc-cards-container');
 if (!container) return;

 let filtered = allKycSubmissions;
 if (kycCurrentFilter === 'pending') {
 filtered = allKycSubmissions.filter(s => s.kycStatus === 'pending');
 } else if (kycCurrentFilter === 'verified') {
 filtered = allKycSubmissions.filter(s => s.kycStatus === 'verified');
 } else if (kycCurrentFilter === 'rejected') {
 filtered = allKycSubmissions.filter(s => s.kycStatus === 'rejected');
 }

 if (filtered.length === 0) {
 container.innerHTML = `
 <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: #0b1a10; border: 1px dashed #1c4228; border-radius: 12px; color: #94a3b8;">
 <div style="font-size: 2.5rem; margin-bottom: 0.5rem;"></div>
 <div style="font-weight: 700; color: #fff; font-size: 1.1rem;">No ${kycCurrentFilter !== 'all' ? kycCurrentFilter.toUpperCase() : ''} KYC Submissions Found</div>
 <div style="font-size: 0.85rem; margin-top: 0.35rem;">Citizens who upload valid documents will appear here for administrative verification.</div>
 </div>
 `;
 return;
 }

 container.innerHTML = filtered.map(item => {
 const status = item.kycStatus || 'unverified';
 const isPending = status === 'pending';
 const isVerified = status === 'verified';
 const isRejected = status === 'rejected';

 let badgeColor = '#64748B';
 let badgeText = 'Unverified';
 if (isPending) {
 badgeColor = '#DC2626';
 badgeText = 'Pending Review';
 } else if (isVerified) {
 badgeColor = '#059669';
 badgeText = 'Verified Citizen';
 } else if (isRejected) {
 badgeColor = '#D97706';
 badgeText = 'Rejected';
 }

 const frontImg = item.kycFrontImage || '';
 const backImg = item.kycBackImage || '';
 const selfieImg = item.kycSelfieImage || '';

 const submitDate = item.kycSubmittedAt ? new Date(item.kycSubmittedAt).toLocaleDateString() : 'N/A';

  return `
 <div class="admin-card" style="border-top: 4px solid ${badgeColor}; display: flex; flex-direction: column; justify-content: space-between; background: #FFFFFF;">
 <div>
 <!-- Header -->
 <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
 <div>
 <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">${escapeHtml(item.name)}</h4>
 <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
 ${escapeHtml(item.email)} • ${escapeHtml(item.phone || 'N/A')}
 </div>
 <div style="font-size: 0.78rem; color: var(--primary-dark); font-weight: 700; margin-top: 0.15rem;">
 ${escapeHtml(item.barangay || 'Metro Verde')}
 </div>
 </div>
 <span style="background: ${badgeColor}; color: #FFFFFF; padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 800;">
 ${badgeText}
 </span>
 </div>

 <!-- Document Info -->
 <div style="background: var(--surface-alt); padding: 0.85rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border); font-size: 0.82rem;">
 <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
 <span style="color: var(--text-muted); font-weight: 600;">Document Type:</span>
 <strong style="color: var(--primary-dark); font-weight: 800;">${escapeHtml(item.kycIdType || 'Not specified')}</strong>
 </div>
 <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
 <span style="color: var(--text-muted); font-weight: 600;">ID / Document #:</span>
 <strong style="color: var(--text-main); font-family: monospace; font-weight: 800;">${escapeHtml(item.kycIdNumber || 'N/A')}</strong>
 </div>
 <div style="display: flex; justify-content: space-between;">
 <span style="color: var(--text-muted); font-weight: 600;">Submitted Date:</span>
 <span style="color: var(--text-main); font-weight: 600;">${submitDate}</span>
 </div>
 ${item.kycRejectReason ? `
 <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border); color: var(--red-dark); font-size: 0.78rem;">
 <strong>Rejection Reason:</strong> ${escapeHtml(item.kycRejectReason)}
 </div>
 ` : ''}
 </div>

 <!-- Document Image Thumbnails with Zoom trigger -->
 <div style="margin-bottom: 1rem;">
 <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem;">
 Attached Proof Documents (Click to Enlarge):
 </div>
 <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">
 <div onclick="openAdminKycZoomModal('${frontImg}', 'Front of Valid ID', '${escapeHtml(item.name)} - ${escapeHtml(item.kycIdType || '')}')" style="cursor: pointer; position: relative; border-radius: 6px; overflow: hidden; border: 1px solid #1c4228;">
 <img src="${frontImg}" alt="Front of ID" style="width: 100%; height: 75px; object-fit: cover;">
 <div style="background: rgba(0,0,0,0.7); color: #fff; font-size: 0.65rem; text-align: center; padding: 0.15rem;">Front ID</div>
 </div>
 <div onclick="openAdminKycZoomModal('${backImg}', 'Back of Valid ID', '${escapeHtml(item.name)} - ${escapeHtml(item.kycIdType || '')}')" style="cursor: pointer; position: relative; border-radius: 6px; overflow: hidden; border: 1px solid #1c4228;">
 <img src="${backImg}" alt="Back of ID" style="width: 100%; height: 75px; object-fit: cover;">
 <div style="background: rgba(0,0,0,0.7); color: #fff; font-size: 0.65rem; text-align: center; padding: 0.15rem;">Back ID</div>
 </div>
 <div onclick="openAdminKycZoomModal('${selfieImg}', 'Selfie Holding ID', '${escapeHtml(item.name)}')" style="cursor: pointer; position: relative; border-radius: 6px; overflow: hidden; border: 1px solid #1c4228;">
 <img src="${selfieImg}" alt="Selfie with ID" style="width: 100%; height: 75px; object-fit: cover;">
 <div style="background: rgba(0,0,0,0.7); color: #fff; font-size: 0.65rem; text-align: center; padding: 0.15rem;">Selfie + ID</div>
 </div>
 </div>
 </div>
 </div>

 <!-- Action Controls -->
 <div style="padding-top: 0.75rem; border-top: 1px solid #1c4228; display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap;">
 ${isVerified ? `
 <button onclick="handleAdminKycReview('${item.id}', 'reverify')" class="btn-admin-outline" style="padding: 0.45rem 0.75rem; font-size: 0.8rem; color: #60a5fa; border-color: #1e40af;">
 Set for Re-verification
 </button>
 ` : `
 <button onclick="handleAdminKycReview('${item.id}', 'approve')" class="btn-admin-primary" style="padding: 0.45rem 0.9rem; font-size: 0.8rem; background: #059669; border-color: #10B981;">
 Approve & Verify
 </button>
 <button onclick="handleAdminKycReview('${item.id}', 'reject')" class="btn-admin-outline" style="padding: 0.45rem 0.75rem; font-size: 0.8rem; color: #f87171; border-color: #7f1d1d;">
 Reject
 </button>
 `}
 </div>
 </div>
 `;
 }).join('');
}

async function handleAdminKycReview(userId, action) {
 let reason = '';
 if (action === 'reject') {
 reason = prompt('Please specify reason for rejecting this KYC application:', 'ID image was blurry, expired, or document number did not match.');
 if (reason === null) return; // cancelled
 }

 try {
 const res = await adminFetch('/api/admin/kyc/review', {
 method: 'POST',
 body: JSON.stringify({ userId, action, reason })
 });
 const data = await res.json();
 if (!res.ok) {
 alert(data.error || 'Failed to complete review');
 return;
 }

 alert(`Success: Citizen KYC status updated to ${action === 'approve' ? 'VERIFIED' : 'REJECTED'}.`);
 loadKycSubmissions();
 loadUsersData();
 } catch (err) {
 alert('Network error communicating with CENRO server.');
 }
}

function openAdminKycZoomModal(imgSrc, title, subtitle) {
 const modal = document.getElementById('admin-kyc-zoom-modal');
 const img = document.getElementById('kyc-zoom-img');
 const titleEl = document.getElementById('kyc-zoom-modal-title');
 const subEl = document.getElementById('kyc-zoom-modal-sub');

 if (img) img.src = imgSrc;
 if (titleEl) titleEl.textContent = title;
 if (subEl) subEl.textContent = subtitle;
 if (modal) modal.style.display = 'flex';
}

function closeAdminKycZoomModal() {
 const modal = document.getElementById('admin-kyc-zoom-modal');
 if (modal) modal.style.display = 'none';
}

// User Guides Diagram Handlers
async function handleGuideImageSelect(event) {
 const file = event.target.files[0];
 if (!file) return;

 try {
 const result = await uploadImageFile(file, 'guide');
 document.getElementById('guide-image-url').value = result.url;
 const previewBox = document.getElementById('guide-image-preview-box');
 const previewThumb = document.getElementById('guide-image-preview-thumb');
 const filenameEl = document.getElementById('guide-image-filename');

 if (previewThumb) previewThumb.src = result.url;
 if (filenameEl) filenameEl.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
 if (previewBox) previewBox.style.display = 'flex';
 loadMediaGallery();
 } catch (err) {
 alert(err.message);
 } finally {
 event.target.value = '';
 }
}

function clearGuideImage() {
 const urlInput = document.getElementById('guide-image-url');
 if (urlInput) urlInput.value = '';
 const previewBox = document.getElementById('guide-image-preview-box');
 if (previewBox) previewBox.style.display = 'none';
 const fileInput = document.getElementById('guide-image-file');
 if (fileInput) fileInput.value = '';
}

// User Guides
async function loadUserGuides() {
 try {
 const res = await fetch('/api/user-guides');
 const data = await res.json();
 const guides = data.guides || [];

 const container = document.getElementById('admin-guides-list');
 if (guides.length === 0) {
 container.innerHTML = `<div style="color:#94a3b8; font-size:0.85rem;">No citizen guides added yet.</div>`;
 return;
 }

 container.innerHTML = guides.map(g => `
 <div style="background:#09160d; border:1px solid #1c4228; border-radius:10px; padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
 <div style="flex:1; min-width:250px;">
 <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
 <span style="font-size:1.2rem;">${g.icon || ''}</span>
 <span style="font-weight:700; color:#fff; font-size:0.95rem;">${g.title}</span>
 <span style="font-size:0.75rem; color:#34d399;">[${g.category}]</span>
 </div>
 <p style="font-size:0.82rem; color:#cbd5e1; margin-bottom:0.5rem;">${g.summary || ''}</p>
 ${g.imageUrl ? `
 <div style="margin-bottom:0.6rem;">
 <img src="${g.imageUrl}" alt="${g.title}" style="max-height:110px; max-width:220px; border-radius:6px; object-fit:cover; border:1px solid #1c4228;">
 </div>
 ` : ''}
 <div style="font-size:0.78rem; color:#94a3b8; background:#061009; padding:0.5rem 0.75rem; border-radius:6px; font-family:monospace;">
 ${g.content}
 </div>
 </div>
 <button onclick="deleteGuide('${g.id}')" class="btn-admin-danger" style="font-size:0.75rem; padding:0.35rem 0.7rem;">
 Delete
 </button>
 </div>
 `).join('');
 } catch (e) {
 console.error('Failed to load user guides:', e);
 }
}

async function handleCreateGuide(e) {
 e.preventDefault();

 const newGuide = {
 title: document.getElementById('guide-title').value.trim(),
 icon: document.getElementById('guide-icon').value.trim() || '',
 category: document.getElementById('guide-category').value,
 summary: document.getElementById('guide-summary').value.trim(),
 content: document.getElementById('guide-content').value.trim(),
 imageUrl: document.getElementById('guide-image-url').value.trim()
 };

 try {
 const res = await adminFetch('/api/user-guides', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(newGuide)
 });
 if (res.ok) {
 document.getElementById('admin-guide-form').reset();
 clearGuideImage();
 loadUserGuides();
 alert('Guide added to user website!');
 }
 } catch (err) {
 alert('Network error adding guide.');
 }
}

async function deleteGuide(id) {
 if (!confirm('Delete this user guide?')) return;
 try {
 const res = await adminFetch(`/api/user-guides/${id}`, { method: 'DELETE' });
 if (res.ok) loadUserGuides();
 } catch (e) {
 alert('Network error deleting guide.');
 }
}

// 7. Sub-Admin Management (Super Admin Area)
async function loadSubAdminsData() {
 try {
 const res = await adminFetch('/api/admin/sub-admins');
 const data = await res.json();
 allSubAdmins = data.admins || [];

 const tbody = document.getElementById('subadmins-table-body');
 if (allSubAdmins.length === 0) {
 tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:#94a3b8;">No sub-admins configured.</td></tr>`;
 return;
 }

 tbody.innerHTML = allSubAdmins.map(a => `
 <tr>
 <td style="font-weight:700; color:#fff;">
 ${a.name}
 ${a.role === 'super_admin' ? ' <span class="admin-badge-super">SUPER</span>' : ''}
 </td>
 <td>${a.email}</td>
 <td style="font-size:0.8rem; color:#94a3b8;">${a.department || 'CENRO'}</td>
 <td>
 ${a.role === 'super_admin' ? '<span class="permission-chip" style="background:#f59e0b; color:#000;">FULL SYSTEM ACCESS</span>' :
 (a.permissions || []).map(p => `<span class="permission-chip">${p.replace('can_', '').replace('_', ' ')}</span>`).join('')}
 </td>
 <td>
 <span style="padding:0.2rem 0.5rem; border-radius:4px; font-size:0.75rem; font-weight:700; background:#065f46; color:#fff;">
 ${a.status}
 </span>
 </td>
 <td>
 ${a.role === 'super_admin' ? '<span style="color:#64748b; font-size:0.75rem;">Primary Admin</span>' : `
 <button onclick="deleteSubAdmin('${a.id}')" class="btn-admin-danger" style="padding:0.3rem 0.65rem; font-size:0.75rem;">
 Revoke Access
 </button>
 `}
 </td>
 </tr>
 `).join('');
 } catch (e) {
 console.error('Failed to load sub-admins:', e);
 }
}

async function handleCreateSubAdmin(e) {
 e.preventDefault();

 const permissions = [];
 if (document.getElementById('perm-triage').checked) permissions.push('can_triage_reports');
 if (document.getElementById('perm-announcements').checked) permissions.push('can_post_announcements');
 if (document.getElementById('perm-weather').checked) permissions.push('can_manage_weather');
 if (document.getElementById('perm-cms').checked) permissions.push('can_edit_cms');
 if (document.getElementById('perm-users').checked) permissions.push('can_manage_users');

 const newSub = {
 name: document.getElementById('subadmin-name').value.trim(),
 email: document.getElementById('subadmin-email').value.trim(),
 password: document.getElementById('subadmin-password').value.trim(),
 department: document.getElementById('subadmin-dept').value.trim(),
 permissions: permissions
 };

 try {
 const res = await adminFetch('/api/admin/sub-admins', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(newSub)
 });
 const data = await res.json();

 if (res.ok) {
 document.getElementById('create-subadmin-form').reset();
 loadSubAdminsData();
 alert(`Sub-admin account provisioned for ${newSub.name} with customized permission limits.`);
 } else {
 alert(data.error || 'Failed to create sub-admin.');
 }
 } catch (err) {
 alert('Network error creating sub-admin account.');
 }
}

async function deleteSubAdmin(id) {
 if (!confirm('Are you sure you want to revoke this sub-admin account?')) return;
 try {
 const res = await adminFetch(`/api/admin/sub-admins/${id}`, { method: 'DELETE' });
 if (res.ok) {
 loadSubAdminsData();
 alert('Sub-admin access revoked.');
 } else {
 alert('Cannot delete this account.');
 }
 } catch (e) {
 alert('Network error deleting sub-admin.');
 }
}

// 8. Super Admin Settings (Credentials Update)
function loadSuperAdminSettings() {
 if (!currentAdmin) return;
 document.getElementById('settings-admin-name').value = currentAdmin.name || 'Mark Kenneth Ulgasan';
 document.getElementById('settings-admin-email').value = currentAdmin.email || 'markkennethulgasan@gmail.com';
 if (document.getElementById('settings-admin-dept')) {
 document.getElementById('settings-admin-dept').value = currentAdmin.department || 'Executive Directorate & System Administration';
 }
 if (document.getElementById('settings-admin-phone')) {
 document.getElementById('settings-admin-phone').value = currentAdmin.phone || '+63 917 123 4567';
 }
 if (document.getElementById('settings-current-email-badge')) {
 document.getElementById('settings-current-email-badge').textContent = currentAdmin.email || 'markkennethulgasan@gmail.com';
 }
 document.getElementById('settings-current-password').value = '';
 document.getElementById('settings-new-password').value = '';
 if (document.getElementById('settings-confirm-password')) {
 document.getElementById('settings-confirm-password').value = '';
 }
}

async function handleSaveSuperAdminSettings(e) {
 e.preventDefault();

 const name = document.getElementById('settings-admin-name').value.trim();
 const email = document.getElementById('settings-admin-email').value.trim();
 const department = document.getElementById('settings-admin-dept') ? document.getElementById('settings-admin-dept').value.trim() : '';
 const phone = document.getElementById('settings-admin-phone') ? document.getElementById('settings-admin-phone').value.trim() : '';
 const currentPassword = document.getElementById('settings-current-password').value.trim();
 const newPassword = document.getElementById('settings-new-password').value.trim();
 const confirmPassword = document.getElementById('settings-confirm-password') ? document.getElementById('settings-confirm-password').value.trim() : '';

 const successBox = document.getElementById('settings-success-msg');
 const errorBox = document.getElementById('settings-error-msg');
 successBox.style.display = 'none';
 errorBox.style.display = 'none';

 if (!currentPassword) {
 errorBox.textContent = 'Please enter your current password to verify and authorize changes.';
 errorBox.style.display = 'block';
 return;
 }

 if (newPassword) {
 if (newPassword.length < 4) {
 errorBox.textContent = 'New password must be at least 4 characters long.';
 errorBox.style.display = 'block';
 return;
 }
 if (confirmPassword && newPassword !== confirmPassword) {
 errorBox.textContent = 'New password and confirmation password do not match.';
 errorBox.style.display = 'block';
 return;
 }
 }

 const payload = { name, email, department, phone, currentPassword };
 if (newPassword) payload.newPassword = newPassword;

 try {
 const res = await adminFetch('/api/admin/settings/super-admin', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });
 const data = await res.json();

 if (res.ok) {
 currentAdmin = { ...currentAdmin, ...data.superAdmin };
 localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(currentAdmin));

 document.getElementById('admin-profile-name').textContent = currentAdmin.name;
 if (document.getElementById('admin-profile-dept')) {
 document.getElementById('admin-profile-dept').textContent = currentAdmin.department || 'LGU CENRO';
 }
 if (document.getElementById('settings-current-email-badge')) {
 document.getElementById('settings-current-email-badge').textContent = currentAdmin.email;
 }

 successBox.textContent = ' Super Admin credentials and administrative profile updated successfully!';
 successBox.style.display = 'block';
 document.getElementById('settings-current-password').value = '';
 document.getElementById('settings-new-password').value = '';
 if (document.getElementById('settings-confirm-password')) {
 document.getElementById('settings-confirm-password').value = '';
 }
 } else {
 errorBox.textContent = data.error || 'Failed to update super admin credentials';
 errorBox.style.display = 'block';
 }
 } catch (err) {
 errorBox.textContent = 'Network error updating super admin settings';
 errorBox.style.display = 'block';
 }
}

// ==========================================
// SUPABASE CLOUD DATABASE SETTINGS & SYNC
// ==========================================
async function loadSupabaseStatus() {
 const pill = document.getElementById('supabase-status-pill');
 const schemaBox = document.getElementById('supabase-sql-schema');
 const urlInput = document.getElementById('supabase-input-url');

 const dbBadge = document.getElementById('supabase-db-badge');
 const storageBadge = document.getElementById('supabase-storage-badge');
 const usersBadge = document.getElementById('supabase-users-badge');
 const repCount = document.getElementById('supabase-count-reports');
 const cfgStatus = document.getElementById('supabase-status-config');
 const usrCount = document.getElementById('supabase-count-users');

 if (pill) {
 pill.textContent = 'Checking...';
 pill.style.background = '#1e293b';
 pill.style.color = '#94a3b8';
 }

 try {
 const res = await adminFetch('/api/admin/supabase-status');
 const data = await res.json();
 if (!res.ok) return;

 if (schemaBox && data.sqlSchema) {
 schemaBox.value = data.sqlSchema;
 }

 const st = data.status || {};
 if (pill) {
 if (st.connected) {
 pill.textContent = ' Auto-Connected';
 pill.style.background = '#065f46';
 pill.style.color = '#a7f3d0';
 } else if (st.configured) {
 pill.textContent = ' Configured (Testing...)';
 pill.style.background = '#854d0e';
 pill.style.color = '#fde68a';
 } else {
 pill.textContent = ' Awaiting Credentials';
 pill.style.background = '#334155';
 pill.style.color = '#cbd5e1';
 }
 }

 // Database Card
 if (dbBadge) {
 if (st.connected) {
 dbBadge.textContent = 'Active';
 dbBadge.style.background = '#065f46';
 dbBadge.style.color = '#a7f3d0';
 } else {
 dbBadge.textContent = 'Offline';
 dbBadge.style.background = '#7f1d1d';
 dbBadge.style.color = '#fecaca';
 }
 }
 if (repCount) repCount.textContent = (reportsStore ? reportsStore.length : '--');
 if (cfgStatus) cfgStatus.textContent = st.connected ? 'Active' : 'Offline';

 // Storage Card
 if (storageBadge) {
 if (st.storageConnected) {
 storageBadge.textContent = 'Ready';
 storageBadge.style.background = '#065f46';
 storageBadge.style.color = '#a7f3d0';
 } else if (st.connected) {
 storageBadge.textContent = 'Needs SQL';
 storageBadge.style.background = '#854d0e';
 storageBadge.style.color = '#fde68a';
 } else {
 storageBadge.textContent = 'Offline';
 storageBadge.style.background = '#334155';
 storageBadge.style.color = '#94a3b8';
 }
 }

 // Users Card
 if (usersBadge) {
 if (st.usersTableReady) {
 usersBadge.textContent = 'Synced';
 usersBadge.style.background = '#065f46';
 usersBadge.style.color = '#a7f3d0';
 } else if (st.connected) {
 usersBadge.textContent = 'Needs Table SQL';
 usersBadge.style.background = '#854d0e';
 usersBadge.style.color = '#fde68a';
 } else {
 usersBadge.textContent = 'Local Cache';
 usersBadge.style.background = '#334155';
 usersBadge.style.color = '#94a3b8';
 }
 }
 if (usrCount) usrCount.textContent = (userStore ? userStore.length : '--');

 if (urlInput && st.supabaseUrl && !urlInput.value) {
 urlInput.placeholder = st.supabaseUrl;
 }
 } catch (err) {
 if (pill) {
 pill.textContent = ' Offline';
 pill.style.background = '#7f1d1d';
 pill.style.color = '#fecaca';
 }
 }
}

async function triggerSupabaseAutoConnect() {
 const autoBtn = document.getElementById('btn-autoconnect-supabase');
 const resMsg = document.getElementById('supabase-result-msg');
 if (autoBtn) {
 autoBtn.disabled = true;
 autoBtn.textContent = ' Auto-Connecting...';
 }
 if (resMsg) {
 resMsg.style.display = 'block';
 resMsg.style.background = '#1e293b';
 resMsg.style.color = '#cbd5e1';
 resMsg.textContent = 'Connecting to Supabase Database, Storage, and Accounts...';
 }

 try {
 const res = await adminFetch('/api/admin/supabase-auto-connect', { method: 'POST' });
 const data = await res.json();
 if (autoBtn) {
 autoBtn.disabled = false;
 autoBtn.textContent = ' Auto Connect';
 }

 if (res.ok && data.success) {
 if (resMsg) {
 resMsg.style.background = '#065f46';
 resMsg.style.color = '#a7f3d0';
 resMsg.textContent = ' ' + (data.message || 'Auto-connected successfully!');
 }
 loadSupabaseStatus();
 } else {
 if (resMsg) {
 resMsg.style.background = '#7f1d1d';
 resMsg.style.color = '#fecaca';
 resMsg.textContent = ' Auto-connection warning: ' + (data.message || data.error || 'Failed to auto-connect');
 }
 loadSupabaseStatus();
 }
 } catch (err) {
 if (autoBtn) {
 autoBtn.disabled = false;
 autoBtn.textContent = ' Auto Connect';
 }
 if (resMsg) {
 resMsg.style.background = '#7f1d1d';
 resMsg.style.color = '#fecaca';
 resMsg.textContent = 'Network error during auto-connect.';
 }
 }
}

async function handleSaveSupabaseConfig(e) {
 e.preventDefault();
 const url = document.getElementById('supabase-input-url').value.trim();
 const key = document.getElementById('supabase-input-key').value.trim();
 const resMsg = document.getElementById('supabase-result-msg');
 const saveBtn = document.getElementById('btn-save-supabase');

 if (!url || !key) return;

 if (saveBtn) {
 saveBtn.disabled = true;
 saveBtn.textContent = ' Saving & Connecting...';
 }
 if (resMsg) resMsg.style.display = 'none';

 try {
 const res = await adminFetch('/api/admin/supabase-config', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 supabaseUrl: url,
 supabaseKey: key,
 isServiceRole: key.includes('service_role') || key.length > 100
 })
 });
 const data = await res.json();

 if (saveBtn) {
 saveBtn.disabled = false;
 saveBtn.textContent = ' Save & Connect';
 }

 if (res.ok && data.success) {
 if (resMsg) {
 resMsg.style.display = 'block';
 resMsg.style.background = '#065f46';
 resMsg.style.color = '#a7f3d0';
 resMsg.textContent = ' ' + data.message;
 }
 loadSupabaseStatus();
 } else {
 if (resMsg) {
 resMsg.style.display = 'block';
 resMsg.style.background = '#7f1d1d';
 resMsg.style.color = '#fecaca';
 resMsg.textContent = ' ' + (data.error || 'Failed to save and connect');
 }
 }
 } catch (err) {
 if (saveBtn) {
 saveBtn.disabled = false;
 saveBtn.textContent = ' Save & Connect';
 }
 if (resMsg) {
 resMsg.style.display = 'block';
 resMsg.style.background = '#7f1d1d';
 resMsg.style.color = '#fecaca';
 resMsg.textContent = 'Network error saving Supabase credentials.';
 }
 }
}

async function testSupabaseConnection() {
 const pill = document.getElementById('supabase-status-pill');
 const resMsg = document.getElementById('supabase-result-msg');
 if (pill) {
 pill.textContent = 'Testing...';
 pill.style.background = '#1e293b';
 }

 try {
 const res = await adminFetch('/api/admin/supabase-test', { method: 'POST' });
 const data = await res.json();
 if (resMsg) resMsg.style.display = 'block';

 if (data.connected) {
 if (resMsg) {
 resMsg.style.background = '#065f46';
 resMsg.style.color = '#a7f3d0';
 let extra = '';
 if (data.storage && !data.storage.ready) {
 extra = ' (Notice: Storage bucket needs SQL setup script)';
 }
 resMsg.textContent = ' Supabase Connection Successful! ' + (data.message || '') + extra;
 }
 if (pill) {
 pill.textContent = ' Auto-Connected';
 pill.style.background = '#065f46';
 pill.style.color = '#a7f3d0';
 }
 loadSupabaseStatus();
 } else {
 if (resMsg) {
 resMsg.style.display = 'block';
 resMsg.style.background = '#7f1d1d';
 resMsg.style.color = '#fecaca';
 resMsg.textContent = ' Connection failed: ' + (data.error || 'Could not connect to Supabase');
 }
 if (pill) {
 pill.textContent = ' Connection Error';
 pill.style.background = '#7f1d1d';
 pill.style.color = '#fecaca';
 }
 }
 } catch (err) {
 if (resMsg) {
 resMsg.style.display = 'block';
 resMsg.style.background = '#7f1d1d';
 resMsg.style.color = '#fecaca';
 resMsg.textContent = 'Network error testing Supabase connection.';
 }
 }
}

async function triggerSupabaseSync() {
 const resMsg = document.getElementById('supabase-result-msg');
 if (resMsg) {
 resMsg.style.display = 'block';
 resMsg.style.background = '#1e293b';
 resMsg.style.color = '#cbd5e1';
 resMsg.textContent = ' Synchronizing local and remote data...';
 }

 try {
 const res = await adminFetch('/api/admin/supabase-sync', { method: 'POST' });
 const data = await res.json();
 if (resMsg) {
 if (res.ok && data.success) {
 resMsg.style.background = '#065f46';
 resMsg.style.color = '#a7f3d0';
 resMsg.textContent = ` ${data.message} (${data.reportsCount || 0} reports, ${data.usersCount || 0} users)`;
 loadSupabaseStatus();
 } else {
 resMsg.style.background = '#7f1d1d';
 resMsg.style.color = '#fecaca';
 resMsg.textContent = ' Sync error: ' + (data.error || 'Could not sync');
 }
 }
 } catch (err) {
 if (resMsg) {
 resMsg.style.background = '#7f1d1d';
 resMsg.style.color = '#fecaca';
 resMsg.textContent = 'Network error synchronizing with Supabase.';
 }
 }
}

function copySupabaseSchema() {
 const schemaBox = document.getElementById('supabase-sql-schema');
 const btn = document.getElementById('btn-copy-supabase-sql');
 if (!schemaBox) return;
 schemaBox.select();
 navigator.clipboard.writeText(schemaBox.value).then(() => {
 if (btn) {
 const orig = btn.innerHTML;
 btn.innerHTML = ' Copied to Clipboard!';
 setTimeout(() => { btn.innerHTML = orig; }, 2500);
 }
 }).catch(() => {
 document.execCommand('copy');
 if (btn) btn.innerHTML = ' Copied!';
 });
}

async function triggerBackgroundUpload() {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = "image/*";
  input.onchange = async (e) => {
    const files = e.target.files;
    if (files.length > 3) { alert("Maximum 3 background images allowed."); return; }
    
    // Upload logic placeholder...
    alert("Background image upload triggered. Functionality placeholder implemented.");
  };
  input.click();
}

// ==========================================
// SQLITE RELATIONAL DATABASE MANAGEMENT
// ==========================================
async function loadDatabaseStatus() {
  const pill = document.getElementById('sqlite-status-pill');
  const engineEl = document.getElementById('sqlite-engine-name');
  const totalEl = document.getElementById('sqlite-total-records');
  const sizeEl = document.getElementById('sqlite-file-size');
  const tbody = document.getElementById('sqlite-tables-tbody');

  try {
    const res = await adminFetch('/api/admin/database/status');
    const data = await res.json();
    if (res.ok && data.tables) {
      if (pill) {
        pill.textContent = 'Active & Synced';
        pill.style.background = 'var(--primary-tint)';
        pill.style.color = 'var(--primary-dark)';
      }
      if (engineEl) engineEl.textContent = data.engine || 'SQLite 3 (WASM)';
      if (totalEl) totalEl.textContent = Number(data.totalRecords || 0).toLocaleString();
      if (sizeEl) sizeEl.textContent = 'Size: ' + (data.sizeFormatted || '0 KB');

      if (tbody && Array.isArray(data.tables)) {
        tbody.innerHTML = data.tables.map(t => `
          <tr>
            <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: var(--primary-dark); font-family: monospace;">${escapeHtml(t.name)}</td>
            <td style="padding: 0.65rem 0.85rem; color: var(--text-muted);">${escapeHtml(t.desc)}</td>
            <td style="padding: 0.65rem 0.85rem; text-align: right; font-weight: 800; color: var(--text-main);">${Number(t.count || 0).toLocaleString()}</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    if (pill) {
      pill.textContent = 'Active (Local Storage)';
      pill.style.background = '#FEF3C7';
      pill.style.color = '#B45309';
    }
  }
}

async function downloadDatabaseBackup() {
  const msg = document.getElementById('sqlite-action-msg');
  if (msg) {
    msg.style.display = 'block';
    msg.style.background = 'var(--primary-tint)';
    msg.style.color = 'var(--primary-dark)';
    msg.textContent = 'Preparing SQLite binary database download...';
  }
  try {
    const res = await adminFetch('/api/admin/database/download');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to export SQLite database');
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `climate_database_backup_${Date.now()}.sqlite`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    if (msg) {
      msg.style.background = '#D1FAE5';
      msg.style.color = '#065F46';
      msg.textContent = 'SQLite database file (.sqlite) successfully downloaded!';
      setTimeout(() => { msg.style.display = 'none'; }, 4000);
    }
  } catch (err) {
    if (msg) {
      msg.style.background = '#FEE2E2';
      msg.style.color = '#991B1B';
      msg.textContent = 'Error: ' + err.message;
    }
  }
}

async function triggerDatabaseSync() {
  const msg = document.getElementById('sqlite-action-msg');
  if (msg) {
    msg.style.display = 'block';
    msg.style.background = 'var(--primary-tint)';
    msg.style.color = 'var(--primary-dark)';
    msg.textContent = 'Synchronizing all records into SQLite database...';
  }
  try {
    const res = await adminFetch('/api/admin/database/sync', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      if (msg) {
        msg.style.background = '#D1FAE5';
        msg.style.color = '#065F46';
        msg.textContent = data.message || 'Database synchronized!';
        setTimeout(() => { msg.style.display = 'none'; }, 4000);
      }
      loadDatabaseStatus();
    } else {
      throw new Error(data.error || 'Sync failed');
    }
  } catch (err) {
    if (msg) {
      msg.style.background = '#FEE2E2';
      msg.style.color = '#991B1B';
      msg.textContent = 'Sync error: ' + err.message;
    }
  }
}

// =========================================================================
// COMMUNITY ACTIVITIES & PARTICIPATION PROOFS MANAGEMENT
// =========================================================================
let adminActivitiesList = [];
let adminParticipationsList = [];
let currentProofFilter = 'all';

function switchActivitySubTab(subTab) {
  const btnManage = document.getElementById('btn-act-tab-manage');
  const btnProofs = document.getElementById('btn-act-tab-proofs');
  const subManage = document.getElementById('subtab-activities-manage');
  const subProofs = document.getElementById('subtab-activities-proofs');

  if (subTab === 'manage') {
    if (btnManage) btnManage.classList.add('active');
    if (btnProofs) btnProofs.classList.remove('active');
    if (subManage) subManage.style.display = 'block';
    if (subProofs) subProofs.style.display = 'none';
  } else {
    if (btnProofs) btnProofs.classList.add('active');
    if (btnManage) btnManage.classList.remove('active');
    if (subProofs) subProofs.style.display = 'block';
    if (subManage) subManage.style.display = 'none';
  }
}

async function loadAdminActivities() {
  try {
    const res = await adminFetch('/api/activities?all=1');
    const data = await res.json();
    adminActivitiesList = data.activities || [];

    const container = document.getElementById('admin-activities-list');
    if (!container) return;

    if (adminActivitiesList.length === 0) {
      container.innerHTML = `<div style="color:#94a3b8; font-size:0.85rem; padding:1.5rem; text-align:center; background:#061009; border-radius:8px;">No community activities created yet. Fill out the form above to add a movement drive.</div>`;
      return;
    }

    container.innerHTML = adminActivitiesList.map(act => {
      const actImg = act.image_url || act.imageUrl || '';
      return `
        <div style="background:#09160d; border:1px solid #1c4228; border-radius:10px; padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; opacity:${act.hidden ? '0.65' : '1'};">
          <div style="flex:1; min-width:260px;">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap;">
              <span class="badge-normal" style="background:#065f46; color:#a7f3d0; border-color:#059669; font-weight:800; font-size:0.75rem;">+${act.points || 50} Eco-Pts</span>
              <span style="font-weight:700; color:#fff; font-size:1rem;">${escapeHtml(act.title)}</span>
              <span style="font-size:0.75rem; color:#94a3b8;">(${escapeHtml(act.category || 'Drive')})</span>
              ${act.hidden ? `<span style="font-size:0.7rem; padding:0.1rem 0.4rem; border-radius:4px; background:#7f1d1d; color:#fca5a5; font-weight:700;">Hidden</span>` : `<span style="font-size:0.7rem; padding:0.1rem 0.4rem; border-radius:4px; background:#065f46; color:#a7f3d0; font-weight:700;">Visible</span>`}
            </div>
            <div style="font-size:0.82rem; color:#cbd5e1; margin:0.4rem 0; line-height:1.5;">
              <div><strong>Date & Time:</strong> ${escapeHtml(act.event_date || act.date || 'TBA')}</div>
              <div><strong>Location:</strong> ${escapeHtml(act.location || 'Metro Verde')}</div>
              <div><strong>Organizer:</strong> ${escapeHtml(act.organizer || 'LGU CENRO')}</div>
              <div><strong>Max Participants:</strong> ${act.max_participants || act.max || 100}</div>
            </div>
            <p style="font-size:0.84rem; color:#94a3b8; line-height:1.5; margin-top:0.35rem;">${escapeHtml(act.description || '')}</p>
            ${actImg ? `
              <div style="margin-top:0.6rem;">
                <img src="${actImg}" alt="${escapeHtml(act.title)}" style="max-height:100px; max-width:200px; border-radius:6px; object-fit:cover; border:1px solid #1c4228;">
              </div>
            ` : ''}
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button onclick="editAdminActivity('${act.id}')" class="btn-admin-outline" style="font-size:0.75rem; padding:0.35rem 0.7rem;">
              Edit
            </button>
            <button onclick="toggleHideAdminActivity('${act.id}', ${!!act.hidden})" class="btn-admin-outline" style="font-size:0.75rem; padding:0.35rem 0.7rem;">
              ${act.hidden ? 'Unhide' : 'Hide'}
            </button>
            <button onclick="deleteAdminActivity('${act.id}')" class="btn-admin-danger" style="font-size:0.75rem; padding:0.35rem 0.7rem;">
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Failed to load admin activities:', e);
  }
}

async function handleSaveAdminActivity(e) {
  e.preventDefault();

  const editId = document.getElementById('act-edit-id').value;
  const title = document.getElementById('act-title').value.trim();
  const category = document.getElementById('act-category').value;
  const eventDate = document.getElementById('act-event-date').value.trim();
  const location = document.getElementById('act-location').value.trim();
  const organizer = document.getElementById('act-organizer').value.trim();
  const points = Number(document.getElementById('act-points').value) || 100;
  const maxParticipants = Number(document.getElementById('act-max-participants').value) || 100;
  const isHidden = document.getElementById('act-hidden').checked;
  const description = document.getElementById('act-description').value.trim();
  const imageUrl = document.getElementById('act-image-url').value.trim();

  const activityData = {
    title,
    category,
    event_date: eventDate,
    location,
    organizer,
    points,
    max_participants: maxParticipants,
    hidden: isHidden ? 1 : 0,
    description,
    image_url: imageUrl
  };

  const btnSave = document.getElementById('btn-save-activity');
  const origBtnText = btnSave ? btnSave.textContent : '';
  if (btnSave) btnSave.textContent = 'Saving Activity...';

  try {
    const url = editId ? `/api/activities/${editId}` : '/api/activities';
    const method = editId ? 'PUT' : 'POST';

    const res = await adminFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    });

    if (res.ok) {
      resetActivityForm();
      await loadAdminActivities();
      alert(editId ? 'Community activity updated successfully!' : 'New community activity published to public portal!');
    } else {
      alert('Failed to save activity.');
    }
  } catch (err) {
    alert('Network error saving community activity.');
  } finally {
    if (btnSave) btnSave.textContent = origBtnText;
  }
}

function editAdminActivity(id) {
  const act = adminActivitiesList.find(a => a.id === id);
  if (!act) return;

  document.getElementById('act-edit-id').value = act.id;
  document.getElementById('act-title').value = act.title || '';
  document.getElementById('act-category').value = act.category || 'Environmental Drive';
  document.getElementById('act-event-date').value = act.event_date || act.date || '';
  document.getElementById('act-location').value = act.location || '';
  document.getElementById('act-organizer').value = act.organizer || '';
  document.getElementById('act-points').value = act.points || 100;
  document.getElementById('act-max-participants').value = act.max_participants || act.max || 100;
  document.getElementById('act-hidden').checked = !!act.hidden;
  document.getElementById('act-description').value = act.description || '';

  const actImg = act.image_url || act.imageUrl || '';
  document.getElementById('act-image-url').value = actImg;

  if (actImg) {
    const thumb = document.getElementById('act-image-preview-thumb');
    const filenameBox = document.getElementById('act-image-filename');
    const previewBox = document.getElementById('act-image-preview-box');
    if (thumb) thumb.src = actImg;
    if (filenameBox) filenameBox.textContent = 'Attached Activity Poster';
    if (previewBox) previewBox.style.display = 'flex';
  } else {
    clearActivityImage();
  }

  document.getElementById('admin-act-form-title').textContent = 'Edit Community Activity / Movement';
  document.getElementById('btn-save-activity').textContent = 'Update Community Activity';
  document.getElementById('btn-cancel-edit-activity').style.display = 'inline-block';

  window.scrollTo({ top: document.getElementById('admin-activity-form').offsetTop - 80, behavior: 'smooth' });
}

function resetActivityForm() {
  document.getElementById('act-edit-id').value = '';
  document.getElementById('admin-activity-form').reset();
  clearActivityImage();
  document.getElementById('admin-act-form-title').textContent = 'Add New Community Activity / Movement';
  document.getElementById('btn-save-activity').textContent = 'Publish Community Activity';
  document.getElementById('btn-cancel-edit-activity').style.display = 'none';
}

async function toggleHideAdminActivity(id, isCurrentlyHidden) {
  try {
    const res = await adminFetch(`/api/activities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleHide: !isCurrentlyHidden })
    });
    if (res.ok) {
      loadAdminActivities();
    }
  } catch (e) {
    alert('Network error toggling activity visibility.');
  }
}

async function deleteAdminActivity(id) {
  if (!confirm('Are you sure you want to delete this community activity? Associated participations will also be cleared.')) return;
  try {
    const res = await adminFetch(`/api/activities/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadAdminActivities();
      loadAdminParticipations();
    }
  } catch (e) {
    alert('Network error deleting activity.');
  }
}

async function handleActivityImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const result = await uploadImageFile(file, 'activity');
    if (result && result.url) {
      document.getElementById('act-image-url').value = result.url;
      const thumb = document.getElementById('act-image-preview-thumb');
      const filenameBox = document.getElementById('act-image-filename');
      const previewBox = document.getElementById('act-image-preview-box');
      if (thumb) thumb.src = result.url;
      if (filenameBox) filenameBox.textContent = file.name;
      if (previewBox) previewBox.style.display = 'flex';
    }
  } catch (err) {
    alert('Error uploading activity image: ' + err.message);
  }
}

function clearActivityImage() {
  document.getElementById('act-image-url').value = '';
  const fileInput = document.getElementById('act-image-file');
  if (fileInput) fileInput.value = '';
  const previewBox = document.getElementById('act-image-preview-box');
  if (previewBox) previewBox.style.display = 'none';
}

async function loadAdminParticipations() {
  try {
    const res = await adminFetch('/api/admin/activities/participations');
    const data = await res.json();
    adminParticipationsList = data.participations || [];

    const pendingList = adminParticipationsList.filter(p => p.status === 'Pending');
    const approvedList = adminParticipationsList.filter(p => p.status === 'Approved');
    const rejectedList = adminParticipationsList.filter(p => p.status === 'Rejected');

    const pendingCountEl = document.getElementById('admin-proofs-pending-count');
    const approvedCountEl = document.getElementById('admin-proofs-approved-count');
    const rejectedCountEl = document.getElementById('admin-proofs-rejected-count');
    const pointsTotalEl = document.getElementById('admin-proofs-points-total');
    const pendingPill = document.getElementById('admin-proofs-pending-pill');
    const actPendingBadge = document.getElementById('admin-act-pending-badge');

    const totalPointsAwarded = approvedList.reduce((sum, p) => sum + Number(p.points_awarded || 50), 0);

    if (pendingCountEl) pendingCountEl.textContent = pendingList.length;
    if (approvedCountEl) approvedCountEl.textContent = approvedList.length;
    if (rejectedCountEl) rejectedCountEl.textContent = rejectedList.length;
    if (pointsTotalEl) pointsTotalEl.textContent = `${totalPointsAwarded} pts`;

    if (pendingPill) {
      pendingPill.textContent = pendingList.length;
      pendingPill.style.display = pendingList.length > 0 ? 'inline-block' : 'none';
    }
    if (actPendingBadge) {
      actPendingBadge.textContent = pendingList.length;
    }

    renderAdminProofsContainer();
  } catch (e) {
    console.error('Failed to load admin participations:', e);
  }
}

function filterAdminProofs(filter) {
  currentProofFilter = filter;
  ['all', 'pending', 'approved', 'rejected'].forEach(f => {
    const btn = document.getElementById(`btn-filter-proof-${f}`);
    if (btn) {
      if (f === filter) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  renderAdminProofsContainer();
}

function renderAdminProofsContainer() {
  const container = document.getElementById('admin-proofs-container');
  if (!container) return;

  let filtered = adminParticipationsList;
  if (currentProofFilter === 'pending') filtered = adminParticipationsList.filter(p => p.status === 'Pending');
  if (currentProofFilter === 'approved') filtered = adminParticipationsList.filter(p => p.status === 'Approved');
  if (currentProofFilter === 'rejected') filtered = adminParticipationsList.filter(p => p.status === 'Rejected');

  if (filtered.length === 0) {
    container.innerHTML = `<div style="color:#94a3b8; font-size:0.85rem; padding:1.5rem; text-align:center; background:#061009; border-radius:8px;">No participation proof submissions in this queue.</div>`;
    return;
  }

  container.innerHTML = filtered.map(p => {
    let statusBg = '#334155';
    let statusText = p.status || 'Pending';
    if (p.status === 'Approved') statusBg = '#065f46';
    if (p.status === 'Rejected') statusBg = '#7f1d1d';
    if (p.status === 'Pending') statusBg = '#b45309';

    return `
      <div style="background:#09160d; border:1px solid #1c4228; border-radius:10px; padding:1rem; display:flex; flex-wrap:wrap; gap:1.25rem; align-items:flex-start; justify-content:space-between;">
        <div style="flex:1; min-width:280px;">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem; flex-wrap:wrap;">
            <span style="padding:0.2rem 0.55rem; border-radius:4px; font-size:0.72rem; font-weight:700; background:${statusBg}; color:#fff;">
              ${statusText}
            </span>
            <span style="font-weight:800; color:#10b981; font-size:0.95rem;">+${p.points_awarded || 50} Eco-Pts</span>
            <span style="font-weight:700; color:#fff; font-size:1rem;">${escapeHtml(p.activity_title)}</span>
          </div>

          <div style="background:#061009; border:1px solid #1c4228; padding:0.6rem 0.85rem; border-radius:8px; margin:0.5rem 0;">
            <div style="font-size:0.85rem; color:#fff; font-weight:700;">${escapeHtml(p.user_name)}</div>
            <div style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(p.user_email)} • ID: ${escapeHtml(p.user_id)}</div>
          </div>

          ${p.proof_description ? `<p style="font-size:0.85rem; color:#cbd5e1; line-height:1.5; margin:0.4rem 0;">${escapeHtml(p.proof_description)}</p>` : ''}

          <div style="font-size:0.75rem; color:#64748b; margin-top:0.4rem;">
            Submitted on ${new Date(p.submitted_at).toLocaleString()}
          </div>

          ${p.review_notes ? `
            <div style="margin-top:0.5rem; font-size:0.8rem; color:#a7f3d0; background:#065f46; padding:0.35rem 0.65rem; border-radius:6px; display:inline-block;">
              <strong>Admin Note:</strong> ${escapeHtml(p.review_notes)}
            </div>
          ` : ''}

          ${p.status === 'Pending' ? `
            <div style="margin-top:0.85rem; background:#061009; border:1px solid #1c4228; padding:0.75rem; border-radius:8px;">
              <label style="display:block; font-size:0.75rem; font-weight:700; color:#94a3b8; margin-bottom:0.35rem;">Review Note / Feedback (Optional):</label>
              <input type="text" id="proof-note-${p.id}" class="admin-input" style="font-size:0.8rem; padding:0.4rem; margin-bottom:0.65rem;" placeholder="e.g. Verified attendance at tree planting drive. Excellent work!">
              
              <div style="display:flex; gap:0.5rem;">
                <button onclick="reviewAdminProof('${p.id}', 'Approved')" class="btn-admin-primary" style="font-size:0.78rem; padding:0.45rem 0.85rem; background:#10b981; border-color:#059669;">
                  Approve & Grant +${p.points_awarded || 50} Points
                </button>
                <button onclick="reviewAdminProof('${p.id}', 'Rejected')" class="btn-admin-danger" style="font-size:0.78rem; padding:0.45rem 0.85rem;">
                  Reject Proof
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        ${p.proof_image_url ? `
          <div style="text-align:center;">
            <img src="${p.proof_image_url}" alt="Submitted Proof Photo" style="max-height:160px; max-width:220px; object-fit:cover; border-radius:8px; border:2px solid #1c4228; cursor:pointer;" onclick="window.open('${p.proof_image_url}', '_blank')">
            <div style="font-size:0.72rem; color:#94a3b8; margin-top:0.25rem;">Click photo to expand</div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

async function reviewAdminProof(submissionId, status) {
  const noteInput = document.getElementById(`proof-note-${submissionId}`);
  const notes = noteInput ? noteInput.value.trim() : '';

  try {
    const res = await adminFetch('/api/admin/activities/review-participation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, status, notes })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert(data.message || `Proof submission marked as ${status}.`);
      await loadAdminParticipations();
      await loadUsersData();
    } else {
      alert(data.error || 'Failed to review proof submission.');
    }
  } catch (err) {
    alert('Network error reviewing proof submission.');
  }
}

