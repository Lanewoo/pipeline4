const express = require('express');         // 引入 Express 框架
const router = express.Router();           // 创建路由实例
const db = require('../db');               // 引入数据库操作模块

// 登录接口
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body; // 从请求体中解构出用户名和密码

    if (!username || !password) {           // 校验用户名和密码是否为空
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const user = await db.getUser(username); // 根据用户名从数据库查询用户
    if (!user || user.password !== password || user.status !== 'active') { // 验证密码和账户状态
      return res.status(401).json({ success: false, error: 'Invalid credentials or account inactive' });
    }

    const { password: _, ...userWithoutPassword } = user; // 从用户对象中排除密码字段
    res.json({ success: true, user: userWithoutPassword }); // 返回不含密码的用户信息
  } catch (err) {
    next(err);                             // 将错误传递给全局错误处理中间件
  }
});

// 注册（申请访问权限）接口
router.post('/register', async (req, res, next) => {
  try {
    const { name, username, role, password } = req.body; // 从请求体解构注册信息

    if (!name || !username || !password) {  // 校验必填字段
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const existingUser = await db.getUser(username);       // 检查用户名是否已存在
    const existingPending = await db.getPendingUser(username); // 检查是否已有待审批的同名申请
    if (existingUser || existingPending) {  // 如果已存在或已在审批中，返回错误
      return res.status(400).json({ success: false, error: 'Username already exists or pending' });
    }

    await db.savePendingUser({ username, name, role: role || 'BD', password }); // 保存到待审批用户表
    res.json({ success: true, message: 'Request submitted for approval' }); // 返回成功提示
  } catch (err) {
    next(err);                             // 将错误传递给全局错误处理中间件
  }
});

// 登出接口
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' }); // 返回登出成功（前端会清除本地会话）
});

module.exports = router;                   // 导出路由模块
