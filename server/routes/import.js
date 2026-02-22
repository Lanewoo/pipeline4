const express = require('express');         // 引入 Express 框架
const router = express.Router();           // 创建路由实例
const XLSX = require('xlsx');              // 引入 XLSX 库（用于 Excel 文件读写）
const db = require('../db');               // 引入数据库操作模块

// Excel 列名 → 数据库字段名的映射关系
const COL_MAP = {
  'Partner':'partner',                     // 合作伙伴
  'Customers':'customers',                 // 客户
  'Hwc/Hid':'hwchid',                     // 华为云账号/HID
  'Billing Start Date':'billing',          // 计费开始日期
  'Reseller':'reseller',                   // 经销商
  'Industry':'industry',                   // 行业
  'Workload':'workload',                   // 工作负载
  'Offering':'offering',                   // 产品/服务
  'BD':'bd',                               // BD 负责人
  'PBD':'pbd',                             // PBD 负责人
  'PSA':'psa',                             // PSA（售前架构师）
  'Partner Sales':'partnersales',          // 合作伙伴销售
  'Next Step':'nextstep',                  // 下一步计划
  'Probility':'prob',                      // 成交概率
  'Sales Stage':'stage',                   // 销售阶段
  'Jan':'jan','Feb':'feb','Mar':'mar',     // 一月、二月、三月
  'Apr':'apr','May':'may','Jun':'jun',     // 四月、五月、六月
  'Jul':'jul','Aug':'aug','Sep':'sep',     // 七月、八月、九月
  'Oct':'oct','Nov':'nov','Dec':'dec'      // 十月、十一月、十二月
};

// 导入接口（POST /api/import）—— 此处提示使用前端导入功能
router.post('/', async (req, res, next) => {
  try {
    res.json({ success: false, error: 'Use the frontend import feature' }); // 提示用户通过前端界面导入
  } catch (err) {
    next(err);                             // 将错误传递给全局错误处理中间件
  }
});

module.exports = router;                   // 导出路由模块
