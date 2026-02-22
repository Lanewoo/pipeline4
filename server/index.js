const express = require('express');       // 引入 Express Web 框架
const bodyParser = require('body-parser'); // 引入请求体解析中间件
const cors = require('cors');             // 引入跨域资源共享（CORS）中间件
const path = require('path');             // 引入 Node.js 路径处理模块
require('dotenv').config();               // 加载 .env 文件中的环境变量

const db = require('./db');               // 引入数据库操作模块

const app = express();                    // 创建 Express 应用实例
const PORT = process.env.PORT || 5000;    // 设置服务器端口，优先使用环境变量，默认 5000

// 中间件配置
app.use(bodyParser.json());               // 解析 JSON 格式的请求体
app.use(bodyParser.urlencoded({ extended: true })); // 解析 URL 编码格式的请求体
app.use(cors({                            // 配置跨域策略
  origin: process.env.CORS_ORIGIN || '*', // 允许的跨域来源，默认允许所有
  credentials: true                       // 允许携带 Cookie 等凭证信息
}));

// 托管静态文件（public 目录下的 HTML/CSS/JS 等）
app.use(express.static(path.join(__dirname, '../public')));

// API 路由注册
app.use('/api/auth', require('./routes/auth'));       // 认证相关接口（登录/注册/登出）
app.use('/api/records', require('./routes/records')); // 记录（管道数据）相关接口
app.use('/api/users', require('./routes/users'));     // 用户管理相关接口
app.use('/api/import', require('./routes/import'));   // 数据导入相关接口

// 访问根路径时返回主页 HTML 文件
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 所有未匹配的路由都返回主页（支持前端客户端路由）
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);               // 在控制台打印错误堆栈
  res.status(err.status || 500).json({    // 返回错误响应
    success: false,                        // 标记请求失败
    error: process.env.NODE_ENV === 'production'  // 生产环境隐藏详细错误信息
      ? 'Internal Server Error'
      : err.message
  });
});

// 先初始化数据库，然后启动服务器（立即执行的异步函数）
(async () => {
  try {
    await db.init();                       // 初始化数据库（创建表、插入默认数据）
    app.listen(PORT, () => {               // 开始监听指定端口
      console.log(`🚀 Pipeline Manager is running on http://localhost:${PORT}`);  // 输出服务启动成功信息
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);    // 输出当前运行环境
      console.log(`🗄️  Database: Huawei Cloud RDS (PostgreSQL)`);                 // 输出数据库类型
    });
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message); // 数据库初始化失败时输出错误
    process.exit(1);                       // 以错误码 1 退出进程
  }
})();

// 优雅关闭：接收到 SIGTERM 信号时安全关闭数据库连接后退出
process.on('SIGTERM', async () => {
  console.log('Shutting down...');         // 输出正在关闭的提示
  await db.close();                        // 关闭数据库连接池
  process.exit(0);                         // 以正常状态码 0 退出进程
});

module.exports = app;                      // 导出 app 实例（用于测试等场景）
