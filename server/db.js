const { Pool } = require('pg');            // 从 pg 库引入连接池类

// 创建 PostgreSQL 数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,    // 数据库连接字符串（从环境变量读取）
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // SSL 配置：启用时不验证证书
  max: parseInt(process.env.DB_POOL_MAX || '10'), // 连接池最大连接数，默认 10
  idleTimeoutMillis: 30000,                // 空闲连接超时时间（30 秒）
  connectionTimeoutMillis: 5000,           // 建立连接超时时间（5 秒）
});

// 监听连接池异常错误事件
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err); // 打印连接池意外错误
});

// 数据库初始化函数：创建表结构并插入默认数据
async function init() {
  const client = await pool.connect();     // 从连接池获取一个客户端连接
  try {
    await client.query('BEGIN');           // 开启事务

    // 创建用户表（如果不存在）
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,             -- 自增主键
        username VARCHAR(255) UNIQUE NOT NULL, -- 用户名（唯一，不可为空）
        name VARCHAR(255) NOT NULL,        -- 姓名（不可为空）
        role VARCHAR(50) NOT NULL,         -- 角色（admin/BD/PBD）
        password VARCHAR(255) NOT NULL,    -- 密码
        status VARCHAR(50) DEFAULT 'active', -- 状态，默认为 active（活跃）
        created TIMESTAMPTZ DEFAULT NOW()  -- 创建时间，默认当前时间
      )
    `);

    // 创建待审批用户表（如果不存在）
    await client.query(`
      CREATE TABLE IF NOT EXISTS pending_users (
        id SERIAL PRIMARY KEY,             -- 自增主键
        username VARCHAR(255) UNIQUE NOT NULL, -- 用户名（唯一，不可为空）
        name VARCHAR(255) NOT NULL,        -- 姓名
        role VARCHAR(50) NOT NULL,         -- 申请的角色
        password VARCHAR(255) NOT NULL,    -- 设定的密码
        requested TIMESTAMPTZ DEFAULT NOW() -- 申请时间
      )
    `);

    // 创建管道记录表（如果不存在）
    await client.query(`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,             -- 自增主键
        partner VARCHAR(255),              -- 合作伙伴名称
        customers VARCHAR(255),            -- 客户名称
        hwchid VARCHAR(255),               -- 华为云账号/HID
        billing VARCHAR(50),               -- 计费开始日期
        reseller VARCHAR(255),             -- 经销商
        industry VARCHAR(255),             -- 行业
        workload VARCHAR(255),             -- 工作负载类型
        offering VARCHAR(255),             -- 产品/服务类型
        bd VARCHAR(255),                   -- BD（商务拓展）负责人
        pbd VARCHAR(255),                  -- PBD（合作伙伴商务拓展）负责人
        psa VARCHAR(255),                  -- PSA（售前架构师）
        partnersales VARCHAR(255),         -- 合作伙伴销售代表
        nextstep TEXT,                     -- 下一步行动计划
        prob INTEGER DEFAULT 0,            -- 成交概率（0-100%）
        stage VARCHAR(100),                -- 销售阶段
        jan NUMERIC(12,2) DEFAULT 0,       -- 一月预测收入
        feb NUMERIC(12,2) DEFAULT 0,       -- 二月预测收入
        mar NUMERIC(12,2) DEFAULT 0,       -- 三月预测收入
        apr NUMERIC(12,2) DEFAULT 0,       -- 四月预测收入
        may NUMERIC(12,2) DEFAULT 0,       -- 五月预测收入
        jun NUMERIC(12,2) DEFAULT 0,       -- 六月预测收入
        jul NUMERIC(12,2) DEFAULT 0,       -- 七月预测收入
        aug NUMERIC(12,2) DEFAULT 0,       -- 八月预测收入
        sep NUMERIC(12,2) DEFAULT 0,       -- 九月预测收入
        oct NUMERIC(12,2) DEFAULT 0,       -- 十月预测收入
        nov NUMERIC(12,2) DEFAULT 0,       -- 十一月预测收入
        "dec" NUMERIC(12,2) DEFAULT 0,     -- 十二月预测收入（dec 是 SQL 关键字，需加引号）
        created TIMESTAMPTZ DEFAULT NOW()  -- 记录创建时间
      )
    `);

    // 如果用户表为空，则插入默认管理员账号
    const { rows: userRows } = await client.query('SELECT COUNT(*) AS cnt FROM users');
    if (parseInt(userRows[0].cnt) === 0) {
      await client.query(
        `INSERT INTO users (username, name, role, password, status)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', 'Administrator', 'admin', process.env.DEFAULT_ADMIN_PASSWORD || 'changeme', 'active']
      );
    }

    // 如果记录表为空，则插入示例数据
    const { rows: recRows } = await client.query('SELECT COUNT(*) AS cnt FROM records');
    if (parseInt(recRows[0].cnt) === 0) {
      // 插入第一条示例记录
      await client.query(
        `INSERT INTO records (partner, customers, hwchid, billing, reseller, industry, workload, offering,
          bd, pbd, psa, partnersales, nextstep, prob, stage,
          jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, "dec")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,
        ['TechCorp','Acme Ltd','HWC001','2025-01-15','ResellerA','Finance','Cloud Compute','ECS',
         'Alice Wong','Bob Chen','Charlie Lee','Dana Park','Follow up Q2',75,'Proposal',
         50000,60000,70000,80000,85000,90000,95000,100000,110000,120000,130000,140000]
      );
      // 插入第二条示例记录
      await client.query(
        `INSERT INTO records (partner, customers, hwchid, billing, reseller, industry, workload, offering,
          bd, pbd, psa, partnersales, nextstep, prob, stage,
          jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, "dec")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,
        ['GlobalNet','BetaCo','HID002','2025-02-01','ResellerB','Retail','Storage','OBS',
         'Eve Tan','Frank Li','Grace Kim','Henry Wu','Demo scheduled',50,'Qualification',
         20000,22000,25000,28000,30000,32000,35000,38000,40000,45000,50000,55000]
      );
    }

    await client.query('COMMIT');          // 提交事务
    console.log('✅ PostgreSQL database initialized successfully'); // 打印数据库初始化成功信息
  } catch (err) {
    await client.query('ROLLBACK');        // 出错时回滚事务
    throw err;                             // 将错误抛给调用者
  } finally {
    client.release();                      // 释放客户端连接回连接池
  }
}

// ── 用户操作 ──

// 根据用户名或 ID 获取单个用户
async function getUser(identifier, byId = false) {
  const { rows } = byId
    ? await pool.query('SELECT * FROM users WHERE id = $1', [identifier])     // 按 ID 查询
    : await pool.query('SELECT * FROM users WHERE username = $1', [identifier]); // 按用户名查询
  return rows[0] || null;                  // 返回查到的用户，未找到返回 null
}

// 获取所有用户列表（按 ID 排序）
async function getAllUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
  return rows;
}

// 创建新用户并返回插入后的数据
async function saveUser(user) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, name, role, password, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,                         // RETURNING * 返回插入的完整行数据
    [user.username, user.name, user.role, user.password, user.status || 'active']
  );
  return rows[0];
}

// 更新用户信息并返回更新后的数据
async function updateUser(user) {
  const { rows } = await pool.query(
    `UPDATE users SET username=$1, name=$2, role=$3, password=$4, status=$5
     WHERE id=$6 RETURNING *`,
    [user.username, user.name, user.role, user.password, user.status, user.id]
  );
  return rows[0];
}

// 根据 ID 删除用户
async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

// ── 待审批用户操作 ──

// 根据用户名获取待审批用户
async function getPendingUser(username) {
  const { rows } = await pool.query('SELECT * FROM pending_users WHERE username = $1', [username]);
  return rows[0] || null;
}

// 根据 ID 获取待审批用户
async function getPendingUserById(id) {
  const { rows } = await pool.query('SELECT * FROM pending_users WHERE id = $1', [id]);
  return rows[0] || null;
}

// 获取所有待审批用户列表
async function getAllPendingUsers() {
  const { rows } = await pool.query('SELECT * FROM pending_users ORDER BY id');
  return rows;
}

// 保存新的待审批用户申请
async function savePendingUser(user) {
  const { rows } = await pool.query(
    `INSERT INTO pending_users (username, name, role, password)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user.username, user.name, user.role, user.password]
  );
  return rows[0];
}

// 根据 ID 删除待审批用户（用于批准或拒绝后的清理）
async function deletePendingUser(id) {
  await pool.query('DELETE FROM pending_users WHERE id = $1', [id]);
}

// ── 管道记录操作 ──

// 根据 ID 获取单条记录
async function getRecord(id) {
  const { rows } = await pool.query('SELECT * FROM records WHERE id = $1', [id]);
  const row = rows[0] || null;
  if (row) normalizeRecordNumbers(row);    // 将 NUMERIC 类型字段从字符串转为数字
  return row;
}

// 获取所有记录列表
async function getRecords() {
  const { rows } = await pool.query('SELECT * FROM records ORDER BY id');
  rows.forEach(normalizeRecordNumbers);    // 批量转换数字类型
  return rows;
}

// 创建新的管道记录
async function saveRecord(record) {
  const { rows } = await pool.query(
    `INSERT INTO records (partner, customers, hwchid, billing, reseller, industry, workload, offering,
      bd, pbd, psa, partnersales, nextstep, prob, stage,
      jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, "dec")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
     RETURNING *`,
    [record.partner, record.customers, record.hwchid, record.billing, record.reseller,
     record.industry, record.workload, record.offering, record.bd, record.pbd, record.psa,
     record.partnersales, record.nextstep, record.prob || 0, record.stage,
     record.jan||0, record.feb||0, record.mar||0, record.apr||0, record.may||0, record.jun||0,
     record.jul||0, record.aug||0, record.sep||0, record.oct||0, record.nov||0, record.dec||0]
  );
  const row = rows[0];
  normalizeRecordNumbers(row);             // 转换数字类型
  return row;
}

// 更新已有的管道记录
async function updateRecord(record) {
  const { rows } = await pool.query(
    `UPDATE records SET partner=$1, customers=$2, hwchid=$3, billing=$4, reseller=$5,
      industry=$6, workload=$7, offering=$8, bd=$9, pbd=$10, psa=$11, partnersales=$12,
      nextstep=$13, prob=$14, stage=$15,
      jan=$16, feb=$17, mar=$18, apr=$19, may=$20, jun=$21,
      jul=$22, aug=$23, sep=$24, oct=$25, nov=$26, "dec"=$27
     WHERE id=$28 RETURNING *`,
    [record.partner, record.customers, record.hwchid, record.billing, record.reseller,
     record.industry, record.workload, record.offering, record.bd, record.pbd, record.psa,
     record.partnersales, record.nextstep, record.prob||0, record.stage,
     record.jan||0, record.feb||0, record.mar||0, record.apr||0, record.may||0, record.jun||0,
     record.jul||0, record.aug||0, record.sep||0, record.oct||0, record.nov||0, record.dec||0,
     record.id]
  );
  const row = rows[0];
  if (row) normalizeRecordNumbers(row);    // 转换数字类型
  return row;
}

// 根据 ID 删除管道记录
async function deleteRecord(id) {
  await pool.query('DELETE FROM records WHERE id = $1', [id]);
}

// PostgreSQL 的 NUMERIC 列返回的是字符串类型，此函数将其转为 JavaScript 数字
function normalizeRecordNumbers(row) {
  const numCols = ['prob','jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']; // 需要转换的列名
  for (const col of numCols) {
    if (row[col] !== null && row[col] !== undefined) {
      row[col] = Number(row[col]);         // 字符串转数字
    }
  }
}

// 关闭数据库连接池
async function close() {
  await pool.end();
}

// 导出所有数据库操作函数供其他模块使用
module.exports = {
  init,                  // 初始化数据库
  getUser,               // 获取单个用户
  getAllUsers,            // 获取所有用户
  saveUser,              // 创建用户
  updateUser,            // 更新用户
  deleteUser,            // 删除用户
  getPendingUser,        // 获取待审批用户（按用户名）
  getPendingUserById,    // 获取待审批用户（按 ID）
  getAllPendingUsers,    // 获取所有待审批用户
  savePendingUser,       // 保存待审批用户
  deletePendingUser,     // 删除待审批用户
  getRecord,             // 获取单条记录
  getRecords,            // 获取所有记录
  saveRecord,            // 创建记录
  updateRecord,          // 更新记录
  deleteRecord,          // 删除记录
  close,                 // 关闭连接池
};
