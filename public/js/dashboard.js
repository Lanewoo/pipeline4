/* ═══════════════════════════════════════════════════════════════ */
/*  DASHBOARD & PIPELINE BOARD                                    */
/* ═══════════════════════════════════════════════════════════════ */

function renderDashboard() {
  const recs = getVisibleRecords();
  const total = recs.reduce((s,r) => s + recordTotal(r), 0);
  const won = recs.filter(r => r.stage === 'Closed Won').reduce((s,r) => s + recordTotal(r), 0);
  const avgProb = recs.length ? Math.round(recs.reduce((s,r) => s + (Number(r.prob)||0), 0) / recs.length) : 0;
  const open = recs.filter(r => !['Closed Won','Closed Lost'].includes(r.stage)).length;

  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card red"><div class="stat-label">Total Pipeline</div><div class="stat-value">${fmtMoney(total)}</div><div class="stat-sub">${recs.length} records</div></div>
    <div class="stat-card green"><div class="stat-label">Closed Won</div><div class="stat-value">${fmtMoney(won)}</div><div class="stat-sub">${recs.filter(r=>r.stage==='Closed Won').length} deals</div></div>
    <div class="stat-card blue"><div class="stat-label">Open Deals</div><div class="stat-value">${open}</div><div class="stat-sub">Active pipeline</div></div>
    <div class="stat-card amber"><div class="stat-label">Avg Probability</div><div class="stat-value">${avgProb}%</div><div class="stat-sub">Across open deals</div></div>
    <div class="stat-card purple"><div class="stat-label">In Negotiation</div><div class="stat-value">${recs.filter(r=>r.stage==='Negotiation').length}</div><div class="stat-sub">Near close</div></div>
  `;

  const monthTotals = MONTHS.map(m => recs.reduce((s,r) => s + (Number(r[m])||0), 0));
  const maxM = Math.max(...monthTotals, 1);
  document.getElementById('month-chart').innerHTML = monthTotals.map((v, i) => `
    <div class="bar-wrap">
      <div class="bar-val">${fmtMoney(v)}</div>
      <div class="bar" style="height:${Math.round((v/maxM)*90)}%;background:linear-gradient(180deg,var(--red),rgba(232,25,44,0.4));min-height:4px"></div>
      <div class="bar-name">${MONTH_LABELS[i]}</div>
    </div>
  `).join('');

  const stages = ['Prospect','Qualification','Proposal','Negotiation','Closed Won','Closed Lost'];
  const stageCols = ['#6b7280','#3b82f6','#f59e0b','#8b5cf6','#10b981','#ef4444'];
  const stageCounts = stages.map(s => recs.filter(r => r.stage === s).length);
  const totalDeals = recs.length || 1;
  let offset = 0;
  const R = 50, C = 65, circumf = 2 * Math.PI * R;
  let paths = '';
  stages.forEach((s, i) => {
    const pct = stageCounts[i] / totalDeals;
    const len = pct * circumf;
    if (len > 0) {
      paths += `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${stageCols[i]}" stroke-width="12" stroke-dasharray="${len} ${circumf - len}" stroke-dashoffset="${-offset}" stroke-linecap="round"/>`;
      offset += len;
    }
  });
  document.getElementById('donut-svg').innerHTML = paths;
  document.getElementById('donut-num').textContent = recs.length;
  document.getElementById('donut-legend').innerHTML = stages.map((s,i) => stageCounts[i] > 0 ? `<span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:${stageCols[i]};display:inline-block"></span>${s} (${stageCounts[i]})</span>` : '').join('');
}

function renderPipeline() {
  const recs = getVisibleRecords();
  const stages = ['Prospect','Qualification','Proposal','Negotiation','Closed Won','Closed Lost'];
  const stageCols2 = { 'Prospect':'#6b7280','Qualification':'#3b82f6','Proposal':'#f59e0b','Negotiation':'#8b5cf6','Closed Won':'#10b981','Closed Lost':'#ef4444' };
  document.getElementById('stage-board').innerHTML = stages.map(s => {
    const sRecs = recs.filter(r => r.stage === s);
    const total = sRecs.reduce((sum,r) => sum+recordTotal(r),0);
    return `
      <div class="stage-col">
        <div class="stage-col-header">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${stageCols2[s]};display:inline-block;box-shadow:0 0 6px ${stageCols2[s]}"></span>
            <span class="stage-col-name" style="color:${stageCols2[s]}">${s}</span>
          </div>
          <span class="stage-count">${sRecs.length}</span>
        </div>
        <div style="padding:8px 10px;font-size:10px;color:var(--text-muted);border-bottom:1px solid var(--border);font-family:var(--font-mono)">${fmtMoney(total)}</div>
        <div class="stage-cards">
          ${sRecs.length ? sRecs.map(r => `
            <div class="pipeline-card" onclick="viewRecord(${r.id})">
              <div class="pc-name">${r.customers || r.partner || '—'}</div>
              <div class="pc-partner">${r.partner || ''}</div>
              <div class="pc-footer">
                <span class="tag">${r.offering || r.workload || '—'}</span>
                <span class="pc-prob text-mono" style="color:${probColor(r.prob)}">${r.prob||0}%</span>
              </div>
            </div>
          `).join('') : '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:12px">No records</div>'}
        </div>
      </div>
    `;
  }).join('');
}

function getVisibleRecords() {
  const recs = getRecords();
  if (!currentUser) return recs;
  if (currentUser.role === 'admin') return recs;
  return recs.filter(r => r.bd === currentUser.name || r.pbd === currentUser.name || r.bd === currentUser.username || r.pbd === currentUser.username);
}
