# GramMate: Local Setup & Running Instructions

This guide will help you set up and run GramMate on your local machine with both backend and frontend.

## 📋 Prerequisites

Before you begin, ensure you have installed:
- **Python 3.9+** ([https://www.python.org/downloads/](https://www.python.org/downloads/))
- **Node.js 16+** ([https://nodejs.org/](https://nodejs.org/))
- **Git** ([https://git-scm.com/](https://git-scm.com/))

Verify installations:
```bash
python --version
node --version
npm --version
```

## 🚀 Quick Start (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/GramMate.git
cd GramMate
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env

# Run the backend server
python main.py
```

The backend will start at **http://localhost:8000**

### 3. Frontend Setup (in a new terminal)
```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the development server
npm start
```

The frontend will open at **http://localhost:3000**

## ✅ Verify Installation

### Backend Health Check
Open your browser and visit: **http://localhost:8000/docs**

You should see:
- **Swagger UI** with all API endpoints
- A list of all authentication and video endpoints
- Interactive API testing interface

### Frontend Health Check
The frontend should automatically open at **http://localhost:3000**. You should see:
- GramMate login page
- "Sign Up" and "Log In" buttons

---

## 🔧 Detailed Setup Instructions

### Backend Configuration

#### 1. Environment Variables (.env)

The `.env.example` file contains all configuration options. For local development, the defaults are usually fine:

```bash
cp backend/.env.example backend/.env
```

Key variables for local testing:
```
DATABASE_URL=sqlite:///./grammate.db      # SQLite for local development
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
DEBUG=True
FRONTEND_URL=http://localhost:3000
```

#### 2. Database Initialization

The database tables are created automatically when you start the server. The first time the app runs, it will:
- Create `grammate.db` SQLite database
- Create all tables (Users, Videos, Wallets, etc.)
- Initialize the schema

#### 3. Install Database Tools (Optional)

To inspect the SQLite database:
```bash
# View database contents
sqlite3 backend/grammate.db

# Inside sqlite3 prompt:
.tables                    # List all tables
SELECT * FROM users;      # View users
.exit                      # Exit sqlite3
```

#### 4. Running the Backend

```bash
cd backend

# Activate virtual environment (if not already active)
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

# Start the server
python main.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**API Documentation:** http://localhost:8000/docs

### Frontend Configuration

The frontend is already configured to communicate with the backend at `http://localhost:8000`. If you need to change this:

Edit [frontend/src/App.jsx](frontend/src/App.jsx) and update the API_BASE_URL:
```javascript
const API_BASE_URL = 'http://localhost:8000';  // Local development
// const API_BASE_URL = 'https://api.grammate.com';  // Production
```

#### Running the Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm start
```

Expected output:
```
webpack compiled successfully
Compiled successfully!
You can now view grammate in the browser.
  Local:            http://localhost:3000
```

The app will automatically open in your default browser.

---

## 🧪 Testing the Authentication System

### 1. Create a New Account

1. Open http://localhost:3000
2. Click "Sign Up"
3. Fill in:
   - **Email:** test@example.com
   - **Username:** testuser
   - **Password:** SecurePass123!
4. Click "Create Account"

### 2. Log In

1. Enter your email and password
2. Click "Log In"
3. You should see your dashboard/feed

### 3. Test Protected Endpoints

Using the Swagger UI (http://localhost:8000/docs):

1. Click the **"Authorize"** button (top right)
2. Copy the JWT token from the login response
3. Paste it in the format: `Bearer <your-token>`
4. Click "Authorize"
5. Try accessing protected endpoints like:
   - `GET /user/profile`
   - `POST /video/upload`
   - `GET /wallet`

### 4. Test with cURL

```bash
# Signup
curl -X POST "http://localhost:8000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!"
  }'

# Login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=SecurePass123!"

# Get Profile (requires token - replace YOUR_TOKEN)
curl -X GET "http://localhost:8000/user/profile" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔐 Authentication Features

The system includes these security features:

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (!@#$%^&*)

**Example valid password:** `SecurePass123!`

### Rate Limiting
- **Login/Signup:** 5 attempts per minute per IP
- **General API:** 100 requests per minute per IP
- Status: **429 Too Many Requests** if limit exceeded

### Email Verification
After signup, users must verify their email:
- Verification link expires in 7 days
- Check your console output (in dev mode, links are printed to console)

### Password Reset
1. Click "Forgot Password" on login page
2. Enter your email
3. Check console output for reset link
4. Use link to create new password

---

## 📱 Frontend Features to Test

### 1. Authentication Pages
- [ ] Sign Up page works
- [ ] Login page shows JWT token
- [ ] Protected pages redirect to login when unauthorized
- [ ] Logout clears token

### 2. User Dashboard
- [ ] View user profile
- [ ] Edit profile information
- [ ] View wallet balance

### 3. Video Upload
- [ ] Upload video functionality (if implemented)
- [ ] Video appears in feed
- [ ] Delete video works

### 4. Feed
- [ ] View other users' videos
- [ ] Like/unlike videos
- [ ] Leave comments (if implemented)

---

## 🐛 Troubleshooting

### "Port 8000 already in use"
```bash
# Kill the process using port 8000
# Linux/macOS:
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### "Port 3000 already in use"
```bash
# Kill the process using port 3000
# Linux/macOS:
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "ModuleNotFoundError: No module named 'fastapi'"
```bash
# Ensure virtual environment is activated and reinstall dependencies
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### "CORS error: blocked by browser"
This means the frontend and backend aren't communicating. Check:
1. Backend is running on http://localhost:8000
2. Frontend API_BASE_URL is set correctly in `src/App.jsx`
3. Check browser console for exact error message

### "Email verification not working"
In development mode:
- Emails are logged to the console where the backend is running
- Look for lines like: `[DEV MODE] Verification email sent to: test@example.com`
- Copy the verification token from the console and use it

### "Can't login after signup"
```bash
# Check database has the user
cd backend
source venv/bin/activate  # Activate venv first
sqlite3 grammate.db "SELECT email, username FROM users;"
```

---

## 🔄 Useful Commands

### Backend Commands
```bash
cd backend
source venv/bin/activate

# Run server
python main.py

# Run tests
pytest

# Check code style
black . --check

# Install new package
pip install package_name
pip freeze > requirements.txt
```

### Frontend Commands
```bash
cd frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Check for linting errors
npm run lint
```

### Database Commands
```bash
cd backend

# View database
sqlite3 grammate.db

# Backup database
cp grammate.db grammate.db.backup

# Reset database (delete all data)
rm grammate.db
# Restart the backend and it will recreate the database
```

---

## 📊 Project Structure

```
GramMate/
├── backend/
│   ├── main.py                 # Main FastAPI application
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example            # Environment template
│   ├── grammate.db             # SQLite database (created on first run)
│   ├── pytest.ini              # Test configuration
│   └── tests/
│       ├── test_auth.py        # Basic auth tests
│       └── test_security.py    # Security feature tests
├── frontend/
│   ├── package.json            # NPM dependencies
│   ├── src/
│   │   ├── App.jsx            # Main app component
│   │   ├── index.js           # Entry point
│   │   └── pages/             # Page components
│   └── public/
│       └── index.html         # HTML template
└── docs/                       # Documentation files
```

---

## 🎯 Next Steps

1. **Explore the API:** Visit http://localhost:8000/docs and try the endpoints
2. **Test Authentication:** Sign up and log in through the frontend
3. **Review Code:** Check [backend/main.py](backend/main.py) to understand the auth implementation
4. **Run Tests:** Execute `pytest` in the backend directory
5. **Customize:** Modify the frontend pages to match your design

---

## 📚 Documentation

- **API Reference:** See [API.md](../API.md)
- **Authentication Details:** See [AUTHENTICATION_SECURITY_SUMMARY.md](../AUTHENTICATION_SECURITY_SUMMARY.md)
- **Technical Specs:** See [TECHNICAL_SPECIFICATION.md](../TECHNICAL_SPECIFICATION.md)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs:** Look for error messages in your terminal
2. **Try the troubleshooting section** above
3. **Check the API docs:** Visit http://localhost:8000/docs
4. **Review test files:** See [backend/tests/](backend/tests/) for examples

---

## ✨ What's Ready to Use

✅ **Complete & Working:**
- User authentication (signup, login, logout)
- JWT token-based security
- Password hashing and validation
- Rate limiting on auth endpoints
- Email verification system
- Password reset flow
- Protected API routes
- Comprehensive test suite

🔄 **Optional Enhancements (can be enabled):**
- Two-factor authentication (2FA)
- OAuth/SSO (Google, GitHub)
- Email delivery (SMTP)
- Account recovery codes

---

## 🚀 Ready to Deploy?

When you're ready to deploy to production:

1. Switch database from SQLite to PostgreSQL
2. Update `.env` with production values
3. Set `ENVIRONMENT=production` and `DEBUG=False`
4. Configure real email service (SendGrid, Gmail with App Passwords)
5. Use HTTPS and secure cookies
6. Set up CI/CD pipeline with GitHub Actions

See [TECHNICAL_SPECIFICATION.md](../TECHNICAL_SPECIFICATION.md) for production deployment details.

---

**Happy coding! 🎉**
