const express = require('express');         // 引入 Express 框架
const router = express.Router();           // 创建路由实例
const db = require('../db');               // 引入数据库操作模块

// 获取所有用户列表（仅管理员可用）（GET /api/users）
router.get('/', async (req, res, next) => {
  try {
    const users = await db.getAllUsers();   // 从数据库查询所有用户
    const safe = users.map(u => {          // 遍历用户列表
      const { password, ...user } = u;     // 移除密码字段
      return user;                         // 返回不含密码的用户对象
    });
    res.json({ success: true, users: safe }); // 返回安全的用户列表
  } catch (err) {
    next(err);                             // 将错误传递给全局错误处理中间件
  }
});

// 获取待审批用户请求列表（GET /api/users/pending）
router.get('/pending', async (req, res, next) => {
  try {
    const pending = await db.getAllPendingUsers(); // 查询所有待审批的注册申请
    res.json({ success: true, pending });  // 返回待审批列表
  } catch (err) {
    next(err);
  }
});

// 管理员创建新用户（POST /api/users）
router.post('/', async (req, res, next) => {
  try {
    const { username, name, role, password } = req.body; // 解构请求体中的用户信息

    if (!username || !name || !role || !password) { // 校验所有必填字段
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const existing = await db.getUser(username); // 检查用户名是否已存在
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    const user = await db.saveUser({ username, name, role, password, status: 'active' }); // 创建用户（状态为活跃）
    const { password: _, ...safe } = user; // 移除密码字段
    res.json({ success: true, user: safe }); // 返回新建的用户信息（不含密码）
  } catch (err) {
    next(err);
  }
});

// 更新用户状态（PUT /api/users/:id）
router.put('/:id', async (req, res, next) => {
  try {
    const user = await db.getUser(parseInt(req.params.id), true); // 根据 ID 查询用户
    if (!user) {                           // 如果用户不存在
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.status = req.body.status || user.status; // 更新状态（如未传则保持原状态）
    const updated = await db.updateUser(user); // 执行数据库更新
    const { password, ...safe } = updated; // 移除密码字段
    res.json({ success: true, user: safe }); // 返回更新后的用户信息
  } catch (err) {
    next(err);
  }
});

// 批准待审批用户（POST /api/users/pending/:id/approve）
router.post('/pending/:id/approve', async (req, res, next) => {
  try {
    const pending = await db.getPendingUserById(parseInt(req.params.id)); // 根据 ID 查询待审批用户
    if (!pending) {                        // 如果待审批记录不存在
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const user = await db.saveUser({       // 将待审批用户转为正式用户
      username: pending.username,          // 用户名
      name: pending.name,                 // 姓名
      role: pending.role,                 // 角色
      password: pending.password,         // 密码
      status: 'active',                   // 状态设为活跃
    });

    await db.deletePendingUser(pending.id); // 从待审批表中删除该记录
    const { password: _, ...safe } = user; // 移除密码字段
    res.json({ success: true, user: safe }); // 返回新建的用户信息
  } catch (err) {
    next(err);
  }
});

// 管理员重置用户密码（PUT /api/users/:id/password）
router.put('/:id/password', async (req, res, next) => {
  try {
    const user = await db.getUser(parseInt(req.params.id), true); // 根据 ID 查询用户
    if (!user) {                           // 如果用户不存在
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const { password, currentPassword } = req.body; // 获取新密码和当前密码
    if (!password) {                       // 校验新密码不能为空
      return res.status(400).json({ success: false, error: 'New password required' });
    }
    if (currentPassword && user.password !== currentPassword) { // 如果提供了当前密码，验证是否正确
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }
    user.password = password;              // 设置新密码
    await db.updateUser(user);             // 更新到数据库
    res.json({ success: true, message: 'Password updated' }); // 返回成功提示
  } catch (err) {
    next(err);
  }
});

// 管理员删除用户（DELETE /api/users/:id）
router.delete('/:id', async (req, res, next) => {
  try {
    await db.deleteUser(parseInt(req.params.id)); // 根据 ID 删除用户
    res.json({ success: true, message: 'User deleted' }); // 返回删除成功提示
  } catch (err) {
    next(err);
  }
});

// 拒绝待审批用户请求（POST /api/users/pending/:id/reject）
router.post('/pending/:id/reject', async (req, res, next) => {
  try {
    await db.deletePendingUser(parseInt(req.params.id)); // 从待审批表中删除该记录
    res.json({ success: true, message: 'Request rejected' }); // 返回拒绝成功提示
  } catch (err) {
    next(err);
  }
});

module.exports = router;                   // 导出路由模块
