// Admin State & Session
let currentAdminSession = null;
let adminReportsList = [];
let adminActivitiesList = [];
let adminParticipationsList = [];
let adminUsersList = [];

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function adminFetch(url, options = {}) {
  const headers = options.headers || {};
  if (currentAdminSession?.token) {
    headers['Authorization'] = `Bearer ${currentAdminSession.token}`;
  }
  return fetch(url, { ...options, headers });
}

// Admin Session & Auth
async function checkAdminSession() {
  try {
    const res = await fetch('/api/admin/session');
    const data = await res.json();
    if (res.ok && data.authenticated) {
      currentAdminSession = data.session;
      document.getElementById('admin-auth-screen').style.display = 'none';
      await refreshAdminData();
    } else {
      document.getElementById('admin-auth-screen').style.display = 'flex';
    }
  } catch (e) {
    document.getElementById('admin-auth-screen').style.display = 'flex';
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-login-email').value.trim();
  const password = document.getElementById('admin-login-password').value.trim();

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      currentAdminSession = data.session;
      document.getElementById('admin-auth-screen').style.display = 'none';
      await refreshAdminData();
    } else {
      alert(data.error || 'Invalid admin credentials.');
    }
  } catch (err) {
    alert('Network error during admin login.');
  }
}

async function handleAdminLogout() {
  await fetch('/api/admin/logout', { method: 'POST' });
  currentAdminSession = null;
  document.getElementById('admin-auth-screen').style.display = 'flex';
}

// Tab Switching
function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));

  const targetSec = document.getElementById(`tab-${tabName}`);
  if (targetSec) targetSec.classList.add('active');

  if (tabName === 'triage') loadAdminTriage();
  if (tabName === 'announcements') loadAdminAnnouncements();
  if (tabName === 'activities') {
    loadAdminActivities();
    loadAdminParticipations();
  }
  if (tabName === 'users') loadAdminUsers();
}

async function refreshAdminData() {
  await Promise.all([
    loadAdminTriage(),
    loadAdminAnnouncements(),
    loadAdminActivities(),
    loadAdminParticipations(),
    loadAdminUsers()
  ]);
}

// 1. Triage & Reports Queue
async function loadAdminTriage() {
  try {
    const res = await adminFetch('/api/reports');
    const data = await res.json();
    adminReportsList = data.reports || [];

    document.getElementById('kpi-total-reports').textContent = adminReportsList.length;
    const pending = adminReportsList.filter(r => r.status === 'Submitted' || r.status === 'In Inspection').length;
    document.getElementById('kpi-pending-reports').textContent = pending;

    const container = document.getElementById('admin-triage-container');
    if (!container) return;

    if (adminReportsList.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:1.5rem;">No incident reports submitted yet.</div>`;
      return;
    }

    container.innerHTML = adminReportsList.map(r => `
      <div style="background:var(--surface-card); border:1px solid var(--border-dark); border-radius:10px; padding:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-weight:800; color:#38BDF8;">${escapeHtml(r.id)}</span>
            <span style="font-weight:700; color:#fff; font-size:1rem;">${escapeHtml(r.title)}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">(${escapeHtml(r.category)})</span>
          </div>
          <select onchange="updateReportStatus('${r.id}', this.value)" class="admin-select" style="width:auto; font-weight:700;">
            <option value="Submitted" ${r.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
            <option value="In Inspection" ${r.status === 'In Inspection' ? 'selected' : ''}>In Inspection</option>
            <option value="Action In Progress" ${r.status === 'Action In Progress' ? 'selected' : ''}>Action In Progress</option>
            <option value="Resolved" ${r.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </div>

        <p style="font-size:0.85rem; color:var(--text-muted); margin:0.4rem 0;">${escapeHtml(r.description)}</p>

        <div style="margin-top:0.6rem; display:flex; gap:0.5rem; align-items:center;">
          <input type="text" id="inspect-note-${r.id}" class="admin-input" placeholder="Add CENRO inspection remarks..." value="${escapeHtml(r.inspection_notes || '')}" style="font-size:0.8rem;">
          <button onclick="saveInspectionNote('${r.id}')" class="btn-admin-primary" style="font-size:0.75rem; padding:0.4rem 0.75rem;">Save Note</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.warn('Admin triage fetch error:', e);
  }
}

async function updateReportStatus(reportId, status) {
  await adminFetch(`/api/reports/${reportId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  loadAdminTriage();
}

async function saveInspectionNote(reportId) {
  const note = document.getElementById(`inspect-note-${reportId}`).value.trim();
  await adminFetch(`/api/reports/${reportId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspection_notes: note })
  });
  alert('Inspection note updated.');
  loadAdminTriage();
}

// 2. Weather Advisory Manager
async function handleSaveWeather(e) {
  e.preventDefault();
  const temp = Number(document.getElementById('weather-temp').value);
  const heatIndex = Number(document.getElementById('weather-heat').value);
  const condition = document.getElementById('weather-condition').value.trim();
  const typhoonSignal = document.getElementById('weather-typhoon').value;
  const advisoryNotice = document.getElementById('weather-notice').value.trim();

  await adminFetch('/api/weather', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temperature: temp, heat_index: heatIndex, condition, typhoon_signal: typhoonSignal, advisory_notice: advisoryNotice })
  });
  alert('Weather & Climate telemetry updated!');
}

// 3. Announcements Manager
async function loadAdminAnnouncements() {
  try {
    const res = await adminFetch('/api/announcements?all=1');
    const data = await res.json();
    const list = data.announcements || [];

    const container = document.getElementById('admin-announcements-list');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No published announcements yet.</div>`;
      return;
    }

    container.innerHTML = list.map(a => `
      <div style="background:var(--surface-card); border:1px solid var(--border-dark); border-radius:8px; padding:0.85rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; opacity:${a.hidden ? '0.6' : '1'};">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
            <span style="font-weight:800; color:#fff;">${escapeHtml(a.title)}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">(${escapeHtml(a.category)})</span>
            ${a.hidden ? `<span style="font-size:0.68rem; background:#7F1D1D; color:#FCA5A5; padding:0.1rem 0.4rem; border-radius:4px;">Hidden</span>` : ''}
          </div>
          <p style="font-size:0.82rem; color:var(--text-muted);">${escapeHtml(a.content)}</p>
        </div>
        <div style="display:flex; gap:0.4rem;">
          <button onclick="toggleHideAnnouncement('${a.id}', ${!!a.hidden})" class="btn-admin-outline" style="font-size:0.75rem; padding:0.3rem 0.6rem;">
            ${a.hidden ? 'Unhide' : 'Hide'}
          </button>
          <button onclick="deleteAnnouncement('${a.id}')" class="btn-admin-danger" style="font-size:0.75rem; padding:0.3rem 0.6rem;">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.warn('Announcements fetch error:', e);
  }
}

async function handleSaveAnnouncement(e) {
  e.preventDefault();
  const title = document.getElementById('ann-title').value.trim();
  const category = document.getElementById('ann-category').value;
  const priority = document.getElementById('ann-priority').value;
  const content = document.getElementById('ann-content').value.trim();

  await adminFetch('/api/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, category, priority, content })
  });

  document.getElementById('admin-announcement-form').reset();
  alert('Announcement published successfully!');
  loadAdminAnnouncements();
}

async function toggleHideAnnouncement(id, isCurrentlyHidden) {
  await adminFetch(`/api/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toggleHide: !isCurrentlyHidden })
  });
  loadAdminAnnouncements();
}

async function deleteAnnouncement(id) {
  if (!confirm('Are you sure you want to delete this announcement?')) return;
  await adminFetch(`/api/announcements/${id}`, { method: 'DELETE' });
  loadAdminAnnouncements();
}

// 4. Community Activities & Proof Verification Manager
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
      container.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No activities created yet.</div>`;
      return;
    }

    container.innerHTML = adminActivitiesList.map(act => `
      <div style="background:var(--surface-card); border:1px solid var(--border-dark); border-radius:8px; padding:0.85rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; opacity:${act.hidden ? '0.65' : '1'};">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
            <span style="font-weight:800; color:#10B981;">+${act.points || 50} Eco-Pts</span>
            <span style="font-weight:700; color:#fff;">${escapeHtml(act.title)}</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">(${escapeHtml(act.category)})</span>
          </div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(act.event_date || '')} • ${escapeHtml(act.location || '')}</div>
        </div>
        <div style="display:flex; gap:0.4rem;">
          <button onclick="toggleHideActivity('${act.id}', ${!!act.hidden})" class="btn-admin-outline" style="font-size:0.75rem; padding:0.3rem 0.6rem;">
            ${act.hidden ? 'Unhide' : 'Hide'}
          </button>
          <button onclick="deleteActivity('${act.id}')" class="btn-admin-danger" style="font-size:0.75rem; padding:0.3rem 0.6rem;">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.warn('Admin activities fetch error:', e);
  }
}

async function handleSaveAdminActivity(e) {
  e.preventDefault();
  const title = document.getElementById('act-title').value.trim();
  const category = document.getElementById('act-category').value;
  const event_date = document.getElementById('act-event-date').value.trim();
  const location = document.getElementById('act-location').value.trim();
  const points = Number(document.getElementById('act-points').value) || 100;
  const isHidden = document.getElementById('act-hidden').checked;
  const description = document.getElementById('act-description').value.trim();

  await adminFetch('/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, category, event_date, location, points, hidden: isHidden ? 1 : 0, description })
  });

  document.getElementById('admin-activity-form').reset();
  alert('Community activity published!');
  loadAdminActivities();
}

async function toggleHideActivity(id, isCurrentlyHidden) {
  await adminFetch(`/api/activities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toggleHide: !isCurrentlyHidden })
  });
  loadAdminActivities();
}

async function deleteActivity(id) {
  if (!confirm('Are you sure you want to delete this activity?')) return;
  await adminFetch(`/api/activities/${id}`, { method: 'DELETE' });
  loadAdminActivities();
}

async function loadAdminParticipations() {
  try {
    const res = await adminFetch('/api/admin/activities/participations');
    const data = await res.json();
    adminParticipationsList = data.participations || [];

    const pendingList = adminParticipationsList.filter(p => p.status === 'Pending');
    const pill = document.getElementById('admin-proofs-pending-pill');
    const badge = document.getElementById('admin-act-pending-badge');
    if (pill) {
      pill.textContent = pendingList.length;
      pill.style.display = pendingList.length > 0 ? 'inline-block' : 'none';
    }
    if (badge) badge.textContent = pendingList.length;

    const container = document.getElementById('admin-proofs-container');
    if (!container) return;

    if (adminParticipationsList.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:1.5rem;">No participation proofs submitted in queue.</div>`;
      return;
    }

    container.innerHTML = adminParticipationsList.map(p => `
      <div style="background:var(--surface-card); border:1px solid var(--border-dark); border-radius:10px; padding:1rem; display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem;">
        <div style="flex:1; min-width:260px;">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem;">
            <span style="font-weight:800; color:#10B981;">+${p.points_awarded || 50} Eco-Pts</span>
            <span style="font-weight:700; color:#fff;">${escapeHtml(p.activity_title)}</span>
          </div>
          <div style="font-size:0.85rem; color:#fff; font-weight:700;">${escapeHtml(p.user_name)} (${escapeHtml(p.user_email)})</div>
          ${p.proof_description ? `<p style="font-size:0.82rem; color:var(--text-muted); margin:0.35rem 0;">${escapeHtml(p.proof_description)}</p>` : ''}
          <div style="font-size:0.75rem; color:var(--text-muted);">Submitted: ${new Date(p.submitted_at).toLocaleString()}</div>

          ${p.status === 'Pending' ? `
            <div style="display:flex; gap:0.5rem; margin-top:0.75rem;">
              <button onclick="reviewProof('${p.id}', 'Approved')" class="btn-admin-primary" style="background:#10B981; font-size:0.78rem;">
                Approve & Award +${p.points_awarded || 50} Points
              </button>
              <button onclick="reviewProof('${p.id}', 'Rejected')" class="btn-admin-danger" style="font-size:0.78rem;">
                Reject Proof
              </button>
            </div>
          ` : `
            <div style="margin-top:0.5rem; font-weight:700; font-size:0.8rem; color:${p.status === 'Approved' ? '#34D399' : '#F87171'};">
              Status: ${p.status}
            </div>
          `}
        </div>

        ${p.proof_image_url ? `
          <img src="${p.proof_image_url}" alt="Proof" style="max-height:120px; max-width:180px; object-fit:cover; border-radius:8px; border:1px solid var(--border-dark);">
        ` : ''}
      </div>
    `).join('');
  } catch (e) {
    console.warn('Admin participations fetch error:', e);
  }
}

async function reviewProof(submissionId, status) {
  await adminFetch('/api/admin/activities/review-participation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId, status })
  });
  alert(`Participation proof marked as ${status}.`);
  loadAdminParticipations();
  loadAdminUsers();
}

// 5. Citizen Users Manager
async function loadAdminUsers() {
  try {
    const res = await adminFetch('/api/admin/users');
    const data = await res.json();
    adminUsersList = data.users || [];

    document.getElementById('kpi-registered-users').textContent = data.totalUsers || adminUsersList.length;

    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    if (adminUsersList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No citizen accounts registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = adminUsersList.map(u => {
      const photo = u.avatarUrl || u.avatar_url || '';
      return `
        <tr style="border-bottom:1px solid var(--border-dark);">
          <td style="padding:0.75rem; font-weight:700; color:#fff; display:flex; align-items:center; gap:0.5rem;">
            ${photo ? `<img src="${photo}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">` : '👤'}
            <span>${escapeHtml(u.full_name || u.name)}</span>
          </td>
          <td style="padding:0.75rem;">${escapeHtml(u.email)}</td>
          <td style="padding:0.75rem;">${escapeHtml(u.barangay || 'Metro Verde')}</td>
          <td style="padding:0.75rem;">${escapeHtml(u.kyc_status || 'Unverified')}</td>
          <td style="padding:0.75rem; font-weight:800; color:#34D399;">${u.ecoPoints || 0} pts</td>
          <td style="padding:0.75rem;">
            <span style="font-size:0.75rem; color:#A7F3D0; background:#065F46; padding:0.2rem 0.5rem; border-radius:4px;">Active</span>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    console.warn('Admin users fetch error:', e);
  }
}

// 6. Database Exporter
function downloadDatabaseBackup() {
  window.open('/api/admin/database/download', '_blank');
}

document.addEventListener('DOMContentLoaded', checkAdminSession);
