const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

async function init() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pending_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        requested TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        partner VARCHAR(255),
        customers VARCHAR(255),
        hwchid VARCHAR(255),
        billing VARCHAR(50),
        reseller VARCHAR(255),
        industry VARCHAR(255),
        workload VARCHAR(255),
        offering VARCHAR(255),
        bd VARCHAR(255),
        pbd VARCHAR(255),
        psa VARCHAR(255),
        partnersales VARCHAR(255),
        nextstep TEXT,
        prob INTEGER DEFAULT 0,
        stage VARCHAR(100),
        jan NUMERIC(12,2) DEFAULT 0,
        feb NUMERIC(12,2) DEFAULT 0,
        mar NUMERIC(12,2) DEFAULT 0,
        apr NUMERIC(12,2) DEFAULT 0,
        may NUMERIC(12,2) DEFAULT 0,
        jun NUMERIC(12,2) DEFAULT 0,
        jul NUMERIC(12,2) DEFAULT 0,
        aug NUMERIC(12,2) DEFAULT 0,
        sep NUMERIC(12,2) DEFAULT 0,
        oct NUMERIC(12,2) DEFAULT 0,
        nov NUMERIC(12,2) DEFAULT 0,
        "dec" NUMERIC(12,2) DEFAULT 0,
        created TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Seed default admin if users table is empty
    const { rows: userRows } = await client.query('SELECT COUNT(*) AS cnt FROM users');
    if (parseInt(userRows[0].cnt) === 0) {
      await client.query(
        `INSERT INTO users (username, name, role, password, status)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', 'Administrator', 'admin', 'huawei@123', 'active']
      );
    }

    // Seed demo records if records table is empty
    const { rows: recRows } = await client.query('SELECT COUNT(*) AS cnt FROM records');
    if (parseInt(recRows[0].cnt) === 0) {
      await client.query(
        `INSERT INTO records (partner, customers, hwchid, billing, reseller, industry, workload, offering,
          bd, pbd, psa, partnersales, nextstep, prob, stage,
          jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, "dec")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,
        ['TechCorp','Acme Ltd','HWC001','2025-01-15','ResellerA','Finance','Cloud Compute','ECS',
         'Alice Wong','Bob Chen','Charlie Lee','Dana Park','Follow up Q2',75,'Proposal',
         50000,60000,70000,80000,85000,90000,95000,100000,110000,120000,130000,140000]
      );
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

    await client.query('COMMIT');
    console.log('✅ PostgreSQL database initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── User operations ──

async function getUser(identifier, byId = false) {
  const { rows } = byId
    ? await pool.query('SELECT * FROM users WHERE id = $1', [identifier])
    : await pool.query('SELECT * FROM users WHERE username = $1', [identifier]);
  return rows[0] || null;
}

async function getAllUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
  return rows;
}

async function saveUser(user) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, name, role, password, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user.username, user.name, user.role, user.password, user.status || 'active']
  );
  return rows[0];
}

async function updateUser(user) {
  const { rows } = await pool.query(
    `UPDATE users SET username=$1, name=$2, role=$3, password=$4, status=$5
     WHERE id=$6 RETURNING *`,
    [user.username, user.name, user.role, user.password, user.status, user.id]
  );
  return rows[0];
}

async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

// ── Pending user operations ──

async function getPendingUser(username) {
  const { rows } = await pool.query('SELECT * FROM pending_users WHERE username = $1', [username]);
  return rows[0] || null;
}

async function getPendingUserById(id) {
  const { rows } = await pool.query('SELECT * FROM pending_users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getAllPendingUsers() {
  const { rows } = await pool.query('SELECT * FROM pending_users ORDER BY id');
  return rows;
}

async function savePendingUser(user) {
  const { rows } = await pool.query(
    `INSERT INTO pending_users (username, name, role, password)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user.username, user.name, user.role, user.password]
  );
  return rows[0];
}

async function deletePendingUser(id) {
  await pool.query('DELETE FROM pending_users WHERE id = $1', [id]);
}

// ── Record operations ──

async function getRecord(id) {
  const { rows } = await pool.query('SELECT * FROM records WHERE id = $1', [id]);
  const row = rows[0] || null;
  if (row) normalizeRecordNumbers(row);
  return row;
}

async function getRecords() {
  const { rows } = await pool.query('SELECT * FROM records ORDER BY id');
  rows.forEach(normalizeRecordNumbers);
  return rows;
}

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
  normalizeRecordNumbers(row);
  return row;
}

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
  if (row) normalizeRecordNumbers(row);
  return row;
}

async function deleteRecord(id) {
  await pool.query('DELETE FROM records WHERE id = $1', [id]);
}

// PostgreSQL NUMERIC columns come back as strings; cast them to JS numbers
function normalizeRecordNumbers(row) {
  const numCols = ['prob','jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  for (const col of numCols) {
    if (row[col] !== null && row[col] !== undefined) {
      row[col] = Number(row[col]);
    }
  }
}

async function close() {
  await pool.end();
}

module.exports = {
  init,
  getUser,
  getAllUsers,
  saveUser,
  updateUser,
  deleteUser,
  getPendingUser,
  getPendingUserById,
  getAllPendingUsers,
  savePendingUser,
  deletePendingUser,
  getRecord,
  getRecords,
  saveRecord,
  updateRecord,
  deleteRecord,
  close,
};
