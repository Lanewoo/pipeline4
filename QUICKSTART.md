# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Local Development (Fastest)

```bash
cd pipeline-manager-deployed
npm install
npm start
```

Open `http://localhost:5000`

**Login with:**
- Username: `admin`
- Password: `huawei@123`

### Option 2: Docker (Recommended for Deployment)

```bash
cd pipeline-manager-deployed
docker-compose up -d
```

Access at `http://localhost:5000`

### Option 3: Cloud Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for:
- ☁️ Heroku
- ☁️ AWS Elastic Beanstalk  
- ☁️ Google Cloud Run
- ☁️ Azure App Service
- 🐳 Docker configuration

---

## 📁 Project Structure

```
pipeline-manager-deployed/
├── package.json              # Node.js dependencies
├── .env.example             # Environment template
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose setup
├── README.md                # Full documentation
│
├── server/
│   ├── index.js             # Main server file
│   ├── db.js                # In-memory database
│   └── routes/
│       ├── auth.js          # Authentication
│       ├── records.js       # Pipeline records
│       ├── users.js         # User management
│       └── import.js        # Import/export
│
├── public/
│   ├── index.html           # Main HTML file
│   ├── css/
│   │   └── styles.css       # All styles
│   └── js/
│       ├── app.js           # Core application
│       ├── dashboard.js     # Dashboard logic
│       ├── records.js       # Records management
│       ├── users.js         # User management
│       └── import-export.js # Import/export logic
│
└── docs/
    └── DEPLOYMENT.md        # Deployment guide
```

---

## ✨ Features

✅ **Authentication** - Secure login with role-based access  
✅ **Dashboard** - Real-time pipeline analytics  
✅ **Pipeline Board** - Kanban-style workflow  
✅ **Records Management** - Full CRUD operations  
✅ **User Management** - Admin controls & access requests  
✅ **Data Import/Export** - Excel file support (XLSX)  
✅ **Mobile Responsive** - Works on all devices  
✅ **Dark Mode** - Beautiful Huawei-branded UI  

---

## 🔐 Default User

| Field | Value |
|-------|-------|
| Username | admin |
| Password | huawei@123 |
| Role | Admin |

⚠️ **Change immediately** before going to production!

---

## 🔧 Configuration

Edit `.env` file:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=sqlite://./data/pipeline.db
JWT_SECRET=change-me-in-production
CORS_ORIGIN=http://localhost:5000
LOG_LEVEL=debug
```

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Update `JWT_SECRET` in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure database (PostgreSQL recommended)
- [ ] Enable HTTPS/TLS
- [ ] Setup automated backups
- [ ] Configure logging service
- [ ] Run security audit
- [ ] Test on staging environment
- [ ] Document deployment process

---

## 📞 Support & Issues

For help or to report issues:

1. Check [DEPLOYMENT.md](docs/DEPLOYMENT.md)
2. Review [README.md](README.md)
3. Create an issue in the repository
4. Contact the development team

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎯 Next Steps

1. **Local testing**: Follow Option 1 above
2. **Customize**: Update branding, colors, fields
3. **Deploy**: Follow Option 2 or 3
4. **Monitor**: Setup logging and alerts
5. **Maintain**: Regular updates and backups

**Happy pipeline managing! 🎉**
