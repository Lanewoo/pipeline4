/* ═══════════════════════════════════════════════════════════════ */
/*  记录管理功能（增删改查）                                         */
/* ═══════════════════════════════════════════════════════════════ */

let editingRecordId = null;                // 当前正在编辑的记录 ID（null 表示新增模式）

// 填充筛选器下拉选项（从现有记录中提取唯一值）
function populateFilters() {
  const recs = getVisibleRecords();        // 获取当前用户可见的记录
  // 填充单个下拉框：保留当前选中值，添加唯一选项
  const fill = (id, vals) => {
    const el = document.getElementById(id);
    const cur = el.value;                  // 保存当前选中值
    el.innerHTML = el.options[0].outerHTML + [...new Set(vals.filter(Boolean))].map(v => `<option ${v===cur?'selected':''} value="${v}">${v}</option>`).join('');
  };
  fill('f-stage', recs.map(r => r.stage));     // 填充阶段筛选器
  fill('f-industry', recs.map(r => r.industry)); // 填充行业筛选器
  fill('f-offering', recs.map(r => r.offering)); // 填充产品筛选器
  fill('f-bd', recs.map(r => r.bd));           // 填充 BD 筛选器

  // 填充表单中的 datalist 自动补全选项
  const setDL = (id, vals) => { document.getElementById(id).innerHTML = [...new Set(vals.filter(Boolean))].map(v => `<option value="${v}">`).join(''); };
  setDL('industry-list', recs.map(r => r.industry));   // 行业自动补全
  setDL('offering-list', recs.map(r => r.offering));   // 产品自动补全
  const users = getUsers();
  setDL('bd-list', users.filter(u => u.role==='BD'||u.role==='admin').map(u => u.name));   // BD 人员自动补全
  setDL('pbd-list', users.filter(u => u.role==='PBD'||u.role==='admin').map(u => u.name)); // PBD 人员自动补全
}

// 渲染记录列表表格（支持搜索和筛选）
function renderRecords() {
  let recs = getVisibleRecords();          // 获取当前用户可见的记录
  const q = (document.getElementById('rec-search')?.value||'').toLowerCase(); // 搜索关键词
  const fStage = document.getElementById('f-stage')?.value||'';    // 阶段筛选值
  const fInd = document.getElementById('f-industry')?.value||'';   // 行业筛选值
  const fOf = document.getElementById('f-offering')?.value||'';    // 产品筛选值
  const fBd = document.getElementById('f-bd')?.value||'';          // BD 筛选值

  // 应用搜索和筛选条件
  if (q) recs = recs.filter(r => JSON.stringify(r).toLowerCase().includes(q));  // 全字段模糊搜索
  if (fStage) recs = recs.filter(r => r.stage === fStage);   // 按阶段筛选
  if (fInd) recs = recs.filter(r => r.industry === fInd);    // 按行业筛选
  if (fOf) recs = recs.filter(r => r.offering === fOf);      // 按产品筛选
  if (fBd) recs = recs.filter(r => r.bd === fBd);            // 按 BD 筛选

  // 渲染表头
  const cols = ['Partner','Customers','Offering','Industry','Stage','BD','PBD','Probability','Total','Billing Start','Actions'];
  document.getElementById('records-head').innerHTML = `<tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr>`;

  // 如果没有记录，显示空状态提示
  if (!recs.length) {
    document.getElementById('records-body').innerHTML = `<tr><td colspan="${cols.length}"><div class="empty-state"><div class="empty-icon">📭</div><div>No records found</div></div></td></tr>`;
    return;
  }

  // 渲染每行记录数据
  document.getElementById('records-body').innerHTML = recs.map(r => `
    <tr>
      <td>${r.partner||'—'}</td>
      <!-- 合作伙伴 -->
      <td>${r.customers||'—'}</td>
      <!-- 客户名 -->
      <td>${r.offering ? `<span class="badge badge-cyan">${r.offering}</span>` : '—'}</td>
      <!-- 产品/服务（青色徽章） -->
      <td>${r.industry||'—'}</td>
      <!-- 行业 -->
      <td>${stageBadge(r.stage)}</td>
      <!-- 销售阶段（彩色徽章） -->
      <td>${r.bd||'—'}</td>
      <!-- BD 负责人 -->
      <td>${r.pbd||'—'}</td>
      <!-- PBD 负责人 -->
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="prob-bar" style="width:48px"><div class="prob-fill" style="width:${r.prob||0}%;background:${probColor(r.prob)}"></div></div>
          <!-- 概率进度条 -->
          <span class="text-mono" style="font-size:11px;color:${probColor(r.prob)}">${r.prob||0}%</span>
          <!-- 概率数值 -->
        </div>
      </td>
      <td class="text-mono">${fmtMoney(recordTotal(r))}</td>
      <!-- 全年收入总额 -->
      <td>${r.billing||'—'}</td>
      <!-- 计费开始日期 -->
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-xs" onclick="viewRecord(${r.id})">View</button>
          <!-- 查看详情按钮 -->
          ${canEditRecord(r) ? `<button class="btn btn-secondary btn-xs" onclick="editRecord(${r.id})">Edit</button>` : ''}
          <!-- 编辑按钮（仅有权限时显示） -->
          ${currentUser?.role==='admin' ? `<button class="btn btn-danger btn-xs" onclick="deleteRecord(${r.id})">Del</button>` : ''}
          <!-- 删除按钮（仅管理员可见） -->
        </div>
      </td>
    </tr>
  `).join('');
}

// 判断当前用户是否有权编辑指定记录
function canEditRecord(r) {
  if (!currentUser) return false;          // 未登录不可编辑
  if (currentUser.role === 'admin') return true; // 管理员可编辑所有
  // BD/PBD 只能编辑自己负责的记录
  return r.bd === currentUser.name || r.bd === currentUser.username || r.pbd === currentUser.name || r.pbd === currentUser.username;
}

// 打开添加记录模态框
function openAddRecord() {
  editingRecordId = null;                  // 设置为新增模式
  document.getElementById('modal-record-title').textContent = 'Add Record'; // 设置标题
  // 清空所有表单字段
  ['partner','customers','hwchid','billing','reseller','industry','workload','offering','bd','pbd','psa','partnersales','nextstep'].forEach(f => document.getElementById('r-'+f).value = '');
  document.getElementById('r-prob').value = '';    // 清空概率
  document.getElementById('r-stage').value = '';   // 清空阶段
  MONTHS.forEach(m => document.getElementById('r-'+m).value = ''); // 清空所有月份
  switchRecordTab('basic');                // 切换到基本信息标签
  populateFilters();                       // 填充自动补全选项
  openModal('modal-record');               // 打开模态框
}

// 打开编辑记录模态框
function editRecord(id) {
  const r = getRecords().find(x => x.id === id); // 从缓存中查找记录
  if (!r) return;
  editingRecordId = id;                    // 设置为编辑模式
  document.getElementById('modal-record-title').textContent = 'Edit Record'; // 设置标题
  // 填充表单字段
  ['partner','customers','hwchid','reseller','industry','workload','offering','bd','pbd','psa','partnersales','nextstep'].forEach(f => document.getElementById('r-'+f).value = r[f]||'');
  document.getElementById('r-billing').value = r.billing||'';  // 填充计费日期
  document.getElementById('r-prob').value = r.prob||'';        // 填充概率
  document.getElementById('r-stage').value = r.stage||'';      // 填充阶段
  MONTHS.forEach(m => document.getElementById('r-'+m).value = r[m]||''); // 填充月份数据
  switchRecordTab('basic');                // 切换到基本信息标签
  populateFilters();                       // 填充自动补全选项
  openModal('modal-record');               // 打开模态框
}

// 保存记录（新增或更新）
async function saveRecord() {
  const partner = document.getElementById('r-partner').value.trim();     // 获取合作伙伴
  const customers = document.getElementById('r-customers').value.trim(); // 获取客户名
  const stage = document.getElementById('r-stage').value;                // 获取销售阶段
  if (!partner || !customers) { showAlert('record-alert','error','Partner and Customers are required.'); return; } // 校验必填字段

  // 构建记录对象
  const r = {
    partner, customers,
    hwchid: document.getElementById('r-hwchid').value.trim(),        // 华为云账号
    billing: document.getElementById('r-billing').value,             // 计费日期
    reseller: document.getElementById('r-reseller').value.trim(),    // 经销商
    industry: document.getElementById('r-industry').value.trim(),    // 行业
    workload: document.getElementById('r-workload').value.trim(),    // 工作负载
    offering: document.getElementById('r-offering').value.trim(),    // 产品/服务
    bd: document.getElementById('r-bd').value.trim(),                // BD
    pbd: document.getElementById('r-pbd').value.trim(),              // PBD
    psa: document.getElementById('r-psa').value.trim(),              // PSA
    partnersales: document.getElementById('r-partnersales').value.trim(), // 合作伙伴销售
    nextstep: document.getElementById('r-nextstep').value.trim(),    // 下一步
    prob: Number(document.getElementById('r-prob').value)||0,        // 成交概率
    stage: stage,                          // 销售阶段
  };
  MONTHS.forEach(m => r[m] = Number(document.getElementById('r-'+m).value)||0); // 获取各月份数据

  try {
    if (editingRecordId) {
      await api('PUT', '/records/' + editingRecordId, r);  // 编辑模式：调用更新接口
    } else {
      await api('POST', '/records', r);    // 新增模式：调用创建接口
    }
    await refreshRecords();                // 刷新记录缓存
    closeModal('modal-record');            // 关闭模态框
    renderRecords();                       // 重新渲染记录表格
    renderDashboard();                     // 重新渲染仪表盘
  } catch (err) {
    showAlert('record-alert', 'error', err.message || 'Failed to save record.'); // 显示保存错误
  }
}

// 删除记录
async function deleteRecord(id) {
  if (!confirm('Delete this record?')) return; // 弹出确认对话框
  try {
    await api('DELETE', '/records/' + id); // 调用删除接口
    await refreshRecords();                // 刷新记录缓存
    renderRecords();                       // 重新渲染记录表格
    renderDashboard();                     // 重新渲染仪表盘
  } catch (err) {
    alert('Failed to delete: ' + (err.message || 'Unknown error')); // 显示删除错误
  }
}

// 查看记录详情（弹出模态框）
function viewRecord(id) {
  const r = getRecords().find(x => x.id === id); // 从缓存中查找记录
  if (!r) return;
  document.getElementById('view-title').textContent = r.customers || r.partner; // 设置标题为客户名

  // 生成月度预测 HTML
  const monthsHtml = `<div class="month-grid" style="margin-top:8px">
    ${MONTHS.map((m,i) => `<div class="form-group"><div class="info-item"><div class="lbl">${MONTH_LABELS[i]}</div><div class="val text-mono">${fmtMoney(r[m]||0)}</div></div></div>`).join('')}
  </div>`;

  // 渲染详情内容
  document.getElementById('view-body').innerHTML = `
    <!-- 基本信息行 -->
    <div class="info-row">
      <div class="info-item"><div class="lbl">Partner</div><div class="val">${r.partner||'—'}</div></div>
      <!-- 合作伙伴 -->
      <div class="info-item"><div class="lbl">Customer</div><div class="val">${r.customers||'—'}</div></div>
      <!-- 客户 -->
      <div class="info-item"><div class="lbl">HWC/HID</div><div class="val text-mono">${r.hwchid||'—'}</div></div>
      <!-- 华为云账号 -->
      <div class="info-item"><div class="lbl">Billing Start</div><div class="val">${r.billing||'—'}</div></div>
      <!-- 计费开始 -->
      <div class="info-item"><div class="lbl">Stage</div><div class="val">${stageBadge(r.stage)}</div></div>
      <!-- 销售阶段 -->
      <div class="info-item"><div class="lbl">Probability</div><div class="val" style="color:${probColor(r.prob)}">${r.prob||0}%</div></div>
      <!-- 成交概率 -->
    </div>
    <!-- 业务信息行 -->
    <div class="info-row">
      <div class="info-item"><div class="lbl">Industry</div><div class="val">${r.industry||'—'}</div></div>
      <!-- 行业 -->
      <div class="info-item"><div class="lbl">Workload</div><div class="val">${r.workload||'—'}</div></div>
      <!-- 工作负载 -->
      <div class="info-item"><div class="lbl">Offering</div><div class="val">${r.offering||'—'}</div></div>
      <!-- 产品/服务 -->
      <div class="info-item"><div class="lbl">Reseller</div><div class="val">${r.reseller||'—'}</div></div>
      <!-- 经销商 -->
    </div>
    <!-- 人员信息行 -->
    <div class="info-row">
      <div class="info-item"><div class="lbl">BD</div><div class="val">${r.bd||'—'}</div></div>
      <!-- BD 负责人 -->
      <div class="info-item"><div class="lbl">PBD</div><div class="val">${r.pbd||'—'}</div></div>
      <!-- PBD 负责人 -->
      <div class="info-item"><div class="lbl">PSA</div><div class="val">${r.psa||'—'}</div></div>
      <!-- PSA -->
      <div class="info-item"><div class="lbl">Partner Sales</div><div class="val">${r.partnersales||'—'}</div></div>
      <!-- 合作伙伴销售 -->
      <div class="info-item"><div class="lbl">Total Forecast</div><div class="val text-mono">${fmtMoney(recordTotal(r))}</div></div>
      <!-- 全年预测总额 -->
    </div>
    ${r.nextstep ? `<div style="padding:12px 16px;background:var(--surface2);border-radius:8px;border-left:3px solid var(--amber);margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Next Step</div><div style="font-size:13px">${r.nextstep}</div></div>` : ''}
    <!-- 下一步计划（如果有） -->
    <div style="font-family:var(--font-head);font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text-muted)">Monthly Forecast</div>
    <!-- 月度预测标题 -->
    ${monthsHtml}
    <!-- 月度预测数据 -->
  `;

  // 渲染底部操作按钮
  document.getElementById('view-footer').innerHTML = `
    ${canEditRecord(r) ? `<button class="btn btn-secondary btn-sm" onclick="closeModal('modal-view');editRecord(${r.id})">Edit</button>` : ''}
    <!-- 编辑按钮（有权限时显示） -->
    ${currentUser?.role==='admin' ? `<button class="btn btn-danger btn-sm" onclick="closeModal('modal-view');deleteRecord(${r.id})">Delete</button>` : ''}
    <!-- 删除按钮（仅管理员） -->
    <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-view')">Close</button>
    <!-- 关闭按钮 -->
  `;
  openModal('modal-view');                 // 打开详情模态框
}
