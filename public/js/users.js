/* ═══════════════════════════════════════════════════════════════ */
/*  用户管理功能（管理员专用）                                       */
/* ═══════════════════════════════════════════════════════════════ */

// 渲染用户管理页面（待审批列表 + 所有用户表格）
function renderUsers() {
  const users = getUsers();                // 获取缓存的用户列表
  const pending = getPending();            // 获取缓存的待审批用户列表

  // 更新待审批数量徽章
  const countEl = document.getElementById('pending-count-badge');
  if (pending.length > 0) countEl.innerHTML = `<span class="badge badge-amber" style="margin-left:6px">${pending.length}</span>`;
  else countEl.innerHTML = '';             // 无待审批时隐藏徽章

  // 渲染待审批用户卡片列表
  document.getElementById('pending-list').innerHTML = pending.length ? pending.map(p => `
    <div class="pending-card">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--amber);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:white;flex-shrink:0">${(p.name||'?')[0].toUpperCase()}</div>
      <!-- 头像圆形图标（显示名字首字母） -->
      <div class="pending-card-info">
        <div class="pending-card-name">${p.name}</div>
        <!-- 申请人姓名 -->
        <div class="pending-card-meta">@${p.username} · <span class="badge badge-amber">${p.role}</span> · Requested ${fmtDate(p.requested)}</div>
        <!-- 用户名、申请角色、申请时间 -->
      </div>
      <div class="pending-actions">
        <button class="btn btn-success btn-sm" onclick="approveUser(${p.id})">✓ Approve</button>
        <!-- 批准按钮 -->
        <button class="btn btn-danger btn-sm" onclick="rejectUser(${p.id})">✕ Reject</button>
        <!-- 拒绝按钮 -->
      </div>
    </div>
  `).join('') : '<div class="empty-state"><div class="empty-icon">✅</div><div>No pending requests</div></div>';
  // 无待审批时显示空状态提示

  // 渲染所有用户表格
  document.getElementById('users-body').innerHTML = users.map(u => `
    <tr>
      <td>@${u.username}</td>
      <!-- 用户名 -->
      <td>${u.name}</td>
      <!-- 姓名 -->
      <td><span class="badge ${u.role==='admin'?'badge-red':u.role==='BD'?'badge-blue':'badge-purple'}">${u.role}</span></td>
      <!-- 角色（管理员红色、BD 蓝色、PBD 紫色） -->
      <td><span class="badge ${u.status==='active'?'badge-green':'badge-gray'}">${u.status}</span></td>
      <!-- 状态（活跃绿色、禁用灰色） -->
      <td style="font-size:11px;color:var(--text-muted)">${fmtDate(u.created)}</td>
      <!-- 创建时间 -->
      <td>
        <div style="display:flex;gap:6px">
          ${u.username !== 'admin' ? `<button class="btn btn-ghost btn-xs" onclick="openResetPw(${u.id},'${u.username}')">Reset PW</button>` : ''}
          <!-- 重置密码按钮（管理员账号除外） -->
          ${u.username !== 'admin' && u.status === 'active' ? `<button class="btn btn-danger btn-xs" onclick="toggleUserStatus(${u.id},'inactive')">Disable</button>` : ''}
          <!-- 禁用按钮（活跃状态且非管理员） -->
          ${u.username !== 'admin' && u.status !== 'active' ? `<button class="btn btn-success btn-xs" onclick="toggleUserStatus(${u.id},'active')">Enable</button>` : ''}
          <!-- 启用按钮（非活跃状态且非管理员） -->
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No users</td></tr>';
  // 无用户时显示提示
}

// 批准待审批用户
async function approveUser(id) {
  try {
    await api('POST', '/users/pending/' + id + '/approve'); // 调用批准接口
    await refreshUsers();                  // 刷新用户列表缓存
    await refreshPending();                // 刷新待审批列表缓存
    renderUsers();                         // 重新渲染用户页面
  } catch (err) {
    alert('Failed to approve: ' + (err.message || 'Unknown error')); // 显示错误
  }
}

// 拒绝待审批用户
async function rejectUser(id) {
  if (!confirm('Reject this request?')) return; // 弹出确认对话框
  try {
    await api('POST', '/users/pending/' + id + '/reject'); // 调用拒绝接口
    await refreshPending();                // 刷新待审批列表缓存
    renderUsers();                         // 重新渲染用户页面
  } catch (err) {
    alert('Failed to reject: ' + (err.message || 'Unknown error'));
  }
}

// 切换用户状态（启用/禁用）
async function toggleUserStatus(id, status) {
  try {
    await api('PUT', '/users/' + id, { status }); // 调用更新用户接口
    await refreshUsers();                  // 刷新用户列表缓存
    renderUsers();                         // 重新渲染用户页面
  } catch (err) {
    alert('Failed to update status: ' + (err.message || 'Unknown error'));
  }
}

// 打开创建用户模态框
function openAddUser() {
  document.getElementById('modal-user-title').textContent = 'Create User'; // 设置标题
  ['u-name','u-username','u-pass'].forEach(id => document.getElementById(id).value = ''); // 清空表单
  document.getElementById('u-role').value = 'BD'; // 默认角色为 BD
  openModal('modal-user');                 // 打开模态框
}

// 保存新用户
async function saveUser() {
  const name = document.getElementById('u-name').value.trim();     // 获取姓名
  const username = document.getElementById('u-username').value.trim(); // 获取用户名
  const role = document.getElementById('u-role').value;            // 获取角色
  const password = document.getElementById('u-pass').value;        // 获取密码
  if (!name || !username || !password) { showAlert('user-alert','error','All fields are required.'); return; } // 校验非空

  try {
    await api('POST', '/users', { name, username, role, password }); // 调用创建用户接口
    await refreshUsers();                  // 刷新用户列表缓存
    closeModal('modal-user');              // 关闭模态框
    renderUsers();                         // 重新渲染用户页面
  } catch (err) {
    showAlert('user-alert', 'error', err.message || 'Failed to create user.'); // 显示错误
  }
}

let resetPwTargetId = null;                // 当前要重置密码的用户 ID

// 打开重置密码模态框
function openResetPw(id, username) {
  resetPwTargetId = id;                    // 记录目标用户 ID
  document.getElementById('reset-pw-target').textContent = '@' + username; // 显示目标用户名
  document.getElementById('rpw-new').value = '';     // 清空新密码输入框
  document.getElementById('rpw-confirm').value = ''; // 清空确认密码输入框
  openModal('modal-reset-pw');             // 打开模态框
}

// 确认重置密码
async function confirmResetPw() {
  const np = document.getElementById('rpw-new').value;     // 获取新密码
  const cp = document.getElementById('rpw-confirm').value; // 获取确认密码
  if (!np) { showAlert('reset-pw-alert','error','Enter a new password.'); return; } // 校验新密码非空
  if (np !== cp) { showAlert('reset-pw-alert','error','Passwords do not match.'); return; } // 校验两次密码一致

  try {
    await api('PUT', '/users/' + resetPwTargetId + '/password', { password: np }); // 调用重置密码接口
    closeModal('modal-reset-pw');          // 关闭模态框
  } catch (err) {
    showAlert('reset-pw-alert', 'error', err.message || 'Failed to reset password.'); // 显示错误
  }
}

// 填充个人资料页面
function populateProfile() {
  if (!currentUser) return;                // 未登录则跳过
  document.getElementById('profile-avatar').textContent = (currentUser.name||currentUser.username||'?')[0].toUpperCase(); // 头像显示首字母
  document.getElementById('profile-name').textContent = currentUser.name || currentUser.username; // 显示姓名
  const rb = document.getElementById('profile-role-badge');
  rb.textContent = currentUser.role;       // 显示角色
  rb.className = 'badge ' + (currentUser.role==='admin'?'badge-red':currentUser.role==='BD'?'badge-blue':'badge-purple'); // 设置角色徽章样式
  document.getElementById('profile-username').textContent = '@' + currentUser.username; // 显示用户名
}

// 修改当前用户密码
async function changePassword() {
  const cur = document.getElementById('pw-current').value;  // 获取当前密码
  const nw = document.getElementById('pw-new').value;       // 获取新密码
  const cf = document.getElementById('pw-confirm').value;   // 获取确认密码
  if (!cur || !nw || !cf) { showAlert('pw-alert','error','All fields are required.'); return; } // 校验非空
  if (nw !== cf) { showAlert('pw-alert','error','New passwords do not match.'); return; } // 校验新密码一致

  try {
    await api('PUT', '/users/' + currentUser.id + '/password', { password: nw, currentPassword: cur }); // 调用修改密码接口
    showAlert('pw-alert','success','Password updated successfully.'); // 显示成功提示
    document.getElementById('pw-current').value = '';       // 清空表单
    document.getElementById('pw-new').value = '';
    document.getElementById('pw-confirm').value = '';
  } catch (err) {
    showAlert('pw-alert', 'error', err.message || 'Failed to update password.'); // 显示错误
  }
}
