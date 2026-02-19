const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all users (admin only)
router.get('/', async (req, res, next) => {
  try {
    const users = await db.getAllUsers();
    const safe = users.map(u => {
      const { password, ...user } = u;
      return user;
    });
    res.json({ success: true, users: safe });
  } catch (err) {
    next(err);
  }
});

// Get pending requests
router.get('/pending', async (req, res, next) => {
  try {
    const pending = await db.getAllPendingUsers();
    res.json({ success: true, pending });
  } catch (err) {
    next(err);
  }
});

// Create user (admin only)
router.post('/', async (req, res, next) => {
  try {
    const { username, name, role, password } = req.body;

    if (!username || !name || !role || !password) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const existing = await db.getUser(username);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    const user = await db.saveUser({ username, name, role, password, status: 'active' });
    const { password: _, ...safe } = user;
    res.json({ success: true, user: safe });
  } catch (err) {
    next(err);
  }
});

// Update user status
router.put('/:id', async (req, res, next) => {
  try {
    const user = await db.getUser(parseInt(req.params.id), true);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.status = req.body.status || user.status;
    const updated = await db.updateUser(user);
    const { password, ...safe } = updated;
    res.json({ success: true, user: safe });
  } catch (err) {
    next(err);
  }
});

// Approve pending request
router.post('/pending/:id/approve', async (req, res, next) => {
  try {
    const pending = await db.getPendingUserById(parseInt(req.params.id));
    if (!pending) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const user = await db.saveUser({
      username: pending.username,
      name: pending.name,
      role: pending.role,
      password: pending.password,
      status: 'active',
    });

    await db.deletePendingUser(pending.id);
    const { password: _, ...safe } = user;
    res.json({ success: true, user: safe });
  } catch (err) {
    next(err);
  }
});

// Reject pending request
router.post('/pending/:id/reject', async (req, res, next) => {
  try {
    await db.deletePendingUser(parseInt(req.params.id));
    res.json({ success: true, message: 'Request rejected' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
