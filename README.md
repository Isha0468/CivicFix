<div align="center">

# 🏙️ CivicFix

### **Report. Track. Improve.**

A production-ready **MERN Stack Civic Issue Reporting Platform** that enables citizens to report civic issues, municipal officers to manage and resolve complaints, and administrators to monitor city-wide operations through a centralized dashboard.

<p align="center">
  <a href="https://civicfix-frontend-8uf6.onrender.com"><img src="https://img.shields.io/badge/🚀 Live Demo-2ea44f?style=for-the-badge" /></a>
  <a href="https://github.com/Isha0468/CivicFix"><img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" /></a>
</p>

<p align="center">

<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white"/>
<img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
<img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black"/>

</p>

</div>

---

# 📖 Overview

**CivicFix** is a modern full-stack civic issue management platform developed using the **MERN Stack**.

The platform enables citizens to report civic issues such as potholes, garbage collection problems, water leakage, damaged streetlights, and other municipal concerns. Municipal officers can manage and resolve complaints, while administrators oversee platform operations through a centralized dashboard.

---

# 🚀 Live Demo

### 🌐 Frontend

https://civicfix-frontend-8uf6.onrender.com

### ⚙️ Backend API

https://civicfix-4ty0.onrender.com

---

# ✨ Features

## 👤 Citizen

- 📝 Secure Registration & Login
- 📍 Report Civic Issues
- 🖼 Upload Complaint Images
- 🗺 Select Issue Location using Interactive Maps
- 📊 Track Complaint Status
- 📜 View Complaint History
- ✏ Edit Submitted Complaints

---

## 👮 Municipal Officer

- 🔐 Secure Login
- 📋 View Assigned Complaints
- 🔄 Update Complaint Status
- 💬 Add Resolution Remarks
- 📍 Manage Complaints within Assigned Area
- 📈 Dashboard Overview

---

## 👨‍💼 Administrator

- 👥 User Management
- 📊 Dashboard Analytics
- 🏙 Monitor Complaints
- 📈 System Statistics
- ⚙ Platform Administration

---

# 🏗️ System Architecture

```text
Citizen / Officer / Admin
            │
            ▼
     React + Vite Frontend
            │
            ▼
      Axios HTTP Requests
            │
            ▼
     Express REST API Server
            │
            ▼
JWT Authentication Middleware
            │
            ▼
 MongoDB Atlas Database
```

---

# 🛠 Tech Stack

| Category | Technologies |
|-----------|--------------|
| 🎨 Frontend | React, Vite, Tailwind CSS, React Router DOM, Axios |
| ⚙️ Backend | Node.js, Express.js |
| 🗄️ Database | MongoDB Atlas, Mongoose |
| 🔐 Authentication | JWT, BCrypt |
| 🗺 Maps | Leaflet, React Leaflet |
| 📊 Charts | Chart.js |
| 🚀 Deployment | Render |

---

# 📂 Project Structure

```text
CivicFix
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   └── server.js
│   ├── .env
│   └── package.json
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   ├── services
│   │   └── App.jsx
│   ├── .env
│   └── package.json
│
└── README.md
```

---

# 🔑 Demo Credentials

### 👮 Municipal Officer

| Field | Value |
|-------|-------|
| **Email** | `officer@civicfix.com` |
| **Password** | `officer123` |

> **Note:** Additional users can be created through the application registration flow.

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/Isha0468/CivicFix.git

cd CivicFix
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🌍 Environment Variables

## Backend (.env)

```env
PORT=
MONGODB_URI=
JWT_SECRET=
```

---

## Frontend (.env)

```env
VITE_API_URL=
```

---

# 🔐 Security Features

- 🔑 JWT Authentication
- 🔒 BCrypt Password Hashing
- 🛡 Protected API Routes
- 🌐 Secure CORS Configuration
- ✅ Input Validation
- 🚦 Express Rate Limiting
- 🪖 Helmet Security

---

# 📱 Highlights

- 📱 Fully Responsive Design
- 🗺 Interactive Map Integration
- 📊 Dashboard Analytics
- 📈 Real-time Complaint Tracking
- 🔐 Role-Based Authentication
- ☁ MongoDB Atlas Database
- 🚀 Fully Deployed on Render

---

# 📸 Screenshots

> Add screenshots of the following pages:

- 🏠 Landing Page
- 🔐 Login
- 📝 Report Complaint
- 🗺 Map View
- 👤 Citizen Dashboard
- 👮 Officer Dashboard
- 👨‍💼 Admin Dashboard
- 📊 Analytics Dashboard

---

# 🎯 Future Improvements

- 🔔 Push Notifications
- 📧 Email Notifications
- 📱 Mobile Application
- 🤖 AI-based Complaint Prioritization
- 📈 Advanced Analytics
- 🌍 Multi-language Support

---

# 👩‍💻 Developer

**Isha**

GitHub

https://github.com/Isha0468

---

<div align="center">

## ⭐ If you found this project useful, consider giving it a Star!

Made with ❤️ using the MERN Stack

</div>
