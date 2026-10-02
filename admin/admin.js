// CENRO Administrative Command Console Logic
let currentAdmin = null;
let adminHotlinesList = [];
let adminActivitiesList = [];
let adminParticipationsList = [];
let adminUsersList = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAdminSession();
});

async function adminFetch(endpoint, options = {}) {
  options.headers = options.headers || {};
  return await fetch(endpoint, options);
}

async function checkAdminSession() {
  try {
    const res = await adminFetch('/api/admin/users');
    if (res.ok) {
      showDashboardView();
    } else {
      showAuthView();
    }
  } catch (e) {
    showAuthView();
  }
}

function showAuthView() {
  document.getElementById('admin-auth-view').style.display = 'flex';
  document.getElementById('admin-dashboard-view').style.display = 'none';
}

function showDashboardView() {
  document.getElementById('admin-auth-view').style.display = 'none';
  document.getElementById('admin-dashboard-view').style.display = 'flex';
  switchAdminTab('overview');
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  const errBox = document.getElementById('admin-auth-error');

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      currentAdmin = data.admin;
      document.getElementById('admin-user-display-name').textContent = currentAdmin ? currentAdmin.name : 'Super Admin';
      showDashboardView();
    } else {
      if (errBox) {
        errBox.textContent = data.error || 'Invalid credentials';
        errBox.style.display = 'block';
      }
    }
  } catch (err) {
    if (errBox) {
      errBox.textContent = 'Network error during authentication';
      errBox.style.display = 'block';
    }
  }
}

function exitDashboard() {
  showAuthView();
}

function toggleAdminMobileSidebar() {
  const sidebar = document.getElementById('admin-sidebar-nav');
  if (sidebar) sidebar.classList.toggle('mobile-open');
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(`tab-${tabName}`);
  if (target) target.classList.add('active');

  const titleEl = document.getElementById('admin-topbar-title-text');
  if (titleEl) {
    const titles = {
      overview: 'Operational Command Center',
      hotlines: 'Emergency Hotlines Management',
      cms: 'Website CMS & Portal Branding',
      weather: 'Climate Advisory & Weather Control',
      announcements: 'Municipal Announcements Manager',
      activities: 'Community Movements & Proof Reviews',
      users: 'Citizen Users & Account Analytics'
    };
    titleEl.textContent = titles[tabName] || 'Command Center';
  }

  const sidebar = document.getElementById('admin-sidebar-nav');
  if (sidebar) sidebar.classList.remove('mobile-open');

  if (tabName === 'hotlines') loadAdminHotlines();
  if (tabName === 'announcements') loadAnnouncements();
  if (tabName === 'activities') { loadAdminActivities(); loadAdminParticipations(); }
  if (tabName === 'users') loadUsersData();
}

// Emergency Hotlines CMS Management
async function loadAdminHotlines() {
  try {
    const res = await fetch('/api/hotlines');
    const data = await res.json();
    adminHotlinesList = data.hotlines || [];

    const container = document.getElementById('admin-hotlines-manager-list');
    const kpiEl = document.getElementById('kpi-hotlines-count');
    if (kpiEl) kpiEl.textContent = adminHotlinesList.length;

    if (!container) return;

    if (adminHotlinesList.length === 0) {
      container.innerHTML = `<div style="color:#94a3b8; padding:1.5rem; text-align:center;">No hotlines defined. Click "Add New Emergency Hotline" above.</div>`;
      return;
    }

    container.innerHTML = adminHotlinesList.map((h, i) => `
      <div style="background:#0D1F13; border:1px solid #1C4228; border-left:5px solid #10B981; border-radius:10px; padding:1rem; display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
            <span style="font-size:0.7rem; font-weight:800; background:#065F46; color:#A7F3D0; padding:0.15rem 0.5rem; border-radius:4px;">${escapeHtml(h.category || 'General')}</span>
            <strong style="font-size:1.05rem; color:#fff;">${escapeHtml(h.name)}</strong>
          </div>
          <div style="font-size:1.2rem; font-weight:800; color:#10B981; margin:0.2rem 0;">${escapeHtml(h.number)}</div>
          <p style="font-size:0.82rem; color:#94A3B8; margin:0;">${escapeHtml(h.note || '')}</p>
        </div>

        <div style="display:flex; gap:0.5rem;">
          <button onclick="editHotline('${h.id || i}')" class="btn-admin-outline">Edit</button>
          <button onclick="deleteHotline('${h.id || i}')" class="btn-admin-danger">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load hotlines:', e);
  }
}

function openAddHotlineModal() {
  document.getElementById('hotline-id').value = '';
  document.getElementById('hotline-form').reset();
  document.getElementById('hotline-modal-title').textContent = 'Add Emergency Hotline';
  document.getElementById('hotline-modal').style.display = 'flex';
}

function closeHotlineModal() {
  document.getElementById('hotline-modal').style.display = 'none';
}

function editHotline(id) {
  const h = adminHotlinesList.find((item, index) => item.id === id || String(index) === id);
  if (!h) return;

  document.getElementById('hotline-id').value = h.id || '';
  document.getElementById('hotline-name').value = h.name || '';
  document.getElementById('hotline-number').value = h.number || '';
  document.getElementById('hotline-category').value = h.category || 'Environment & Hazards';
  document.getElementById('hotline-note').value = h.note || '';

  document.getElementById('hotline-modal-title').textContent = 'Edit Emergency Hotline';
  document.getElementById('hotline-modal').style.display = 'flex';
}

async function handleSaveHotline(e) {
  e.preventDefault();
  const id = document.getElementById('hotline-id').value;
  const name = document.getElementById('hotline-name').value.trim();
  const number = document.getElementById('hotline-number').value.trim();
  const category = document.getElementById('hotline-category').value;
  const note = document.getElementById('hotline-note').value.trim();

  let updatedList = [...adminHotlinesList];
  if (id) {
    const idx = updatedList.findIndex(item => item.id === id);
    if (idx !== -1) {
      updatedList[idx] = { id, name, number, category, note };
    } else {
      updatedList.push({ id: 'hotline_' + Date.now(), name, number, category, note });
    }
  } else {
    updatedList.push({ id: 'hotline_' + Date.now(), name, number, category, note });
  }

  try {
    const res = await adminFetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergencyHotlines: updatedList })
    });

    if (res.ok) {
      closeHotlineModal();
      await loadAdminHotlines();
      alert('Emergency hotlines updated!');
    }
  } catch (err) {
    alert('Failed to save hotline.');
  }
}

async function deleteHotline(id) {
  if (!confirm('Are you sure you want to remove this emergency hotline?')) return;
  const updatedList = adminHotlinesList.filter((item, index) => item.id !== id && String(index) !== id);
  try {
    const res = await adminFetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergencyHotlines: updatedList })
    });
    if (res.ok) {
      await loadAdminHotlines();
    }
  } catch (e) {
    alert('Failed to delete hotline.');
  }
}

// CMS & Weather
async function handleSaveCMSConfig(e) {
  e.preventDefault();
  const websiteName = document.getElementById('cms-title').value.trim();
  const websiteSubtitle = document.getElementById('cms-subtitle').value.trim();
  const websiteLogo = document.getElementById('cms-logo').value.trim();
  const heroTitle = document.getElementById('cms-hero-title').value.trim();
  const heroSubtitle = document.getElementById('cms-hero-sub').value.trim();

  try {
    const res = await adminFetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteName, websiteSubtitle, websiteLogo, heroTitle, heroSubtitle })
    });
    if (res.ok) alert('CMS Configuration saved!');
  } catch (err) {
    alert('Error saving CMS.');
  }
}

async function handleSaveWeatherConfig(e) {
  e.preventDefault();
  const temperature = Number(document.getElementById('weather-temp-input').value) || 32;
  const heatIndex = Number(document.getElementById('weather-heat-input').value) || 38;
  const alertLevel = document.getElementById('weather-alert-input').value.trim();
  const condition = document.getElementById('weather-cond-input').value.trim();
  const advisoryNotice = document.getElementById('weather-notice-input').value.trim();

  try {
    const res = await adminFetch('/api/weather', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temperature, heatIndex, alertLevel, condition, advisoryNotice })
    });
    if (res.ok) alert('Weather advisory broadcasted!');
  } catch (err) {
    alert('Error saving weather advisory.');
  }
}

// Announcements
let adminAnnouncementsList = [];

async function loadAnnouncements() {
  try {
    const res = await adminFetch('/api/announcements?all=1');
    const data = await res.json();
    adminAnnouncementsList = data.announcements || [];
    const container = document.getElementById('admin-announcements-list');

    if (!container) return;

    if (adminAnnouncementsList.length === 0) {
      container.innerHTML = `<div style="color:#94a3b8; padding:1rem;">No announcements published yet.</div>`;
      return;
    }

    container.innerHTML = adminAnnouncementsList.map(a => `
      <div style="background:#0D1F13; border:1px solid #1C4228; border-radius:10px; padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem;">
            <span style="font-size:0.72rem; font-weight:800; background:#065F46; color:#A7F3D0; padding:0.15rem 0.5rem; border-radius:4px;">${escapeHtml(a.category || 'Advisory')}</span>
            <span style="font-size:0.72rem; font-weight:800; background:${a.priority === 'Critical' ? '#7F1D1D' : '#1E293B'}; color:${a.priority === 'Critical' ? '#FCA5A5' : '#94A3B8'}; padding:0.15rem 0.5rem; border-radius:4px;">${escapeHtml(a.priority || 'Normal')}</span>
            ${a.hidden ? `<span style="font-size:0.72rem; font-weight:800; background:#991B1B; color:#fff; padding:0.15rem 0.5rem; border-radius:4px;">HIDDEN</span>` : ''}
          </div>
          <strong style="color:#fff; font-size:1.05rem;">${escapeHtml(a.title)}</strong>
          <p style="font-size:0.85rem; color:#94A3B8; margin-top:0.35rem; line-height:1.4;">${escapeHtml(a.content)}</p>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <button onclick="editAnnouncement('${a.id}')" class="btn-admin-outline">Edit</button>
          <button onclick="toggleHideAnnouncement('${a.id}', ${a.hidden ? 'true' : 'false'})" class="btn-admin-outline">${a.hidden ? 'Unhide' : 'Hide'}</button>
          <button onclick="deleteAnnouncement('${a.id}')" class="btn-admin-danger">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Announcements error:', e);
  }
}

function editAnnouncement(id) {
  const a = adminAnnouncementsList.find(item => item.id === id);
  if (!a) return;

  const editIdEl = document.getElementById('ann-edit-id');
  if (editIdEl) editIdEl.value = a.id;
  document.getElementById('ann-title').value = a.title || '';
  document.getElementById('ann-category').value = a.category || 'Advisory';
  document.getElementById('ann-priority').value = a.priority || 'Normal';
  document.getElementById('ann-content').value = a.content || '';

  const formTitle = document.getElementById('ann-form-title');
  if (formTitle) formTitle.textContent = 'Edit Municipal Announcement';
  const saveBtn = document.getElementById('btn-save-ann');
  if (saveBtn) saveBtn.textContent = 'Update Announcement';
  const cancelBtn = document.getElementById('btn-cancel-ann');
  if (cancelBtn) cancelBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetAnnouncementForm() {
  const editIdEl = document.getElementById('ann-edit-id');
  if (editIdEl) editIdEl.value = '';
  document.getElementById('admin-announcement-form').reset();
  const formTitle = document.getElementById('ann-form-title');
  if (formTitle) formTitle.textContent = 'Create New Municipal Announcement';
  const saveBtn = document.getElementById('btn-save-ann');
  if (saveBtn) saveBtn.textContent = 'Publish Announcement';
  const cancelBtn = document.getElementById('btn-cancel-ann');
  if (cancelBtn) cancelBtn.style.display = 'none';
}

async function handleCreateAnnouncement(e) {
  e.preventDefault();
  const editIdEl = document.getElementById('ann-edit-id');
  const editId = editIdEl ? editIdEl.value : '';
  const title = document.getElementById('ann-title').value.trim();
  const category = document.getElementById('ann-category').value;
  const priority = document.getElementById('ann-priority').value;
  const content = document.getElementById('ann-content').value.trim();

  try {
    const endpoint = editId ? `/api/announcements/${editId}` : '/api/announcements';
    const method = editId ? 'PUT' : 'POST';

    const res = await adminFetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId || undefined, title, category, priority, content })
    });
    if (res.ok) {
      resetAnnouncementForm();
      loadAnnouncements();
      alert(editId ? 'Announcement updated!' : 'Announcement published!');
    }
  } catch (err) {
    alert('Error saving announcement.');
  }
}

async function toggleHideAnnouncement(id, currentHidden) {
  try {
    const res = await adminFetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleHide: !currentHidden })
    });
    if (res.ok) loadAnnouncements();
  } catch (e) {
    alert('Failed to toggle announcement visibility.');
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Are you sure you want to delete this announcement?')) return;
  try {
    const res = await adminFetch(`/api/announcements/${id}`, { method: 'DELETE' });
    if (res.ok) loadAnnouncements();
  } catch (e) {}
}

// Community Activities
async function loadAdminActivities() {
  try {
    const res = await adminFetch('/api/activities?all=1');
    const data = await res.json();
    adminActivitiesList = data.activities || [];

    const container = document.getElementById('admin-activities-list');
    if (!container) return;

    if (adminActivitiesList.length === 0) {
      container.innerHTML = `<div style="color:#94a3b8; padding:1rem;">No community activities created yet.</div>`;
      return;
    }

    container.innerHTML = adminActivitiesList.map(act => `
      <div style="background:#0D1F13; border:1px solid #1C4228; border-radius:10px; padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem;">
            <span style="font-size:0.72rem; font-weight:800; background:#065F46; color:#A7F3D0; padding:0.15rem 0.5rem; border-radius:4px;">${escapeHtml(act.category || 'Drive')}</span>
            <span style="font-size:0.72rem; font-weight:800; background:#10B981; color:#fff; padding:0.15rem 0.5rem; border-radius:4px;">+${act.points || 100} Eco-Pts</span>
            ${act.hidden ? `<span style="font-size:0.72rem; font-weight:800; background:#991B1B; color:#fff; padding:0.15rem 0.5rem; border-radius:4px;">HIDDEN</span>` : ''}
          </div>
          <strong style="color:#fff; font-size:1.05rem;">${escapeHtml(act.title)}</strong>
          <div style="font-size:0.82rem; color:#94A3B8; margin-top:0.25rem;">
            <span>📅 ${escapeHtml(act.event_date || act.eventDate || 'TBA')}</span> • 
            <span>📍 ${escapeHtml(act.location || 'Metro Verde')}</span>
          </div>
          <p style="font-size:0.84rem; color:#94A3B8; margin-top:0.35rem; line-height:1.4;">${escapeHtml(act.description || '')}</p>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <button onclick="editActivity('${act.id}')" class="btn-admin-outline">Edit</button>
          <button onclick="toggleHideActivity('${act.id}', ${act.hidden ? 'true' : 'false'})" class="btn-admin-outline">${act.hidden ? 'Unhide' : 'Hide'}</button>
          <button onclick="deleteActivity('${act.id}')" class="btn-admin-danger">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Activities error:', e);
  }
}

function editActivity(id) {
  const act = adminActivitiesList.find(a => a.id === id);
  if (!act) return;

  const editIdEl = document.getElementById('act-edit-id');
  if (editIdEl) editIdEl.value = act.id;
  document.getElementById('act-title').value = act.title || '';
  document.getElementById('act-category').value = act.category || 'Environmental Drive';
  document.getElementById('act-event-date').value = act.event_date || act.eventDate || '';
  document.getElementById('act-location').value = act.location || '';
  document.getElementById('act-points').value = act.points || 100;
  document.getElementById('act-description').value = act.description || '';

  const formTitle = document.getElementById('act-form-title');
  if (formTitle) formTitle.textContent = 'Edit Community Activity';
  const saveBtn = document.getElementById('btn-save-act');
  if (saveBtn) saveBtn.textContent = 'Update Activity';
  const cancelBtn = document.getElementById('btn-cancel-act');
  if (cancelBtn) cancelBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetActivityForm() {
  const editIdEl = document.getElementById('act-edit-id');
  if (editIdEl) editIdEl.value = '';
  document.getElementById('admin-activity-form').reset();
  const formTitle = document.getElementById('act-form-title');
  if (formTitle) formTitle.textContent = 'Add / Manage Community Activity';
  const saveBtn = document.getElementById('btn-save-act');
  if (saveBtn) saveBtn.textContent = 'Save Community Activity';
  const cancelBtn = document.getElementById('btn-cancel-act');
  if (cancelBtn) cancelBtn.style.display = 'none';
}

async function handleSaveAdminActivity(e) {
  e.preventDefault();
  const editIdEl = document.getElementById('act-edit-id');
  const editId = editIdEl ? editIdEl.value : '';
  const title = document.getElementById('act-title').value.trim();
  const category = document.getElementById('act-category').value.trim();
  const event_date = document.getElementById('act-event-date').value.trim();
  const location = document.getElementById('act-location').value.trim();
  const points = Number(document.getElementById('act-points').value) || 100;
  const description = document.getElementById('act-description').value.trim();

  try {
    const endpoint = editId ? `/api/activities/${editId}` : '/api/activities';
    const method = editId ? 'PUT' : 'POST';

    const res = await adminFetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId || undefined, title, category, event_date, location, points, description })
    });
    if (res.ok) {
      resetActivityForm();
      loadAdminActivities();
      alert(editId ? 'Activity updated!' : 'Activity created!');
    }
  } catch (e) {
    alert('Failed to save activity.');
  }
}

async function toggleHideActivity(id, currentHidden) {
  try {
    const res = await adminFetch(`/api/activities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleHide: !currentHidden })
    });
    if (res.ok) loadAdminActivities();
  } catch (e) {
    alert('Failed to toggle activity visibility.');
  }
}

async function deleteActivity(id) {
  if (!confirm('Are you sure you want to delete this activity?')) return;
  try {
    const res = await adminFetch(`/api/activities/${id}`, { method: 'DELETE' });
    if (res.ok) loadAdminActivities();
  } catch (e) {
    alert('Failed to delete activity.');
  }
}

async function loadAdminParticipations() {
  try {
    const res = await adminFetch('/api/admin/activities/participations');
    const data = await res.json();
    adminParticipationsList = data.participations || [];

    const container = document.getElementById('admin-proofs-container');
    const kpi = document.getElementById('kpi-pending-proofs');
    const pending = adminParticipationsList.filter(p => p.status === 'Pending');
    if (kpi) kpi.textContent = pending.length;

    if (!container) return;

    if (adminParticipationsList.length === 0) {
      container.innerHTML = `<div style="color:#94a3b8;">No participation proof submissions.</div>`;
      return;
    }

    container.innerHTML = adminParticipationsList.map(p => `
      <div style="background:#0D1F13; border:1px solid #1C4228; border-radius:10px; padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
        <div>
          <strong style="color:#fff;">${escapeHtml(p.user_name)} (${escapeHtml(p.user_email)})</strong>
          <div style="font-size:0.85rem; color:#10B981; margin:0.25rem 0;">${escapeHtml(p.activity_title)} (+${p.points_awarded || 50} Eco-Pts)</div>
          <p style="font-size:0.82rem; color:#94A3B8;">${escapeHtml(p.proof_description || '')}</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          ${p.status === 'Pending' ? `
            <button onclick="reviewProof('${p.id}', 'Approved')" class="btn-admin-primary">Approve & Award Points</button>
            <button onclick="reviewProof('${p.id}', 'Rejected')" class="btn-admin-danger">Reject</button>
          ` : `<span style="font-size:0.8rem; font-weight:800; color:#10B981;">${p.status}</span>`}
        </div>
      </div>
    `).join('');
  } catch (e) {}
}

async function reviewProof(submissionId, status) {
  try {
    const res = await adminFetch('/api/admin/activities/review-participation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, status })
    });
    if (res.ok) {
      alert(`Proof ${status}!`);
      loadAdminParticipations();
    }
  } catch (e) {}
}

// Citizen Users
async function loadUsersData() {
  try {
    const res = await adminFetch('/api/admin/users');
    const data = await res.json();
    adminUsersList = data.users || [];

    const kpi = document.getElementById('kpi-total-users');
    if (kpi) kpi.textContent = data.totalUsers || adminUsersList.length;

    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    tbody.innerHTML = adminUsersList.map(u => {
      const avatar = u.avatar || u.avatar_url || '';
      return `
        <tr style="border-bottom:1px solid #1C4228;">
          <td style="padding:0.6rem; color:#38BDF8;">${escapeHtml(u.id)}</td>
          <td style="padding:0.6rem; color:#fff; display:flex; align-items:center; gap:0.5rem;">
            ${avatar ? `<img src="${avatar}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">` : `<div style="width:28px; height:28px; border-radius:50%; background:#1E293B; color:#10B981; font-weight:800; display:flex; align-items:center; justify-content:center;">${(u.full_name||u.name||'C').charAt(0)}</div>`}
            <span>${escapeHtml(u.full_name || u.name)}</span>
          </td>
          <td style="padding:0.6rem; color:#94A3B8;">${escapeHtml(u.email)}</td>
          <td style="padding:0.6rem; color:#94A3B8;">${escapeHtml(u.barangay || 'Metro Verde')}</td>
          <td style="padding:0.6rem; color:#10B981; font-weight:800;">${u.eco_points || u.ecoPoints || 50} pts</td>
          <td style="padding:0.6rem;"><span style="background:#065F46; color:#A7F3D0; padding:0.15rem 0.45rem; border-radius:4px; font-size:0.75rem;">${escapeHtml(u.status || 'Active')}</span></td>
        </tr>
      `;
    }).join('');
  } catch (e) {}
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
