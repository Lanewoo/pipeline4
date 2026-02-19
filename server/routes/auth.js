const express = require('express');
const router = express.Router();
const db = require('../db');

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const user = await db.getUser(username);
    if (!user || user.password !== password || user.status !== 'active') {
      return res.status(401).json({ success: false, error: 'Invalid credentials or account inactive' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
});

// Register (Request Access)
router.post('/register', async (req, res, next) => {
  try {
    const { name, username, role, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const existingUser = await db.getUser(username);
    const existingPending = await db.getPendingUser(username);
    if (existingUser || existingPending) {
      return res.status(400).json({ success: false, error: 'Username already exists or pending' });
    }

    await db.savePendingUser({ username, name, role: role || 'BD', password });
    res.json({ success: true, message: 'Request submitted for approval' });
  } catch (err) {
    next(err);
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
