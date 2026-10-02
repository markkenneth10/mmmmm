// Client State Management
const CITIZEN_STORAGE_KEY = 'climate_citizen_account';
let state = {
  currentUser: JSON.parse(localStorage.getItem(CITIZEN_STORAGE_KEY) || 'null'),
  weather: null,
  announcements: [],
  reports: [],
  activities: []
};

let myParticipationsList = [];
let activityProofPhotoBase64 = '';
let reportPhotoBase64 = '';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed; bottom:24px; right:24px; background:#0F172A; color:#fff; padding:0.75rem 1.25rem; border-radius:8px; z-index:9999; font-size:0.88rem; font-weight:700; box-shadow:0 10px 15px -3px rgba(0,0,0,0.2); animation:fadeIn 0.2s ease-out;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Tab Switching
function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById(`nav-${tabName}`);
  if (navEl) navEl.classList.add('active');

  document.querySelectorAll('.portal-section').forEach(sec => sec.classList.remove('active'));
  const targetSec = document.getElementById(`section-${tabName}`);
  if (targetSec) targetSec.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabName === 'profile') loadMyParticipations();
}

// 1. Data Fetching
async function initApp() {
  updateAuthUI();
  await Promise.all([
    fetchWeather(),
    fetchAnnouncements(),
    fetchReports(),
    fetchActivities()
  ]);
}

async function fetchWeather() {
  try {
    const res = await fetch('/api/weather');
    const data = await res.json();
    state.weather = data.weather;
    if (state.weather) {
      document.getElementById('home-weather-condition').textContent = `${state.weather.condition} • ${state.weather.temperature}°C`;
      document.getElementById('home-heat-index').textContent = `${state.weather.heat_index || state.weather.heatIndex || 38}°C`;
      document.getElementById('home-typhoon-signal').textContent = state.weather.typhoon_signal || state.weather.typhoonSignal || 'None';
      if (state.weather.advisory_notice) {
        document.getElementById('home-weather-notice').textContent = state.weather.advisory_notice;
      }
    }
  } catch (e) {
    console.warn('Weather fetch error:', e);
  }
}

async function fetchAnnouncements() {
  try {
    const res = await fetch('/api/announcements');
    const data = await res.json();
    state.announcements = data.announcements || [];
    renderAnnouncements();
  } catch (e) {
    console.warn('Announcements fetch error:', e);
  }
}

function renderAnnouncements() {
  const container = document.getElementById('home-announcements-list');
  if (!container) return;

  if (state.announcements.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted); font-size:0.88rem;">No active climate announcements published at this time.</div>`;
    return;
  }

  container.innerHTML = state.announcements.map(a => `
    <div style="background:var(--surface-alt); border:1px solid var(--border); border-radius:var(--radius-md); padding:1rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
        <span class="badge-portal-pill" style="background:var(--primary-dark); color:#fff; font-size:0.7rem;">${escapeHtml(a.priority || 'Advisory')}</span>
        <span style="font-size:0.75rem; color:var(--text-muted);">${new Date(a.created_at || Date.now()).toLocaleDateString()}</span>
      </div>
      <h4 style="font-size:1.05rem; font-weight:800; color:var(--text-main); margin-bottom:0.35rem;">${escapeHtml(a.title)}</h4>
      <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5;">${escapeHtml(a.content || a.body || '')}</p>
      ${(a.image_url || a.imageUrl) ? `
        <img src="${a.image_url || a.imageUrl}" alt="${escapeHtml(a.title)}" style="max-height:140px; border-radius:8px; margin-top:0.6rem; object-fit:cover;">
      ` : ''}
    </div>
  `).join('');
}

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

function renderReportsTracker() {
  const container = document.getElementById('reports-tracker-list');
  if (!container) return;

  if (state.reports.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:2rem;">No incident reports submitted yet.</div>`;
    return;
  }

  container.innerHTML = state.reports.map(r => {
    let statusClass = 'submitted';
    if (r.status === 'Resolved') statusClass = 'resolved';
    if (r.status === 'In Inspection') statusClass = 'inspection';
    if (r.status === 'Action In Progress') statusClass = 'progress';

    return `
      <div style="border:1px solid var(--border); border-radius:var(--radius-md); padding:1rem; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:flex-start; gap:1rem;">
        <div style="flex:1; min-width:260px;">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap;">
            <span class="status-badge ${statusClass}">${escapeHtml(r.status)}</span>
            <span class="badge-portal-pill">${escapeHtml(r.barangay)}</span>
            <h4 style="font-size:1.05rem; font-weight:800; color:var(--text-main); margin:0;">${escapeHtml(r.title)}</h4>
          </div>
          <p style="font-size:0.85rem; color:var(--text-muted); margin:0.35rem 0; line-height:1.5;">${escapeHtml(r.description)}</p>
          <div style="font-size:0.75rem; color:var(--text-muted);">
            Reported by ${escapeHtml(r.reporter_name || 'Citizen')} • ${new Date(r.created_at || Date.now()).toLocaleString()}
          </div>
          ${r.inspection_notes ? `
            <div style="margin-top:0.5rem; padding:0.5rem 0.75rem; background:var(--primary-tint); border-radius:6px; font-size:0.8rem; color:var(--primary-dark);">
              <strong>CENRO Dispatch Remark:</strong> ${escapeHtml(r.inspection_notes)}
            </div>
          ` : ''}
        </div>
        ${r.photo_url ? `
          <img src="${r.photo_url}" alt="Report Photo" style="width:80px; height:80px; object-fit:cover; border-radius:8px; border:1px solid var(--border);">
        ` : ''}
      </div>
    `;
  }).join('');
}

async function fetchActivities() {
  try {
    const res = await fetch('/api/activities');
    const data = await res.json();
    state.activities = data.activities || [];
    renderActivities();
  } catch (e) {
    console.warn('Activities fetch error:', e);
  }
}

function renderActivities() {
  const grid = document.getElementById('activities-grid');
  if (!grid) return;

  if (state.activities.length === 0) {
    grid.innerHTML = `<div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">No community activities scheduled at this time.</div>`;
    return;
  }

  grid.innerHTML = state.activities.map(act => {
    const actImg = act.image_url || act.imageUrl || '';
    const pointsVal = act.points || 50;

    return `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          ${actImg ? `
            <div style="margin: -1.25rem -1.25rem 1rem -1.25rem; overflow: hidden; border-top-left-radius: var(--radius-lg); border-top-right-radius: var(--radius-lg);">
              <img src="${actImg}" alt="${escapeHtml(act.title)}" style="width: 100%; height: 160px; object-fit: cover;">
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.35rem;">
            <span class="badge-portal-pill" style="font-size: 0.68rem;">${escapeHtml(act.category || 'Environmental Drive')}</span>
            <span class="status-badge resolved" style="font-size: 0.72rem; background: #ECFDF5; color: #065F46; font-weight: 800; border: 1px solid #A7F3D0;">+${pointsVal} Eco-Points</span>
          </div>
          <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">${escapeHtml(act.title)}</h4>
          <div style="font-size: 0.82rem; color: var(--text-muted); margin: 0.5rem 0; line-height: 1.6;">
            <div><strong>Date & Time:</strong> ${escapeHtml(act.event_date || act.date || 'TBA')}</div>
            <div><strong>Location:</strong> ${escapeHtml(act.location || 'Metro Verde')}</div>
            <div><strong>Organizer:</strong> ${escapeHtml(act.organizer || 'LGU CENRO')}</div>
          </div>
          ${act.description ? `<p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.5; margin-top: 0.5rem;">${escapeHtml(act.description)}</p>` : ''}
        </div>

        <div style="margin-top: 1.25rem; pt: 0.75rem; border-top: 1px solid var(--border);">
          <button class="btn-primary" onclick="openActivityProofModal('${act.id}')" style="width: 100%; font-size: 0.88rem; padding: 0.7rem; justify-content: center;">
            Participate & Submit Proof
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 2. Incident Report Submission
function handleReportPhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    reportPhotoBase64 = event.target.result;
    document.getElementById('rep-photo-preview-img').src = reportPhotoBase64;
    document.getElementById('rep-photo-preview-box').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function handleReportSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-report');
  if (btn) btn.disabled = true;

  try {
    let photoUrl = '';
    if (reportPhotoBase64) {
      const uploadRes = await fetch('/api/user/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: reportPhotoBase64, filename: `hazard_${Date.now()}.png` })
      });
      const uploadData = await uploadRes.json();
      if (uploadData.url) photoUrl = uploadData.url;
    }

    const payload = {
      title: document.getElementById('rep-title').value.trim(),
      category: document.getElementById('rep-category').value,
      severity: document.getElementById('rep-severity').value,
      barangay: document.getElementById('rep-barangay').value,
      location_text: document.getElementById('rep-location').value.trim(),
      description: document.getElementById('rep-description').value.trim(),
      photo_url: photoUrl,
      reporter_name: state.currentUser ? (state.currentUser.full_name || state.currentUser.name) : 'Anonymous Citizen',
      user_id: state.currentUser ? state.currentUser.id : ''
    };

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      document.getElementById('incident-report-form').reset();
      reportPhotoBase64 = '';
      document.getElementById('rep-photo-preview-box').style.display = 'none';
      showToast('Incident report dispatched to CENRO Command Center!');
      await fetchReports();
      switchTab('tracker');
    } else {
      alert('Failed to submit report.');
    }
  } catch (err) {
    alert('Network error submitting incident report.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// 3. Activity Participation Proof Submission
function openActivityProofModal(actId) {
  if (!state.currentUser) {
    openAuthModal('login');
    showToast('Please sign in to participate in community activities.');
    return;
  }

  const act = state.activities.find(a => a.id === actId);
  if (!act) return;

  document.getElementById('proof-activity-id').value = act.id;
  document.getElementById('proof-activity-title').value = act.title;
  document.getElementById('proof-activity-points').value = act.points || 50;

  document.getElementById('proof-modal-act-title').textContent = act.title;
  document.getElementById('proof-modal-act-name').textContent = act.title;
  document.getElementById('proof-modal-act-points').textContent = `+${act.points || 50} Eco-Points`;

  document.getElementById('proof-description').value = '';
  document.getElementById('proof-submit-error').style.display = 'none';

  clearProofPhoto();

  const modal = document.getElementById('activity-proof-modal');
  if (modal) modal.style.display = 'flex';
}

function closeActivityProofModal() {
  const modal = document.getElementById('activity-proof-modal');
  if (modal) modal.style.display = 'none';
}

function handleProofPhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    activityProofPhotoBase64 = e.target.result;
    document.getElementById('proof-photo-placeholder').style.display = 'none';
    const previewBox = document.getElementById('proof-photo-preview-box');
    const previewImg = document.getElementById('proof-photo-preview-img');
    if (previewImg) previewImg.src = activityProofPhotoBase64;
    if (previewBox) previewBox.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearProofPhoto(event) {
  if (event) event.stopPropagation();
  activityProofPhotoBase64 = '';
  const fileInput = document.getElementById('proof-photo-file-input');
  if (fileInput) fileInput.value = '';
  const placeholder = document.getElementById('proof-photo-placeholder');
  const previewBox = document.getElementById('proof-photo-preview-box');
  if (placeholder) placeholder.style.display = 'block';
  if (previewBox) previewBox.style.display = 'none';
}

async function handleActivityProofSubmit(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const actId = document.getElementById('proof-activity-id').value;
  const actTitle = document.getElementById('proof-activity-title').value;
  const points = Number(document.getElementById('proof-activity-points').value) || 50;
  const desc = document.getElementById('proof-description').value.trim();
  const errBox = document.getElementById('proof-submit-error');
  const submitBtn = document.getElementById('btn-submit-proof');

  if (errBox) errBox.style.display = 'none';

  if (!activityProofPhotoBase64) {
    if (errBox) {
      errBox.textContent = 'Please attach a photo as proof of your activity participation.';
      errBox.style.display = 'block';
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Proof...';
  }

  try {
    const mediaRes = await fetch('/api/user/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: activityProofPhotoBase64,
        filename: `proof_${actId}_${Date.now()}.png`
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

    const data = await res.json();
    if (!res.ok) {
      if (errBox) {
        errBox.textContent = data.error || 'Failed to submit participation proof.';
        errBox.style.display = 'block';
      }
      return;
    }

    closeActivityProofModal();
    showToast('Participation proof submitted! Pending CENRO admin verification.');
    await loadMyParticipations();

  } catch (err) {
    if (errBox) {
      errBox.textContent = 'Network communication error submitting proof.';
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
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Please sign in to view your joined community movements.</div>`;
    return;
  }

  try {
    const res = await fetch(`/api/activities/my-participations?userId=${encodeURIComponent(state.currentUser.id || '')}&email=${encodeURIComponent(state.currentUser.email || '')}`);
    const data = await res.json();
    myParticipationsList = data.participations || [];

    if (myParticipationsList.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">You have not submitted participation proofs yet. Browse upcoming drives to claim Eco-Points!</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${myParticipationsList.map(p => {
          let statusBadge = `<span class="badge-portal-pill" style="background: var(--amber-dark); color: #fff;">Pending Review</span>`;
          if (p.status === 'Approved') statusBadge = `<span class="badge-portal-pill" style="background: var(--primary-light); color: #fff;">Approved (+${p.points_awarded || 50} Pts)</span>`;
          if (p.status === 'Rejected') statusBadge = `<span class="badge-portal-pill" style="background: var(--red); color: #fff;">Rejected</span>`;

          return `
            <div style="background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                  ${statusBadge}
                  <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">${escapeHtml(p.activity_title)}</h4>
                </div>
                ${p.proof_description ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.35rem 0;">${escapeHtml(p.proof_description)}</p>` : ''}
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Submitted: ${new Date(p.submitted_at).toLocaleDateString()}</div>
              </div>
              ${p.proof_image_url ? `
                <img src="${p.proof_image_url}" alt="Proof" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);">
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    console.warn('Participations fetch error:', err);
  }
}

// 4. User Profile & Avatar
async function handleAvatarFileChange(e) {
  const file = e.target.files[0];
  if (!file || !state.currentUser) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    const dataUrl = event.target.result;
    const res = await fetch('/api/user/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, filename: `avatar_${state.currentUser.id}.png` })
    });
    const data = await res.json();
    if (data.url) {
      state.currentUser.avatar_url = data.url;
      state.currentUser.avatar = data.url;
      localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
      
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.currentUser.email, avatar_url: data.url })
      });

      updateAuthUI();
      showToast('Profile photo updated successfully!');
    }
  };
  reader.readAsDataURL(file);
}

function updateAuthUI() {
  const widget = document.getElementById('header-user-widget');
  const u = state.currentUser;

  if (u) {
    const photo = u.avatar_url || u.avatar || '';
    const name = u.full_name || u.name || 'Citizen';
    widget.innerHTML = `
      <button class="btn-secondary" onclick="switchTab('profile')" style="padding:0.4rem 0.75rem;">
        ${photo ? `<img src="${photo}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">` : '👤'}
        <span>${escapeHtml(name.split(' ')[0])} (${u.eco_points || u.ecoPoints || 50} pts)</span>
      </button>
    `;

    document.getElementById('profile-user-name').textContent = name;
    document.getElementById('profile-user-email').textContent = u.email;
    document.getElementById('profile-eco-points').textContent = `${u.eco_points || u.ecoPoints || 50} pts`;

    const avatarImg = document.getElementById('profile-avatar-img');
    const avatarInitials = document.getElementById('profile-avatar-initials');
    if (photo && avatarImg) {
      avatarImg.src = photo;
      avatarImg.style.display = 'block';
      if (avatarInitials) avatarInitials.style.display = 'none';
    }
  } else {
    widget.innerHTML = `
      <button class="btn-primary" onclick="openAuthModal('login')">
        Sign In / Register
      </button>
    `;
  }
}

// Auth Modal
function openAuthModal(mode) {
  document.getElementById('auth-modal').style.display = 'flex';
}

function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}

async function handleCitizenAuth(e) {
  e.preventDefault();
  const name = document.getElementById('auth-name').value.trim();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();

  const url = name ? '/api/auth/register' : '/api/auth/login';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();
  if (res.ok && data.user) {
    state.currentUser = data.user;
    localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
    closeAuthModal();
    updateAuthUI();
    showToast(`Welcome, ${escapeHtml(data.user.full_name || data.user.name)}!`);
  } else {
    alert(data.error || 'Authentication failed.');
  }
}

function startEcoQuiz() {
  showToast('Eco Quiz initialized! You earned +50 Eco-Points for completion.');
  if (state.currentUser) {
    state.currentUser.eco_points = (state.currentUser.eco_points || 50) + 50;
    localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
    updateAuthUI();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
