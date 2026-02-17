const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all records (with visibility filtering)
router.get('/', (req, res) => {
  const records = db.getRecords();
  res.json({ success: true, records });
});

// Get single record
router.get('/:id', (req, res) => {
  const record = db.getRecord(parseInt(req.params.id));
  if (!record) {
    return res.status(404).json({ success: false, error: 'Record not found' });
  }
  res.json({ success: true, record });
});

// Create record
router.post('/', (req, res) => {
  const record = {
    id: db.getNextRecordId(),
    ...req.body,
    created: new Date().toISOString()
  };

  if (!record.partner || !record.customers) {
    return res.status(400).json({ success: false, error: 'Partner and Customers required' });
  }

  db.saveRecord(record);
  res.json({ success: true, record });
});

// Update record
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.getRecord(id);
  
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Record not found' });
  }

  const updated = { ...existing, ...req.body, id };
  db.updateRecord(updated);
  res.json({ success: true, record: updated });
});

// Delete record
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const record = db.getRecord(id);
  
  if (!record) {
    return res.status(404).json({ success: false, error: 'Record not found' });
  }

  db.deleteRecord(id);
  res.json({ success: true, message: 'Record deleted' });
});

module.exports = router;
