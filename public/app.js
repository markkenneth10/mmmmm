// ==========================================================================
// Climate Action Reporting & Information System (Metro Verde)
// Citizen Portal Client-Side Application Engine
// ==========================================================================

const CITIZEN_STORAGE_KEY = 'climate_citizen_session';

const DEFAULT_LOGO_IMAGE_URL = '/assets/ic_climate_app_icon.jpg';

// Global Application State
const state = {
 activeTab: 'dashboard',
 currentUser: null,
 reports: [],
 config: {
 websiteName: 'Climate Action',
 websiteSubtitle: 'Reporting & Information System • Metro Verde',
 logoImageUrl: DEFAULT_LOGO_IMAGE_URL,
 logoType: 'image'
 },
 weather: {},
 announcements: [],
 articles: [],
 userGuides: [],
 activities: [],
 uploadedPhotoData: null,
 fullMapInstance: null,
 previewMapInstance: null,
 fullMapMarkers: [],
 previewMapMarkers: [],
 currentQuizIndex: 0,
 quizScore: 0,
 joinedActivities: new Set()
};

// Educational & Scientific Library Articles (Initially Empty for Fresh Publish)
const articles = [];

// 6 Core Climate Information Pillars (Modal data)
const climatePillars = {
 'climate-change': {
 title: "Climate Change Realities",
 subtitle: "Understanding local risks and adaptation pathways",
 image: "/assets/climate_change_thumb_1789457800658.jpg",
 content: `
 <p>Information about climate change impacts and municipal adaptation strategies.</p>
 `
 },
 'flood-safety': {
 title: "Stormwater & Flash Flood Preparedness",
 subtitle: "Protecting life, waterways, and community drainage corridors",
 image: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80",
 content: `
 <p>Guidelines for flood safety and drainage maintenance.</p>
 `
 },
 'forest-protection': {
 title: "Watershed & Urban Forest Conservation",
 subtitle: "Preserving ecological canopy, slopes, and biodiversity",
 image: "/assets/climate_hero_banner.jpg",
 content: `
 <p>Policies and practices for forest conservation.</p>
 `
 },
 'waste-mgmt': {
 title: "Ecological Solid Waste Management",
 subtitle: "Source segregation and plastic elimination",
 image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
 content: `
 <p>Waste management protocols under RA 9003.</p>
 `
 },
 'water-protection': {
 title: "Freshwater & Aquifer Protection",
 subtitle: "Preventing water contamination",
 image: "https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&w=600&q=80",
 content: `
 <p>Water resource protection guidelines.</p>
 `
 },
 'energy-saving': {
 title: "Low-Carbon Living & Energy Efficiency",
 subtitle: "Reducing municipal carbon footprint",
 image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80",
 content: `
 <p>Energy conservation tips for citizens.</p>
 `
 }
};

// Interactive Quiz Questions
const quizQuestions = [
 {
 question: "Under Philippine Republic Act 9003, what is the maximum penalty for open burning of municipal trash and yard waste?",
 options: [
 "A friendly verbal warning with no fine",
 "Fines from ₱300 up to ₱1,000 and/or 1 to 15 days imprisonment",
 "Community tree planting for 1 hour only",
 "No regulation exists for domestic burning"
 ],
 correct: 1,
 explanation: "Section 48 of RA 9003 strictly penalizes open burning of solid waste due to hazardous dioxins and particulate respiratory risks."
 },
 {
 question: "What is the primary cause of the Urban Heat Island effect in densely built districts?",
 options: [
 "Too many solar panels installed on rooftops",
 "Replacement of natural green vegetation with heat-absorbing asphalt and concrete",
 "Natural sea breezes blowing warm moisture inland",
 "Over-watering of domestic gardens"
 ],
 correct: 1,
 explanation: "Impervious dark asphalt surfaces absorb up to 90% of solar radiation, raising nighttime ambient temperatures significantly."
 },
 {
 question: "What is the optimal citizen response when observing industrial chemical discharge into a public creek?",
 options: [
 "Wait 30 days to see if rain dilutes it",
 "Take geotagged photos and submit an urgent incident report to CENRO immediately",
 "Attempt to drink water to test contamination",
 "Post anonymously on personal social media without reporting"
 ],
 correct: 1,
 explanation: "Rapid reporting enables CENRO environmental inspection units to extract laboratory samples and issue legal Cease and Desist orders."
 }
];

// Community Activities (Initially Empty)
const activities = [];


// ==========================================================================
// Initialization on DOM Load
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
 // Preload cached site branding and permanent logo instantly before network request
 try {
 const cachedConfig = JSON.parse(localStorage.getItem('climate_site_config') || localStorage.getItem('climate_brand_logo_updated') || '{}');
 if (cachedConfig) {
 if (!cachedConfig.logoImageUrl) {
 cachedConfig.logoImageUrl = DEFAULT_LOGO_IMAGE_URL;
 cachedConfig.logoType = 'image';
 }
 state.config = { ...state.config, ...cachedConfig };
 }
 } catch (_) {}
 applyConfigUI(state.config);

 initCitizenSession();
 setupNavigation();
 loadAllData();
 renderArticles();
 renderQuiz();
 renderActivities();
 setupGlobalClickHandlers();
});

// Helper functions for Barrier and Guest mode
function showAuthBarrier() {
 const barrier = document.getElementById('auth-barrier-screen');
 if (barrier) barrier.style.display = 'flex';
}

function dismissBarrierToGuest() {
 sessionStorage.setItem('climate_citizen_guest_browse', 'true');
 const barrier = document.getElementById('auth-barrier-screen');
 if (barrier) barrier.style.display = 'none';
 showToast('Browsing as guest. Citizen account and verification are required to submit reports.');
}

// 1. Citizen Session Handling & Authentication
async function initCitizenSession() {
 const saved = localStorage.getItem(CITIZEN_STORAGE_KEY);
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 // If legacy hardcoded demo user was previously cached in browser, clear it
 const isDemoAccount = parsed && (
 parsed.id === 'usr-mk-001' ||
 parsed.id === 'citizen-mk-01' ||
 String(parsed.email || '').includes('test_citizen_') ||
 String(parsed.email || '').includes('@test.ph') ||
 String(parsed.email || '').includes('cruz.maria.registered')
 );
 if (isDemoAccount) {
 localStorage.removeItem(CITIZEN_STORAGE_KEY);
 state.currentUser = null;
 } else if (parsed && (parsed.email || parsed.name)) {
 // Immediately restore user into state so the citizen is logged in with zero delay
 state.currentUser = parsed;
 updateAuthUI();

 // Background revalidation with server
 try {
 if (parsed.email) {
 const res = await fetch(`/api/user/profile?email=${encodeURIComponent(parsed.email)}`);
 if (res.ok) {
 const data = await res.json();
 if (data.user) {
 state.currentUser = { ...parsed, ...data.user };
 if (!state.currentUser.email && parsed.email) {
 state.currentUser.email = parsed.email;
 }
 localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
 updateAuthUI();
 }
 } else if (res.status === 404) {
 // Re-sync local user to server so serverless cold starts seamlessly recover the user!
 try {
 await fetch('/api/auth/sync-client-session', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ user: parsed })
 });
 } catch (_) {}
 }
 }
 } catch (err) {
 console.warn('Profile background refresh fallback:', err);
 // Keep state.currentUser = parsed active! Do NOT clear session.
 }
 } else {
 state.currentUser = null;
 }
 } catch (e) {
 console.warn('Session parse error:', e);
 }
 } else {
 state.currentUser = null;
 }
 updateAuthUI();
}

function updateAuthUI() {
 const barrier = document.getElementById('auth-barrier-screen');
 const authModal = document.getElementById('auth-modal');
 const authContainer = document.getElementById('citizen-auth-container');
 const drawerUserCard = document.getElementById('drawer-user-card');
 const gateCard = document.getElementById('report-kyc-gate') || document.getElementById('report-auth-gate');
 const reportForm = document.getElementById('report-form-container');
 const dashPoints = document.getElementById('dash-user-eco-points');

 if (state.currentUser) {
 // ----------------------------------------------------
 // LOGGED IN CITIZEN: REMOVE CREATE & LOGIN FROM WEBSITE
 // ----------------------------------------------------
 document.body.classList.add('citizen-logged-in');
 document.body.classList.remove('citizen-guest');

 // Immediately remove/hide the gateway barrier & auth modal
 if (barrier) barrier.style.display = 'none';
 if (authModal) authModal.style.display = 'none';

 if (dashPoints) {
 dashPoints.textContent = state.currentUser.ecoPoints || 50;
 }

 const avatarHtml = state.currentUser.avatar
 ? `<img src="${state.currentUser.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
 : `<span>${getInitials(state.currentUser.fullName || state.currentUser.name)}</span>`;

 // Top Header User Profile Pill (Replaces Create Account / Sign In)
 if (authContainer) {
 authContainer.innerHTML = `
 <div class="citizen-profile-menu-wrapper">
 <div class="user-profile-trigger" onclick="toggleUserDropdown(event)" role="button" aria-expanded="false" title="Citizen Account Menu">
 <div class="user-avatar-circle">
 ${avatarHtml}
 </div>
 <div class="user-text-info">
 <div class="user-name-title">${escapeHtml(state.currentUser.fullName || state.currentUser.name)}</div>
 <div class="user-role-subtitle">
 <span>${state.currentUser.kycStatus === 'verified' ? 'Verified Citizen' : 'ID Verification Needed'}</span>
 <span style="font-size:0.6rem;">▼</span>
 </div>
 </div>
 </div>

 <!-- Dropdown Card -->
 <div class="user-dropdown-menu" id="user-dropdown-menu" onclick="event.stopPropagation()">
 <div class="user-dropdown-header">
 <div style="font-weight: 800; font-size: 0.95rem; color: var(--primary-dark);">${escapeHtml(state.currentUser.fullName || state.currentUser.name)}</div>
 <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(state.currentUser.email)}</div>
 <div class="user-dropdown-stat-row">
 <span>Status:</span>
 <strong style="color: var(--primary-light); font-size: 0.9rem;">Active Citizen</strong>
 </div>
 <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem;">
 <span>Standing: <strong>Good Standing</strong></span>
 <span>ID: <strong>${state.currentUser.kycStatus === 'verified' ? 'Verified' : (state.currentUser.kycStatus === 'pending' ? 'Pending Review' : 'Unverified')}</strong></span>
 </div>
 </div>

 <div style="display: flex; flex-direction: column; gap: 0.25rem;">
 <button class="dropdown-item-link" onclick="switchTab('profile'); closeAllDropdowns();">
 View Citizen Profile & KYC
 </button>
 <button class="dropdown-item-link" onclick="switchTab('tracker'); closeAllDropdowns();">
 My Incident Reports
 </button>
 
 <button class="dropdown-item-link" onclick="switchTab('activities'); closeAllDropdowns();">
 Community Activities
 </button>
 <button class="dropdown-item-link text-danger" onclick="handleCitizenLogout(); closeAllDropdowns();">
 Sign Out
 </button>
 </div>
 </div>
 </div>
 `;
 }

 // Drawer user card (Shows profile and Sign Out)
 if (drawerUserCard) {
 drawerUserCard.innerHTML = `
 <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
 <div>
 <div style="font-weight: 800; font-size: 0.9rem; color: #fff;">${escapeHtml(state.currentUser.fullName || state.currentUser.name)}</div>
 <div style="font-size: 0.72rem; color: rgba(255,255,255,0.85);">${state.currentUser.kycStatus === 'verified' ? 'Verified Citizen' : 'ID Needed'}</div>
 </div>
 <button onclick="handleCitizenLogout(); closeMobileDrawer();" style="background: rgba(255,255,255,0.22); border:none; color:#fff; font-size:0.75rem; padding:0.35rem 0.7rem; border-radius: 999px; cursor:pointer; font-weight: 600;">Sign Out</button>
 </div>
 `;
 }

 // Incident Reporting Gating based on KYC
 const isKycVerified = state.currentUser.kycStatus === 'verified';
 if (isKycVerified) {
 if (gateCard) gateCard.style.display = 'none';
 if (reportForm) reportForm.style.display = 'grid';
 const reporterName = document.getElementById('reporter-display-name');
 const reporterEmail = document.getElementById('reporter-display-email');
 if (reporterName) reporterName.textContent = state.currentUser.fullName || state.currentUser.name;
 if (reporterEmail) reporterEmail.textContent = `(${state.currentUser.email})`;
 } else {
 if (reportForm) reportForm.style.display = 'none';
 if (gateCard) {
 gateCard.style.display = 'block';
 updateReportingKycGateCard();
 }
 }

 renderProfileUI();

 } else {
 // ----------------------------------------------------
 // LOGGED OUT / GUEST VISITOR
 // ----------------------------------------------------
 document.body.classList.remove('citizen-logged-in');
 document.body.classList.add('citizen-guest');

 if (dashPoints) dashPoints.textContent = 0;

 const isGuest = sessionStorage.getItem('climate_citizen_guest_browse') === 'true';
 if (barrier) {
 barrier.style.display = isGuest ? 'none' : 'flex';
 }

 if (authContainer) {
 authContainer.innerHTML = `
 <button class="btn-citizen-signin" onclick="setBarrierMode('register'); showAuthBarrier();">
 Create Account / Sign In
 </button>
 `;
 }

 if (drawerUserCard) {
 drawerUserCard.innerHTML = `
 <div style="display: flex; align-items: center; justify-content: space-between;">
 <span style="font-size: 0.8rem; color: #fff;">Guest Visitor</span>
 <button onclick="setBarrierMode('register'); showAuthBarrier(); closeMobileDrawer();" style="background: var(--emerald); border:none; color:#fff; font-size:0.75rem; padding:0.3rem 0.75rem; border-radius: 999px; cursor:pointer; font-weight:700;">Create Account</button>
 </div>
 `;
 }

 if (gateCard) {
 gateCard.style.display = 'block';
 updateReportingKycGateCard();
 }
 if (reportForm) reportForm.style.display = 'none';
 }
}

function updateReportingKycGateCard() {
 const gateCard = document.getElementById('report-kyc-gate') || document.getElementById('report-auth-gate');
 if (!gateCard) return;

 if (!state.currentUser) {
 // Case 1: Guest / Not Logged In
 gateCard.innerHTML = `
 <div style="margin-bottom: 0.75rem;"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-light);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
 <div style="display: inline-block; background: var(--primary-light); color: #fff; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.75rem;">
 Account & Verification Required
 </div>
 <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.5rem;">
 Create an Account & Verify Identity to Report Incidents
 </h3>
 <p style="font-size: 0.9rem; color: var(--text-muted); max-width: 540px; margin: 0 auto 1.25rem; line-height: 1.65;">
 Under City Environmental Ordinance #2026-04, citizens must create an official account and undergo government ID verification (KYC) before filing environmental reports to eliminate fake reports and misinformation.
 </p>
 <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
 <button class="btn-primary" onclick="setBarrierMode('register'); showAuthBarrier();" style="padding: 0.8rem 1.6rem; font-size: 0.95rem;">
 Create Citizen Account
 </button>
 <button class="btn-secondary" onclick="setBarrierMode('login'); showAuthBarrier();" style="padding: 0.8rem 1.4rem; font-size: 0.95rem;">
 Sign In
 </button>
 </div>
 `;
 return;
 }

 const status = state.currentUser.kycStatus || 'unverified';
 if (status === 'pending') {
 gateCard.innerHTML = `
 <div style="margin-bottom: 0.75rem;"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--amber);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
 <div style="display: inline-block; background: var(--amber-dark); color: #fff; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.75rem;">
 Verification Pending CENRO Review
 </div>
 <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.5rem;">
 Your Identity Documents Are Under Administrative Review
 </h3>
 <p style="font-size: 0.9rem; color: var(--text-muted); max-width: 540px; margin: 0 auto 1.25rem; line-height: 1.6;">
 Thank you for submitting your government ID for verification. Under City Environmental Ordinance #2026-04, CENRO compliance officers verify applicant records to ensure zero misinformation and fraudulent submissions. You will be authorized to submit live reports once verified.
 </p>
 <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
 <button class="btn-primary" onclick="openKycModal()" style="padding: 0.75rem 1.5rem;">
 View Submitted Documents
 </button>
 <button class="btn-secondary" onclick="switchTab('tracker')" style="padding: 0.75rem 1.5rem;">
 View Community Incident Tracker
 </button>
 </div>
 `;
 } else if (status === 'rejected') {
 gateCard.innerHTML = `
 <div style="margin-bottom: 0.75rem;"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--red);"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></div>
 <div style="display: inline-block; background: var(--red); color: #fff; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.75rem;">
 Verification Rejected / Incomplete
 </div>
 <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.5rem;">
 Document Verification Could Not Be Completed
 </h3>
 <p style="font-size: 0.9rem; color: var(--text-muted); max-width: 540px; margin: 0 auto 0.75rem; line-height: 1.6;">
 ${escapeHtml(state.currentUser.kycRejectReason || 'The uploaded document was unclear, expired, or information did not match municipal records.')}
 </p>
 <p style="font-size: 0.85rem; color: var(--text-main); font-weight: 600; margin-bottom: 1.25rem;">
 Please re-upload clear photos of a valid Philippine government-issued ID to activate incident reporting.
 </p>
 <button class="btn-primary" onclick="openKycModal()" style="padding: 0.75rem 1.5rem;">
 Upload Valid Government ID
 </button>
 `;
 } else {
 // Unverified
 gateCard.innerHTML = `
 <div style="margin-bottom: 0.75rem;"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-light);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
 <div style="display: inline-block; background: var(--amber-dark); color: #fff; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.75rem;">
 Identity Verification Required
 </div>
 <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.5rem;">
 Verify Your Identity to Submit Environmental Reports
 </h3>
 <p style="font-size: 0.9rem; color: var(--text-muted); max-width: 540px; margin: 0 auto 1.25rem; line-height: 1.65;">
 Welcome, <strong>${escapeHtml(state.currentUser.fullName || state.currentUser.name)}</strong>! To prevent misinformation, spam, and unverified hazards, all citizens are required to verify their account through KYC verification using a valid government ID before filing reports.
 </p>
 <button class="btn-primary" onclick="openKycModal()" style="padding: 0.85rem 1.75rem; font-size: 0.95rem;">
 Upload & Verify Government ID
 </button>
 `;
 }
}

function renderProfileUI() {
 if (!state.currentUser) return;
 const u = state.currentUser;

 const nameEl = document.getElementById('profile-user-name');
 const bgyEl = document.getElementById('profile-user-barangay');
 const emailPill = document.getElementById('profile-user-email-pill');
 const contEl = document.getElementById('profile-user-contacts');
 const pointsEl = document.getElementById('profile-eco-points');
 const levelEl = document.getElementById('profile-citizen-level');
 const rankEl = document.getElementById('profile-citizen-rank');
 const authStatusEl = document.getElementById('profile-report-auth-status');
 const badgeEl = document.getElementById('profile-kyc-badge');
 const avatarImg = document.getElementById('profile-avatar-img');
 const initialsSpan = document.getElementById('profile-avatar-initials');

 if (nameEl) nameEl.textContent = u.fullName || u.name;
 if (bgyEl) bgyEl.textContent = u.barangay || 'Metro Verde City';
 if (emailPill) emailPill.textContent = u.email || 'Registered Citizen';
 if (contEl) contEl.textContent = u.phone || 'No phone set';
 if (pointsEl) pointsEl.innerHTML = `${u.ecoPoints || u.eco_points || 0} <span style="font-size: 0.9rem;">pts</span>`;
 if (levelEl) levelEl.textContent = u.level || 'Eco Citizen';
 if (rankEl) rankEl.innerHTML = `Rank: <strong>#${u.rank || 1} in LGU</strong> • Status: <strong>${u.status || 'Active'}</strong>`;

 const userPhoto = u.avatar || u.avatar_url || u.avatarUrl || '';
 if (avatarImg && initialsSpan) {
 if (userPhoto) {
 avatarImg.src = userPhoto;
 avatarImg.style.display = 'block';
 initialsSpan.style.display = 'none';
 } else {
 avatarImg.style.display = 'none';
 initialsSpan.style.display = 'inline';
 initialsSpan.textContent = getInitials(u.fullName || u.name);
 }
 }

 loadMyParticipations();

 // KYC Badge & Card
 const kycStatus = u.kycStatus || 'unverified';
 const kycCard = document.getElementById('profile-kyc-card');
 const kycChip = document.getElementById('profile-kyc-status-chip');
 const kycDesc = document.getElementById('profile-kyc-desc');
 const kycDetails = document.getElementById('profile-kyc-details');
 const kycActionBtn = document.getElementById('btn-profile-kyc-action');

 if (kycStatus === 'verified') {
 if (badgeEl) {
 badgeEl.textContent = 'Verified Citizen';
 badgeEl.style.background = 'var(--primary-light)';
 }
 if (authStatusEl) {
 authStatusEl.textContent = 'Authorized';
 authStatusEl.style.color = 'var(--primary-light)';
 }
 if (kycCard) kycCard.style.borderLeftColor = 'var(--primary-light)';
 if (kycChip) {
 kycChip.textContent = 'Verified Citizen';
 kycChip.style.background = 'var(--primary-light)';
 }
 if (kycDesc) {
 kycDesc.textContent = 'Your government ID has been verified by CENRO administration. Real-time incident reporting is fully authorized.';
 }
 if (kycDetails) {
 kycDetails.style.display = 'block';
 kycDetails.textContent = `${u.kycIdType || 'Government ID'} • Number: ${maskIdNumber(u.kycIdNumber || '')}`;
 }
 if (kycActionBtn) {
 kycActionBtn.textContent = 'Update / Replace ID';
 }
 } else if (kycStatus === 'pending') {
 if (badgeEl) {
 badgeEl.textContent = 'Verification Pending';
 badgeEl.style.background = 'var(--amber-dark)';
 }
 if (authStatusEl) {
 authStatusEl.textContent = 'Pending Review';
 authStatusEl.style.color = 'var(--amber-dark)';
 }
 if (kycCard) kycCard.style.borderLeftColor = 'var(--amber)';
 if (kycChip) {
 kycChip.textContent = 'Pending Admin Review';
 kycChip.style.background = 'var(--amber-dark)';
 }
 if (kycDesc) {
 kycDesc.textContent = 'Your uploaded ID documents are currently in the CENRO administrative review queue. Verification typically completes within 24 hours.';
 }
 if (kycDetails) {
 kycDetails.style.display = 'block';
 kycDetails.textContent = `Submitted: ${u.kycIdType || 'Government ID'} (${maskIdNumber(u.kycIdNumber || '')})`;
 }
 if (kycActionBtn) {
 kycActionBtn.textContent = 'Re-upload Documents';
 }
 } else if (kycStatus === 'rejected') {
 if (badgeEl) {
 badgeEl.textContent = 'Verification Rejected';
 badgeEl.style.background = 'var(--red)';
 }
 if (authStatusEl) {
 authStatusEl.textContent = 'Not Authorized';
 authStatusEl.style.color = 'var(--red)';
 }
 if (kycCard) kycCard.style.borderLeftColor = 'var(--red)';
 if (kycChip) {
 kycChip.textContent = 'Submission Rejected';
 kycChip.style.background = 'var(--red)';
 }
 if (kycDesc) {
 kycDesc.textContent = `Verification issue: ${u.kycRejectReason || 'Document copy was unclear or invalid'}. Please re-upload a clear copy of a valid government ID.`;
 }
 if (kycDetails) kycDetails.style.display = 'none';
 if (kycActionBtn) {
 kycActionBtn.textContent = 'Re-upload Valid ID';
 }
 } else {
 // Unverified
 if (badgeEl) {
 badgeEl.textContent = 'Unverified';
 badgeEl.style.background = 'var(--text-muted)';
 }
 if (authStatusEl) {
 authStatusEl.textContent = 'KYC Required';
 authStatusEl.style.color = 'var(--amber-dark)';
 }
 if (kycCard) kycCard.style.borderLeftColor = 'var(--amber)';
 if (kycChip) {
 kycChip.textContent = 'Action Needed';
 kycChip.style.background = 'var(--amber-dark)';
 }
 if (kycDesc) {
 kycDesc.textContent = 'To submit real-time environmental hazard reports and prevent false alerts, verify your identity with a valid government ID.';
 }
 if (kycDetails) kycDetails.style.display = 'none';
 if (kycActionBtn) {
 kycActionBtn.textContent = 'Upload & Verify Government ID';
 }
 }

 // Pre-fill profile settings form
 const editEmail = document.getElementById('edit-profile-email');
 const editName = document.getElementById('edit-profile-name');
 const editPhone = document.getElementById('edit-profile-phone');
 const editBgy = document.getElementById('edit-profile-barangay');
 const editAddr = document.getElementById('edit-profile-address');
 const editBio = document.getElementById('edit-profile-bio');
 const editEmgName = document.getElementById('edit-profile-emg-name');
 const editEmgPhone = document.getElementById('edit-profile-emg-phone');

 if (editEmail) editEmail.value = u.email || '';
 if (editName) editName.value = u.fullName || u.name || '';
 if (editPhone) editPhone.value = u.phone || '';
 if (editBgy && u.barangay) editBgy.value = u.barangay;
 if (editAddr) editAddr.value = u.address || '';
 if (editBio) editBio.value = u.bio || '';
 if (editEmgName) editEmgName.value = u.emergencyContactName || '';
 if (editEmgPhone) editEmgPhone.value = u.emergencyContactPhone || '';
}

function maskIdNumber(idStr) {
 if (!idStr) return '••••';
 if (idStr.length <= 4) return idStr;
 return '••••-••••-' + idStr.slice(-4);
}

// Barrier Auth Modal Handling
function setBarrierMode(mode) {
 const tabLogin = document.getElementById('barrier-tab-login');
 const tabReg = document.getElementById('barrier-tab-register');
 const formLogin = document.getElementById('barrier-login-form');
 const formReg = document.getElementById('barrier-register-form');

 const modalTabLogin = document.getElementById('auth-tab-login');
 const modalTabReg = document.getElementById('auth-tab-register');
 const modalFormLogin = document.getElementById('citizen-login-form');
 const modalFormReg = document.getElementById('citizen-register-form');

 if (mode === 'login') {
 if (tabLogin) tabLogin.className = 'auth-barrier-tab active';
 if (tabReg) tabReg.className = 'auth-barrier-tab';
 if (formLogin) formLogin.style.display = 'block';
 if (formReg) formReg.style.display = 'none';

 if (modalTabLogin) modalTabLogin.className = 'btn-primary';
 if (modalTabReg) modalTabReg.className = 'btn-secondary';
 if (modalFormLogin) modalFormLogin.style.display = 'block';
 if (modalFormReg) modalFormReg.style.display = 'none';
 } else {
 if (tabLogin) tabLogin.className = 'auth-barrier-tab';
 if (tabReg) tabReg.className = 'auth-barrier-tab active';
 if (formLogin) formLogin.style.display = 'none';
 if (formReg) formReg.style.display = 'block';

 if (modalTabLogin) modalTabLogin.className = 'btn-secondary';
 if (modalTabReg) modalTabReg.className = 'btn-primary';
 if (modalFormLogin) modalFormLogin.style.display = 'none';
 if (modalFormReg) modalFormReg.style.display = 'block';
 }
}

async function handleBarrierLogin(e) {
 if (e && e.preventDefault) e.preventDefault();
 const form = (e && e.target && e.target.tagName === 'FORM') ? e.target : document.getElementById('barrier-login-form');

 const emailInput = form ? (form.querySelector('input[type="email"]') || form.querySelector('#barrier-login-email') || form.querySelector('#citizen-login-email')) : document.getElementById('barrier-login-email');
 const passInput = form ? (form.querySelector('input[type="password"]') || form.querySelector('#barrier-login-password') || form.querySelector('#citizen-login-password')) : document.getElementById('barrier-login-password');
 const email = (emailInput ? emailInput.value : '').trim();
 const password = (passInput ? passInput.value : '').trim();
 let errBox = form ? (form.querySelector('.auth-error-box, [id$="-error"]') || form.querySelector('#barrier-login-error') || form.querySelector('#auth-login-error')) : document.getElementById('barrier-login-error');
 if (errBox) errBox.style.display = 'none';

 if (!email || !password) {
 if (errBox) {
 errBox.textContent = 'Please enter your email and password.';
 errBox.style.display = 'block';
 }
 return;
 }

 const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
 const origBtnText = submitBtn ? submitBtn.innerHTML : '';
 if (submitBtn) {
 submitBtn.disabled = true;
 submitBtn.innerHTML = 'Signing in...';
 }

 try {
 const res = await fetch('/api/auth/login', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, password })
 });
 const data = await res.json();
 if (!res.ok) {
 if (errBox) {
 errBox.textContent = data.error || 'Invalid citizen email or password.';
 errBox.style.display = 'block';
 }
 return;
 }

 // AUTOMATIC LOGIN SUCCESS
 state.currentUser = data.user;
 localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
 sessionStorage.removeItem('climate_citizen_guest_browse');

 // Close and remove barrier modal & auth modal
 const barrier = document.getElementById('auth-barrier-screen');
 if (barrier) barrier.style.display = 'none';
 const authModal = document.getElementById('auth-modal');
 if (authModal) authModal.style.display = 'none';

 // Update entire UI: removes all create account and sign in buttons from website!
 updateAuthUI();
 showToast(`Welcome back, ${escapeHtml(state.currentUser.fullName || state.currentUser.name)}!`);
 await fetchReports();

 if (form && form.reset) form.reset();
 } catch (err) {
 console.error('Login error:', err);
 if (errBox) {
 errBox.textContent = 'Network communication error. Please try again.';
 errBox.style.display = 'block';
 }
 } finally {
 if (submitBtn) {
 submitBtn.disabled = false;
 submitBtn.innerHTML = origBtnText;
 }
 }
}

async function handleBarrierRegister(e) {
 if (e && e.preventDefault) e.preventDefault();
 const form = (e && e.target && e.target.tagName === 'FORM') ? e.target : document.getElementById('barrier-register-form');

 const nameInput = form ? (form.querySelector('input[name="name"]') || form.querySelector('#barrier-reg-name') || form.querySelector('#reg-name') || form.querySelector('input[type="text"]')) : document.getElementById('barrier-reg-name');
 const emailInput = form ? (form.querySelector('input[type="email"]') || form.querySelector('#barrier-reg-email') || form.querySelector('#reg-email')) : document.getElementById('barrier-reg-email');
 const phoneInput = form ? (form.querySelector('input[type="tel"]') || form.querySelector('#barrier-reg-phone') || form.querySelector('#reg-phone')) : document.getElementById('barrier-reg-phone');
 const barangayInput = form ? (form.querySelector('select') || form.querySelector('#barrier-reg-barangay') || form.querySelector('#reg-barangay')) : document.getElementById('barrier-reg-barangay');
 const addressInput = form ? (form.querySelector('#barrier-reg-address') || form.querySelector('input[name="address"]') || form.querySelector('#reg-address')) : document.getElementById('barrier-reg-address');
 const passInput = form ? (form.querySelector('input[type="password"]') || form.querySelector('#barrier-reg-password') || form.querySelector('#reg-password')) : document.getElementById('barrier-reg-password');

 const name = (nameInput ? nameInput.value : '').trim();
 const email = (emailInput ? emailInput.value : '').trim();
 const phone = (phoneInput ? phoneInput.value : '').trim() || '+63 917 123 4567';
 const barangay = (barangayInput ? barangayInput.value : 'Barangay Makilas');
 const address = (addressInput ? addressInput.value : '').trim();
 const password = (passInput ? passInput.value : '').trim();
 let errBox = form ? (form.querySelector('.auth-error-box, [id$="-error"]') || form.querySelector('#barrier-reg-error') || form.querySelector('#auth-reg-error')) : document.getElementById('barrier-reg-error');
 if (errBox) errBox.style.display = 'none';

 if (!name || !email || !password) {
 if (errBox) {
 errBox.textContent = 'Please fill out your name, email, and password.';
 errBox.style.display = 'block';
 }
 return;
 }
 if (password.length < 6) {
 if (errBox) {
 errBox.textContent = 'Password must be at least 6 characters.';
 errBox.style.display = 'block';
 }
 return;
 }

 const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
 const origBtnText = submitBtn ? submitBtn.innerHTML : '';
 if (submitBtn) {
 submitBtn.disabled = true;
 submitBtn.innerHTML = 'Creating account & signing in...';
 }

 try {
 const res = await fetch('/api/auth/register', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ name, email, phone, barangay, address, password })
 });
 const data = await res.json();
 if (!res.ok && res.status !== 409) {
 if (errBox) {
 errBox.textContent = data.error || 'Registration failed. Please check your information.';
 errBox.style.display = 'block';
 }
 return;
 }

 let userToLogin = data ? data.user : null;
 // If account already existed, attempt seamless automatic login
 if (res.status === 409) {
 const loginRes = await fetch('/api/auth/login', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, password })
 });
 const loginData = await loginRes.json();
 if (loginRes.ok && loginData.user) {
 userToLogin = loginData.user;
 } else {
 setBarrierMode('login');
 const loginEmail = document.getElementById('barrier-login-email') || document.getElementById('citizen-login-email');
 if (loginEmail) loginEmail.value = email;
 const loginErr = document.getElementById('barrier-login-error') || document.getElementById('auth-login-error');
 if (loginErr) {
 loginErr.textContent = 'An account with this email already exists. Please sign in with your password.';
 loginErr.style.display = 'block';
 }
 showToast('Account already exists. Please sign in with your password.');
 return;
 }
 }

 if (!userToLogin) {
 userToLogin = {
 id: `user-${Date.now().toString().slice(-4)}`,
 name,
 fullName: name,
 email,
 phone,
 barangay,
 address,
 role: 'citizen',
 status: 'Active',
 ecoPoints: 50,
 kycStatus: 'unverified'
 };
 }

 // AUTOMATIC LOGIN AFTER CREATING ACCOUNT
 state.currentUser = userToLogin;
 localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
 sessionStorage.removeItem('climate_citizen_guest_browse');

 // Close and remove barrier modal and auth modal
 const barrier = document.getElementById('auth-barrier-screen');
 if (barrier) barrier.style.display = 'none';
 const authModal = document.getElementById('auth-modal');
 if (authModal) authModal.style.display = 'none';

 // Update entire UI: removes all create account and sign in buttons from website!
 updateAuthUI();
 showToast(`Account created! Welcome, ${escapeHtml(userToLogin.fullName || userToLogin.name)}!`);
 await fetchReports();

 if (form && form.reset) form.reset();
 } catch (err) {
 console.warn('Registration network fallback:', err);
 // Offline / Network fallback: create and log in locally!
 const fallbackUser = {
 id: `user-${Date.now().toString().slice(-4)}`,
 name,
 fullName: name,
 email,
 phone,
 barangay,
 address,
 role: 'citizen',
 status: 'Active',
 ecoPoints: 50,
 kycStatus: 'unverified'
 };
 state.currentUser = fallbackUser;
 localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
 sessionStorage.removeItem('climate_citizen_guest_browse');

 const barrier = document.getElementById('auth-barrier-screen');
 if (barrier) barrier.style.display = 'none';
 const authModal = document.getElementById('auth-modal');
 if (authModal) authModal.style.display = 'none';
 updateAuthUI();
 showToast(`Account created! Welcome, ${escapeHtml(name)}!`);
 } finally {
 if (submitBtn) {
 submitBtn.disabled = false;
 submitBtn.innerHTML = origBtnText;
 }
 }
}

// Profile Settings & Photo Upload Handlers
async function handleAvatarFileChange(event) {
 const file = event.target.files[0];
 if (!file || !state.currentUser) return;

 const reader = new FileReader();
 reader.onload = async (e) => {
 const dataUrl = e.target.result;
 try {
 const res = await fetch('/api/user/profile', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 email: state.currentUser.email,
 avatar: dataUrl
 })
 });
 const data = await res.json();
 if (res.ok) {
 state.currentUser.avatar = dataUrl;
 localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
 updateAuthUI();
 showToast('Profile photo updated successfully!');
 } else {
 alert(data.error || 'Failed to update avatar.');
 }
 } catch (err) {
 alert('Network error updating profile photo.');
 }
 };
 reader.readAsDataURL(file);
}

async function handleSaveProfileSettings(event) {
 event.preventDefault();
 if (!state.currentUser) return;

 const name = document.getElementById('edit-profile-name').value.trim();
 const phone = document.getElementById('edit-profile-phone').value.trim();
 const barangay = document.getElementById('edit-profile-barangay').value;
 const address = document.getElementById('edit-profile-address').value.trim();
 const bio = document.getElementById('edit-profile-bio').value.trim();
 const emergencyContactName = document.getElementById('edit-profile-emg-name').value.trim();
 const emergencyContactPhone = document.getElementById('edit-profile-emg-phone').value.trim();

 const statusEl = document.getElementById('profile-save-status');

 try {
 const res = await fetch('/api/user/profile', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 email: state.currentUser.email,
 name,
 phone,
 barangay,
 address,
 bio,
 emergencyContactName,
 emergencyContactPhone
 })
 });
 const data = await res.json();
 if (res.ok) {
 state.currentUser = { ...state.currentUser, ...data.user };
 localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
 updateAuthUI();

 if (statusEl) {
 statusEl.style.display = 'block';
 statusEl.style.background = '#ECFDF5';
 statusEl.style.color = '#065F46';
 statusEl.style.border = '1px solid #A7F3D0';
 statusEl.textContent = 'Profile details and address saved successfully.';
 setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
 }
 showToast('Profile information updated.');
 } else {
 if (statusEl) {
 statusEl.style.display = 'block';
 statusEl.style.background = '#FEF2F2';
 statusEl.style.color = '#991B1B';
 statusEl.style.border = '1px solid #FECACA';
 statusEl.textContent = data.error || 'Failed to save changes.';
 }
 }
 } catch (err) {
 alert('Network error saving profile settings.');
 }
}

// KYC Verification Handling
let kycUploadState = { front: null, back: null, selfie: null };

function openKycModal() {
 if (!state.currentUser) {
 setBarrierMode('login');
 const barrier = document.getElementById('auth-barrier-screen');
 if (barrier) barrier.style.display = 'flex';
 return;
 }
 const modal = document.getElementById('kyc-modal');
 if (modal) {
 modal.style.display = 'flex';
 if (state.currentUser.kycIdType) {
 const typeSelect = document.getElementById('kyc-doc-type');
 if (typeSelect) typeSelect.value = state.currentUser.kycIdType;
 }
 if (state.currentUser.kycIdNumber) {
 const numInput = document.getElementById('kyc-doc-number');
 if (numInput) numInput.value = state.currentUser.kycIdNumber;
 }
 const errBox = document.getElementById('kyc-submit-error');
 if (errBox) errBox.style.display = 'none';
 }
}

function closeKycModal() {
 const modal = document.getElementById('kyc-modal');
 if (modal) modal.style.display = 'none';
}

function handleKycFileUpload(event, type) {
 const file = event.target.files[0];
 if (!file) return;

 const reader = new FileReader();
 reader.onload = (e) => {
 const dataUrl = e.target.result;
 kycUploadState[type] = dataUrl;

 const preview = document.getElementById(`kyc-img-${type}`);
 const placeholder = document.getElementById(`kyc-preview-${type}-placeholder`);
 const removeBtn = document.getElementById(`kyc-btn-remove-${type}`);

 if (preview) {
 preview.src = dataUrl;
 preview.style.display = 'block';
 }
 if (placeholder) placeholder.style.display = 'none';
 if (removeBtn) removeBtn.style.display = 'block';
 };
 reader.readAsDataURL(file);
}

function removeKycFile(event, type) {
 event.stopPropagation();
 kycUploadState[type] = null;

 const fileInput = document.getElementById(`kyc-file-${type}`);
 if (fileInput) fileInput.value = '';

 const preview = document.getElementById(`kyc-img-${type}`);
 const placeholder = document.getElementById(`kyc-preview-${type}-placeholder`);
 const removeBtn = document.getElementById(`kyc-btn-remove-${type}`);

 if (preview) preview.style.display = 'none';
 if (placeholder) placeholder.style.display = 'block';
 if (removeBtn) removeBtn.style.display = 'none';
}

async function handleKycSubmit(event) {
 event.preventDefault();
 if (!state.currentUser) return;

 const docType = document.getElementById('kyc-doc-type').value.trim();
 const docNumber = document.getElementById('kyc-doc-number').value.trim();
 const errBox = document.getElementById('kyc-submit-error');
 const submitBtn = document.getElementById('btn-submit-kyc');

 if (errBox) errBox.style.display = 'none';

 if (!kycUploadState.front) {
 if (errBox) {
 errBox.textContent = 'Please upload the front photo of your government ID.';
 errBox.style.display = 'block';
 }
 return;
 }
 if (!kycUploadState.selfie) {
 if (errBox) {
 errBox.textContent = 'Please upload a selfie of you holding your government ID.';
 errBox.style.display = 'block';
 }
 return;
 }

 if (submitBtn) {
 submitBtn.disabled = true;
 submitBtn.textContent = 'Encrypting & Submitting...';
 }

 try {
 const res = await fetch('/api/user/kyc/submit', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 email: state.currentUser.email,
 idType: docType,
 idNumber: docNumber,
 frontImage: kycUploadState.front,
 backImage: kycUploadState.back || '',
 selfieImage: kycUploadState.selfie
 })
 });
 const data = await res.json();

 if (!res.ok) {
 if (errBox) {
 errBox.textContent = data.error || 'Failed to submit KYC documents.';
 errBox.style.display = 'block';
 }
 return;
 }

 state.currentUser.kycStatus = 'pending';
 state.currentUser.kycIdType = docType;
 state.currentUser.kycIdNumber = docNumber;
 state.currentUser.kycSubmittedAt = Date.now();
 localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));

 closeKycModal();
 updateAuthUI();
 showToast('KYC documents submitted for CENRO administrative review.');

 } catch (err) {
 if (errBox) {
 errBox.textContent = 'Network error submitting verification documents.';
 errBox.style.display = 'block';
 }
 } finally {
 if (submitBtn) {
 submitBtn.disabled = false;
 submitBtn.textContent = 'Submit Documents for Admin Review';
 }
 }
}

// Generic Auth Modal (for backwards compatibility)
function openAuthModal(mode = 'login') {
 setBarrierMode(mode);
 const barrier = document.getElementById('auth-barrier-screen');
 if (barrier) barrier.style.display = 'flex';
}

function closeAuthModal() {
 const modal = document.getElementById('auth-modal');
 if (modal) modal.style.display = 'none';
}

function setAuthMode(mode) {
 setBarrierMode(mode);
}

async function handleCitizenLogin(e) {
 await handleBarrierLogin(e);
}

async function handleCitizenRegister(e) {
 await handleBarrierRegister(e);
}

function handleCitizenLogout() {
 localStorage.removeItem(CITIZEN_STORAGE_KEY);
 sessionStorage.removeItem('climate_citizen_guest_browse');
 state.currentUser = null;
 setBarrierMode('login');
 showAuthBarrier();
 updateAuthUI();
 showToast('Signed out of citizen session.');
}

// 2. Data Fetching
async function loadAllData() {
 await Promise.all([
 fetchConfig(),
 fetchWeather(),
 fetchAnnouncements(),
 fetchUserGuides(),
 fetchReports(),
 fetchActivities(),
 fetchArticles()
 ]);
}

async function fetchConfig() {
 try {
 const res = await fetch('/api/config?_t=' + Date.now(), { cache: 'no-store' });
 const data = await res.json();
 const newConfig = data.config || {};
 // Ensure logoImageUrl is never blank
 if (!newConfig.logoImageUrl) {
 newConfig.logoImageUrl = state.config.logoImageUrl || DEFAULT_LOGO_IMAGE_URL;
 newConfig.logoType = 'image';
 }
 state.config = { ...state.config, ...newConfig };
 try {
 localStorage.setItem('climate_site_config', JSON.stringify(state.config));
 } catch (_) {}
 applyConfigUI(state.config);
 } catch (e) {
 console.warn('Using cached or default config', e);
 }
}

function renderBrandLogoElement(el, c, size = 44) {
 if (!el) return;
 const logoUrl = (c && c.logoImageUrl) ? c.logoImageUrl : DEFAULT_LOGO_IMAGE_URL;
 const isEmoji = Boolean(c && c.logoType === 'emoji' && !c.logoImageUrl);

 if (!isEmoji && logoUrl) {
 // If element already contains the identical logo image, DO NOT destroy and recreate the DOM node!
 const existingImg = el.querySelector('img.brand-logo-img');
 if (existingImg && existingImg.getAttribute('src') === logoUrl && el.classList.contains('has-image')) {
 return; // Already actively rendered, prevent flicker
 }

 el.classList.add('has-image');
 el.style.background = 'transparent';
 el.style.backgroundImage = 'none';
 el.style.boxShadow = 'none';
 el.style.border = 'none';
 el.style.padding = '0';
 el.style.borderRadius = '0';
 el.style.overflow = 'visible';
 el.style.width = 'auto';
 el.style.maxWidth = '200px';
 el.style.height = `${size}px`;
 el.innerHTML = `<img src="${logoUrl}" alt="Official Logo" class="brand-logo-img" style="height:100%!important; max-height:${size}px!important; width:auto!important; max-width:200px!important; object-fit:contain!important; display:block!important; margin:auto; background:transparent!important; background-image:none!important; border:none!important; border-radius:0!important; box-shadow:none!important;" onerror="this.onerror=null; this.src='${DEFAULT_LOGO_IMAGE_URL}';">`;
 } else {
 // Only revert if there is no image configured at all
 if (el.querySelector('img.brand-logo-img') && logoUrl) {
 return;
 }
 el.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
 el.classList.remove('has-image');
 el.style.background = '';
 el.style.backgroundImage = '';
 el.style.boxShadow = '';
 el.style.border = '';
 el.style.padding = '';
 el.style.borderRadius = '';
 el.style.overflow = '';
 el.style.width = '';
 el.style.maxWidth = '';
 el.style.height = '';
 }
}

// Updates browser tab favicon dynamically for user website
function updateSiteFavicon(c) {
 if (!c) return;
 const isImage = Boolean(c.logoImageUrl && c.logoType !== 'emoji');

 // Remove existing icon links to force browser tab refresh
 const existingLinks = document.querySelectorAll("link[rel*='icon']");
 existingLinks.forEach(el => el.remove());

 const newLink = document.createElement('link');
 newLink.id = 'site-favicon';
 newLink.rel = 'icon';

 const favUrl = isImage ? c.logoImageUrl : DEFAULT_LOGO_IMAGE_URL;
 newLink.type = 'image/png';
 const cacheBuster = (favUrl.includes('?') ? '&' : '?') + 'fav=' + (c.updatedAt || Date.now());
 newLink.href = favUrl + cacheBuster;
 document.head.appendChild(newLink);
}

function applyConfigUI(c) {
 if (!c) return;

 // Website Name & Subtitle across all views
 const siteName = c.websiteName || 'Climate Action';
 const siteSub = c.websiteSubtitle || 'Reporting & Information System • Metro Verde';
  renderNatureAnimations(c.enableNatureAnimations);

 const brandEl = document.getElementById('site-brand-name');
 if (brandEl) brandEl.textContent = siteName;

 const subEl = document.getElementById('site-brand-sub');
 if (subEl) subEl.textContent = siteSub;

 const drawerBrandEl = document.getElementById('drawer-brand-name');
 if (drawerBrandEl) drawerBrandEl.textContent = siteName;

 const drawerSubEl = document.getElementById('drawer-brand-sub');
 if (drawerSubEl) drawerSubEl.textContent = siteSub;

 const footerBrandEl = document.getElementById('footer-brand-name');
 if (footerBrandEl) footerBrandEl.textContent = siteName;

 // Render Brand Logo across Header, Mobile Drawer, and Footer
 renderBrandLogoElement(document.getElementById('site-logo-icon'), c, 44);
 renderBrandLogoElement(document.getElementById('drawer-logo-icon'), c, 38);
 renderBrandLogoElement(document.getElementById('footer-logo-icon'), c, 34);

 // Update browser tab Favicon dynamically
 updateSiteFavicon(c);

 // Update Page Title
 if (c.websiteName) {
 const pageTitle = document.getElementById('page-title');
 if (pageTitle) {
 pageTitle.textContent = `${c.websiteName} | Mobile & Web Climate Action Reporting and Information System`;
 }
 }

 if (c.climateChangeInfo) {
 const el = document.getElementById('cms-display-climate-change');
 if (el) el.textContent = c.climateChangeInfo;
 }
 if (c.climateActionInfo) {
 const el = document.getElementById('cms-display-climate-action');
 if (el) el.textContent = c.climateActionInfo;
 }
 if (c.climateAwarenessInfo) {
 const el = document.getElementById('cms-display-climate-awareness');
 if (el) el.textContent = c.climateAwarenessInfo;
 }
 if (c.reportingGuideInfo) {
 const el = document.getElementById('cms-display-reporting-guide');
 if (el) el.textContent = c.reportingGuideInfo;
 }

 // About System, Mandate, Governance, and Creators
 if (c.aboutWebsite) {
 const el = document.getElementById('cms-display-about-website');
 if (el) el.textContent = c.aboutWebsite;
 const footerAbout = document.getElementById('cms-display-footer-about');
 if (footerAbout) footerAbout.textContent = c.aboutWebsite;
 }
 if (c.whyCreated) {
 const el = document.getElementById('cms-display-why-created');
 if (el) el.textContent = c.whyCreated;
 }
 if (c.whoCreated) {
 const el = document.getElementById('cms-display-who-created');
 if (el) el.textContent = c.whoCreated;
 const footerCreator = document.getElementById('cms-display-footer-creator');
 if (footerCreator) footerCreator.textContent = c.whoCreated;
 }
 if (c.contactPartners) {
 const el = document.getElementById('cms-display-contact-partners');
 if (el) el.textContent = c.contactPartners;
 }
 if (c.footerCopyrightText) {
 const footerBottomDiv = document.querySelector('.footer-bottom-strip > div > div');
 if (footerBottomDiv) footerBottomDiv.textContent = c.footerCopyrightText;
 }

  // Emergency Hotlines (Dynamic municipal list with real-time sync)
  renderCitizenEmergencyHotlines(c);

 // Hero Banner image (if provided)
 const heroBanner = document.getElementById('home-report-cta-banner');
 if (heroBanner) {
 if (c.heroImageUrl) {
 heroBanner.style.backgroundImage = `linear-gradient(rgba(10, 37, 24, 0.88), rgba(10, 37, 24, 0.92)), url('${c.heroImageUrl}')`;
 heroBanner.style.backgroundSize = 'cover';
 heroBanner.style.backgroundPosition = 'center';
 } else {
 heroBanner.style.backgroundImage = '';
 }
 }

 // About Graphic image (if provided)
 const aboutImg = document.getElementById('cms-display-about-img');
 const aboutImgBox = document.getElementById('cms-display-about-img-box');
 if (aboutImg) {
 if (c.aboutImageUrl) {
 aboutImg.src = c.aboutImageUrl;
 if (aboutImgBox) aboutImgBox.style.display = 'block';
 } else {
 if (aboutImgBox) aboutImgBox.style.display = 'none';
 }
 }
}

async function fetchWeather() {
 try {
 const res = await fetch('/api/weather');
 const data = await res.json();
 state.weather = data.weather || {};
 applyWeatherUI(state.weather);
 } catch (e) {
 console.warn('Weather fallback');
 }
}

function renderCitizenEmergencyHotlines(c) {
  let hotlines = c.emergencyHotlines;
  if (!Array.isArray(hotlines) || hotlines.length === 0) {
    hotlines = [];
    if (c.emergencyHotline) hotlines.push({ name: 'Municipal Disaster Rescue', number: c.emergencyHotline, note: '24/7 Rapid Response', icon: '' });
    if (c.denrHotline) hotlines.push({ name: 'DENR Environmental Protection', number: c.denrHotline, note: 'Violations & Enforcement', icon: '' });
    if (c.healthHotline) hotlines.push({ name: 'City Health & Heat Helpline', number: c.healthHotline, note: 'Medical & Climate Health', icon: '' });
    if (hotlines.length === 0) {
      hotlines = [
        { name: 'Municipal Disaster Rescue', number: '(02) 8888-ECO', note: '24/7 Rapid Response', icon: '' },
        { name: 'DENR Environmental Protection', number: '#911-DENR', note: 'Violations & Enforcement', icon: '' },
        { name: 'City Health & Heat Helpline', number: '(02) 8999-CLIMATE', note: 'Medical & Climate Health', icon: '' }
      ];
    }
  }

  // 1. Mobile Drawer 24/7 Hotlines
  const drawerContainer = document.getElementById('cms-display-drawer-hotlines-list');
  if (drawerContainer) {
    drawerContainer.innerHTML = hotlines.map(h => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0; border-bottom: 1px dashed rgba(255,255,255,0.1); font-size: 0.78rem;">
        <span style="color: var(--text-muted); display:flex; align-items:center; gap:0.35rem;"><strong>${escapeHtml(h.name)}</strong>:</span>
        <a href="tel:${escapeHtml((h.number || '').replace(/[^0-9+#*]/g, ''))}" style="color: #4ADE80; font-weight: 800; text-decoration: none;">${escapeHtml(h.number)}</a>
      </div>
    `).join('');
  }

  // 2. Protocol Hotlines Row (Homepage triage & response protocols)
  const protocolContainer = document.getElementById('cms-display-protocol-hotlines-list');
  if (protocolContainer) {
    protocolContainer.innerHTML = hotlines.map(h => `
      <div class="protocol-hotline-item">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.25rem;">
          <div class="protocol-hotline-label">${escapeHtml(h.name)}</div>
          ${h.note ? `<span style="font-size:0.6rem; background:rgba(34,197,94,0.15); color:#166534; padding:0.08rem 0.3rem; border-radius:4px; font-weight:700; white-space:nowrap;">${escapeHtml(h.note)}</span>` : ''}
        </div>
        <a href="tel:${escapeHtml((h.number || '').replace(/[^0-9+#*]/g, ''))}" class="protocol-hotline-number" style="display:block; text-decoration:none; margin-top:0.2rem;">${escapeHtml(h.number)}</a>
      </div>
    `).join('');
  }

  // 3. Footer Hotlines Column
  const footerContainer = document.getElementById('cms-display-footer-hotlines-list');
  if (footerContainer) {
    footerContainer.innerHTML = hotlines.map(h => `
      <div style="margin-bottom: 0.5rem; padding-bottom: 0.45rem; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
          <span>${escapeHtml(h.name)}</span>
          ${h.note ? `<span style="font-size: 0.65rem; color: #86EFAC;">${escapeHtml(h.note)}</span>` : ''}
        </div>
        <div style="margin-top: 0.15rem;">
          <a href="tel:${escapeHtml((h.number || '').replace(/[^0-9+#*]/g, ''))}" style="color: #FFFFFF; font-weight: 800; text-decoration: none; font-size: 0.88rem; letter-spacing: 0.02em;">
            ${escapeHtml(h.number)}
          </a>
        </div>
      </div>
    `).join('') + `
      <div style="margin-top: 0.4rem; font-size: 0.76rem; color: var(--text-muted);">
        CENRO Inquiries: <strong style="color:#FFFFFF;">cenro@metroverde.gov.ph</strong>
      </div>
    `;
  }

  // Legacy fallback bindings
  const elRescue = document.getElementById('cms-display-emergency-hotline');
  if (elRescue) elRescue.textContent = hotlines[0]?.number || c.emergencyHotline || '';
  const drawerRescue = document.getElementById('cms-display-drawer-rescue-hotline');
  if (drawerRescue) drawerRescue.textContent = hotlines[0]?.number || c.emergencyHotline || '';

  const elDenr = document.getElementById('cms-display-denr-hotline');
  if (elDenr) elDenr.textContent = hotlines[1]?.number || c.denrHotline || '';
  const drawerDenr = document.getElementById('cms-display-drawer-denr-hotline');
  if (drawerDenr) drawerDenr.textContent = hotlines[1]?.number || c.denrHotline || '';

  const elHealth = document.getElementById('cms-display-health-hotline');
  if (elHealth) elHealth.textContent = hotlines[2]?.number || c.healthHotline || '';
}

function applyWeatherUI(w) {
 const headerPill = document.getElementById('header-weather-text');
 if (headerPill) {
 headerPill.textContent = `${w.temperature || 32}°C • ${w.alertLevel || 'Yellow'} Alert`;
 }

 const tempEl = document.getElementById('dash-weather-temp');
 const heatEl = document.getElementById('dash-weather-heat');
 const condEl = document.getElementById('dash-weather-condition');
 const feelsEl = document.getElementById('dash-weather-feels');
 const alertEl = document.getElementById('dash-weather-alert');
 const aqiEl = document.getElementById('dash-weather-aqi');
 const rainEl = document.getElementById('dash-weather-rain');
 const advEl = document.getElementById('dash-weather-advisory-text');

 if (tempEl) tempEl.textContent = w.temperature || 32;
 if (heatEl) heatEl.textContent = `${w.heatIndex || 38}°C`;
 if (condEl) condEl.textContent = w.condition || 'Partly Cloudy';
 if (feelsEl) feelsEl.textContent = `Feels like ${Math.round((w.temperature || 32) + 4)}°C`;
 if (aqiEl) aqiEl.textContent = w.airQuality || '68';
 if (rainEl) rainEl.textContent = w.rainRisk || '45%';
 if (alertEl) alertEl.innerHTML = `<span class="advisory-dot"></span> PAGASA Status: ${w.alertLevel || 'Yellow'} Alert`;
 if (advEl) advEl.textContent = `${w.advisoryNotice || 'Low Pressure Area approaching Eastern Seaboard. Preemptive culvert monitoring active.'} >`;
}

function refreshClimateTelemetry() {
 const indicator = document.querySelector('.status-updated-indicator');
 if (indicator) indicator.textContent = 'Updating telemetry...';
 setTimeout(async () => {
 await fetchWeather();
 if (indicator) indicator.textContent = 'Telemetry updated';
 showToast('Real-time climate telemetry refreshed.');
 }, 600);
}

function openAdvisoryModal() {
 const body = document.getElementById('modal-incident-body');
 body.innerHTML = `
 <div style="border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1rem;">
 <span class="status-badge" style="background:#FEF3C7; color:#B45309;">PAGASA METEOROLOGICAL BULLETIN</span>
 <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--primary-dark); margin-top: 0.35rem;">
 Tropical Depression & Monsoon Advisory #04
 </h3>
 </div>
 <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-main);">
 <p>A Low Pressure Area (LPA) was estimated based on all available data at 280 km East of Metro Verde. It is forecasted to bring moderate to heavy rainfall along mountain foothills and downstream river spillways.</p>
 <div style="background: var(--surface-alt); padding: 0.85rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid var(--amber);">
 <strong>Municipal Directives:</strong>
 <ul style="padding-left: 1.25rem; margin-top: 0.25rem;">
 <li>Barangay DRRMO Eco-Wardens are mobilized for round-the-clock water level telemetry.</li>
 <li>Residents along river corridors are advised to clear roadside drainage culverts.</li>
 <li>Emergency Rescue Hotline (02) 8888-ECO is on heightened alert.</li>
 </ul>
 </div>
 </div>
 `;
 document.getElementById('incident-modal').style.display = 'flex';
}

async function fetchAnnouncements() {
 try {
 const res = await fetch('/api/announcements');
 const data = await res.json();
 state.announcements = data.announcements || [];
 renderAnnouncementsUI(state.announcements);
 } catch (e) {
 console.warn('Announcements fallback');
 }
}

function renderAnnouncementsUI(list) {
 const notifContainer = document.getElementById('notif-items-list');
 const badgeCount = document.getElementById('notif-badge-count');

 if (badgeCount) {
 badgeCount.textContent = list.length || 0;
 badgeCount.style.display = list.length > 0 ? 'flex' : 'none';
 }

 if (notifContainer) {
 if (list.length === 0) {
 notifContainer.innerHTML = `
 <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
 No active alerts or official bulletins at this time.
 </div>
 `;
 } else {
 notifContainer.innerHTML = list.map((a, idx) => `
 <div class="notif-item priority-${(a.priority || 'low').toLowerCase()}" onclick="openNoticeIndexModal(${idx})" style="cursor:pointer;" title="Click to view bulletin details">
 <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; margin-bottom:0.2rem;">
 <span style="font-weight:700; color:var(--text-main);">${escapeHtml(a.title)}</span>
 <span class="status-badge" style="font-size:0.65rem; padding:1px 6px; text-transform:uppercase;">${escapeHtml(a.priority || 'info')}</span>
 </div>
 <div style="color:var(--text-muted); font-size:0.75rem; line-height:1.4;">${escapeHtml(a.content)}</div>
 <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.3rem;">By ${escapeHtml(a.author || 'CENRO')} • ${new Date(a.timestamp || Date.now()).toLocaleDateString()}</div>
 </div>
 `).join('');
 }
 }
}

function openNoticeIndexModal(idx) {
 if (state.announcements && state.announcements[idx]) {
 openNoticeDetailModal(state.announcements[idx]);
 }
}

function openNoticeDetailModal(notice) {
 closeAllDropdowns();
 const modal = document.getElementById('incident-modal');
 const body = document.getElementById('modal-incident-body');
 if (!modal || !body) return;

 const prio = (notice.priority || 'info').toLowerCase();
 const prioBg = prio === 'urgent' ? '#EF4444' : prio === 'high' ? '#F59E0B' : '#10B981';

 body.innerHTML = `
 <div style="border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1rem;">
 <span class="status-badge" style="background:${prioBg}; color:#fff; font-size:0.7rem; font-weight:800; text-transform:uppercase; padding:3px 10px; border-radius:6px;">
 ${escapeHtml(notice.priority || 'OFFICIAL BULLETIN')}
 </span>
 <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--primary-dark); margin-top: 0.5rem;">
 ${escapeHtml(notice.title || 'Official Climate Advisory')}
 </h3>
 <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.25rem;">
 Issued by <strong>${escapeHtml(notice.author || 'CENRO Command')}</strong> • ${notice.timestamp ? new Date(notice.timestamp).toLocaleString() : 'Recent'}
 </div>
 </div>
 <div style="font-size: 0.92rem; line-height: 1.7; color: var(--text-main); margin-bottom: 1.25rem;">
 <p style="white-space: pre-wrap;">${escapeHtml(notice.content || '')}</p>
 </div>
 <div style="padding-top: 0.75rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
 <span style="font-size: 0.75rem; color: var(--text-muted);">Verified Municipal Advisory</span>
 <button class="btn-primary" onclick="closeModal('incident-modal')" style="padding: 0.45rem 1.25rem; font-size: 0.85rem;">Dismiss</button>
 </div>
 `;
 modal.style.display = 'flex';
}

function openNotificationsModal() {
 const notifMenu = document.getElementById('notif-dropdown-menu');
 if (notifMenu) {
 notifMenu.classList.add('active');
 }
}

function closeNotificationsMenu() {
 const notifMenu = document.getElementById('notif-dropdown-menu');
 if (notifMenu) {
 notifMenu.classList.remove('active');
 }
}

function markAllNotifsRead() {
 const badge = document.getElementById('notif-badge-count');
 if (badge) badge.style.display = 'none';
 closeAllDropdowns();
 showToast('All notifications marked as read.');
}

async function fetchUserGuides() {
 try {
 const res = await fetch('/api/user-guides');
 const data = await res.json();
 state.userGuides = data.guides || [];
 renderUserGuidesUI(state.userGuides);
 } catch (e) {
 console.warn('User guides fallback');
 }
}

function renderUserGuidesUI(guides) {
 const container = document.getElementById('user-guides-container');
 if (!container) return;

 if (guides.length === 0) {
 container.innerHTML = `
 <div class="card" style="text-align: center; color: var(--text-muted); padding: 2rem;">
 No user guides available yet.
 </div>
 `;
 return;
 }

 container.innerHTML = guides.map(g => `
 <div class="card" style="border-left: 5px solid var(--primary-light);">
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
 <div style="display: flex; align-items: center; gap: 0.75rem;">
 <svg class="icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-light);"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
 <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--primary-dark);">${escapeHtml(g.title)}</h3>
 </div>
 <span class="badge-portal-pill" style="font-size: 0.7rem;">${escapeHtml(g.category || 'Guide')}</span>
 </div>
 <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">${escapeHtml(g.summary || '')}</p>
 <div style="background: var(--surface-alt); padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.85rem; line-height: 1.6; color: var(--text-main);">
 ${escapeHtml(g.content)}
 </div>
 </div>
 `).join('');
}

// 3. Reports Handling & Homepage Rendering
async function fetchReports() {
 try {
 const res = await fetch('/api/reports');
 const data = await res.json();
 state.reports = data.reports || [];
 } catch (e) {
 console.warn('Reports fetch fallback');
 }
 renderDashboardData();
 renderIncidentTracker();
 initOrUpdatePreviewMap();
 initOrUpdateFullMap();
}

function renderDashboardData() {
 const kycPill = document.getElementById('dash-user-kyc-pill');
 const trendEl = document.getElementById('kpi-user-reports-trend');

 const totalEl = document.getElementById('kpi-total-reports') || document.getElementById('kpi-user-total-reports');
 const pendEl = document.getElementById('kpi-pending-reports') || document.getElementById('kpi-user-pending-reports');
 const inProgEl = document.getElementById('kpi-inprogress-reports') || document.getElementById('kpi-user-inprogress-reports');
 const resEl = document.getElementById('kpi-resolved-reports') || document.getElementById('kpi-user-resolved-reports');
 const tableBody = document.getElementById('dashboard-recent-table-body');

 if (state.currentUser) {
 const user = state.currentUser;
 if (kycPill) {
 if (user.kycStatus === 'verified') {
 kycPill.innerHTML = 'Verified Citizen';
 kycPill.style.background = '#065F46';
 kycPill.style.color = '#A7F3D0';
 } else if (user.kycStatus === 'pending') {
 kycPill.innerHTML = 'KYC Review Pending';
 kycPill.style.background = '#854D0E';
 kycPill.style.color = '#FDE68A';
 } else {
 kycPill.innerHTML = 'Unverified Account';
 kycPill.style.background = '#1E3A8A';
 kycPill.style.color = '#BFDBFE';
 }
 }
 if (trendEl) trendEl.textContent = 'Personal account log';

 const userEmail = (user.email || '').toLowerCase();
 const userReports = (state.reports || []).filter(r => ((r.submittedEmail || r.userEmail || '')).toLowerCase() === userEmail);

 const total = userReports.length;
 const pending = userReports.filter(r => r.status === 'Pending' || r.status === 'Submitted').length;
 const inProgress = userReports.filter(r => r.status === 'In Progress' || r.status === 'Investigating' || r.status === 'Under Review').length;
 const resolved = userReports.filter(r => r.status === 'Resolved' || r.status === 'Closed').length;

 if (totalEl) totalEl.textContent = total;
 if (pendEl) pendEl.textContent = pending;
 if (inProgEl) inProgEl.textContent = inProgress;
 if (resEl) resEl.textContent = resolved;

 if (tableBody) {
 if (userReports.length === 0) {
 tableBody.innerHTML = `
 <tr>
 <td colspan="4" style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
 <div style="font-weight: 800; color: var(--text-main); font-size: 1rem;">No Incident Reports Filed Yet</div>
 <div style="font-size: 0.82rem; margin-top: 0.35rem; color: var(--text-muted); line-height: 1.4;">
 ${user.kycStatus === 'verified'
 ? 'Your account is ready to report local hazards, illegal dumping, or flooding.'
 : 'Complete one-time KYC verification to submit certified incident reports.'}
 </div>
 <button class="btn-primary" onclick="${user.kycStatus === 'verified' ? "switchTab('report')" : "openKycModal()"}" style="margin-top: 0.85rem; font-size: 0.82rem; padding: 0.5rem 1rem;">
 ${user.kycStatus === 'verified' ? '+ Submit First Report' : 'Verify Identity Now'}
 </button>
 </td>
 </tr>
 `;
 } else {
 tableBody.innerHTML = userReports.map(r => {
 const dateStr = r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
 const st = (r.status || 'Submitted');
 const stClass = st.toLowerCase().replace(' ', '-');
 return `
 <tr class="interactive-row" onclick="openReportTimelineModal('${r.id}', '${escapeHtml(r.category || r.title)}', '${escapeHtml(r.barangay || '')}', '${st}')">
 <td><div class="report-type-cell">${escapeHtml(r.title || r.category)}</div></td>
 <td>${escapeHtml(r.barangay || 'Metro Verde')}</td>
 <td><span class="status-badge ${stClass}"><span class="status-dot ${stClass}"></span> ${st}</span></td>
 <td style="color: var(--text-muted); font-size: 0.78rem;">${dateStr}</td>
 </tr>
 `;
 }).join('');
 }
 }
 } else {
 // Guest Citizen View: Show Municipal Community Activity and Recent Community Reports
 if (kycPill) {
 kycPill.innerHTML = 'Public Community Mode';
 kycPill.style.background = '#1E293B';
 kycPill.style.color = '#94A3B8';
 }
 if (trendEl) trendEl.textContent = 'Metro Verde Municipality';

 const allReports = state.reports || [];
 const total = allReports.length;
 const pending = allReports.filter(r => r.status === 'Pending' || r.status === 'Submitted').length;
 const inProgress = allReports.filter(r => r.status === 'In Progress' || r.status === 'Investigating' || r.status === 'Under Review').length;
 const resolved = allReports.filter(r => r.status === 'Resolved' || r.status === 'Closed').length;

 if (totalEl) totalEl.textContent = total;
 if (pendEl) pendEl.textContent = pending;
 if (inProgEl) inProgEl.textContent = inProgress;
 if (resEl) resEl.textContent = resolved;

 if (tableBody) {
 if (allReports.length > 0) {
 tableBody.innerHTML = allReports.slice(0, 4).map(r => {
 const dateStr = r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
 const st = (r.status || 'Submitted');
 const stClass = st.toLowerCase().replace(' ', '-');
 return `
 <tr class="interactive-row" onclick="openReportTimelineModal('${r.id}', '${escapeHtml(r.category || r.title)}', '${escapeHtml(r.barangay || '')}', '${st}')">
 <td><div class="report-type-cell">${escapeHtml(r.title || r.category)}</div></td>
 <td>${escapeHtml(r.barangay || 'Metro Verde')}</td>
 <td><span class="status-badge ${stClass}"><span class="status-dot ${stClass}"></span> ${st}</span></td>
 <td style="color: var(--text-muted); font-size: 0.78rem;">${dateStr}</td>
 </tr>
 `;
 }).join('');
 } else {
 tableBody.innerHTML = `
 <tr>
 <td colspan="4" style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
 <div>No community reports submitted yet.</div>
 </td>
 </tr>
 `;
 }
 }
 }

 // Render Dashboard Activities List
 const activitiesContainer = document.getElementById('dashboard-activities-container');
 if (activitiesContainer) {
 if (state.activities.length === 0) {
 activitiesContainer.innerHTML = `
 <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
 No upcoming activities.
 </div>
 `;
 } else {
 activitiesContainer.innerHTML = state.activities.slice(0, 3).map(act => `
 <div class="activity-row-item">
 <div class="activity-info-block">
 <div class="activity-name">${act.title}</div>
 <div class="activity-meta">
 <span>${act.date}</span>
 <span>${act.registered} Volunteers</span>
 </div>
 </div>
 <button class="btn-join-activity ${state.joinedActivities.has(act.id) ? 'joined' : ''}" onclick="toggleJoinActivity('${act.id}')">
 ${state.joinedActivities.has(act.id) ? 'Joined' : 'Join Activity'}
 </button>
 </div>
 `).join('');
 }
 }
}

// Quick action: Open Report tab and prefill category
function openReportWithCategory(categoryName = '') {
 switchTab('report');
 if (categoryName) {
 const sel = document.getElementById('report-category');
 if (sel) {
 for (let i = 0; i < sel.options.length; i++) {
 if (sel.options[i].value.toLowerCase().includes(categoryName.toLowerCase())) {
 sel.selectedIndex = i;
 break;
 }
 }
 }
 }
 const titleInput = document.getElementById('report-title');
 if (titleInput) {
 titleInput.focus();
 titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
 }
}

// 4. Incident Status Timeline Modal
function openReportTimelineModal(reportId, type, location, status) {
 const modal = document.getElementById('incident-modal');
 const body = document.getElementById('modal-incident-body');
 if (!modal || !body) return;

 const isResolved = status.toLowerCase() === 'resolved';
 const isInProgress = status.toLowerCase().includes('progress');
 const isInvestigating = status.toLowerCase().includes('investigating');

 body.innerHTML = `
 <div style="border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
 <div>
 <span style="font-size: 0.78rem; font-weight: 800; color: var(--primary-light);">${reportId}</span>
 <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-top: 0.2rem;">
 ${type} at ${location}
 </h3>
 </div>
 <span class="status-badge ${status.toLowerCase().replace(' ', '-')}">
 ● ${status}
 </span>
 </div>

 <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
 Track the live 5-stage municipal resolution milestones and field inspection audits:
 </div>

 <!-- 5-Step Status Timeline -->
 <div class="status-timeline-track">
 <div class="timeline-step-item done">
 <div class="timeline-step-marker"></div>
 <div class="timeline-step-title">1. Report Submitted</div>
 <div class="timeline-step-meta">Logged by verified citizen. Geotagged and queued for dispatch.</div>
 </div>
 <div class="timeline-step-item done">
 <div class="timeline-step-marker"></div>
 <div class="timeline-step-title">2. Verified by Barangay Eco-Warden</div>
 <div class="timeline-step-meta">On-site photographic inspection confirmed validity.</div>
 </div>
 <div class="timeline-step-item ${isInvestigating || isInProgress || isResolved ? 'done' : 'current'}">
 <div class="timeline-step-marker">${isInvestigating || isInProgress || isResolved ? '' : '●'}</div>
 <div class="timeline-step-title">3. Assigned to CENRO Response Unit</div>
 <div class="timeline-step-meta">Ticket allocated to specialized Solid Waste or Flood Mitigation team.</div>
 </div>
 <div class="timeline-step-item ${isResolved ? 'done' : (isInProgress || isInvestigating ? 'current' : '')}">
 <div class="timeline-step-marker">${isResolved ? '' : (isInProgress || isInvestigating ? '●' : '○')}</div>
 <div class="timeline-step-title">4. Under Investigation & Active Remediation</div>
 <div class="timeline-step-meta">Drainage declogging crews, heavy equipment, or legal citations issued.</div>
 </div>
 <div class="timeline-step-item ${isResolved ? 'done' : ''}">
 <div class="timeline-step-marker">${isResolved ? '' : '○'}</div>
 <div class="timeline-step-title">5. Resolved & Field Audited</div>
 <div class="timeline-step-meta">Remediation photo uploaded. Community reward credited.</div>
 </div>
 </div>

 <div style="background: var(--surface-alt); padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.82rem; margin-top: 1.25rem;">
 <strong>CENRO Dispatch Log:</strong>
 <div style="color: var(--text-muted); margin-top: 0.25rem;">
 Team #4 Alpha deployed to ${location}. Environmental inspection conducted under Republic Act 9003. Citizen reporter notified via mobile alert.
 </div>
 </div>
 `;

 modal.style.display = 'flex';
}

// 5. Climate Information Pillar Modal
function openInfoCardModal(pillarKey) {
 const p = climatePillars[pillarKey];
 if (!p) return;

 const modal = document.getElementById('info-pillar-modal');
 const body = document.getElementById('modal-info-pillar-body');
 if (!modal || !body) return;

 body.innerHTML = `
 <div style="border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1rem;">
 <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--primary-dark);">${p.title}</h3>
 <div style="font-size: 0.82rem; color: var(--text-muted);">${p.subtitle}</div>
 </div>

 ${p.image ? `
 <div style="margin-bottom: 1rem; max-height: 200px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border);">
 <img src="${p.image}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover; max-height: 200px; display: block;">
 </div>
 ` : ''}

 <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-main);">
 ${p.content}
 </div>

 <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
 <button class="btn-primary" onclick="closeModal('info-pillar-modal')">
 Close Knowledge Guide
 </button>
 </div>
 `;

 modal.style.display = 'flex';
}

function closeModal(modalId) {
 const el = document.getElementById(modalId);
 if (el) el.style.display = 'none';
}

// 6. Interactive Leaflet GIS Maps (Preview + Full)
function initOrUpdatePreviewMap() {
 const container = document.getElementById('dashboard-preview-map');
 if (!container) return;

 // Safeguard: Leaflet script might load asynchronously or fail on slow mobile network
 if (typeof L === 'undefined' || !L.map) {
 console.warn('Leaflet GIS library not yet loaded. Map preview deferred.');
 return;
 }

 try {
 if (!state.previewMapInstance) {
 if (container._leaflet_id) {
 container._leaflet_id = null;
 }
 state.previewMapInstance = L.map('dashboard-preview-map', {
 zoomControl: false,
 attributionControl: false
 }).setView([14.6538, 121.0583], 13);

 L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
 maxZoom: 18
 }).addTo(state.previewMapInstance);
 }

 // Clear previous markers
 if (state.previewMapMarkers) {
 state.previewMapMarkers.forEach(m => {
 try { state.previewMapInstance.removeLayer(m); } catch (e) {}
 });
 }
 state.previewMapMarkers = [];

 // Plot reports
 state.reports.forEach(r => {
 if (!r.latitude || !r.longitude) return;
 let color = '#16A765';
 let rad = 7;
 if (r.severity === 'Critical') { color = '#DC3545'; rad = 10; }
 else if (r.severity === 'High') { color = '#EA580C'; rad = 8; }
 else if (r.status === 'Investigating') { color = '#F4B400'; rad = 7; }

 const circle = L.circleMarker([r.latitude, r.longitude], {
 radius: rad,
 fillColor: color,
 color: '#FFFFFF',
 weight: 1.5,
 fillOpacity: 0.85
 }).addTo(state.previewMapInstance);

 circle.bindPopup(`<strong>${r.category}</strong><br>${escapeHtml(r.title)}<br>${r.barangay}`);
 state.previewMapMarkers.push(circle);
 });
 } catch (err) {
 console.warn('Preview map initialization handled safely:', err);
 }
}

function initOrUpdateFullMap() {
 const container = document.getElementById('web-map-container');
 if (!container) return;

 if (typeof L === 'undefined' || !L.map) {
 console.warn('Leaflet GIS library not yet loaded. Full map deferred.');
 return;
 }

 try {
 if (!state.fullMapInstance) {
 if (container._leaflet_id) {
 container._leaflet_id = null;
 }
 state.fullMapInstance = L.map('web-map-container').setView([14.6538, 121.0583], 13);

 L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
 maxZoom: 19,
 attribution: '© OpenStreetMap contributors | Metro Verde GIS'
 }).addTo(state.fullMapInstance);
 }

 // Clear previous markers
 if (state.fullMapMarkers) {
 state.fullMapMarkers.forEach(m => {
 try { state.fullMapInstance.removeLayer(m); } catch (e) {}
 });
 }
 state.fullMapMarkers = [];

 state.reports.forEach(r => {
 if (!r.latitude || !r.longitude) return;
 let color = '#16A765';
 let rad = 8;
 if (r.severity === 'Critical') { color = '#DC3545'; rad = 12; }
 else if (r.severity === 'High') { color = '#EA580C'; rad = 10; }
 else if (r.status === 'Investigating') { color = '#F4B400'; rad = 8; }
 else if (r.status === 'In Progress') { color = '#0284C7'; rad = 8; }

 const circle = L.circleMarker([r.latitude, r.longitude], {
 radius: rad,
 fillColor: color,
 color: '#FFFFFF',
 weight: 2,
 fillOpacity: 0.85
 }).addTo(state.fullMapInstance);

 circle.bindPopup(`
 <div style="font-family:'Plus Jakarta Sans',sans-serif; font-size:12px; line-height:1.4;">
 <strong style="color:${color};">${r.category}</strong><br>
 <strong>${escapeHtml(r.title)}</strong><br>
 <span>${escapeHtml(r.barangay)}</span><br>
 <span style="font-size:11px; color:#5A6A80;">Status: ${r.status}</span>
 </div>
 `);

 circle.on('click', () => {
 // Automatically zoom and center the map on the selected incident report marker
 if (state.fullMapInstance) {
 state.fullMapInstance.flyTo([r.latitude, r.longitude], 16, {
 animate: true,
 duration: 1.2
 });
 circle.openPopup();
 }

 const pinBox = document.getElementById('map-pin-detail-box');
 if (pinBox) {
 pinBox.innerHTML = `
 <div style="background: var(--surface-alt); padding: 0.85rem; border-radius: 8px; border-left: 4px solid ${color};">
 <div style="font-weight: 800; color: var(--text-main);">${escapeHtml(r.title)}</div>
 <div style="font-size: 0.78rem; color: var(--text-muted); margin: 0.35rem 0;">${escapeHtml(r.barangay)} • ${escapeHtml(r.landmark || '')}</div>
 <div style="display: flex; gap: 0.4rem; margin-top: 0.5rem;">
 <span class="status-badge" style="background:${color}22; color:${color}; font-size:0.72rem;">${r.severity}</span>
 <span class="status-badge in-progress" style="font-size:0.72rem;">${r.status}</span>
 </div>
 <button onclick="openReportTimelineModal('${r.id}', '${escapeHtml(r.category)}', '${escapeHtml(r.barangay)}', '${r.status}')" class="btn-primary" style="margin-top: 0.75rem; width: 100%; padding: 0.45rem; font-size: 0.78rem;">
 View Resolution Timeline
 </button>
 </div>
 `;
 }
 });

 state.fullMapMarkers.push(circle);
 });
 } catch (err) {
 console.warn('Full map initialization handled safely:', err);
 }
}

// 7. Incident Tracker View & Search
function renderIncidentTracker(statusFilter = 'All', searchQuery = '') {
 const grid = document.getElementById('tracker-reports-grid');
 if (!grid) return;

 const countAll = document.getElementById('tracker-count-all');
 if (countAll) countAll.textContent = state.reports.length;

 let filtered = state.reports;
 if (statusFilter !== 'All') {
 filtered = filtered.filter(r => (r.status || '').toLowerCase().includes(statusFilter.toLowerCase()));
 }
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(r =>
 (r.title || '').toLowerCase().includes(q) ||
 (r.barangay || '').toLowerCase().includes(q) ||
 (r.id || '').toLowerCase().includes(q) ||
 (r.category || '').toLowerCase().includes(q)
 );
 }

 if (filtered.length === 0) {
 grid.innerHTML = `<div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2.5rem;">No environmental incident reports match your filter criteria.</div>`;
 return;
 }

 grid.innerHTML = filtered.map(r => `
 <div class="card" onclick="openReportTimelineModal('${r.id}', '${escapeHtml(r.category)}', '${escapeHtml(r.barangay)}', '${r.status}')" style="cursor: pointer; display: flex; flex-direction: column; justify-content: space-between;">
 <div>
 <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 0.5rem;">
 <span style="font-size: 0.74rem; font-weight: 800; color: var(--primary-light);">${r.category}</span>
 <span class="status-badge" style="background:#FEE2E2; color:#991B1B; font-size:0.7rem;">${r.severity}</span>
 </div>
 <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-main); line-height: 1.35;">${escapeHtml(r.title)}</h4>
 <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.5rem 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
 ${escapeHtml(r.description)}
 </p>
 </div>

 <div>
 <div style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 0.75rem; display: flex; justify-content: space-between;">
 <span>${escapeHtml(r.barangay)}</span>
 <span>${new Date(r.timestamp).toLocaleDateString()}</span>
 </div>
 <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.65rem;">
 <span class="status-badge in-progress">${r.status}</span>
 <span style="font-size: 0.78rem; color: var(--primary-light); font-weight: 800;">Inspect Timeline →</span>
 </div>
 </div>
 </div>
 `).join('');
}

function handleTrackerSearch(e) {
 const activePill = document.querySelector('[data-tracker-filter].active');
 const filter = activePill ? activePill.getAttribute('data-tracker-filter') : 'All';
 renderIncidentTracker(filter, e.target.value);
}

function filterTrackerByStatus(status) {
 document.querySelectorAll('[data-tracker-filter]').forEach(btn => {
 if (btn.getAttribute('data-tracker-filter') === status) btn.classList.add('active');
 else btn.classList.remove('active');
 });
 const search = document.getElementById('tracker-search-input')?.value || '';
 renderIncidentTracker(status, search);
}

// 8. Form Submission (Strictly Requires Verified Citizen KYC)
async function handleFormSubmit(e) {
 e.preventDefault();

 if (!state.currentUser) {
 setBarrierMode('login');
 const barrier = document.getElementById('auth-barrier-screen');
 if (barrier) barrier.style.display = 'flex';
 showToast('You must log in or register before submitting an incident report.');
 return;
 }

 if (state.currentUser.kycStatus !== 'verified') {
 alert('Identity Verification Required: Under City Ecological Ordinance #2026-04, citizens must verify their government ID before submitting environmental incident reports.');
 openKycModal();
 return;
 }

 const title = document.getElementById('report-title').value.trim();
 const category = document.getElementById('report-category').value;
 const severity = document.getElementById('report-severity').value;
 const barangay = document.getElementById('report-barangay').value;
 const landmark = document.getElementById('report-landmark').value.trim();
 const description = document.getElementById('report-desc').value.trim();

 const coordsMap = {
 'Barangay Makilas': { lat: 14.6520, lng: 121.0540 },
 'Poblacion': { lat: 14.6550, lng: 121.0580 },
 'Lumbia': { lat: 14.6460, lng: 121.0610 },
 'Taway': { lat: 14.6710, lng: 121.0720 },
 'Maasin': { lat: 14.6380, lng: 121.0420 },
 'Barangay San Isidro': { lat: 14.6640, lng: 121.0510 },
 'Barangay Riverside': { lat: 14.6590, lng: 121.0350 },
 'Barangay Malinis': { lat: 14.6640, lng: 121.0510 }
 };
 const coords = coordsMap[barangay] || { lat: 14.6538, lng: 121.0583 };

 const newReport = {
 title,
 category,
 severity,
 barangay,
 landmark,
 description,
 latitude: coords.lat + (Math.random() - 0.5) * 0.005,
 longitude: coords.lng + (Math.random() - 0.5) * 0.005,
 submittedBy: state.currentUser.fullName || state.currentUser.name,
 submittedEmail: state.currentUser.email,
 photoUrl: state.uploadedPhotoData || "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=600&q=80"
 };

 try {
 const res = await fetch('/api/reports', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(newReport)
 });
 const data = await res.json();

 if (res.status === 403 || data.requiresKyc) {
 alert(data.error || 'Identity Verification Required: Please verify your government ID with CENRO before submitting reports.');
 openKycModal();
 return;
 }

 if (res.ok) {
 state.currentUser.ecoPoints = (state.currentUser.ecoPoints || 50) + 50;
 state.currentUser.reportsCount = (state.currentUser.reportsCount || 0) + 1;
 localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
 updateAuthUI();

 document.getElementById('incident-report-form').reset();
 const preview = document.getElementById('photo-preview-img');
 const placeholder = document.getElementById('photo-upload-placeholder');
 if (preview) preview.style.display = 'none';
 if (placeholder) placeholder.style.display = 'block';
 state.uploadedPhotoData = null;

 showToast(`Incident submitted as Ticket ${data.report.id}.`);
 await fetchReports();
 renderDashboardData();
 switchTab('tracker');
 } else {
 alert(data.error || 'Failed to submit report. Please check required fields.');
 }
 } catch (err) {
 alert('Network error submitting incident report.');
 }
}

function handlePhotoSelect(e) {
 const file = e.target.files[0];
 if (!file) return;

 const reader = new FileReader();
 reader.onload = (ev) => {
 state.uploadedPhotoData = ev.target.result;
 const preview = document.getElementById('photo-preview-img');
 const placeholder = document.getElementById('photo-upload-placeholder');
 preview.src = ev.target.result;
 preview.style.display = 'block';
 placeholder.style.display = 'none';
 };
 reader.readAsDataURL(file);
}

// 9. Articles, Quiz & Activities
async function fetchActivities() {
 try {
 const res = await fetch('/api/activities');
 const data = await res.json();
 state.activities = data.activities || [];
 renderActivities();
 renderDashboardData();
 } catch (e) {
 console.warn('Activities fetch fallback');
 }
}

async function fetchArticles() {
 try {
 const res = await fetch('/api/articles');
 const data = await res.json();
 state.articles = data.articles || [];
 renderArticles();
 } catch (e) {
 console.warn('Articles fetch fallback');
 }
}

function renderArticles() {
 const grid = document.getElementById('articles-grid');
 if (!grid) return;

 if (state.articles.length === 0) {
 grid.innerHTML = `
 <div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">
 No climate library articles available yet.
 </div>
 `;
 return;
 }

 grid.innerHTML = state.articles.map(a => `
 <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
 <img src="${a.image}" style="height: 160px; width: 100%; object-fit: cover;" alt="${a.title}">
 <div style="padding: 1.25rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
 <div>
 <span class="badge-portal-pill" style="font-size: 0.68rem;">${a.category}</span>
 <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-main); margin-top: 0.4rem;">${a.title}</h4>
 <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0.5rem 0; line-height: 1.5;">${a.summary}</p>
 </div>
 <div style="font-size: 0.75rem; color: var(--primary-light); font-weight: 800; margin-top: 0.75rem;">
 ${a.readTime}
 </div>
 </div>
 </div>
 `).join('');
}

function renderQuiz() {
 const container = document.getElementById('quiz-container');
 if (!container) return;

 if (state.currentQuizIndex >= quizQuestions.length) {
 container.innerHTML = `
 <div style="text-align: center; padding: 2rem;">
 
 <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.5rem;">Climate Literacy Champion!</h3>
 <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem;">
 You scored ${state.quizScore} out of ${quizQuestions.length} correct. Thank you for advancing environmental literacy in Metro Verde!
 </p>
 <button class="btn-primary" onclick="resetQuiz()">Retake Quiz</button>
 </div>
 `;
 return;
 }

 const q = quizQuestions[state.currentQuizIndex];
 container.innerHTML = `
 <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
 <span style="font-size: 0.8rem; font-weight: 800; color: var(--primary-light);">Question ${state.currentQuizIndex + 1} of ${quizQuestions.length}</span>
 <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">Score: ${state.quizScore}</span>
 </div>
 <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 1.25rem; line-height: 1.5;">${q.question}</h3>

 <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.5rem;">
 ${q.options.map((opt, i) => `
 <button class="btn-secondary" onclick="handleQuizAnswer(${i})" style="text-align: left; padding: 0.85rem 1rem; font-size: 0.88rem; font-weight: 600;">
 ${opt}
 </button>
 `).join('')}
 </div>
 `;
}

function handleQuizAnswer(selectedIdx) {
 const q = quizQuestions[state.currentQuizIndex];
 const isCorrect = selectedIdx === q.correct;
 if (isCorrect) {
 state.quizScore++;
 if (state.currentUser) {
 state.currentUser.ecoPoints = (state.currentUser.ecoPoints || 750) + 15;
 localStorage.setItem(CITIZEN_STORAGE_KEY, JSON.stringify(state.currentUser));
 updateAuthUI();
 }
 }

 alert(isCorrect ? `Correct! ${q.explanation}` : `Incorrect. ${q.explanation}`);
 state.currentQuizIndex++;
 renderQuiz();
}

function resetQuiz() {
 state.currentQuizIndex = 0;
 state.quizScore = 0;
 renderQuiz();
}

// My Activity Participations State
let myParticipationsList = [];
let activityProofPhotoBase64 = '';

async function loadMyParticipations() {
  const container = document.getElementById('my-participations-container');
  if (!container) return;

  if (!state.currentUser) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.88rem;">
        Please sign in to view your joined community movements and proof submission status.
      </div>
    `;
    return;
  }

  try {
    const res = await fetch(`/api/activities/my-participations?userId=${encodeURIComponent(state.currentUser.id || '')}&email=${encodeURIComponent(state.currentUser.email || '')}`);
    const data = await res.json();
    myParticipationsList = data.participations || [];

    if (myParticipationsList.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.88rem;">
          You have not submitted participation proofs for any community activities yet. Browse upcoming drives above to participate and earn Eco-Points!
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${myParticipationsList.map(p => {
          let statusBadge = `<span class="badge-portal-pill" style="background: var(--amber-dark); font-size: 0.72rem;">Pending Admin Review</span>`;
          let statusBorder = 'var(--amber)';
          if (p.status === 'Approved') {
            statusBadge = `<span class="badge-portal-pill" style="background: var(--primary-light); font-size: 0.72rem;">Approved (+${p.points_awarded || 50} Eco-Pts)</span>`;
            statusBorder = 'var(--primary-light)';
          } else if (p.status === 'Rejected') {
            statusBadge = `<span class="badge-portal-pill" style="background: var(--red); font-size: 0.72rem;">Rejected</span>`;
            statusBorder = 'var(--red)';
          }

          return `
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-left: 5px solid ${statusBorder}; border-radius: var(--radius-md); padding: 1rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start; justify-content: space-between;">
              <div style="flex: 1; min-width: 240px;">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
                  ${statusBadge}
                  <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">${escapeHtml(p.activity_title)}</h4>
                </div>
                ${p.proof_description ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.35rem 0; line-height: 1.5;">${escapeHtml(p.proof_description)}</p>` : ''}
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">
                  Submitted on ${new Date(p.submitted_at).toLocaleDateString()} at ${new Date(p.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                ${p.review_notes ? `
                  <div style="margin-top: 0.5rem; padding: 0.5rem 0.75rem; background: #F8FAFC; border-radius: 6px; border: 1px solid #E2E8F0; font-size: 0.8rem; color: var(--text-main);">
                    <strong>CENRO Admin Remarks:</strong> ${escapeHtml(p.review_notes)}
                  </div>
                ` : ''}
              </div>
              ${p.proof_image_url ? `
                <div style="text-align: center;">
                  <img src="${p.proof_image_url}" alt="Participation Proof" style="width: 90px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); cursor: pointer;" onclick="window.open('${p.proof_image_url}', '_blank')">
                  <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 0.2rem;">Click to view full</div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    console.warn('Failed to load my participations:', err);
    container.innerHTML = `
      <div style="text-align: center; color: var(--red); padding: 1rem; font-size: 0.85rem;">
        Could not load participation history.
      </div>
    `;
  }
}

function renderActivities() {
  const grid = document.getElementById('activities-grid');
  if (!grid) return;

  if (state.activities.length === 0) {
    grid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">
        No community activities scheduled at this time.
      </div>
    `;
    return;
  }

  grid.innerHTML = state.activities.map(act => {
    const actImg = act.image_url || act.imageUrl || '';
    const pointsVal = act.points || 50;
    const isJoined = state.joinedActivities.has(act.id);
    const hasSubmittedProof = myParticipationsList.some(p => p.activity_id === act.id);

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
            ${hasSubmittedProof ? 'Submit Additional Proof' : 'Participate & Submit Proof'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openActivityProofModal(actId) {
  if (!state.currentUser) {
    openAuthModal('login');
    showToast('Please sign in to participate in community activities and submit proof.');
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
    // 1. Upload media photo file
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

    // 2. Submit participation proof
    const res = await fetch('/api/activities/join-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: actId,
        activityTitle: actTitle,
        userId: state.currentUser.id,
        userName: state.currentUser.fullName || state.currentUser.name || 'Citizen',
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
    showToast(' Participation proof submitted! Pending CENRO admin verification.');
    await loadMyParticipations();
    renderActivities();

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

function toggleJoinActivity(actId) {
  openActivityProofModal(actId);
}

// 10. Navigation Coordination across Header, Drawer & Bottom Nav
function setupNavigation() {
 // Desktop header pills
 document.querySelectorAll('.nav-tab-pill').forEach(btn => {
 btn.addEventListener('click', () => {
 const tab = btn.getAttribute('data-tab');
 if (tab) switchTab(tab);
 });
 });

 // Mobile drawer links
 document.querySelectorAll('.drawer-nav-btn').forEach(btn => {
 btn.addEventListener('click', () => {
 const tab = btn.getAttribute('data-tab');
 if (tab) {
 switchTab(tab);
 closeMobileDrawer();
 }
 });
 });
}

// Mobile Drawer Controls
function openMobileDrawer() {
 const drawer = document.getElementById('mobile-drawer');
 if (drawer) {
 drawer.classList.add('active');
 document.body.style.overflow = 'hidden';
 }
}

function closeMobileDrawer(e) {
 if (e && e.target && e.target.closest && e.target.closest('.mobile-drawer-panel') && !e.target.closest('.drawer-close-btn') && !e.target.closest('.drawer-nav-btn')) {
 return;
 }
 const drawer = document.getElementById('mobile-drawer');
 if (drawer) {
 drawer.classList.remove('active');
 document.body.style.overflow = '';
 }
}

function switchTab(tabName) {
 state.activeTab = tabName;

 // Desktop Header Tabs
 document.querySelectorAll('.nav-tab-pill').forEach(btn => {
 if (btn.getAttribute('data-tab') === tabName) btn.classList.add('active');
 else btn.classList.remove('active');
 });

 // Drawer Buttons
 document.querySelectorAll('.drawer-nav-btn').forEach(btn => {
 if (btn.getAttribute('data-tab') === tabName) btn.classList.add('active');
 else btn.classList.remove('active');
 });

 // Mobile Bottom Nav
 document.querySelectorAll('.bottom-nav-item').forEach(btn => {
 if (btn.getAttribute('data-bottom-tab') === tabName) btn.classList.add('active');
 else btn.classList.remove('active');
 });

 // Sections
 document.querySelectorAll('.portal-section').forEach(sec => sec.classList.remove('active'));
 const activeSec = document.getElementById(`section-${tabName}`);
 if (activeSec) activeSec.classList.add('active');

 if (tabName === 'report') {
 updateAuthUI();
 }

 // Trigger leaflet recalculation when switching to map tab
 if (tabName === 'map' && state.fullMapInstance) {
 setTimeout(() => {
 state.fullMapInstance.invalidateSize();
 }, 200);
 } else if (tabName === 'dashboard' && state.previewMapInstance) {
 setTimeout(() => {
 state.previewMapInstance.invalidateSize();
 }, 200);
 }

 window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Dropdown Menu Toggles & Handlers
function closeAllDropdowns() {
 const userMenu = document.getElementById('user-dropdown-menu');
 if (userMenu) userMenu.classList.remove('active');
 const notifMenu = document.getElementById('notif-dropdown-menu');
 if (notifMenu) notifMenu.classList.remove('active');
}

function toggleUserDropdown(event) {
 if (event) event.stopPropagation();
 const userMenu = document.getElementById('user-dropdown-menu');
 const notifMenu = document.getElementById('notif-dropdown-menu');
 if (notifMenu) notifMenu.classList.remove('active');
 if (userMenu) {
 userMenu.classList.toggle('active');
 }
}

function toggleNotificationsMenu(event) {
 if (event) event.stopPropagation();
 const notifMenu = document.getElementById('notif-dropdown-menu');
 const userMenu = document.getElementById('user-dropdown-menu');
 if (userMenu) userMenu.classList.remove('active');
 if (notifMenu) {
 notifMenu.classList.toggle('active');
 }
}

// Global click handlers to dismiss dropdowns
function setupGlobalClickHandlers() {
 document.addEventListener('click', () => {
 closeAllDropdowns();
 });

 window.addEventListener('click', (e) => {
 const authModal = document.getElementById('auth-modal');
 const incModal = document.getElementById('incident-modal');
 const infoModal = document.getElementById('info-pillar-modal');

 if (e.target === authModal) closeAuthModal();
 if (e.target === incModal) closeModal('incident-modal');
 if (e.target === infoModal) closeModal('info-pillar-modal');
 });
}

// Toast
let toastTimeout = null;
function showToast(msg) {
 const toast = document.getElementById('toast-message');
 const toastText = document.getElementById('toast-text');
 if (!toast || !toastText) return;

 toastText.textContent = msg;
 toast.classList.add('show');
 clearTimeout(toastTimeout);
 toastTimeout = setTimeout(() => {
 toast.classList.remove('show');
 }, 3800);
}

function escapeHtml(str) {
 if (!str) return '';
 return String(str).replace(/[&<>'"]/g,
 tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
 );
}

// Real-time synchronization of website configuration and logo across tabs
if (window.BroadcastChannel) {
 try {
 const bc = new BroadcastChannel('climate_config_channel');
 bc.onmessage = (event) => {
 if (event.data) {
 fetchConfig();
 }
 };
 } catch (_) {}
}

window.addEventListener('storage', (e) => {
 if (e.key === 'climate_brand_logo_updated' || e.key === 'climate_config_updated') {
 fetchConfig();
 }
});

// Refresh branding when user refocuses or un-hides citizen portal tab
window.addEventListener('focus', () => { fetchConfig(); });
document.addEventListener('visibilitychange', () => {
 if (!document.hidden) fetchConfig();
});

// Periodic polling (every 5 seconds) to ensure changes reflect without manual refresh
setInterval(fetchConfig, 5000);
function getDefaultInfoCardImage(idx) {
  const defaults = [
    '/assets/climate_change_thumb_1789457800658.jpg',
    'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
    '/assets/climate_hero_banner.jpg',
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80'
  ];
  return defaults[idx] || defaults[0];
}

function renderNatureAnimations(enabled) {
  const container = document.querySelector(".animated-bg-container");
  if (!container) return;
  container.innerHTML = "";
  if (!enabled) return;

  for(let i=0; i<20; i++) {
    const el = document.createElement("div");
    el.className = Math.random() > 0.5 ? "particle" : "leaf";
    el.style.left = Math.random() * 100 + "vw";
    el.style.animationDuration = (Math.random() * 10 + 10) + "s";
    el.style.animationDelay = Math.random() * 10 + "s";
    container.appendChild(el);
  }
}
