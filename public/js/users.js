/* ═══════════════════════════════════════════════════════════════ */
/*  USER MANAGEMENT (ADMIN)                                        */
/* ═══════════════════════════════════════════════════════════════ */

function renderUsers() {
  const users = getUsers();
  const pending = getPending();

  const countEl = document.getElementById('pending-count-badge');
  if (pending.length > 0) countEl.innerHTML = `<span class="badge badge-amber" style="margin-left:6px">${pending.length}</span>`;
  else countEl.innerHTML = '';

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

async function approveUser(id) {
  try {
    await api('POST', '/users/pending/' + id + '/approve');
    await refreshUsers();
    await refreshPending();
    renderUsers();
  } catch (err) {
    alert('Failed to approve: ' + (err.message || 'Unknown error'));
  }
}

async function rejectUser(id) {
  if (!confirm('Reject this request?')) return;
  try {
    await api('POST', '/users/pending/' + id + '/reject');
    await refreshPending();
    renderUsers();
  } catch (err) {
    alert('Failed to reject: ' + (err.message || 'Unknown error'));
  }
}

async function toggleUserStatus(id, status) {
  try {
    await api('PUT', '/users/' + id, { status });
    await refreshUsers();
    renderUsers();
  } catch (err) {
    alert('Failed to update status: ' + (err.message || 'Unknown error'));
  }
}

function openAddUser() {
  document.getElementById('modal-user-title').textContent = 'Create User';
  ['u-name','u-username','u-pass'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('u-role').value = 'BD';
  openModal('modal-user');
}

async function saveUser() {
  const name = document.getElementById('u-name').value.trim();
  const username = document.getElementById('u-username').value.trim();
  const role = document.getElementById('u-role').value;
  const password = document.getElementById('u-pass').value;
  if (!name || !username || !password) { showAlert('user-alert','error','All fields are required.'); return; }

  try {
    await api('POST', '/users', { name, username, role, password });
    await refreshUsers();
    closeModal('modal-user');
    renderUsers();
  } catch (err) {
    showAlert('user-alert', 'error', err.message || 'Failed to create user.');
  }
}

let resetPwTargetId = null;
function openResetPw(id, username) {
  resetPwTargetId = id;
  document.getElementById('reset-pw-target').textContent = '@' + username;
  document.getElementById('rpw-new').value = '';
  document.getElementById('rpw-confirm').value = '';
  openModal('modal-reset-pw');
}

async function confirmResetPw() {
  const np = document.getElementById('rpw-new').value;
  const cp = document.getElementById('rpw-confirm').value;
  if (!np) { showAlert('reset-pw-alert','error','Enter a new password.'); return; }
  if (np !== cp) { showAlert('reset-pw-alert','error','Passwords do not match.'); return; }

  try {
    await api('PUT', '/users/' + resetPwTargetId + '/password', { password: np });
    closeModal('modal-reset-pw');
  } catch (err) {
    showAlert('reset-pw-alert', 'error', err.message || 'Failed to reset password.');
  }
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

async function changePassword() {
  const cur = document.getElementById('pw-current').value;
  const nw = document.getElementById('pw-new').value;
  const cf = document.getElementById('pw-confirm').value;
  if (!cur || !nw || !cf) { showAlert('pw-alert','error','All fields are required.'); return; }
  if (nw !== cf) { showAlert('pw-alert','error','New passwords do not match.'); return; }

  try {
    await api('PUT', '/users/' + currentUser.id + '/password', { password: nw, currentPassword: cur });
    showAlert('pw-alert','success','Password updated successfully.');
    document.getElementById('pw-current').value = '';
    document.getElementById('pw-new').value = '';
    document.getElementById('pw-confirm').value = '';
  } catch (err) {
    showAlert('pw-alert', 'error', err.message || 'Failed to update password.');
  }
}
