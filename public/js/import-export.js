/* ═══════════════════════════════════════════════════════════════ */
/*  IMPORT / EXPORT DATA                                           */
/* ═══════════════════════════════════════════════════════════════ */

const REQUIRED_COLS = ['Partner','Customers','Hwc/Hid','Billing Start Date','Reseller','Industry','Workload','Offering','BD','PBD','PSA','Partner Sales','Next Step','Probility','Sales Stage','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COL_MAP = { 'Partner':'partner','Customers':'customers','Hwc/Hid':'hwchid','Billing Start Date':'billing','Reseller':'reseller','Industry':'industry','Workload':'workload','Offering':'offering','BD':'bd','PBD':'pbd','PSA':'psa','Partner Sales':'partnersales','Next Step':'nextstep','Probility':'prob','Sales Stage':'stage','Jan':'jan','Feb':'feb','Mar':'mar','Apr':'apr','May':'may','Jun':'jun','Jul':'jul','Aug':'aug','Sep':'sep','Oct':'oct','Nov':'nov','Dec':'dec' };

let importData = null;

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
  e.target.value = '';
}

function processFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const wb = XLSX.read(e.target.result, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!rows.length) { alert('Empty file.'); return; }

    const headers = rows[0].map(h => String(h||'').trim());
    const dataRows = rows.slice(1).filter(r => r.some(c => c !== null && c !== undefined && c !== ''));

    const matched = {}, missing = [];
    REQUIRED_COLS.forEach(rc => {
      const found = headers.find(h => h.toLowerCase() === rc.toLowerCase() || h.toLowerCase().replace(/\s+/g,'') === rc.toLowerCase().replace(/\s+/g,''));
      if (found) matched[rc] = headers.indexOf(found);
      else missing.push(rc);
    });

    document.getElementById('col-match-body').innerHTML = REQUIRED_COLS.map(rc => {
      const ok = matched[rc] !== undefined;
      return `<tr><td>${rc}</td><td>${ok ? headers[matched[rc]] : '<em>not found</em>'}</td><td class="${ok?'match-ok':'match-miss'}">${ok?'✓ Matched':'✗ Missing'}</td></tr>`;
    }).join('');

    if (missing.length > 0) {
      const summEl = document.getElementById('import-summary');
      summEl.className = 'alert alert-error show';
      summEl.textContent = `${missing.length} required column(s) not found: ${missing.join(', ')}. Import disabled.`;
      document.getElementById('import-confirm-btn').disabled = true;
    } else {
      const summEl = document.getElementById('import-summary');
      summEl.className = 'alert alert-success show';
      summEl.textContent = `All columns matched! ${dataRows.length} row(s) ready to import.`;
      document.getElementById('import-confirm-btn').disabled = false;
    }

    importData = { matched, dataRows, headers };
    document.getElementById('import-preview').style.display = '';
  };
  reader.readAsArrayBuffer(file);
}

async function confirmImport() {
  if (!importData) return;
  const { matched, dataRows } = importData;
  let added = 0;

  for (const row of dataRows) {
    const r = {};
    REQUIRED_COLS.forEach(rc => {
      const idx = matched[rc];
      const key = COL_MAP[rc];
      if (idx !== undefined && key) {
        let v = row[idx];
        if (v === null || v === undefined) v = '';
        if (['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec','prob'].includes(key)) v = Number(v)||0;
        r[key] = v;
      }
    });
    if (r.partner || r.customers) {
      try {
        await api('POST', '/records', r);
        added++;
      } catch { /* skip failed rows */ }
    }
  }

  await refreshRecords();
  importData = null;
  document.getElementById('import-preview').style.display = 'none';
  alert(`Successfully imported ${added} record(s).`);
  goPage('records');
}

function exportXLSX() {
  const recs = getVisibleRecords();
  const rows = [['Partner','Customers','Hwc/Hid','Billing Start Date','Reseller','Industry','Workload','Offering','BD','PBD','PSA','Partner Sales','Next Step','Probility','Sales Stage','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']];
  recs.forEach(r => rows.push([r.partner,r.customers,r.hwchid,r.billing,r.reseller,r.industry,r.workload,r.offering,r.bd,r.pbd,r.psa,r.partnersales,r.nextstep,r.prob,r.stage,r.jan,r.feb,r.mar,r.apr,r.may,r.jun,r.jul,r.aug,r.sep,r.oct,r.nov,r.dec]));
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pipeline');
  XLSX.writeFile(wb, 'pipeline_export.xlsx');
}
