const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all records
router.get('/', async (req, res, next) => {
  try {
    const records = await db.getRecords();
    res.json({ success: true, records });
  } catch (err) {
    next(err);
  }
});

// Get single record
router.get('/:id', async (req, res, next) => {
  try {
    const record = await db.getRecord(parseInt(req.params.id));
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
});

// Create record
router.post('/', async (req, res, next) => {
  try {
    const data = req.body;

    if (!data.partner || !data.customers) {
      return res.status(400).json({ success: false, error: 'Partner and Customers required' });
    }

    const record = await db.saveRecord(data);
    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
});

// Update record
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await db.getRecord(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const updated = { ...existing, ...req.body, id };
    const record = await db.updateRecord(updated);
    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
});

// Delete record
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const record = await db.getRecord(id);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    await db.deleteRecord(id);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
