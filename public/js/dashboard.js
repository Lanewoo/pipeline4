/* ═══════════════════════════════════════════════════════════════ */
/*  仪表盘与管道看板渲染                                            */
/* ═══════════════════════════════════════════════════════════════ */

// 渲染仪表盘页面（统计卡片、柱状图、环形图）
function renderDashboard() {
  const recs = getVisibleRecords();        // 获取当前用户可见的记录
  const total = recs.reduce((s,r) => s + recordTotal(r), 0);  // 计算所有记录的总收入
  const won = recs.filter(r => r.stage === 'Closed Won').reduce((s,r) => s + recordTotal(r), 0); // 已成交的总收入
  const avgProb = recs.length ? Math.round(recs.reduce((s,r) => s + (Number(r.prob)||0), 0) / recs.length) : 0; // 平均成交概率
  const open = recs.filter(r => !['Closed Won','Closed Lost'].includes(r.stage)).length; // 活跃交易数量

  // 渲染统计卡片
  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card red"><div class="stat-label">Total Pipeline</div><div class="stat-value">${fmtMoney(total)}</div><div class="stat-sub">${recs.length} records</div></div>
    <!-- 总管道价值（红色卡片） -->
    <div class="stat-card green"><div class="stat-label">Closed Won</div><div class="stat-value">${fmtMoney(won)}</div><div class="stat-sub">${recs.filter(r=>r.stage==='Closed Won').length} deals</div></div>
    <!-- 已成交金额（绿色卡片） -->
    <div class="stat-card blue"><div class="stat-label">Open Deals</div><div class="stat-value">${open}</div><div class="stat-sub">Active pipeline</div></div>
    <!-- 活跃交易数（蓝色卡片） -->
    <div class="stat-card amber"><div class="stat-label">Avg Probability</div><div class="stat-value">${avgProb}%</div><div class="stat-sub">Across open deals</div></div>
    <!-- 平均概率（琥珀色卡片） -->
    <div class="stat-card purple"><div class="stat-label">In Negotiation</div><div class="stat-value">${recs.filter(r=>r.stage==='Negotiation').length}</div><div class="stat-sub">Near close</div></div>
    <!-- 谈判中数量（紫色卡片） -->
  `;

  // 渲染月度收入柱状图
  const monthTotals = MONTHS.map(m => recs.reduce((s,r) => s + (Number(r[m])||0), 0)); // 计算每月总收入
  const maxM = Math.max(...monthTotals, 1); // 获取最大值（用于计算柱高比例）
  document.getElementById('month-chart').innerHTML = monthTotals.map((v, i) => `
    <div class="bar-wrap">
      <div class="bar-val">${fmtMoney(v)}</div>
      <!-- 柱顶数值 -->
      <div class="bar" style="height:${Math.round((v/maxM)*90)}%;background:linear-gradient(180deg,var(--red),rgba(232,25,44,0.4));min-height:4px"></div>
      <!-- 柱子本体（高度按比例，红色渐变） -->
      <div class="bar-name">${MONTH_LABELS[i]}</div>
      <!-- 月份名称 -->
    </div>
  `).join('');

  // 渲染按销售阶段分布的环形图
  const stages = ['Prospect','Qualification','Proposal','Negotiation','Closed Won','Closed Lost']; // 所有阶段
  const stageCols = ['#6b7280','#3b82f6','#f59e0b','#8b5cf6','#10b981','#ef4444']; // 各阶段对应颜色
  const stageCounts = stages.map(s => recs.filter(r => r.stage === s).length); // 每个阶段的记录数
  const totalDeals = recs.length || 1;     // 总交易数（避免除以 0）
  let offset = 0;                          // SVG 路径偏移量
  const R = 50, C = 65, circumf = 2 * Math.PI * R; // 环形图参数：半径、中心点、周长
  let paths = '';                          // SVG 路径字符串
  stages.forEach((s, i) => {
    const pct = stageCounts[i] / totalDeals; // 该阶段占总量的比例
    const len = pct * circumf;             // 对应的弧长
    if (len > 0) {
      paths += `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${stageCols[i]}" stroke-width="12" stroke-dasharray="${len} ${circumf - len}" stroke-dashoffset="${-offset}" stroke-linecap="round"/>`;
      // 绘制一段弧线
      offset += len;                       // 更新偏移量
    }
  });
  document.getElementById('donut-svg').innerHTML = paths;     // 将 SVG 路径写入环形图
  document.getElementById('donut-num').textContent = recs.length; // 更新中心总数
  // 渲染图例（只显示有记录的阶段）
  document.getElementById('donut-legend').innerHTML = stages.map((s,i) => stageCounts[i] > 0 ? `<span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:${stageCols[i]};display:inline-block"></span>${s} (${stageCounts[i]})</span>` : '').join('');
}

// 渲染管道看板页面（Kanban 视图）
function renderPipeline() {
  const recs = getVisibleRecords();        // 获取当前用户可见的记录
  const stages = ['Prospect','Qualification','Proposal','Negotiation','Closed Won','Closed Lost']; // 所有阶段
  const stageCols2 = { 'Prospect':'#6b7280','Qualification':'#3b82f6','Proposal':'#f59e0b','Negotiation':'#8b5cf6','Closed Won':'#10b981','Closed Lost':'#ef4444' }; // 阶段颜色映射
  // 为每个阶段生成一列
  document.getElementById('stage-board').innerHTML = stages.map(s => {
    const sRecs = recs.filter(r => r.stage === s); // 该阶段的记录
    const total = sRecs.reduce((sum,r) => sum+recordTotal(r),0); // 该阶段的总收入
    return `
      <div class="stage-col">
        <!-- 阶段列头部 -->
        <div class="stage-col-header">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${stageCols2[s]};display:inline-block;box-shadow:0 0 6px ${stageCols2[s]}"></span>
            <!-- 彩色圆点标识 -->
            <span class="stage-col-name" style="color:${stageCols2[s]}">${s}</span>
            <!-- 阶段名称 -->
          </div>
          <span class="stage-count">${sRecs.length}</span>
          <!-- 该阶段的记录数量 -->
        </div>
        <div style="padding:8px 10px;font-size:10px;color:var(--text-muted);border-bottom:1px solid var(--border);font-family:var(--font-mono)">${fmtMoney(total)}</div>
        <!-- 该阶段的总金额 -->
        <div class="stage-cards">
          <!-- 阶段内的卡片列表 -->
          ${sRecs.length ? sRecs.map(r => `
            <div class="pipeline-card" onclick="viewRecord(${r.id})">
              <!-- 单条管道卡片，点击查看详情 -->
              <div class="pc-name">${r.customers || r.partner || '—'}</div>
              <!-- 客户名/合作伙伴名 -->
              <div class="pc-partner">${r.partner || ''}</div>
              <!-- 合作伙伴名 -->
              <div class="pc-footer">
                <span class="tag">${r.offering || r.workload || '—'}</span>
                <!-- 产品/工作负载标签 -->
                <span class="pc-prob text-mono" style="color:${probColor(r.prob)}">${r.prob||0}%</span>
                <!-- 成交概率 -->
              </div>
            </div>
          `).join('') : '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:12px">No records</div>'}
          <!-- 无记录时显示提示 -->
        </div>
      </div>
    `;
  }).join('');
}

// 获取当前用户可见的记录（管理员看全部，BD/PBD 只看自己负责的）
function getVisibleRecords() {
  const recs = getRecords();               // 获取所有缓存记录
  if (!currentUser) return recs;           // 未登录时返回全部
  if (currentUser.role === 'admin') return recs; // 管理员返回全部
  // BD/PBD 只能看到自己作为 BD 或 PBD 负责人的记录
  return recs.filter(r => r.bd === currentUser.name || r.pbd === currentUser.name || r.bd === currentUser.username || r.pbd === currentUser.username);
}
