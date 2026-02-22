/* ═══════════════════════════════════════════════════════════════ */
/*  数据导入/导出功能                                               */
/* ═══════════════════════════════════════════════════════════════ */

// 必需的 Excel 列名列表（导入时校验）
const REQUIRED_COLS = ['Partner','Customers','Hwc/Hid','Billing Start Date','Reseller','Industry','Workload','Offering','BD','PBD','PSA','Partner Sales','Next Step','Probility','Sales Stage','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Excel 列名 → 数据库字段名的映射关系
const COL_MAP = { 'Partner':'partner','Customers':'customers','Hwc/Hid':'hwchid','Billing Start Date':'billing','Reseller':'reseller','Industry':'industry','Workload':'workload','Offering':'offering','BD':'bd','PBD':'pbd','PSA':'psa','Partner Sales':'partnersales','Next Step':'nextstep','Probility':'prob','Sales Stage':'stage','Jan':'jan','Feb':'feb','Mar':'mar','Apr':'apr','May':'may','Jun':'jun','Jul':'jul','Aug':'aug','Sep':'sep','Oct':'oct','Nov':'nov','Dec':'dec' };

let importData = null;                     // 导入数据暂存（解析后的数据，等待用户确认导入）

// 处理文件拖放事件
function handleDrop(e) {
  e.preventDefault();                      // 阻止浏览器默认行为（打开文件）
  e.currentTarget.classList.remove('drag-over'); // 移除拖入高亮样式
  const file = e.dataTransfer.files[0];    // 获取拖入的第一个文件
  if (file) processFile(file);             // 处理文件
}

// 处理文件选择事件（通过点击选择文件）
function handleFileSelect(e) {
  const file = e.target.files[0];          // 获取选择的文件
  if (file) processFile(file);             // 处理文件
  e.target.value = '';                     // 清空文件输入（允许重复选择相同文件）
}

// 解析 Excel 文件并显示导入预览
function processFile(file) {
  const reader = new FileReader();         // 创建文件读取器
  reader.onload = e => {
    const wb = XLSX.read(e.target.result, { type: 'array' }); // 读取 Excel 工作簿
    const ws = wb.Sheets[wb.SheetNames[0]]; // 获取第一个工作表
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }); // 将工作表转为二维数组
    if (!rows.length) { alert('Empty file.'); return; } // 如果文件为空，提示用户

    const headers = rows[0].map(h => String(h||'').trim()); // 获取表头行并去除空格
    const dataRows = rows.slice(1).filter(r => r.some(c => c !== null && c !== undefined && c !== '')); // 获取数据行（过滤空行）

    // 匹配列：将文件中的列名与必需列名进行匹配
    const matched = {}, missing = [];
    REQUIRED_COLS.forEach(rc => {
      const found = headers.find(h => h.toLowerCase() === rc.toLowerCase() || h.toLowerCase().replace(/\s+/g,'') === rc.toLowerCase().replace(/\s+/g,'')); // 不区分大小写和空格匹配
      if (found) matched[rc] = headers.indexOf(found); // 记录匹配到的列索引
      else missing.push(rc);               // 记录未匹配到的列
    });

    // 渲染列匹配结果表格
    document.getElementById('col-match-body').innerHTML = REQUIRED_COLS.map(rc => {
      const ok = matched[rc] !== undefined; // 是否匹配成功
      return `<tr><td>${rc}</td><td>${ok ? headers[matched[rc]] : '<em>not found</em>'}</td><td class="${ok?'match-ok':'match-miss'}">${ok?'✓ Matched':'✗ Missing'}</td></tr>`;
    }).join('');

    // 如果有未匹配的列，禁用导入按钮并显示错误提示
    if (missing.length > 0) {
      const summEl = document.getElementById('import-summary');
      summEl.className = 'alert alert-error show';
      summEl.textContent = `${missing.length} required column(s) not found: ${missing.join(', ')}. Import disabled.`;
      document.getElementById('import-confirm-btn').disabled = true; // 禁用导入按钮
    } else {
      // 所有列匹配成功，启用导入按钮
      const summEl = document.getElementById('import-summary');
      summEl.className = 'alert alert-success show';
      summEl.textContent = `All columns matched! ${dataRows.length} row(s) ready to import.`;
      document.getElementById('import-confirm-btn').disabled = false; // 启用导入按钮
    }

    importData = { matched, dataRows, headers }; // 暂存解析后的数据
    document.getElementById('import-preview').style.display = ''; // 显示预览区域
  };
  reader.readAsArrayBuffer(file);          // 以 ArrayBuffer 格式读取文件
}

// 确认导入：将解析后的数据逐条发送到服务器
async function confirmImport() {
  if (!importData) return;                 // 如果没有数据，直接返回
  const { matched, dataRows } = importData; // 解构匹配信息和数据行
  let added = 0;                           // 成功导入的计数器

  for (const row of dataRows) {            // 遍历每一行数据
    const r = {};                          // 构建记录对象
    REQUIRED_COLS.forEach(rc => {
      const idx = matched[rc];             // 获取该列在文件中的索引
      const key = COL_MAP[rc];             // 获取对应的数据库字段名
      if (idx !== undefined && key) {
        let v = row[idx];                  // 获取单元格值
        if (v === null || v === undefined) v = ''; // 空值处理
        if (['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec','prob'].includes(key)) v = Number(v)||0; // 数字字段转为数字类型
        r[key] = v;                        // 设置字段值
      }
    });
    if (r.partner || r.customers) {        // 至少有合作伙伴或客户名才导入
      try {
        await api('POST', '/records', r);  // 调用创建记录接口
        added++;                           // 成功计数加一
      } catch { /* 跳过失败的行 */ }
    }
  }

  await refreshRecords();                  // 刷新记录缓存
  importData = null;                       // 清空导入数据
  document.getElementById('import-preview').style.display = 'none'; // 隐藏预览区域
  alert(`Successfully imported ${added} record(s).`); // 提示导入成功数量
  goPage('records');                       // 跳转到记录列表页
}

// 导出为 Excel 文件
function exportXLSX() {
  const recs = getVisibleRecords();        // 获取当前用户可见的记录
  // 构建二维数组：第一行为表头
  const rows = [['Partner','Customers','Hwc/Hid','Billing Start Date','Reseller','Industry','Workload','Offering','BD','PBD','PSA','Partner Sales','Next Step','Probility','Sales Stage','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']];
  // 将每条记录按列顺序添加为一行
  recs.forEach(r => rows.push([r.partner,r.customers,r.hwchid,r.billing,r.reseller,r.industry,r.workload,r.offering,r.bd,r.pbd,r.psa,r.partnersales,r.nextstep,r.prob,r.stage,r.jan,r.feb,r.mar,r.apr,r.may,r.jun,r.jul,r.aug,r.sep,r.oct,r.nov,r.dec]));
  const ws = XLSX.utils.aoa_to_sheet(rows); // 将二维数组转为工作表
  const wb = XLSX.utils.book_new();        // 创建新工作簿
  XLSX.utils.book_append_sheet(wb, ws, 'Pipeline'); // 添加工作表到工作簿
  XLSX.writeFile(wb, 'pipeline_export.xlsx'); // 触发下载 Excel 文件
}
