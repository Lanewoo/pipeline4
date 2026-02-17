// Simple in-memory database with localStorage fallback
// In production, use PostgreSQL, MySQL, or MongoDB

let store = {
  users: [],
  records: [],
  pending: [],
  idSeq: { users: 100, records: 100 }
};

// Default admin user
const DEFAULT_USER = {
  id: 1,
  username: 'admin',
  name: 'Administrator',
  role: 'admin',
  password: 'huawei@123',
  status: 'active',
  created: new Date().toISOString()
};

const DEMO_RECORDS = [
  {
    id: 1, partner: 'TechCorp', customers: 'Acme Ltd', hwchid: 'HWC001', billing: '2025-01-15',
    reseller: 'ResellerA', industry: 'Finance', workload: 'Cloud Compute', offering: 'ECS',
    bd: 'Alice Wong', pbd: 'Bob Chen', psa: 'Charlie Lee', partnersales: 'Dana Park',
    nextstep: 'Follow up Q2', prob: 75, stage: 'Proposal',
    jan: 50000, feb: 60000, mar: 70000, apr: 80000, may: 85000, jun: 90000, jul: 95000,
    aug: 100000, sep: 110000, oct: 120000, nov: 130000, dec: 140000
  },
  {
    id: 2, partner: 'GlobalNet', customers: 'BetaCo', hwchid: 'HID002', billing: '2025-02-01',
    reseller: 'ResellerB', industry: 'Retail', workload: 'Storage', offering: 'OBS',
    bd: 'Eve Tan', pbd: 'Frank Li', psa: 'Grace Kim', partnersales: 'Henry Wu',
    nextstep: 'Demo scheduled', prob: 50, stage: 'Qualification',
    jan: 20000, feb: 22000, mar: 25000, apr: 28000, may: 30000, jun: 32000, jul: 35000,
    aug: 38000, sep: 40000, oct: 45000, nov: 50000, dec: 55000
  }
];

function init() {
  if (store.users.length === 0) {
    store.users.push(DEFAULT_USER);
  }
  if (store.records.length === 0) {
    store.records = DEMO_RECORDS.map(r => ({ ...r, created: new Date().toISOString() }));
  }
}

// User operations
function getUser(username, byId = false) {
  if (byId) {
    return store.users.find(u => u.id === username);
  }
  return store.users.find(u => u.username === username);
}

function getAllUsers() {
  return store.users;
}

function saveUser(user) {
  const idx = store.users.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    store.users[idx] = user;
  } else {
    store.users.push(user);
  }
}

function updateUser(user) {
  saveUser(user);
}

function deleteUser(id) {
  store.users = store.users.filter(u => u.id !== id);
}

// Pending users
function getPendingUser(username) {
  return store.pending.find(p => p.username === username);
}

function getPendingUserById(id) {
  return store.pending.find(p => p.id === id);
}

function getAllPendingUsers() {
  return store.pending;
}

function savePendingUser(user) {
  store.pending.push(user);
}

function deletePendingUser(id) {
  store.pending = store.pending.filter(p => p.id !== id);
}

// Record operations
function getRecord(id) {
  return store.records.find(r => r.id === id);
}

function getRecords() {
  return store.records;
}

function saveRecord(record) {
  store.records.push(record);
}

function updateRecord(record) {
  const idx = store.records.findIndex(r => r.id === record.id);
  if (idx >= 0) {
    store.records[idx] = record;
  }
}

function deleteRecord(id) {
  store.records = store.records.filter(r => r.id !== id);
}

// ID generation
function getNextUserId() {
  return ++store.idSeq.users;
}

function getNextRecordId() {
  return ++store.idSeq.records;
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
  getNextUserId,
  getNextRecordId
};
