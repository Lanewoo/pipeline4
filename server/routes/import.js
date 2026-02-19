const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const db = require('../db');

const COL_MAP = {
  'Partner':'partner','Customers':'customers','Hwc/Hid':'hwchid','Billing Start Date':'billing',
  'Reseller':'reseller','Industry':'industry','Workload':'workload','Offering':'offering',
  'BD':'bd','PBD':'pbd','PSA':'psa','Partner Sales':'partnersales','Next Step':'nextstep',
  'Probility':'prob','Sales Stage':'stage','Jan':'jan','Feb':'feb','Mar':'mar','Apr':'apr',
  'May':'may','Jun':'jun','Jul':'jul','Aug':'aug','Sep':'sep','Oct':'oct','Nov':'nov','Dec':'dec'
};

router.post('/', async (req, res, next) => {
  try {
    res.json({ success: false, error: 'Use the frontend import feature' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
