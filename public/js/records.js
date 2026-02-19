/* ═══════════════════════════════════════════════════════════════ */
/*  RECORDS MANAGEMENT                                             */
/* ═══════════════════════════════════════════════════════════════ */

let editingRecordId = null;

function populateFilters() {
  const recs = getVisibleRecords();
  const fill = (id, vals) => {
    const el = document.getElementById(id);
    const cur = el.value;
    el.innerHTML = el.options[0].outerHTML + [...new Set(vals.filter(Boolean))].map(v => `<option ${v===cur?'selected':''} value="${v}">${v}</option>`).join('');
  };
  fill('f-stage', recs.map(r => r.stage));
  fill('f-industry', recs.map(r => r.industry));
  fill('f-offering', recs.map(r => r.offering));
  fill('f-bd', recs.map(r => r.bd));

  const setDL = (id, vals) => { document.getElementById(id).innerHTML = [...new Set(vals.filter(Boolean))].map(v => `<option value="${v}">`).join(''); };
  setDL('industry-list', recs.map(r => r.industry));
  setDL('offering-list', recs.map(r => r.offering));
  const users = getUsers();
  setDL('bd-list', users.filter(u => u.role==='BD'||u.role==='admin').map(u => u.name));
  setDL('pbd-list', users.filter(u => u.role==='PBD'||u.role==='admin').map(u => u.name));
}

function renderRecords() {
  let recs = getVisibleRecords();
  const q = (document.getElementById('rec-search')?.value||'').toLowerCase();
  const fStage = document.getElementById('f-stage')?.value||'';
  const fInd = document.getElementById('f-industry')?.value||'';
  const fOf = document.getElementById('f-offering')?.value||'';
  const fBd = document.getElementById('f-bd')?.value||'';

  if (q) recs = recs.filter(r => JSON.stringify(r).toLowerCase().includes(q));
  if (fStage) recs = recs.filter(r => r.stage === fStage);
  if (fInd) recs = recs.filter(r => r.industry === fInd);
  if (fOf) recs = recs.filter(r => r.offering === fOf);
  if (fBd) recs = recs.filter(r => r.bd === fBd);

  const cols = ['Partner','Customers','Offering','Industry','Stage','BD','PBD','Probability','Total','Billing Start','Actions'];
  document.getElementById('records-head').innerHTML = `<tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr>`;

  if (!recs.length) {
    document.getElementById('records-body').innerHTML = `<tr><td colspan="${cols.length}"><div class="empty-state"><div class="empty-icon">📭</div><div>No records found</div></div></td></tr>`;
    return;
  }

  document.getElementById('records-body').innerHTML = recs.map(r => `
    <tr>
      <td>${r.partner||'—'}</td>
      <td>${r.customers||'—'}</td>
      <td>${r.offering ? `<span class="badge badge-cyan">${r.offering}</span>` : '—'}</td>
      <td>${r.industry||'—'}</td>
      <td>${stageBadge(r.stage)}</td>
      <td>${r.bd||'—'}</td>
      <td>${r.pbd||'—'}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="prob-bar" style="width:48px"><div class="prob-fill" style="width:${r.prob||0}%;background:${probColor(r.prob)}"></div></div>
          <span class="text-mono" style="font-size:11px;color:${probColor(r.prob)}">${r.prob||0}%</span>
        </div>
      </td>
      <td class="text-mono">${fmtMoney(recordTotal(r))}</td>
      <td>${r.billing||'—'}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-xs" onclick="viewRecord(${r.id})">View</button>
          ${canEditRecord(r) ? `<button class="btn btn-secondary btn-xs" onclick="editRecord(${r.id})">Edit</button>` : ''}
          ${currentUser?.role==='admin' ? `<button class="btn btn-danger btn-xs" onclick="deleteRecord(${r.id})">Del</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function canEditRecord(r) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  return r.bd === currentUser.name || r.bd === currentUser.username || r.pbd === currentUser.name || r.pbd === currentUser.username;
}

function openAddRecord() {
  editingRecordId = null;
  document.getElementById('modal-record-title').textContent = 'Add Record';
  ['partner','customers','hwchid','billing','reseller','industry','workload','offering','bd','pbd','psa','partnersales','nextstep'].forEach(f => document.getElementById('r-'+f).value = '');
  document.getElementById('r-prob').value = '';
  document.getElementById('r-stage').value = '';
  MONTHS.forEach(m => document.getElementById('r-'+m).value = '');
  switchRecordTab('basic');
  populateFilters();
  openModal('modal-record');
}

function editRecord(id) {
  const r = getRecords().find(x => x.id === id);
  if (!r) return;
  editingRecordId = id;
  document.getElementById('modal-record-title').textContent = 'Edit Record';
  ['partner','customers','hwchid','reseller','industry','workload','offering','bd','pbd','psa','partnersales','nextstep'].forEach(f => document.getElementById('r-'+f).value = r[f]||'');
  document.getElementById('r-billing').value = r.billing||'';
  document.getElementById('r-prob').value = r.prob||'';
  document.getElementById('r-stage').value = r.stage||'';
  MONTHS.forEach(m => document.getElementById('r-'+m).value = r[m]||'');
  switchRecordTab('basic');
  populateFilters();
  openModal('modal-record');
}

async function saveRecord() {
  const partner = document.getElementById('r-partner').value.trim();
  const customers = document.getElementById('r-customers').value.trim();
  const stage = document.getElementById('r-stage').value;
  if (!partner || !customers) { showAlert('record-alert','error','Partner and Customers are required.'); return; }

  const r = {
    partner, customers,
    hwchid: document.getElementById('r-hwchid').value.trim(),
    billing: document.getElementById('r-billing').value,
    reseller: document.getElementById('r-reseller').value.trim(),
    industry: document.getElementById('r-industry').value.trim(),
    workload: document.getElementById('r-workload').value.trim(),
    offering: document.getElementById('r-offering').value.trim(),
    bd: document.getElementById('r-bd').value.trim(),
    pbd: document.getElementById('r-pbd').value.trim(),
    psa: document.getElementById('r-psa').value.trim(),
    partnersales: document.getElementById('r-partnersales').value.trim(),
    nextstep: document.getElementById('r-nextstep').value.trim(),
    prob: Number(document.getElementById('r-prob').value)||0,
    stage: stage,
  };
  MONTHS.forEach(m => r[m] = Number(document.getElementById('r-'+m).value)||0);

  try {
    if (editingRecordId) {
      await api('PUT', '/records/' + editingRecordId, r);
    } else {
      await api('POST', '/records', r);
    }
    await refreshRecords();
    closeModal('modal-record');
    renderRecords();
    renderDashboard();
  } catch (err) {
    showAlert('record-alert', 'error', err.message || 'Failed to save record.');
  }
}

async function deleteRecord(id) {
  if (!confirm('Delete this record?')) return;
  try {
    await api('DELETE', '/records/' + id);
    await refreshRecords();
    renderRecords();
    renderDashboard();
  } catch (err) {
    alert('Failed to delete: ' + (err.message || 'Unknown error'));
  }
}

function viewRecord(id) {
  const r = getRecords().find(x => x.id === id);
  if (!r) return;
  document.getElementById('view-title').textContent = r.customers || r.partner;

  const monthsHtml = `<div class="month-grid" style="margin-top:8px">
    ${MONTHS.map((m,i) => `<div class="form-group"><div class="info-item"><div class="lbl">${MONTH_LABELS[i]}</div><div class="val text-mono">${fmtMoney(r[m]||0)}</div></div></div>`).join('')}
  </div>`;

  document.getElementById('view-body').innerHTML = `
    <div class="info-row">
      <div class="info-item"><div class="lbl">Partner</div><div class="val">${r.partner||'—'}</div></div>
      <div class="info-item"><div class="lbl">Customer</div><div class="val">${r.customers||'—'}</div></div>
      <div class="info-item"><div class="lbl">HWC/HID</div><div class="val text-mono">${r.hwchid||'—'}</div></div>
      <div class="info-item"><div class="lbl">Billing Start</div><div class="val">${r.billing||'—'}</div></div>
      <div class="info-item"><div class="lbl">Stage</div><div class="val">${stageBadge(r.stage)}</div></div>
      <div class="info-item"><div class="lbl">Probability</div><div class="val" style="color:${probColor(r.prob)}">${r.prob||0}%</div></div>
    </div>
    <div class="info-row">
      <div class="info-item"><div class="lbl">Industry</div><div class="val">${r.industry||'—'}</div></div>
      <div class="info-item"><div class="lbl">Workload</div><div class="val">${r.workload||'—'}</div></div>
      <div class="info-item"><div class="lbl">Offering</div><div class="val">${r.offering||'—'}</div></div>
      <div class="info-item"><div class="lbl">Reseller</div><div class="val">${r.reseller||'—'}</div></div>
    </div>
    <div class="info-row">
      <div class="info-item"><div class="lbl">BD</div><div class="val">${r.bd||'—'}</div></div>
      <div class="info-item"><div class="lbl">PBD</div><div class="val">${r.pbd||'—'}</div></div>
      <div class="info-item"><div class="lbl">PSA</div><div class="val">${r.psa||'—'}</div></div>
      <div class="info-item"><div class="lbl">Partner Sales</div><div class="val">${r.partnersales||'—'}</div></div>
      <div class="info-item"><div class="lbl">Total Forecast</div><div class="val text-mono">${fmtMoney(recordTotal(r))}</div></div>
    </div>
    ${r.nextstep ? `<div style="padding:12px 16px;background:var(--surface2);border-radius:8px;border-left:3px solid var(--amber);margin-bottom:16px"><div style="font-size:10px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Next Step</div><div style="font-size:13px">${r.nextstep}</div></div>` : ''}
    <div style="font-family:var(--font-head);font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text-muted)">Monthly Forecast</div>
    ${monthsHtml}
  `;

  document.getElementById('view-footer').innerHTML = `
    ${canEditRecord(r) ? `<button class="btn btn-secondary btn-sm" onclick="closeModal('modal-view');editRecord(${r.id})">Edit</button>` : ''}
    ${currentUser?.role==='admin' ? `<button class="btn btn-danger btn-sm" onclick="closeModal('modal-view');deleteRecord(${r.id})">Delete</button>` : ''}
    <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-view')">Close</button>
  `;
  openModal('modal-view');
}
