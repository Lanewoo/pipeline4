/* ═══════════════════════════════════════════════════════════════ */
/*  USER MANAGEMENT (ADMIN)                                        */
/* ═══════════════════════════════════════════════════════════════ */

function renderUsers() {
  const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
  const pending = JSON.parse(localStorage.getItem('pm_pending') || '[]');

  const countEl = document.getElementById('pending-count-badge');
  if (pending.length > 0) countEl.innerHTML = `<span class="badge badge-amber" style="margin-left:6px">${pending.length}</span>`;
  else countEl.innerHTML = '';

  // Pending list
  document.getElementById('pending-list').innerHTML = pending.length ? pending.map(p => `
    <div class="pending-card">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--amber);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:white;flex-shrink:0">${(p.name||'?')[0].toUpperCase()}</div>
      <div class="pending-card-info">
        <div class="pending-card-name">${p.name}</div>
        <div class="pending-card-meta">@${p.username} · <span class="badge badge-amber">${p.role}</span> · Requested ${fmtDate(p.requested)}</div>
      </div>
      <div class="pending-actions">
        <button class="btn btn-success btn-sm" onclick="approveUser(${p.id})">✓ Approve</button>
        <button class="btn btn-danger btn-sm" onclick="rejectUser(${p.id})">✕ Reject</button>
      </div>
    </div>
  `).join('') : '<div class="empty-state"><div class="empty-icon">✅</div><div>No pending requests</div></div>';

  // All users
  document.getElementById('users-body').innerHTML = users.map(u => `
    <tr>
      <td>@${u.username}</td>
      <td>${u.name}</td>
      <td><span class="badge ${u.role==='admin'?'badge-red':u.role==='BD'?'badge-blue':'badge-purple'}">${u.role}</span></td>
      <td><span class="badge ${u.status==='active'?'badge-green':'badge-gray'}">${u.status}</span></td>
      <td style="font-size:11px;color:var(--text-muted)">${fmtDate(u.created)}</td>
      <td>
        <div style="display:flex;gap:6px">
          ${u.username !== 'admin' ? `<button class="btn btn-ghost btn-xs" onclick="openResetPw(${u.id},'${u.username}')">Reset PW</button>` : ''}
          ${u.username !== 'admin' && u.status === 'active' ? `<button class="btn btn-danger btn-xs" onclick="toggleUserStatus(${u.id},'inactive')">Disable</button>` : ''}
          ${u.username !== 'admin' && u.status !== 'active' ? `<button class="btn btn-success btn-xs" onclick="toggleUserStatus(${u.id},'active')">Enable</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No users</td></tr>';
}

function approveUser(id) {
  const pending = JSON.parse(localStorage.getItem('pm_pending') || '[]');
  const idx = pending.findIndex(p => p.id === id);
  if (idx < 0) return;
  
  const p = pending[idx];
  const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
  users.push({ id: p.id, username: p.username, name: p.name, role: p.role, password: p.password, status: 'active', created: new Date().toISOString() });
  
  localStorage.setItem('pm_users', JSON.stringify(users));
  pending.splice(idx, 1);
  localStorage.setItem('pm_pending', JSON.stringify(pending));
  renderUsers();
}

function rejectUser(id) {
  if (!confirm('Reject this request?')) return;
  const pending = JSON.parse(localStorage.getItem('pm_pending') || '[]');
  localStorage.setItem('pm_pending', JSON.stringify(pending.filter(p => p.id !== id)));
  renderUsers();
}

function toggleUserStatus(id, status) {
  const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
  const u = users.find(x => x.id === id);
  if (u) u.status = status;
  localStorage.setItem('pm_users', JSON.stringify(users));
  renderUsers();
}

function openAddUser() {
  document.getElementById('modal-user-title').textContent = 'Create User';
  ['u-name','u-username','u-pass'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('u-role').value = 'BD';
  openModal('modal-user');
}

function saveUser() {
  const name = document.getElementById('u-name').value.trim();
  const username = document.getElementById('u-username').value.trim();
  const role = document.getElementById('u-role').value;
  const pass = document.getElementById('u-pass').value;
  if (!name || !username || !pass) { showAlert('user-alert','error','All fields are required.'); return; }
  
  const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
  if (users.find(u => u.username === username)) { showAlert('user-alert','error','Username already exists.'); return; }
  
  users.push({ id: Math.max(...users.map(u => u.id), 0) + 1, username, name, role, password: pass, status: 'active', created: new Date().toISOString() });
  localStorage.setItem('pm_users', JSON.stringify(users));
  closeModal('modal-user');
  renderUsers();
}

let resetPwTargetId = null;
function openResetPw(id, username) {
  resetPwTargetId = id;
  document.getElementById('reset-pw-target').textContent = '@' + username;
  document.getElementById('rpw-new').value = '';
  document.getElementById('rpw-confirm').value = '';
  openModal('modal-reset-pw');
}

function confirmResetPw() {
  const np = document.getElementById('rpw-new').value;
  const cp = document.getElementById('rpw-confirm').value;
  if (!np) { showAlert('reset-pw-alert','error','Enter a new password.'); return; }
  if (np !== cp) { showAlert('reset-pw-alert','error','Passwords do not match.'); return; }
  
  const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
  const u = users.find(x => x.id === resetPwTargetId);
  if (u) { 
    u.password = np; 
    localStorage.setItem('pm_users', JSON.stringify(users));
  }
  closeModal('modal-reset-pw');
}

function populateProfile() {
  if (!currentUser) return;
  document.getElementById('profile-avatar').textContent = (currentUser.name||currentUser.username||'?')[0].toUpperCase();
  document.getElementById('profile-name').textContent = currentUser.name || currentUser.username;
  const rb = document.getElementById('profile-role-badge');
  rb.textContent = currentUser.role;
  rb.className = 'badge ' + (currentUser.role==='admin'?'badge-red':currentUser.role==='BD'?'badge-blue':'badge-purple');
  document.getElementById('profile-username').textContent = '@' + currentUser.username;
}

function changePassword() {
  const cur = document.getElementById('pw-current').value;
  const nw = document.getElementById('pw-new').value;
  const cf = document.getElementById('pw-confirm').value;
  if (!cur || !nw || !cf) { showAlert('pw-alert','error','All fields are required.'); return; }
  if (nw !== cf) { showAlert('pw-alert','error','New passwords do not match.'); return; }
  
  const users = JSON.parse(localStorage.getItem('pm_users') || '[]');
  const u = users.find(x => x.id === currentUser.id);
  if (!u || u.password !== cur) { showAlert('pw-alert','error','Current password is incorrect.'); return; }
  
  u.password = nw;
  localStorage.setItem('pm_users', JSON.stringify(users));
  currentUser.password = nw;
  sessionStorage.setItem('pm_session', JSON.stringify(currentUser));
  
  showAlert('pw-alert','success','Password updated successfully.');
  document.getElementById('pw-current').value = '';
  document.getElementById('pw-new').value = '';
  document.getElementById('pw-confirm').value = '';
}
