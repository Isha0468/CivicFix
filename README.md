<<<<<<< HEAD
# CivicFix – Report. Track. Improve.

CivicFix is a production-ready, full-stack civic issue reporting and resolution platform. It connects Citizens, Municipal Officers, and Administrators to facilitate transparent neighborhood improvements.

---

## Folder Structure

```text
CivicFix/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Storage configs
│   │   ├── controllers/     # Route business logic controllers
│   │   ├── middleware/      # Auth security & Input validators
│   │   ├── models/          # Mongoose database collections schemas
│   │   ├── routes/          # API route bindings
│   │   ├── services/        # Mock AI logic & helper services
│   │   └── server.js        # Server entry files
│   ├── .env.example
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable map widgets, cards, dialogs
│   │   ├── context/         # Auth provider contexts
│   │   ├── pages/           # Citizens, Officers, and Admins screens
│   │   ├── services/        # Axios api client interceptors
│   │   └── App.jsx          # Route guards
│   ├── tailwind.config.js
│   ├── index.html
│   └── package.json
└── README.md
```

---

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS v3, React Router DOM, Axios, Leaflet, React Leaflet, Chart.js, Lucide React
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, Multer
- **Security**: JSON Web Tokens (JWT), BCrypt, Helmet, CORS, Express Rate Limit, Express Validator
- **Image Storage**: Cloudinary (with local disk uploads fallback)

---

## Installation & Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017/civicfix` (or an Atlas connection string)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the environment variables:
   Copy `.env.example` to `.env` (preconfigured with local fallbacks):
   ```bash
   cp .env.example .env
   ```
4. **Seed the database**:
   Run the seeder script to populate default categories, test accounts, and issues:
   ```bash
   npm run seed
   ```
5. Start the backend developer server:
   ```bash
   npm run dev
   ```
   *The server starts on: http://localhost:5000*

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The client starts on: http://localhost:5173*

---

## Demo Credentials (Pre-seeded)

Use these credentials to log in during local evaluation (shortcuts are also provided on the Login page):

- **Citizen**: `citizen@civicfix.com` / `citizen123`
- **Municipal Officer**: `officer@civicfix.com` / `officer123` (District: Downtown Sector A)
- **Administrator**: `admin@civicfix.com` / `admin123`

---

## AI Features & Image Uploads Fallback

1. **AI Image Auto-Categorizer & Severity**:
   - Analyzes complaint titles/descriptions for keywords to suggest categories and tag urgency.
2. **AI Suggested Templates**:
   - Provides title/description fill suggestions for chosen categories.
3. **Duplicate Geofence Checks**:
   - Runs MongoDB `$nearSphere` queries to check if another citizen already reported a similar complaint in a 150m radius.
4. **Storage Fallback**:
   - If Cloudinary credentials are not defined in backend `.env`, files are automatically saved to `backend/uploads` and served statically.

---

## Deployment Guide

### Backend (Render / Heroku)
1. Add environment variables on the provider dashboard:
   - `MONGODB_URI`: MongoDB Atlas string
   - `JWT_SECRET`: Random hash key
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
2. Build commands: `npm install`
3. Start commands: `npm start`

### Frontend (Vercel / Netlify)
1. Set the Environment Variable:
   - `VITE_API_URL`: Your backend API URL (e.g. `https://civicfix-api.onrender.com/api`)
2. Build command: `npm run build`
3. Output directory: `dist`
=======
# CivicFix
CivicFix is a full-stack MERN civic issue reporting and management platform that enables citizens to report local issues, municipal officers to resolve them, and administrators to manage complaints through a transparent, role-based workflow.
>>>>>>> f6869562b8e1738f3f6817cdd556d8751838c368
