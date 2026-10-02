// Climate Action Portal Client Application Logic
const CITIZEN_STORAGE_KEY = 'climate_action_citizen_session';

const state = {
  currentUser: null,
  config: null,
  weather: null,
  hotlines: [],
  announcements: [],
  activities: [],
  reports: []
};

let activityProofPhotoBase64 = '';
let reportPhotoBase64 = '';
let myParticipationsList = [];

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  loadSavedUserSession();
  await loadAllData();
  setupNavigation();
  updateAuthUI();
});

function loadSavedUserSession() {
  try {
    const raw = localStorage.getItem(CITIZEN_STORAGE_KEY);
    if (raw) {
      state.currentUser = JSON.parse(raw);
    }
  } catch (_) {}
}

async function loadAllData() {
  await Promise.all([
    fetchConfig(),
    fetchHotlines(),
    fetchWeather(),
    fetchAnnouncements(),
    fetchActivities(),
    fetchReports()
  ]);
}

async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data && data.config) {
      state.config = data.config;
      renderConfigData();
    }
  } catch (e) {
    console.warn('Config fetch error:', e);
  }
}

function renderConfigData() {
  if (!state.config) return;
  const logoEl = document.getElementById('header-brand-logo');
  const titleEl = document.getElementById('header-brand-title');
  const subEl = document.getElementById('header-brand-subtitle');
  const heroTitle = document.getElementById('hero-title-text');
  const heroSub = document.getElementById('hero-subtitle-text');

  if (logoEl && state.config.websiteLogo) logoEl.textContent = state.config.websiteLogo;
  if (titleEl && state.config.websiteName) titleEl.textContent = state.config.websiteName;
  if (subEl && state.config.websiteSubtitle) subEl.textContent = state.config.websiteSubtitle;
  if (heroTitle && state.config.heroTitle) heroTitle.textContent = state.config.heroTitle;
  if (heroSub && state.config.heroSubtitle) heroSub.textContent = state.config.heroSubtitle;
}

// Emergency Hotlines Rendering
async function fetchHotlines() {
  try {
    const res = await fetch('/api/hotlines');
    const data = await res.json();
    state.hotlines = data.hotlines || [];
    renderHotlines();
  } catch (e) {
    console.warn('Hotlines fetch fallback:', e);
    renderHotlines();
  }
}

function renderHotlines() {
  const container = document.getElementById('public-hotlines-container');
  if (!container) return;

  const hotlinesList = state.hotlines && state.hotlines.length > 0 ? state.hotlines : [
    { id: 'h1', name: 'CENRO Environmental Command Center', number: '(02) 8888-CENRO', note: 'Primary 24/7 Environmental Incident & Violation Dispatch', category: 'Environment & Hazards' },
    { id: 'h2', name: 'Municipal Disaster Risk Reduction (MDRRMO)', number: '(02) 8888-MDRRMO', note: 'Typhoon, Flood & Coastal Surge Emergency Rescue', category: 'Disaster Response' },
    { id: 'h3', name: 'DENR Regional Environmental Hotline', number: '#911-DENR', note: 'Protected Wildlife & Illegal Logging Enforcement', category: 'National Law Enforcement' },
    { id: 'h4', name: 'Metro Verde Municipal Fire Station', number: '(02) 8911-FIRE', note: 'Fire & Chemical Hazard Control Response Unit', category: 'Fire & Chemical Response' },
    { id: 'h5', name: 'Municipal Emergency Health & Rescue', number: '(02) 8911-RESCUE', note: 'Ambulance & Emergency Casualty Paramedic Triage', category: 'Medical & Ambulance' },
    { id: 'h6', name: 'Philippine National Police Sector Command', number: '(02) 8911-PNP', note: 'Public Safety & Environmental Patrol Sector', category: 'Police Enforcement' }
  ];

  container.innerHTML = hotlinesList.map(h => `
    <div class="hotline-card">
      <div>
        <span class="hotline-category-badge">${escapeHtml(h.category || 'Emergency Hotline')}</span>
        <h3 class="hotline-name">${escapeHtml(h.name)}</h3>
        <p class="hotline-note">${escapeHtml(h.note || '24/7 Municipal Response Center')}</p>
      </div>

      <div class="hotline-number-box">
        <a href="tel:${escapeHtml(h.number).replace(/[^0-9+]/g, '')}" class="hotline-number-link">${escapeHtml(h.number)}</a>
        <button class="btn-copy-num" onclick="copyHotline('${escapeHtml(h.number)}')">Copy</button>
      </div>
    </div>
  `).join('');

  // Quick hotline references on home page
  if (hotlinesList[0]) {
    const q1 = document.getElementById('quick-cenro-num');
    if (q1) q1.textContent = hotlinesList[0].number;
  }
  if (hotlinesList[1]) {
    const q2 = document.getElementById('quick-mdrrmo-num');
    if (q2) q2.textContent = hotlinesList[1].number;
  }
}

function copyHotline(number) {
  navigator.clipboard.writeText(number).then(() => {
    showToast(`Copied hotline number: ${number}`);
  }).catch(() => {
    showToast(`Hotline: ${number}`);
  });
}

// Weather
async function fetchWeather() {
  try {
    const res = await fetch('/api/weather');
    const data = await res.json();
    if (data && data.weather) {
      state.weather = data.weather;
      renderWeather();
    }
  } catch (e) {
    console.warn('Weather fetch error:', e);
  }
}

function renderWeather() {
  if (!state.weather) return;
  const temp = document.getElementById('weather-temp');
  const heat = document.getElementById('weather-heat');
  const cond = document.getElementById('weather-condition');
  const air = document.getElementById('weather-air');
  const badge = document.getElementById('weather-alert-badge');
  const notice = document.getElementById('weather-notice');

  if (temp) temp.textContent = `${state.weather.temperature}°C`;
  if (heat) heat.textContent = `Heat Index: ${state.weather.heatIndex || state.weather.heat_index || 38}°C`;
  if (cond) cond.textContent = state.weather.condition || 'Partly Cloudy';
  if (air) air.textContent = `Air Quality: ${state.weather.airQuality || state.weather.air_quality || 'Good'}`;
  if (badge) badge.textContent = state.weather.alertLevel || state.weather.alert_level || 'Yellow Alert';
  if (notice) notice.textContent = state.weather.advisoryNotice || state.weather.advisory_notice || '';
}

// Announcements
async function fetchAnnouncements() {
  try {
    const res = await fetch('/api/announcements');
    const data = await res.json();
    state.announcements = data.announcements || [];
    renderAnnouncementsBanner();
  } catch (e) {
    console.warn('Announcements error:', e);
  }
}

function renderAnnouncementsBanner() {
  const banner = document.getElementById('urgent-announcement-banner');
  if (!banner) return;
  const critical = state.announcements.find(a => !a.hidden && (a.priority === 'Critical' || a.priority === 'High'));
  if (critical) {
    document.getElementById('banner-announcement-title').textContent = critical.title;
    document.getElementById('banner-announcement-body').textContent = critical.content;
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}

// Activities
async function fetchActivities() {
  try {
    const res = await fetch('/api/activities');
    const data = await res.json();
    state.activities = data.activities || [];
    renderActivities();
  } catch (e) {
    console.warn('Activities error:', e);
  }
}

function renderActivities() {
  const grid = document.getElementById('activities-grid');
  if (!grid) return;

  if (state.activities.length === 0) {
    grid.innerHTML = `<div class="card" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No community activities scheduled at this time.</div>`;
    return;
  }

  grid.innerHTML = state.activities.map(act => {
    const actImg = act.image_url || act.imageUrl || '';
    const pointsVal = act.points || 100;
    return `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          ${actImg ? `<img src="${actImg}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:0.75rem;">` : ''}
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
            <span class="badge-portal-pill" style="font-size:0.7rem;">${escapeHtml(act.category || 'Drive')}</span>
            <span class="status-badge resolved" style="font-size:0.72rem;">+${pointsVal} Eco-Pts</span>
          </div>
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--text-main); margin-bottom:0.4rem;">${escapeHtml(act.title)}</h3>
          <div style="font-size:0.82rem; color:var(--text-muted); line-height:1.5;">
            <div><strong>Date:</strong> ${escapeHtml(act.event_date || act.date || 'TBA')}</div>
            <div><strong>Location:</strong> ${escapeHtml(act.location || 'Metro Verde')}</div>
          </div>
          <p style="font-size:0.84rem; color:var(--text-muted); margin-top:0.5rem; line-height:1.4;">${escapeHtml(act.description || '')}</p>
        </div>
        <button class="btn-primary" onclick="openActivityProofModal('${act.id}')" style="width:100%; margin-top:1.25rem; justify-content:center;">
          Participate & Submit Proof
        </button>
      </div>
    `;
  }).join('');
}

// Activity Proof Modal
function openActivityProofModal(actId) {
  if (!state.currentUser) {
    openAuthModal('login');
    showToast('Please sign in to participate and submit proof.');
    return;
  }
  const act = state.activities.find(a => a.id === actId);
  if (!act) return;

  document.getElementById('proof-activity-id').value = act.id;
  document.getElementById('proof-activity-title').value = act.title;
  document.getElementById('proof-activity-points').value = act.points || 100;
  document.getElementById('proof-modal-act-title').textContent = act.title;
  document.getElementById('proof-modal-act-name').textContent = act.title;
  document.getElementById('proof-modal-act-points').textContent = `+${act.points || 100} Eco-Points`;
  document.getElementById('proof-description').value = '';
  document.getElementById('proof-submit-error').style.display = 'none';

  activityProofPhotoBase64 = '';
  const fileInput = document.getElementById('proof-photo-file-input');
  if (fileInput) fileInput.value = '';
  const previewBox = document.getElementById('proof-photo-preview-box');
  if (previewBox) previewBox.style.display = 'none';

  document.getElementById('activity-proof-modal').style.display = 'flex';
}

function closeActivityProofModal() {
  document.getElementById('activity-proof-modal').style.display = 'none';
}

function handleProofPhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    activityProofPhotoBase64 = e.target.result;
    const previewBox = document.getElementById('proof-photo-preview-box');
    const previewImg = document.getElementById('proof-photo-preview-img');
    if (previewImg) previewImg.src = activityProofPhotoBase64;
    if (previewBox) previewBox.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function handleActivityProofSubmit(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const actId = document.getElementById('proof-activity-id').value;
  const actTitle = document.getElementById('proof-activity-title').value;
  const points = Number(document.getElementById('proof-activity-points').value) || 100;
  const desc = document.getElementById('proof-description').value.trim();
  const errBox = document.getElementById('proof-submit-error');
  const submitBtn = document.getElementById('btn-submit-proof');

  if (!activityProofPhotoBase64) {
    if (errBox) {
      errBox.textContent = 'Please attach a photo as proof of your activity participation.';
      errBox.style.display = 'block';
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }

  try {
    const mediaRes = await fetch('/api/user/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: activityProofPhotoBase64,
        filename: `proof_${actId}_${Date.now()}.png`,
        category: 'proof'
      })
    });

    let uploadedPhotoUrl = activityProofPhotoBase64;
    if (mediaRes.ok) {
      const mediaData = await mediaRes.json();
      if (mediaData.url) uploadedPhotoUrl = mediaData.url;
    }

    const res = await fetch('/api/activities/join-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: actId,
        activityTitle: actTitle,
        userId: state.currentUser.id,
        userName: state.currentUser.full_name || state.currentUser.name || 'Citizen',
        userEmail: state.currentUser.email,
        proofImageUrl: uploadedPhotoUrl,
        proofDescription: desc,
        points: points
      })
    });

    if (res.ok) {
      closeActivityProofModal();
      showToast('Participation proof submitted for CENRO admin review!');
      await loadMyParticipations();
    } else {
      if (errBox) {
        errBox.textContent = 'Failed to submit proof.';
        errBox.style.display = 'block';
      }
    }
  } catch (err) {
    if (errBox) {
      errBox.textContent = 'Network communication error.';
      errBox.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Proof for Approval';
    }
  }
}

async function loadMyParticipations() {
  const container = document.getElementById('my-participations-container');
  if (!container) return;

  if (!state.currentUser) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:1rem;">Sign in to view your activity participation history.</div>`;
    return;
  }

  try {
    const res = await fetch(`/api/activities/my-participations?userId=${encodeURIComponent(state.currentUser.id)}&email=${encodeURIComponent(state.currentUser.email)}`);
    const data = await res.json();
    myParticipationsList = data.participations || [];

    if (myParticipationsList.length === 0) {
      container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:1rem;">You have not submitted participation proofs for any activities yet.</div>`;
      return;
    }

    container.innerHTML = myParticipationsList.map(p => `
      <div style="background:var(--surface-alt); border:1px solid var(--border); border-radius:8px; padding:0.85rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="status-badge ${p.status === 'Approved' ? 'resolved' : (p.status === 'Rejected' ? 'rejected' : 'pending')}">${p.status}</span>
            <strong style="font-size:0.95rem;">${escapeHtml(p.activity_title)}</strong>
          </div>
          ${p.proof_description ? `<p style="font-size:0.82rem; color:var(--text-muted); margin-top:0.25rem;">${escapeHtml(p.proof_description)}</p>` : ''}
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">Submitted on ${new Date(p.submitted_at).toLocaleDateString()}</div>
        </div>
        ${p.proof_image_url ? `<img src="${p.proof_image_url}" style="width:60px; height:60px; object-fit:cover; border-radius:6px;">` : ''}
      </div>
    `).join('');
  } catch (e) {
    console.warn('Failed to load my participations:', e);
  }
}

// Incident Reports
async function fetchReports() {
  try {
    const res = await fetch('/api/reports');
    const data = await res.json();
    state.reports = data.reports || [];
    renderReportsTracker();
  } catch (e) {
    console.warn('Reports fetch error:', e);
  }
}

function handleReportPhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    reportPhotoBase64 = evt.target.result;
    const box = document.getElementById('report-photo-preview-box');
    const img = document.getElementById('report-photo-preview-img');
    if (img) img.src = reportPhotoBase64;
    if (box) box.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function handleReportSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('report-title').value.trim();
  const category = document.getElementById('report-category').value;
  const severity = document.getElementById('report-severity').value;
  const barangay = document.getElementById('report-barangay').value;
  const location = document.getElementById('report-location').value.trim();
  const description = document.getElementById('report-description').value.trim();
  const msgEl = document.getElementById('report-submit-msg');
  const btn = document.getElementById('btn-submit-report');

  if (btn) btn.disabled = true;

  try {
    let photoUrl = '';
    if (reportPhotoBase64) {
      const mediaRes = await fetch('/api/user/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: reportPhotoBase64, filename: `report_${Date.now()}.png`, category: 'report' })
      });
      if (mediaRes.ok) {
        const mData = await mediaRes.json();
        photoUrl = mData.url || reportPhotoBase64;
      }
    }

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, category, severity, barangay, location_text: location, description, photo_url: photoUrl,
        user_id: state.currentUser ? state.currentUser.id : '',
        reporter_name: state.currentUser ? (state.currentUser.full_name || state.currentUser.name) : 'Anonymous Citizen'
      })
    });

    if (res.ok) {
      document.getElementById('incident-report-form').reset();
      reportPhotoBase64 = '';
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.style.background = '#D1FAE5';
        msgEl.style.color = '#065F46';
        msgEl.textContent = 'Incident report submitted! CENRO dispatch notified.';
      }
      showToast('Report submitted!');
      await fetchReports();
    }
  } catch (err) {
    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.style.background = '#FEE2E2';
      msgEl.style.color = '#991B1B';
      msgEl.textContent = 'Error submitting report.';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function renderReportsTracker() {
  const container = document.getElementById('reports-tracker-container');
  if (!container) return;

  if (state.reports.length === 0) {
    container.innerHTML = `<div class="card" style="text-align:center; color:var(--text-muted);">No incident reports filed yet.</div>`;
    return;
  }

  container.innerHTML = state.reports.map(r => `
    <div class="card" style="border-left: 5px solid ${r.status === 'Resolved' ? 'var(--primary-light)' : 'var(--amber)'};">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <span class="status-badge ${r.status === 'Resolved' ? 'resolved' : 'pending'}">${r.status}</span>
          <h3 style="font-size:1.1rem; font-weight:800; margin-top:0.35rem;">${escapeHtml(r.title)}</h3>
          <div style="font-size:0.82rem; color:var(--text-muted);">${escapeHtml(r.category)} • ${escapeHtml(r.barangay)}</div>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(r.created_at || Date.now()).toLocaleDateString()}</div>
      </div>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.5rem;">${escapeHtml(r.description)}</p>
    </div>
  `).join('');
}

// Auth UI & Avatar
function updateAuthUI() {
  const container = document.getElementById('header-user-chip-container');
  if (!container) return;

  if (state.currentUser) {
    const avatar = state.currentUser.avatar || state.currentUser.avatar_url || '';
    const name = state.currentUser.full_name || state.currentUser.name || 'Citizen';

    container.innerHTML = `
      <div class="user-nav-chip" onclick="switchTab('profile')">
        ${avatar ? `<img src="${avatar}" class="user-avatar-circle">` : `<div style="width:28px; height:28px; border-radius:50%; background:var(--primary-dark); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800;">${name.charAt(0)}</div>`}
        <span style="font-size:0.82rem; font-weight:700; color:var(--primary-dark);">${escapeHtml(name)}</span>
      </div>
    `;

    // Profile card values
    const pName = document.getElementById('profile-user-name');
    const pEmail = document.getElementById('profile-user-email');
    const pBgy = document.getElementById('profile-user-barangay');
    const pPoints = document.getElementById('profile-eco-points');
    const pAvatarImg = document.getElementById('profile-avatar-img');
    const pInitials = document.getElementById('profile-avatar-initials');

    if (pName) pName.textContent = name;
    if (pEmail) pEmail.textContent = state.currentUser.email;
    if (pBgy) pBgy.textContent = state.currentUser.barangay || 'Metro Verde';
    if (pPoints) pPoints.innerHTML = `${state.currentUser.eco_points || state.currentUser.ecoPoints || 50} <span style="font-size:0.9rem;">pts</span>`;

    if (pAvatarImg && pInitials) {
      if (avatar) {
        pAvatarImg.src = avatar;
        pAvatarImg.style.display = 'block';
        pInitials.style.display = 'none';
      } else {
        pAvatarImg.style.display = 'none';
        pInitials.style.display = 'inline';
        pInitials.textContent = name.charAt(0);
      }
    }

    loadMyParticipations();
  } else {
    container.innerHTML = `<button class="btn-header-auth" onclick="openAuthModal('login')">Citizen Sign In</button>`;
  }
}

async function handleAvatarFileChange(e) {
  const file = e.target.files[0];
  if (!file || !state.currentUser) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    const base64 = evt.target.result;
    const mediaRes = await fetch('/api/user/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, filename: `avatar_${Date.now()}.png`, category: 'avatar' })
    });
    let photoUrl = base64;
    if (mediaRes.ok) {
      const mData = await mediaRes.json();
      if (mData.url) photoUrl = mData.url;
    }
    state.currentUser.avatar = photoUrl;
    state.currentUser.avatar_url = photoUrl;
    localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
    updateAuthUI();
    showToast('Profile photo updated!');
  };
  reader.readAsDataURL(file);
}

// Navigation Controls
function setupNavigation() {
  document.querySelectorAll('.nav-tab-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.nav-tab-pill').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  document.querySelectorAll('.portal-section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(`section-${tabName}`);
  if (target) target.classList.add('active');

  if (tabName === 'hotlines') renderHotlines();
  if (tabName === 'profile') loadMyParticipations();
}

// Auth Modal
function openAuthModal(mode = 'login') {
  setAuthMode(mode);
  document.getElementById('auth-modal').style.display = 'flex';
}

function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}

function setAuthMode(mode) {
  const loginForm = document.getElementById('citizen-login-form');
  const regForm = document.getElementById('citizen-register-form');
  const tabLogin = document.getElementById('auth-tab-login');
  const tabReg = document.getElementById('auth-tab-register');

  if (mode === 'login') {
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
    tabLogin.className = 'btn-primary';
    tabReg.className = 'btn-secondary';
  } else {
    loginForm.style.display = 'none';
    regForm.style.display = 'block';
    tabLogin.className = 'btn-secondary';
    tabReg.className = 'btn-primary';
  }
}

async function handleCitizenLogin(e) {
  e.preventDefault();
  const email = document.getElementById('citizen-login-email').value.trim();
  const password = document.getElementById('citizen-login-pass').value;
  const errBox = document.getElementById('auth-login-error');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      state.currentUser = data.user;
      localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
      closeAuthModal();
      updateAuthUI();
      showToast(`Welcome back, ${escapeHtml(state.currentUser.full_name || state.currentUser.name)}!`);
    } else {
      if (errBox) {
        errBox.textContent = data.error || 'Invalid credentials';
        errBox.style.display = 'block';
      }
    }
  } catch (err) {
    if (errBox) {
      errBox.textContent = 'Network error';
      errBox.style.display = 'block';
    }
  }
}

async function handleCitizenRegister(e) {
  e.preventDefault();
  const name = document.getElementById('citizen-reg-name').value.trim();
  const email = document.getElementById('citizen-reg-email').value.trim();
  const barangay = document.getElementById('citizen-reg-barangay').value;
  const password = document.getElementById('citizen-reg-pass').value;
  const errBox = document.getElementById('auth-reg-error');

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, barangay, password })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      state.currentUser = data.user;
      localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
      closeAuthModal();
      updateAuthUI();
      showToast(`Account created! Welcome, ${escapeHtml(name)}!`);
    } else {
      if (errBox) {
        errBox.textContent = data.error || 'Registration failed';
        errBox.style.display = 'block';
      }
    }
  } catch (err) {
    if (errBox) {
      errBox.textContent = 'Network error';
      errBox.style.display = 'block';
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#064E3B; color:#fff; padding:12px 20px; border-radius:8px; font-weight:700; z-index:9999; box-shadow:0 4px 12px rgba(0,0,0,0.15);';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
