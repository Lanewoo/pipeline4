const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all users (admin only)
router.get('/', (req, res) => {
  const users = db.getAllUsers();
  const safe = users.map(u => {
    const { password, ...user } = u;
    return user;
  });
  res.json({ success: true, users: safe });
});

// Get pending requests
router.get('/pending', (req, res) => {
  const pending = db.getAllPendingUsers();
  res.json({ success: true, pending });
});

// Create user (admin only)
router.post('/', (req, res) => {
  const { username, name, role, password } = req.body;

  if (!username || !name || !role || !password) {
    return res.status(400).json({ success: false, error: 'All fields required' });
  }

  if (db.getUser(username)) {
    return res.status(400).json({ success: false, error: 'Username already exists' });
  }

  const user = {
    id: db.getNextUserId(),
    username,
    name,
    role,
    password,
    status: 'active',
    created: new Date().toISOString()
  };

  db.saveUser(user);
  const { password: _, ...safe } = user;
  res.json({ success: true, user: safe });
});

// Update user status
router.put('/:id', (req, res) => {
  const user = db.getUser(parseInt(req.params.id), true);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  user.status = req.body.status || user.status;
  db.updateUser(user);
  const { password, ...safe } = user;
  res.json({ success: true, user: safe });
});

// Approve pending request
router.post('/pending/:id/approve', (req, res) => {
  const pending = db.getPendingUserById(parseInt(req.params.id));
  if (!pending) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }

  const user = {
    id: pending.id,
    username: pending.username,
    name: pending.name,
    role: pending.role,
    password: pending.password,
    status: 'active',
    created: new Date().toISOString()
  };

  db.saveUser(user);
  db.deletePendingUser(pending.id);
  const { password: _, ...safe } = user;
  res.json({ success: true, user: safe });
});

// Reject pending request
router.post('/pending/:id/reject', (req, res) => {
  db.deletePendingUser(parseInt(req.params.id));
  res.json({ success: true, message: 'Request rejected' });
});

module.exports = router;
