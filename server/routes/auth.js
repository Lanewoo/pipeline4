const express = require('express');
const router = express.Router();
const db = require('../db');

// Default credentials
const DEFAULT_USER = { id: 1, username: 'admin', name: 'Administrator', role: 'admin', password: 'huawei@123', status: 'active' };

// Initialize database
db.init();

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  const user = db.getUser(username);
  if (!user || user.password !== password || user.status !== 'active') {
    return res.status(401).json({ success: false, error: 'Invalid credentials or account inactive' });
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, user: userWithoutPassword });
});

// Register (Request Access)
router.post('/register', (req, res) => {
  const { name, username, role, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ success: false, error: 'All fields required' });
  }

  if (db.getUser(username) || db.getPendingUser(username)) {
    return res.status(400).json({ success: false, error: 'Username already exists or pending' });
  }

  const pending = {
    id: db.getNextUserId(),
    username,
    name,
    role,
    password,
    requested: new Date().toISOString()
  };

  db.savePendingUser(pending);
  res.json({ success: true, message: 'Request submitted for approval' });
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
