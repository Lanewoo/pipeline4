/* ═══════════════════════════════════════════════════════════════ */
/*  管道管理系统 - 主应用脚本                                       */
/* ═══════════════════════════════════════════════════════════════ */

let currentUser = null;                    // 当前登录用户信息（null 表示未登录）
const API_BASE = '/api';                   // API 基础路径

// 内存中的数据缓存（从 API 刷新获取）
let _cachedRecords = [];                   // 缓存的管道记录列表
let _cachedUsers = [];                     // 缓存的用户列表
let _cachedPending = [];                   // 缓存的待审批用户列表

// ═══════════════════════════════════════════════════════
//  API 辅助函数
// ═══════════════════════════════════════════════════════

// 通用 API 请求函数：发送 HTTP 请求并返回解析后的 JSON 数据
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }; // 设置请求方法和 JSON 请求头
  if (body) opts.body = JSON.stringify(body); // 如果有请求体，序列化为 JSON 字符串
  const res = await fetch(API_BASE + path, opts); // 发送请求
  const data = await res.json();           // 解析响应为 JSON
  if (!res.ok || !data.success) throw new Error(data.error || 'Request failed'); // 请求失败则抛出异常
  return data;                             // 返回响应数据
}

// 从服务器刷新管道记录缓存
async function refreshRecords() {
  const data = await api('GET', '/records'); // 调用获取所有记录接口
  _cachedRecords = data.records || [];     // 更新缓存
}

// 从服务器刷新用户列表缓存
async function refreshUsers() {
  const data = await api('GET', '/users'); // 调用获取所有用户接口
  _cachedUsers = data.users || [];         // 更新缓存
}

// 从服务器刷新待审批用户列表缓存
async function refreshPending() {
  const data = await api('GET', '/users/pending'); // 调用获取待审批用户接口
  _cachedPending = data.pending || [];     // 更新缓存
}

// 获取缓存的记录数据
function getRecords() { return _cachedRecords; }
// 获取缓存的用户数据
function getUsers() { return _cachedUsers; }
// 获取缓存的待审批数据
function getPending() { return _cachedPending; }

// ═══════════════════════════════════════════════════════
//  页面初始化
// ═══════════════════════════════════════════════════════

// DOM 加载完成后执行初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadPages();                       // 加载页面 HTML 内容
  await loadModals();                      // 加载模态框 HTML 内容
  checkSession();                          // 检查是否有有效的登录会话
});

// 动态加载所有页面的 HTML 内容到 pages-container 容器
async function loadPages() {
  const html = `
    <!-- ── 仪表盘页面 ── -->
    <div class="page active" id="page-dashboard">
      <div class="page-inner">
        <div class="section-head" style="margin-bottom:20px">
          <div>
            <div class="section-title">Dashboard</div>
            <!-- 仪表盘标题 -->
            <div class="section-sub">Pipeline performance overview</div>
            <!-- 副标题：管道绩效概览 -->
          </div>
          <button class="btn btn-primary btn-sm" onclick="openAddRecord()">＋ Add Record</button>
          <!-- 添加记录按钮 -->
        </div>
        <div class="stat-grid" id="dash-stats"></div>
        <!-- 统计卡片网格容器（由 JS 动态渲染） -->
        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-label">Monthly Revenue Forecast (USD)</div>
            <!-- 月度收入预测图表标签 -->
            <div class="bar-chart" id="month-chart"></div>
            <!-- 柱状图容器 -->
          </div>
          <div class="chart-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div class="chart-label" style="text-align:center">By Sales Stage</div>
            <!-- 按销售阶段分布图表标签 -->
            <div class="donut-chart" id="stage-donut">
              <svg class="donut-svg" width="130" height="130" viewBox="0 0 130 130" id="donut-svg"></svg>
              <!-- 环形图 SVG -->
              <div class="donut-center"><div class="num" id="donut-num">0</div><div class="lbl">Total</div></div>
              <!-- 环形图中心显示总数 -->
            </div>
            <div id="donut-legend" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;font-size:11px"></div>
            <!-- 环形图图例 -->
          </div>
        </div>
      </div>
    </div>

    <!-- ── 管道看板页面 ── -->
    <div class="page" id="page-pipeline">
      <div class="page-inner">
        <div class="section-head">
          <div><div class="section-title">Pipeline Board</div><div class="section-sub">Kanban view by sales stage</div></div>
          <!-- 标题：管道看板（按销售阶段的看板视图） -->
          <button class="btn btn-primary btn-sm" onclick="openAddRecord()">＋ Add Record</button>
          <!-- 添加记录按钮 -->
        </div>
        <div class="stage-board" id="stage-board"></div>
        <!-- 看板列容器（由 JS 动态渲染） -->
      </div>
    </div>

    <!-- ── 记录列表页面 ── -->
    <div class="page" id="page-records">
      <div class="page-inner">
        <div class="section-head">
          <div><div class="section-title">Records</div><div class="section-sub">All pipeline entries</div></div>
          <!-- 标题：所有管道记录 -->
          <div style="display:flex;gap:10px">
            <button class="btn btn-ghost btn-sm" onclick="exportXLSX()">⬇ Export XLSX</button>
            <!-- 导出 Excel 按钮 -->
            <button class="btn btn-primary btn-sm" onclick="openAddRecord()">＋ Add Record</button>
            <!-- 添加记录按钮 -->
          </div>
        </div>
        <!-- 筛选器行 -->
        <div class="filter-row mb-4">
          <input type="text" class="search-input" placeholder="🔍 Search..." id="rec-search" oninput="renderRecords()">
          <!-- 搜索输入框（实时过滤） -->
          <select class="filter-select" id="f-stage" onchange="renderRecords()"><option value="">All Stages</option></select>
          <!-- 阶段筛选下拉框 -->
          <select class="filter-select" id="f-industry" onchange="renderRecords()"><option value="">All Industries</option></select>
          <!-- 行业筛选下拉框 -->
          <select class="filter-select" id="f-offering" onchange="renderRecords()"><option value="">All Offerings</option></select>
          <!-- 产品筛选下拉框 -->
          <select class="filter-select" id="f-bd" onchange="renderRecords()"><option value="">All BD</option></select>
          <!-- BD 筛选下拉框 -->
        </div>
        <!-- 记录数据表格 -->
        <div class="table-card">
          <div class="table-wrap">
            <table>
              <thead id="records-head"></thead>
              <!-- 表头（由 JS 动态渲染） -->
              <tbody id="records-body"></tbody>
              <!-- 表体（由 JS 动态渲染） -->
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 用户管理页面（仅管理员可见） ── -->
    <div class="page" id="page-users">
      <div class="page-inner">
        <div class="section-head">
          <div><div class="section-title">User Management</div><div class="section-sub">Manage accounts and access requests</div></div>
          <!-- 标题：用户管理（管理账户和访问申请） -->
          <button class="btn btn-primary btn-sm" onclick="openAddUser()">＋ Create User</button>
          <!-- 创建用户按钮 -->
        </div>
        <!-- 标签切换：待审批 / 所有用户 -->
        <div class="tabs-inner">
          <div class="tab-inner active" onclick="switchUserTab('pending')">Pending Requests <span id="pending-count-badge"></span></div>
          <!-- 待审批请求标签（带计数徽章） -->
          <div class="tab-inner" onclick="switchUserTab('all')">All Users</div>
          <!-- 所有用户标签 -->
        </div>
        <!-- 待审批标签面板 -->
        <div class="tab-pane active" id="utab-pending">
          <div id="pending-list"></div>
          <!-- 待审批用户列表容器 -->
        </div>
        <!-- 所有用户标签面板 -->
        <div class="tab-pane" id="utab-all">
          <div class="table-card">
            <div class="table-wrap">
              <table>
                <thead><tr>
                  <th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th>
                  <!-- 表头：用户名、姓名、角色、状态、创建时间、操作 -->
                </tr></thead>
                <tbody id="users-body"></tbody>
                <!-- 用户表体（由 JS 动态渲染） -->
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 数据导入页面 ── -->
    <div class="page" id="page-import">
      <div class="page-inner">
        <div class="section-head">
          <div><div class="section-title">Import Data</div><div class="section-sub">Upload an XLSX file to import pipeline records</div></div>
          <!-- 标题：导入数据（上传 XLSX 文件导入管道记录） -->
        </div>
        <!-- 文件拖放区域 -->
        <div class="drop-zone" id="drop-zone" onclick="document.getElementById('file-input').click()" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleDrop(event)">
          <div class="drop-icon">📂</div>
          <!-- 文件夹图标 -->
          <div class="drop-text">Drop your XLSX file here or click to browse</div>
          <!-- 提示：将 XLSX 文件拖到此处或点击浏览 -->
          <div class="drop-sub">Supported format: .xlsx — Columns must match the pipeline template</div>
          <!-- 说明：支持 .xlsx 格式，列需匹配管道模板 -->
          <input type="file" id="file-input" accept=".xlsx" style="display:none" onchange="handleFileSelect(event)">
          <!-- 隐藏的文件选择输入 -->
        </div>
        <!-- 导入预览区域（默认隐藏） -->
        <div id="import-preview" style="display:none;margin-top:24px">
          <div class="table-card" style="margin-bottom:16px">
            <div class="table-header">
              <div class="table-title">Column Matching</div>
              <!-- 列匹配标题 -->
            </div>
            <div class="table-wrap">
              <table class="col-match-table">
                <thead><tr><th>Required Column</th><th>Found in File</th><th>Status</th></tr></thead>
                <!-- 表头：必需列、文件中找到的列、状态 -->
                <tbody id="col-match-body"></tbody>
                <!-- 列匹配结果表体 -->
              </table>
            </div>
          </div>
          <div id="import-summary" class="alert" style="margin-bottom:12px"></div>
          <!-- 导入摘要提示 -->
          <div style="display:flex;gap:10px">
            <button class="btn btn-primary" id="import-confirm-btn" onclick="confirmImport()">Import Records</button>
            <!-- 确认导入按钮 -->
            <button class="btn btn-ghost" onclick="document.getElementById('import-preview').style.display='none';importData=null">Cancel</button>
            <!-- 取消按钮 -->
          </div>
        </div>
      </div>
    </div>

    <!-- ── 个人资料页面 ── -->
    <div class="page" id="page-profile">
      <div class="page-inner">
        <div class="section-title" style="margin-bottom:24px">My Profile</div>
        <!-- 标题：我的资料 -->
        <div class="profile-card">
          <div class="profile-avatar" id="profile-avatar">A</div>
          <!-- 头像（显示名字首字母） -->
          <div style="font-size:20px;font-family:var(--font-head);font-weight:700;margin-bottom:4px" id="profile-name">—</div>
          <!-- 用户姓名 -->
          <div class="flex items-center gap-1 mb-4">
            <span class="badge" id="profile-role-badge">—</span>
            <!-- 角色徽章 -->
            <span class="text-muted" style="font-size:12px" id="profile-username">—</span>
            <!-- 用户名 -->
          </div>
          <hr style="border:none;border-top:1px solid var(--border);margin-bottom:20px">
          <!-- 分隔线 -->
          <div class="section-title" style="font-size:16px;margin-bottom:16px">Change Password</div>
          <!-- 修改密码标题 -->
          <div id="pw-alert" class="alert" style="margin-bottom:12px"></div>
          <!-- 密码修改提示区域 -->
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <!-- 当前密码标签 -->
            <input type="password" id="pw-current" class="form-input" placeholder="Current password">
            <!-- 当前密码输入框 -->
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <!-- 新密码标签 -->
            <input type="password" id="pw-new" class="form-input" placeholder="New password">
            <!-- 新密码输入框 -->
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <!-- 确认新密码标签 -->
            <input type="password" id="pw-confirm" class="form-input" placeholder="Confirm new password">
            <!-- 确认密码输入框 -->
          </div>
          <button class="btn btn-primary" onclick="changePassword()" style="width:auto;padding:10px 24px">Update Password</button>
          <!-- 更新密码按钮 -->
        </div>
      </div>
    </div>
  `;
  document.getElementById('pages-container').innerHTML = html; // 将页面 HTML 注入到容器中
}

// 动态加载所有模态框的 HTML 内容到 modals-container 容器
async function loadModals() {
  const html = `
    <!-- 添加/编辑记录模态框 -->
    <div class="modal-overlay" id="modal-record">
      <div class="modal modal-wide">
        <div class="modal-header">
          <div class="modal-title" id="modal-record-title">Add Record</div>
          <!-- 模态框标题（动态：添加记录 / 编辑记录） -->
          <button class="modal-close" onclick="closeModal('modal-record')">✕</button>
          <!-- 关闭按钮 -->
        </div>
        <div class="modal-body">
          <!-- 标签切换：基本信息 / 销售详情 / 月度预测 -->
          <div class="tabs-inner">
            <div class="tab-inner active" onclick="switchRecordTab('basic')">Basic Info</div>
            <!-- 基本信息标签 -->
            <div class="tab-inner" onclick="switchRecordTab('sales')">Sales Details</div>
            <!-- 销售详情标签 -->
            <div class="tab-inner" onclick="switchRecordTab('monthly')">Monthly Forecast</div>
            <!-- 月度预测标签 -->
          </div>
          <!-- 基本信息面板 -->
          <div id="rtab-basic" class="tab-pane active">
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Partner *</label><input id="r-partner" class="form-input" placeholder="Partner name"></div>
              <!-- 合作伙伴（必填） -->
              <div class="form-group"><label class="form-label">Customers *</label><input id="r-customers" class="form-input" placeholder="Customer name"></div>
              <!-- 客户名称（必填） -->
              <div class="form-group"><label class="form-label">HWC/HID</label><input id="r-hwchid" class="form-input" placeholder="HWC or HID"></div>
              <!-- 华为云账号/HID -->
              <div class="form-group"><label class="form-label">Billing Start Date</label><input id="r-billing" type="date" class="form-input"></div>
              <!-- 计费开始日期 -->
              <div class="form-group"><label class="form-label">Reseller</label><input id="r-reseller" class="form-input" placeholder="Reseller name"></div>
              <!-- 经销商 -->
              <div class="form-group"><label class="form-label">Industry</label><input id="r-industry" class="form-input" list="industry-list" placeholder="Industry"><datalist id="industry-list"></datalist></div>
              <!-- 行业（带自动补全） -->
              <div class="form-group"><label class="form-label">Workload</label><input id="r-workload" class="form-input" placeholder="Workload type"></div>
              <!-- 工作负载类型 -->
              <div class="form-group"><label class="form-label">Offering</label><input id="r-offering" class="form-input" list="offering-list" placeholder="Offering"><datalist id="offering-list"></datalist></div>
              <!-- 产品/服务（带自动补全） -->
            </div>
          </div>
          <!-- 销售详情面板 -->
          <div id="rtab-sales" class="tab-pane">
            <div class="form-grid">
              <div class="form-group"><label class="form-label">BD</label><input id="r-bd" class="form-input" list="bd-list" placeholder="BD name"><datalist id="bd-list"></datalist></div>
              <!-- BD 负责人（带自动补全） -->
              <div class="form-group"><label class="form-label">PBD</label><input id="r-pbd" class="form-input" list="pbd-list" placeholder="PBD name"><datalist id="pbd-list"></datalist></div>
              <!-- PBD 负责人（带自动补全） -->
              <div class="form-group"><label class="form-label">PSA</label><input id="r-psa" class="form-input" placeholder="PSA name"></div>
              <!-- PSA（售前架构师） -->
              <div class="form-group"><label class="form-label">Partner Sales</label><input id="r-partnersales" class="form-input" placeholder="Partner sales rep"></div>
              <!-- 合作伙伴销售代表 -->
              <div class="form-group full-width"><label class="form-label">Next Step</label><input id="r-nextstep" class="form-input" placeholder="Next action step"></div>
              <!-- 下一步计划（占满整行） -->
              <div class="form-group"><label class="form-label">Probability (%)</label><input id="r-prob" type="number" min="0" max="100" class="form-input" placeholder="0-100"></div>
              <!-- 成交概率（0-100%） -->
              <div class="form-group"><label class="form-label">Sales Stage *</label>
                <select id="r-stage" class="form-input">
                  <option value="">Select stage...</option>
                  <!-- 请选择阶段... -->
                  <option>Prospect</option><option>Qualification</option><option>Proposal</option>
                  <!-- 潜在客户 / 资质审查 / 方案提议 -->
                  <option>Negotiation</option><option>Closed Won</option><option>Closed Lost</option>
                  <!-- 谈判 / 成交 / 失败 -->
                </select>
              </div>
            </div>
          </div>
          <!-- 月度预测面板 -->
          <div id="rtab-monthly" class="tab-pane">
            <p class="text-muted" style="font-size:12px;margin-bottom:16px">Enter monthly revenue forecast values (USD)</p>
            <!-- 提示：输入月度收入预测值（美元） -->
            <div class="month-grid">
              <div class="form-group"><label class="form-label">Jan</label><input id="r-jan" type="number" class="form-input" placeholder="0"></div>
              <!-- 一月 -->
              <div class="form-group"><label class="form-label">Feb</label><input id="r-feb" type="number" class="form-input" placeholder="0"></div>
              <!-- 二月 -->
              <div class="form-group"><label class="form-label">Mar</label><input id="r-mar" type="number" class="form-input" placeholder="0"></div>
              <!-- 三月 -->
              <div class="form-group"><label class="form-label">Apr</label><input id="r-apr" type="number" class="form-input" placeholder="0"></div>
              <!-- 四月 -->
              <div class="form-group"><label class="form-label">May</label><input id="r-may" type="number" class="form-input" placeholder="0"></div>
              <!-- 五月 -->
              <div class="form-group"><label class="form-label">Jun</label><input id="r-jun" type="number" class="form-input" placeholder="0"></div>
              <!-- 六月 -->
              <div class="form-group"><label class="form-label">Jul</label><input id="r-jul" type="number" class="form-input" placeholder="0"></div>
              <!-- 七月 -->
              <div class="form-group"><label class="form-label">Aug</label><input id="r-aug" type="number" class="form-input" placeholder="0"></div>
              <!-- 八月 -->
              <div class="form-group"><label class="form-label">Sep</label><input id="r-sep" type="number" class="form-input" placeholder="0"></div>
              <!-- 九月 -->
              <div class="form-group"><label class="form-label">Oct</label><input id="r-oct" type="number" class="form-input" placeholder="0"></div>
              <!-- 十月 -->
              <div class="form-group"><label class="form-label">Nov</label><input id="r-nov" type="number" class="form-input" placeholder="0"></div>
              <!-- 十一月 -->
              <div class="form-group"><label class="form-label">Dec</label><input id="r-dec" type="number" class="form-input" placeholder="0"></div>
              <!-- 十二月 -->
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <div id="record-alert" class="alert" style="flex:1;margin-bottom:0"></div>
          <!-- 记录操作提示区域 -->
          <button class="btn btn-ghost" onclick="closeModal('modal-record')">Cancel</button>
          <!-- 取消按钮 -->
          <button class="btn btn-primary" onclick="saveRecord()">Save Record</button>
          <!-- 保存记录按钮 -->
        </div>
      </div>
    </div>

    <!-- 查看记录详情模态框 -->
    <div class="modal-overlay" id="modal-view">
      <div class="modal modal-wide">
        <div class="modal-header">
          <div class="modal-title" id="view-title">Record Detail</div>
          <!-- 记录详情标题 -->
          <button class="modal-close" onclick="closeModal('modal-view')">✕</button>
          <!-- 关闭按钮 -->
        </div>
        <div class="modal-body" id="view-body"></div>
        <!-- 详情内容区域（由 JS 动态渲染） -->
        <div class="modal-footer" id="view-footer"></div>
        <!-- 底部操作按钮区域 -->
      </div>
    </div>

    <!-- 创建用户模态框 -->
    <div class="modal-overlay" id="modal-user">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" id="modal-user-title">Create User</div>
          <!-- 创建用户标题 -->
          <button class="modal-close" onclick="closeModal('modal-user')">✕</button>
        </div>
        <div class="modal-body">
          <div id="user-alert" class="alert" style="margin-bottom:12px"></div>
          <!-- 用户操作提示区域 -->
          <div class="form-group"><label class="form-label">Full Name *</label><input id="u-name" class="form-input" placeholder="Full name"></div>
          <!-- 全名输入框（必填） -->
          <div class="form-group"><label class="form-label">Username *</label><input id="u-username" class="form-input" placeholder="Username"></div>
          <!-- 用户名输入框（必填） -->
          <div class="form-group"><label class="form-label">Role *</label>
            <select id="u-role" class="form-input">
              <option value="BD">BD</option><option value="PBD">PBD</option><option value="admin">Admin</option>
              <!-- 角色选择：BD / PBD / 管理员 -->
            </select>
          </div>
          <div class="form-group"><label class="form-label">Password *</label><input type="password" id="u-pass" class="form-input" placeholder="Set password"></div>
          <!-- 密码输入框（必填） -->
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal('modal-user')">Cancel</button>
          <!-- 取消按钮 -->
          <button class="btn btn-primary" onclick="saveUser()">Create User</button>
          <!-- 创建用户按钮 -->
        </div>
      </div>
    </div>

    <!-- 重置密码模态框 -->
    <div class="modal-overlay" id="modal-reset-pw">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">Reset Password</div>
          <!-- 重置密码标题 -->
          <button class="modal-close" onclick="closeModal('modal-reset-pw')">✕</button>
        </div>
        <div class="modal-body">
          <div id="reset-pw-alert" class="alert" style="margin-bottom:12px"></div>
          <!-- 重置密码提示区域 -->
          <p style="font-size:13px;color:var(--text-soft);margin-bottom:16px">Set a new password for <strong id="reset-pw-target"></strong></p>
          <!-- 提示：为目标用户设置新密码 -->
          <div class="form-group"><label class="form-label">New Password *</label><input type="password" id="rpw-new" class="form-input" placeholder="New password"></div>
          <!-- 新密码输入框 -->
          <div class="form-group"><label class="form-label">Confirm *</label><input type="password" id="rpw-confirm" class="form-input" placeholder="Confirm password"></div>
          <!-- 确认密码输入框 -->
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal('modal-reset-pw')">Cancel</button>
          <!-- 取消按钮 -->
          <button class="btn btn-primary" onclick="confirmResetPw()">Update Password</button>
          <!-- 确认更新密码按钮 -->
        </div>
      </div>
    </div>
  `;
  document.getElementById('modals-container').innerHTML = html; // 将模态框 HTML 注入到容器中
}

// ═══════════════════════════════════════════════════════
//  认证功能
// ═══════════════════════════════════════════════════════

// 用户登录
async function doLogin() {
  const u = document.getElementById('login-user').value.trim();  // 获取用户名
  const p = document.getElementById('login-pass').value;         // 获取密码
  if (!u || !p) { showAlert('login-alert', 'error', 'Please enter username and password.'); return; } // 校验非空

  try {
    const data = await api('POST', '/auth/login', { username: u, password: p }); // 调用登录接口
    currentUser = data.user;               // 保存当前用户信息
    sessionStorage.setItem('pm_session', JSON.stringify(currentUser)); // 将用户信息存入会话存储
    await launchApp();                     // 启动应用界面
  } catch (err) {
    showAlert('login-alert', 'error', err.message || 'Invalid credentials or account inactive.'); // 显示登录错误
  }
}

// 用户申请访问权限
async function doApply() {
  const name = document.getElementById('apply-name').value.trim();     // 获取全名
  const username = document.getElementById('apply-username').value.trim(); // 获取用户名
  const role = document.getElementById('apply-role').value;            // 获取角色
  const pass = document.getElementById('apply-pass').value;            // 获取密码
  if (!name || !username || !pass) { showAlert('apply-alert', 'error', 'All fields are required.'); return; } // 校验非空

  try {
    await api('POST', '/auth/register', { name, username, role, password: pass }); // 调用注册接口
    showAlert('apply-alert', 'success', 'Request submitted! An admin will review your application.'); // 显示成功提示
    document.getElementById('apply-name').value = '';     // 清空表单
    document.getElementById('apply-username').value = '';
    document.getElementById('apply-pass').value = '';
  } catch (err) {
    showAlert('apply-alert', 'error', err.message || 'Registration failed.'); // 显示错误提示
  }
}

// 用户登出
function doLogout() {
  currentUser = null;                      // 清除当前用户
  sessionStorage.removeItem('pm_session'); // 清除会话存储
  _cachedRecords = [];                     // 清空缓存数据
  _cachedUsers = [];
  _cachedPending = [];
  document.getElementById('app').classList.remove('visible');     // 隐藏应用界面
  document.getElementById('login-screen').style.display = 'flex'; // 显示登录界面
  document.getElementById('login-user').value = '';               // 清空登录表单
  document.getElementById('login-pass').value = '';
}

// 启动主应用界面
async function launchApp() {
  document.getElementById('login-screen').style.display = 'none'; // 隐藏登录界面
  document.getElementById('app').classList.add('visible');         // 显示应用界面
  document.getElementById('topbar-username').textContent = currentUser.name || currentUser.username; // 顶部显示用户名
  const rb = document.getElementById('topbar-role');
  rb.textContent = currentUser.role;       // 顶部显示角色
  rb.className = 'role-chip ' + currentUser.role; // 设置角色标签样式
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = currentUser.role === 'admin' ? 'flex' : 'none'; // 管理员专属元素：管理员可见，其他隐藏
  });
  document.querySelectorAll('.user-only').forEach(el => {
    el.style.display = currentUser.role !== 'admin' ? 'flex' : 'none'; // 普通用户专属元素：非管理员可见
  });

  await refreshRecords();                  // 刷新管道记录数据
  populateProfile();                       // 填充个人资料页
  goPage('dashboard');                     // 默认跳转到仪表盘
}

// 检查是否有有效的登录会话（页面刷新时自动恢复登录状态）
async function checkSession() {
  const s = sessionStorage.getItem('pm_session'); // 从会话存储获取用户信息
  if (s) {
    try {
      currentUser = JSON.parse(s);         // 解析用户信息
      await launchApp();                   // 恢复应用界面
    } catch { /* 会话数据无效，忽略 */ }
  }
}

// ═══════════════════════════════════════════════════════
//  导航与界面交互
// ═══════════════════════════════════════════════════════

// 页面导航：切换到指定页面
async function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));       // 移除所有页面的激活状态
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));     // 移除所有导航标签的激活状态
  document.getElementById('page-' + name).classList.add('active');                     // 激活目标页面
  document.querySelectorAll(`.nav-tab[data-page="${name}"]`).forEach(t => t.classList.add('active')); // 激活对应的导航标签

  if (name === 'dashboard') renderDashboard();     // 仪表盘：渲染统计和图表
  if (name === 'pipeline') renderPipeline();       // 管道看板：渲染看板视图
  if (name === 'records') { populateFilters(); renderRecords(); } // 记录页：填充筛选器并渲染表格
  if (name === 'users') { await refreshUsers(); await refreshPending(); renderUsers(); } // 用户页：刷新并渲染用户数据
  if (name === 'profile') populateProfile();       // 个人资料：填充个人信息
}

// 显示提示框（id：提示框元素ID，type：类型，msg：消息内容）
function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'alert alert-' + type + ' show'; // 设置提示框类型和显示状态
  el.textContent = msg;                    // 设置提示消息
  setTimeout(() => { el.classList.remove('show'); }, 4000); // 4 秒后自动隐藏
}

// 关闭模态框
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
// 打开模态框
function openModal(id) { document.getElementById(id).classList.add('open'); }

// 切换登录/申请 标签页
function switchLoginTab(t) {
  document.getElementById('tab-login').style.display = t === 'login' ? '' : 'none';  // 显示/隐藏登录面板
  document.getElementById('tab-apply').style.display = t === 'apply' ? '' : 'none';  // 显示/隐藏申请面板
  document.querySelectorAll('.login-tab').forEach((el, i) => el.classList.toggle('active', (i===0 && t==='login') || (i===1 && t==='apply'))); // 切换标签激活状态
}

// 切换用户管理页的标签（待审批 / 全部用户）
function switchUserTab(t) {
  document.querySelectorAll('.tab-pane[id^="utab"]').forEach(p => p.classList.remove('active')); // 移除所有面板激活
  document.querySelectorAll('.tabs-inner .tab-inner').forEach((el, i) => el.classList.toggle('active', (i===0 && t==='pending') || (i===1 && t==='all'))); // 切换标签激活
  document.getElementById('utab-' + t).classList.add('active'); // 激活目标面板
}

// 切换记录模态框中的标签（基本信息 / 销售详情 / 月度预测）
function switchRecordTab(t) {
  document.querySelectorAll('[id^="rtab-"]').forEach(p => p.classList.remove('active')); // 移除所有面板激活
  document.querySelectorAll('#modal-record .tab-inner').forEach((el, i) => {
    const tabs = ['basic','sales','monthly']; // 标签名数组
    el.classList.toggle('active', tabs[i] === t); // 切换标签激活
  });
  document.getElementById('rtab-' + t).classList.add('active'); // 激活目标面板
}

// ═══════════════════════════════════════════════════════
//  通用辅助函数
// ═══════════════════════════════════════════════════════

// 格式化日期：将 ISO 格式日期字符串转为本地日期格式
function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString() : '—'; }

// 格式化金额：大数字显示为 $1.2M 或 $50K 格式
function fmtMoney(v) {
  v = Number(v) || 0;
  if (v >= 1e6) return '$' + (v/1e6).toFixed(1) + 'M';  // 百万级显示为 M
  if (v >= 1e3) return '$' + (v/1e3).toFixed(0) + 'K';   // 千级显示为 K
  return '$' + v.toLocaleString();                         // 其他正常显示
}

// 根据概率值返回对应颜色（用于概率进度条）
function probColor(p) {
  p = Number(p) || 0;
  if (p >= 80) return '#10b981';           // 80% 以上：绿色
  if (p >= 50) return '#f59e0b';           // 50% 以上：琥珀色
  if (p >= 30) return '#3b82f6';           // 30% 以上：蓝色
  return '#6b7280';                        // 30% 以下：灰色
}

// 销售阶段对应的徽章样式映射
const STAGE_BADGE = { 'Prospect':'badge-gray', 'Qualification':'badge-blue', 'Proposal':'badge-amber', 'Negotiation':'badge-purple', 'Closed Won':'badge-green', 'Closed Lost':'badge-red' };
// 生成销售阶段徽章 HTML
function stageBadge(stage) {
  return `<span class="badge ${STAGE_BADGE[stage] || 'badge-gray'}">${stage || '—'}</span>`;
}

// 月份字段名数组（小写，对应数据库列名）
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
// 月份显示标签数组
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// 计算记录的全年收入总额
function recordTotal(r) { return MONTHS.reduce((s,m) => s + (Number(r[m])||0), 0); }
