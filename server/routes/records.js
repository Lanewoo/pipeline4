const express = require('express');         // 引入 Express 框架
const router = express.Router();           // 创建路由实例
const db = require('../db');               // 引入数据库操作模块

// 获取所有记录（GET /api/records）
router.get('/', async (req, res, next) => {
  try {
    const records = await db.getRecords(); // 从数据库查询所有管道记录
    res.json({ success: true, records });  // 返回记录列表
  } catch (err) {
    next(err);                             // 将错误传递给全局错误处理中间件
  }
});

// 获取单条记录（GET /api/records/:id）
router.get('/:id', async (req, res, next) => {
  try {
    const record = await db.getRecord(parseInt(req.params.id)); // 根据 ID 查询记录
    if (!record) {                         // 如果记录不存在
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, record });   // 返回查到的记录
  } catch (err) {
    next(err);
  }
});

// 创建新记录（POST /api/records）
router.post('/', async (req, res, next) => {
  try {
    const data = req.body;                 // 获取请求体数据

    if (!data.partner || !data.customers) { // 校验必填字段：合作伙伴和客户
      return res.status(400).json({ success: false, error: 'Partner and Customers required' });
    }

    const record = await db.saveRecord(data); // 将数据保存到数据库
    res.json({ success: true, record });   // 返回新建的记录
  } catch (err) {
    next(err);
  }
});

// 更新记录（PUT /api/records/:id）
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);    // 从 URL 参数获取记录 ID
    const existing = await db.getRecord(id); // 查询已有记录

    if (!existing) {                       // 如果记录不存在
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const updated = { ...existing, ...req.body, id }; // 合并现有数据与更新数据，保留 ID
    const record = await db.updateRecord(updated); // 执行数据库更新
    res.json({ success: true, record });   // 返回更新后的记录
  } catch (err) {
    next(err);
  }
});

// 删除记录（DELETE /api/records/:id）
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);    // 从 URL 参数获取记录 ID
    const record = await db.getRecord(id); // 查询记录是否存在

    if (!record) {                         // 如果记录不存在
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    await db.deleteRecord(id);             // 执行删除操作
    res.json({ success: true, message: 'Record deleted' }); // 返回删除成功提示
  } catch (err) {
    next(err);
  }
});

module.exports = router;                   // 导出路由模块
