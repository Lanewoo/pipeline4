/* ═══════════════════════════════════════════════════════════════ */
/*  PIPELINE MANAGER - MAIN APPLICATION                          */
/* ═══════════════════════════════════════════════════════════════ */

let currentUser = null;
const API_BASE = '/api';

// ═══════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  // Load HTML structure
  await loadPages();
  await loadModals();
  
  // Check session
  checkSession();
});

async function loadPages() {
  const html = `
    <!-- ── DASHBOARD ── -->
    <div class="page active" id="page-dashboard">
      <div class="page-inner">
        <div class="section-head" style="margin-bottom:20px">
          <div>
            <div class="section-title">Dashboard</div>
            <div class="section-sub">Pipeline performance overview</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openAddRecord()">＋ Add Record</button>
        </div>
        <div class="stat-grid" id="dash-stats"></div>
        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-label">Monthly Revenue Forecast (USD)</div>
            <div class="bar-chart" id="month-chart"></div>
          </div>
          <div class="chart-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div class="chart-label" style="text-align:center">By Sales Stage</div>
            <div class="donut-chart" id="stage-donut">
              <svg class="donut-svg" width="130" height="130" viewBox="0 0 130 130" id="donut-svg"></svg>
              <div class="donut-center"><div class="num" id="donut-num">0</div><div class="lbl">Total</div></div>
            </div>
            <div id="donut-legend" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;font-size:11px"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── PIPELINE BOARD ── -->
    <div class="page" id="page-pipeline">
      <div class="page-inner">
        <div class="section-head">
          <div><div class="section-title">Pipeline Board</div><div class="section-sub">Kanban view by sales stage</div></div>
          <button class="btn btn-primary btn-sm" onclick="openAddRecord()">＋ Add Record</button>
        </div>
        <div class="stage-board" id="stage-board"></div>
      </div>
    </div>

    <!-- ── RECORDS ── -->
    <div class="page" id="page-records">
      <div class="page-inner">
        <div class="section-head">
          <div><div class="section-title">Records</div><div class="section-sub">All pipeline entries</div></div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-ghost btn-sm" onclick="exportXLSX()">⬇ Export XLSX</button>
            <button class="btn btn-primary btn-sm" onclick="openAddRecord()">＋ Add Record</button>
          </div>
        </div>
        <div class="filter-row mb-4">
          <input type="text" class="search-input" placeholder="🔍 Search..." id="rec-search" oninput="renderRecords()">
          <select class="filter-select" id="f-stage" onchange="renderRecords()"><option value="">All Stages</option></select>
          <select class="filter-select" id="f-industry" onchange="renderRecords()"><option value="">All Industries</option></select>
          <select class="filter-select" id="f-offering" onchange="renderRecords()"><option value="">All Offerings</option></select>
          <select class="filter-select" id="f-bd" onchange="renderRecords()"><option value="">All BD</option></select>
        </div>
        <div class="table-card">
          <div class="table-wrap">
            <table>
              <thead id="records-head"></thead>
              <tbody id="records-body"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ── USERS (ADMIN) ── -->
    <div class="page" id="page-users">
      <div class="page-inner">
        <div class="section-head">
          <div><div class="section-title">User Management</div><div class="section-sub">Manage accounts and access requests</div></div>
          <button class="btn btn-primary btn-sm" onclick="openAddUser()">＋ Create User</button>
        </div>
        <div class="tabs-inner">
          <div class="tab-inner active" onclick="switchUserTab('pending')">Pending Requests <span id="pending-count-badge"></span></div>
          <div class="tab-inner" onclick="switchUserTab('all')">All Users</div>
        </div>
        <div class="tab-pane active" id="utab-pending">
          <div id="pending-list"></div>
        </div>
        <div class="tab-pane" id="utab-all">
          <div class="table-card">
            <div class="table-wrap">
              <table>
                <thead><tr>
                  <th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th>
                </tr></thead>
                <tbody id="users-body"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── IMPORT ── -->
    <div class="page" id="page-import">
      <div class="page-inner">
        <div class="section-head">
          <div><div class="section-title">Import Data</div><div class="section-sub">Upload an XLSX file to import pipeline records</div></div>
        </div>
        <div class="drop-zone" id="drop-zone" onclick="document.getElementById('file-input').click()" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleDrop(event)">
          <div class="drop-icon">📂</div>
          <div class="drop-text">Drop your XLSX file here or click to browse</div>
          <div class="drop-sub">Supported format: .xlsx — Columns must match the pipeline template</div>
          <input type="file" id="file-input" accept=".xlsx" style="display:none" onchange="handleFileSelect(event)">
        </div>
        <div id="import-preview" style="display:none;margin-top:24px">
          <div class="table-card" style="margin-bottom:16px">
            <div class="table-header">
              <div class="table-title">Column Matching</div>
            </div>
            <div class="table-wrap">
              <table class="col-match-table">
                <thead><tr><th>Required Column</th><th>Found in File</th><th>Status</th></tr></thead>
                <tbody id="col-match-body"></tbody>
              </table>
            </div>
          </div>
          <div id="import-summary" class="alert" style="margin-bottom:12px"></div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-primary" id="import-confirm-btn" onclick="confirmImport()">Import Records</button>
            <button class="btn btn-ghost" onclick="document.getElementById('import-preview').style.display='none';importData=null">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── PROFILE ── -->
    <div class="page" id="page-profile">
      <div class="page-inner">
        <div class="section-title" style="margin-bottom:24px">My Profile</div>
        <div class="profile-card">
          <div class="profile-avatar" id="profile-avatar">A</div>
          <div style="font-size:20px;font-family:var(--font-head);font-weight:700;margin-bottom:4px" id="profile-name">—</div>
          <div class="flex items-center gap-1 mb-4">
            <span class="badge" id="profile-role-badge">—</span>
            <span class="text-muted" style="font-size:12px" id="profile-username">—</span>
          </div>
          <hr style="border:none;border-top:1px solid var(--border);margin-bottom:20px">
          <div class="section-title" style="font-size:16px;margin-bottom:16px">Change Password</div>
          <div id="pw-alert" class="alert" style="margin-bottom:12px"></div>
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input type="password" id="pw-current" class="form-input" placeholder="Current password">
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" id="pw-new" class="form-input" placeholder="New password">
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input type="password" id="pw-confirm" class="form-input" placeholder="Confirm new password">
          </div>
          <button class="btn btn-primary" onclick="changePassword()" style="width:auto;padding:10px 24px">Update Password</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('pages-container').innerHTML = html;
}

async function loadModals() {
  const html = `
    <!-- Add/Edit Record Modal -->
    <div class="modal-overlay" id="modal-record">
      <div class="modal modal-wide">
        <div class="modal-header">
          <div class="modal-title" id="modal-record-title">Add Record</div>
          <button class="modal-close" onclick="closeModal('modal-record')">✕</button>
        </div>
        <div class="modal-body">
          <div class="tabs-inner">
            <div class="tab-inner active" onclick="switchRecordTab('basic')">Basic Info</div>
            <div class="tab-inner" onclick="switchRecordTab('sales')">Sales Details</div>
            <div class="tab-inner" onclick="switchRecordTab('monthly')">Monthly Forecast</div>
          </div>
          <div id="rtab-basic" class="tab-pane active">
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Partner *</label><input id="r-partner" class="form-input" placeholder="Partner name"></div>
              <div class="form-group"><label class="form-label">Customers *</label><input id="r-customers" class="form-input" placeholder="Customer name"></div>
              <div class="form-group"><label class="form-label">HWC/HID</label><input id="r-hwchid" class="form-input" placeholder="HWC or HID"></div>
              <div class="form-group"><label class="form-label">Billing Start Date</label><input id="r-billing" type="date" class="form-input"></div>
              <div class="form-group"><label class="form-label">Reseller</label><input id="r-reseller" class="form-input" placeholder="Reseller name"></div>
              <div class="form-group"><label class="form-label">Industry</label><input id="r-industry" class="form-input" list="industry-list" placeholder="Industry"><datalist id="industry-list"></datalist></div>
              <div class="form-group"><label class="form-label">Workload</label><input id="r-workload" class="form-input" placeholder="Workload type"></div>
              <div class="form-group"><label class="form-label">Offering</label><input id="r-offering" class="form-input" list="offering-list" placeholder="Offering"><datalist id="offering-list"></datalist></div>
            </div>
          </div>
          <div id="rtab-sales" class="tab-pane">
            <div class="form-grid">
              <div class="form-group"><label class="form-label">BD</label><input id="r-bd" class="form-input" list="bd-list" placeholder="BD name"><datalist id="bd-list"></datalist></div>
              <div class="form-group"><label class="form-label">PBD</label><input id="r-pbd" class="form-input" list="pbd-list" placeholder="PBD name"><datalist id="pbd-list"></datalist></div>
              <div class="form-group"><label class="form-label">PSA</label><input id="r-psa" class="form-input" placeholder="PSA name"></div>
              <div class="form-group"><label class="form-label">Partner Sales</label><input id="r-partnersales" class="form-input" placeholder="Partner sales rep"></div>
              <div class="form-group full-width"><label class="form-label">Next Step</label><input id="r-nextstep" class="form-input" placeholder="Next action step"></div>
              <div class="form-group"><label class="form-label">Probability (%)</label><input id="r-prob" type="number" min="0" max="100" class="form-input" placeholder="0-100"></div>
              <div class="form-group"><label class="form-label">Sales Stage *</label>
                <select id="r-stage" class="form-input">
                  <option value="">Select stage...</option>
                  <option>Prospect</option><option>Qualification</option><option>Proposal</option>
                  <option>Negotiation</option><option>Closed Won</option><option>Closed Lost</option>
                </select>
              </div>
            </div>
          </div>
          <div id="rtab-monthly" class="tab-pane">
            <p class="text-muted" style="font-size:12px;margin-bottom:16px">Enter monthly revenue forecast values (USD)</p>
            <div class="month-grid">
              <div class="form-group"><label class="form-label">Jan</label><input id="r-jan" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Feb</label><input id="r-feb" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Mar</label><input id="r-mar" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Apr</label><input id="r-apr" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">May</label><input id="r-may" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Jun</label><input id="r-jun" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Jul</label><input id="r-jul" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Aug</label><input id="r-aug" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Sep</label><input id="r-sep" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Oct</label><input id="r-oct" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Nov</label><input id="r-nov" type="number" class="form-input" placeholder="0"></div>
              <div class="form-group"><label class="form-label">Dec</label><input id="r-dec" type="number" class="form-input" placeholder="0"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <div id="record-alert" class="alert" style="flex:1;margin-bottom:0"></div>
          <button class="btn btn-ghost" onclick="closeModal('modal-record')">Cancel</button>
          <button class="btn btn-primary" onclick="saveRecord()">Save Record</button>
        </div>
      </div>
    </div>

    <!-- View Record Modal -->
    <div class="modal-overlay" id="modal-view">
      <div class="modal modal-wide">
        <div class="modal-header">
          <div class="modal-title" id="view-title">Record Detail</div>
          <button class="modal-close" onclick="closeModal('modal-view')">✕</button>
        </div>
        <div class="modal-body" id="view-body"></div>
        <div class="modal-footer" id="view-footer"></div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div class="modal-overlay" id="modal-user">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" id="modal-user-title">Create User</div>
          <button class="modal-close" onclick="closeModal('modal-user')">✕</button>
        </div>
        <div class="modal-body">
          <div id="user-alert" class="alert" style="margin-bottom:12px"></div>
          <div class="form-group"><label class="form-label">Full Name *</label><input id="u-name" class="form-input" placeholder="Full name"></div>
          <div class="form-group"><label class="form-label">Username *</label><input id="u-username" class="form-input" placeholder="Username"></div>
          <div class="form-group"><label class="form-label">Role *</label>
            <select id="u-role" class="form-input">
              <option value="BD">BD</option><option value="PBD">PBD</option><option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Password *</label><input type="password" id="u-pass" class="form-input" placeholder="Set password"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal('modal-user')">Cancel</button>
          <button class="btn btn-primary" onclick="saveUser()">Create User</button>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div class="modal-overlay" id="modal-reset-pw">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">Reset Password</div>
          <button class="modal-close" onclick="closeModal('modal-reset-pw')">✕</button>
        </div>
        <div class="modal-body">
          <div id="reset-pw-alert" class="alert" style="margin-bottom:12px"></div>
          <p style="font-size:13px;color:var(--text-soft);margin-bottom:16px">Set a new password for <strong id="reset-pw-target"></strong></p>
          <div class="form-group"><label class="form-label">New Password *</label><input type="password" id="rpw-new" class="form-input" placeholder="New password"></div>
          <div class="form-group"><label class="form-label">Confirm *</label><input type="password" id="rpw-confirm" class="form-input" placeholder="Confirm password"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal('modal-reset-pw')">Cancel</button>
          <button class="btn btn-primary" onclick="confirmResetPw()">Update Password</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modals-container').innerHTML = html;
}

// ═══════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════

function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  if (!u || !p) { showAlert('login-alert', 'error', 'Please enter username and password.'); return; }
  
  // For now, use localStorage-based auth
  const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
  const user = users.find(x => x.username === u && x.password === p && x.status === 'active');
  
  if (!user) { showAlert('login-alert', 'error', 'Invalid credentials or account inactive.'); return; }
  
  currentUser = user;
  sessionStorage.setItem('pm_session', JSON.stringify(user));
  launchApp();
}

function doApply() {
  const name = document.getElementById('apply-name').value.trim();
  const username = document.getElementById('apply-username').value.trim();
  const role = document.getElementById('apply-role').value;
  const pass = document.getElementById('apply-pass').value;
  if (!name || !username || !pass) { showAlert('apply-alert', 'error', 'All fields are required.'); return; }
  
  const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
  const pending = JSON.parse(localStorage.getItem('pm_pending') || '[]');
  
  if (users.find(x => x.username === username) || pending.find(x => x.username === username)) {
    showAlert('apply-alert', 'error', 'Username already exists or is pending.'); return;
  }
  
  pending.push({ id: Date.now(), username, name, role, password: pass, requested: new Date().toISOString() });
  localStorage.setItem('pm_pending', JSON.stringify(pending));
  
  showAlert('apply-alert', 'success', 'Request submitted! An admin will review your application.');
  document.getElementById('apply-name').value = '';
  document.getElementById('apply-username').value = '';
  document.getElementById('apply-pass').value = '';
}

function doLogout() {
  currentUser = null;
  sessionStorage.removeItem('pm_session');
  document.getElementById('app').classList.remove('visible');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

function launchApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  document.getElementById('topbar-username').textContent = currentUser.name || currentUser.username;
  const rb = document.getElementById('topbar-role');
  rb.textContent = currentUser.role;
  rb.className = 'role-chip ' + currentUser.role;
  // Show/hide admin tabs
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = currentUser.role === 'admin' ? 'flex' : 'none';
  });
  document.querySelectorAll('.user-only').forEach(el => {
    el.style.display = currentUser.role !== 'admin' ? 'flex' : 'none';
  });
  populateProfile();
  goPage('dashboard');
}

function checkSession() {
  const s = sessionStorage.getItem('pm_session');
  if (s) { try { currentUser = JSON.parse(s); launchApp(); } catch {} }
}

// ═══════════════════════════════════════════════════════
//  NAVIGATION & UI
// ═══════════════════════════════════════════════════════

function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll(`.nav-tab[data-page="${name}"]`).forEach(t => t.classList.add('active'));
  
  if (name === 'dashboard') renderDashboard();
  if (name === 'pipeline') renderPipeline();
  if (name === 'records') { populateFilters(); renderRecords(); }
  if (name === 'users') renderUsers();
  if (name === 'profile') populateProfile();
}

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'alert alert-' + type + ' show';
  el.textContent = msg;
  setTimeout(() => { el.classList.remove('show'); }, 4000);
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openModal(id) { document.getElementById(id).classList.add('open'); }

function switchLoginTab(t) {
  document.getElementById('tab-login').style.display = t === 'login' ? '' : 'none';
  document.getElementById('tab-apply').style.display = t === 'apply' ? '' : 'none';
  document.querySelectorAll('.login-tab').forEach((el, i) => el.classList.toggle('active', (i===0 && t==='login') || (i===1 && t==='apply')));
}

function switchUserTab(t) {
  document.querySelectorAll('.tab-pane[id^="utab"]').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tabs-inner .tab-inner').forEach((el, i) => el.classList.toggle('active', (i===0 && t==='pending') || (i===1 && t==='all')));
  document.getElementById('utab-' + t).classList.add('active');
}

function switchRecordTab(t) {
  document.querySelectorAll('[id^="rtab-"]').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#modal-record .tab-inner').forEach((el, i) => {
    const tabs = ['basic','sales','monthly'];
    el.classList.toggle('active', tabs[i] === t);
  });
  document.getElementById('rtab-' + t).classList.add('active');
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString() : '—'; }
function fmtMoney(v) {
  v = Number(v) || 0;
  if (v >= 1e6) return '$' + (v/1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v/1e3).toFixed(0) + 'K';
  return '$' + v.toLocaleString();
}

function probColor(p) {
  p = Number(p) || 0;
  if (p >= 80) return '#10b981';
  if (p >= 50) return '#f59e0b';
  if (p >= 30) return '#3b82f6';
  return '#6b7280';
}

const STAGE_BADGE = { 'Prospect':'badge-gray', 'Qualification':'badge-blue', 'Proposal':'badge-amber', 'Negotiation':'badge-purple', 'Closed Won':'badge-green', 'Closed Lost':'badge-red' };
function stageBadge(stage) {
  return `<span class="badge ${STAGE_BADGE[stage] || 'badge-gray'}">${stage || '—'}</span>`;
}

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function recordTotal(r) { return MONTHS.reduce((s,m) => s + (Number(r[m])||0), 0); }

// Initialize default data
function initializeDefaultData() {
  if (!localStorage.getItem('pm_users')) {
    localStorage.setItem('pm_users', JSON.stringify([
      { id: 1, username: 'admin', name: 'Administrator', role: 'admin', password: 'huawei@123', status: 'active', created: new Date().toISOString() }
    ]));
  }
  if (!localStorage.getItem('pm_records')) {
    const demoRecords = [
      { id:1, partner:'TechCorp', customers:'Acme Ltd', hwchid:'HWC001', billing:'2025-01-15', reseller:'ResellerA', industry:'Finance', workload:'Cloud Compute', offering:'ECS', bd:'Alice Wong', pbd:'Bob Chen', psa:'Charlie Lee', partnersales:'Dana Park', nextstep:'Follow up Q2', prob:75, stage:'Proposal', jan:50000, feb:60000, mar:70000, apr:80000, may:85000, jun:90000, jul:95000, aug:100000, sep:110000, oct:120000, nov:130000, dec:140000, created:new Date().toISOString() },
      { id:2, partner:'GlobalNet', customers:'BetaCo', hwchid:'HID002', billing:'2025-02-01', reseller:'ResellerB', industry:'Retail', workload:'Storage', offering:'OBS', bd:'Eve Tan', pbd:'Frank Li', psa:'Grace Kim', partnersales:'Henry Wu', nextstep:'Demo scheduled', prob:50, stage:'Qualification', jan:20000, feb:22000, mar:25000, apr:28000, may:30000, jun:32000, jul:35000, aug:38000, sep:40000, oct:45000, nov:50000, dec:55000, created:new Date().toISOString() }
    ];
    localStorage.setItem('pm_records', JSON.stringify(demoRecords));
  }
}

initializeDefaultData();
