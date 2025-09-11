# Fashion Stop - Render Deployment Guide

## 🚀 Render Environment Configuration

This project is configured for seamless deployment on Render with MongoDB integration.

### 📋 Deployment Requirements

- **Node.js**: 16.x or higher
- **MongoDB**: Automatically provisioned by Render
- **Environment**: Production-ready configuration

### 🔧 Environment Variables

The following environment variables are automatically configured in `render.yaml`:

```yaml
NODE_ENV=production
PORT=10000
MONGODB_URI=<automatically-provided-by-render>
ADMIN_USERNAME=sujal
ADMIN_PASSWORD=pass123
APP_NAME=Fashion Stop
APP_VERSION=1.0.0
```

### 📁 File Structure for Render

```
fashion-stop/
├── server.js           # Main server file
├── package.json        # Dependencies
├── render.yaml         # Render configuration
├── .env.example        # Environment template
└── README-RENDER.md    # This file
```

### 🗄️ Database Configuration

- **Database Name**: `fashionstop`
- **User**: `fashionstop_user`
- **Plan**: Free tier
- **Auto-initialization**: Products and admin user created on first run

### 🌐 Deployment Process

1. **Push to GitHub**: Code automatically deploys from main branch
2. **Build Process**: `npm install` runs automatically
3. **Database Setup**: MongoDB instance provisioned automatically
4. **Health Checks**: `/health` endpoint monitors service status

### 📊 API Endpoints

- `GET /` - Frontend application
- `GET /health` - Health check
- `GET /api/products` - Product catalog
- `POST /api/admin/login` - Admin authentication
- `POST /api/orders` - Order placement
- `GET /api/admin/stats` - Dashboard statistics

### 🔐 Admin Access

- **Username**: `sujal`
- **Password**: `pass123`
- **Login URL**: `https://your-app.onrender.com/admin`

### 🛠️ Local Development

For local development, ensure MongoDB is running:

```bash
# Start MongoDB
mongod --dbpath "C:\data\db" --port 27017

# Start server
npm start
```

### 📈 Monitoring

- **Health Check**: Automatic monitoring via `/health`
- **Logs**: Available in Render dashboard
- **Database**: MongoDB metrics in Render console

### 🔄 Auto-Deploy

Configured for automatic deployment on every push to the main branch.

---

**Live URL**: https://fashionstop.onrender.com
**Status**: Production Ready ✅
