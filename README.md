# Huawei Pipeline Manager

A comprehensive sales pipeline management system designed for Huawei partners and business development teams.

## Features

- Dashboard with pipeline performance overview
- Kanban-style pipeline board
- Record management and CRUD operations
- User management with role-based access control
- Data import/export with Excel
- Monthly revenue forecasting
- Real-time analytics and charts

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite (development) / PostgreSQL (production)
- **Data**: XLSX for import/export

## Installation

### Prerequisites
- Node.js 14+ and npm
- Git

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd pipeline-manager-deployed
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Start the server
```bash
npm start
```

The application will be available at `http://localhost:5000`

## Development

For development with auto-reload:
```bash
npm run dev
```

## Deployment

### Docker
```bash
docker build -t pipeline-manager .
docker run -p 5000:5000 pipeline-manager
```

### Heroku
```bash
heroku create <app-name>
git push heroku main
```

### AWS/Azure/GCP
Use the provided Docker configuration or deploy Node.js directly.

## Default Credentials

```
Username: admin
Password: huawei@123
```

⚠️ **IMPORTANT**: Change the default password immediately in production!

## User Roles

- **Admin**: Full access, user management
- **BD**: Business Development, can manage own records
- **PBD**: Partner Business Development, can manage own records

## API Endpoints

```
# Authentication
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/register

# Records
GET    /api/records
POST   /api/records
GET    /api/records/:id
PUT    /api/records/:id
DELETE /api/records/:id

# Users (Admin only)
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

# Import/Export
POST   /api/import
GET    /api/export
```

## Database Schema

See `docs/schema.sql` for complete database structure.

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

MIT

## Support

For issues or questions, contact the development team.
