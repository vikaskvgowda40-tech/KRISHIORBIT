# KRISHIORBIT 🛰️🌱

**NASA Space Apps Challenge 2026**  
*Agricultural Intelligence Platform for Smarter Crop Rotation*

---

## 🌾 Project Overview

**KRISHIORBIT** is an agricultural intelligence platform that synthesizes NASA satellite Earth observations, climate indicators, soil health characteristics, and crop profiles to help farmers discover resilient, sustainable, and high-yield crop rotation strategies.

---

## 📁 Project Architecture

```
KRISHIORBIT/
├── backend/
│   ├── main.py              # FastAPI application & endpoints
│   ├── database.py          # SQLite connection, schemas & CRUD queries
│   ├── krishiorbit.db       # Persistent SQLite database file
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html           # HTML template
│   ├── package.json         # React & Vite configuration
│   ├── vite.config.js       # Vite configuration
│   └── src/
│       ├── App.jsx          # Main application & routing state
│       ├── App.css          # Design system (forest-green / off-white & photography)
│       ├── index.css        # Base reset and typography
│       ├── main.jsx         # React DOM root
│       └── components/
│           ├── Sidebar.jsx  # Navigation sidebar & backend health status
│           ├── LandingPage.jsx # Platform overview, agro-zones & core pillars
│           ├── Dashboard.jsx   # Analytical workspace & landscape banner
│           ├── FarmProfile.jsx # Farm parcel registry, soil profiling & CRUD management
│           ├── NasaWeatherCharts.jsx # Responsive SVG rainfall & temperature progression
│           └── CropIntelligence.jsx # Authentic Indian crop photographic profiles
└── README.md                # Project documentation
```

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, JavaScript, HTML5, CSS3 (Forest Green & Off-White Palette)
- **Backend**: Python 3.11+, FastAPI, Uvicorn
- **Database**: SQLite *(scheduled for later integration)*

---

## 🚀 Running the Project

### 1. Backend (FastAPI)

1. Open a terminal and navigate to `KRISHIORBIT/backend`:
   ```bash
   cd KRISHIORBIT/backend
   ```
2. Install dependencies (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI development server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
4. Verify the backend health check in your browser or curl:
   ```
   http://127.0.0.1:8000/api/health
   ```

### 2. Frontend (React + Vite)

1. Open a second terminal and navigate to `KRISHIORBIT/frontend`:
   ```bash
   cd KRISHIORBIT/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the frontend in your browser:
   ```
   http://localhost:5173
   ```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API Welcome message & status |
| `GET` | `/api/health` | Health check endpoint returning backend status |
| `GET` | `/api/nasa-power` | Fetches & parses real NASA POWER agroclimatology telemetry (T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M) with daily records and monthly aggregates |
| `POST` | `/api/farm-profiles` | Create and persist a new farm parcel profile in SQLite |
| `GET` | `/api/farm-profiles` | Retrieve all registered farm profiles sorted by update recency |
| `GET` | `/api/farm-profiles/{id}` | Retrieve a specific farm profile by primary key ID |
| `PUT` | `/api/farm-profiles/{id}` | Update parcel acreage, soil, crops, or priority |
| `DELETE` | `/api/farm-profiles/{id}` | Delete a farm profile from SQLite with validation |
| `GET` | `/api/crops` | Retrieve all scientifically cataloged crops with optional search and category filters |
| `GET` | `/api/crops/{crop_id}` | Retrieve detailed growing parameters, water/thermal requirements, and rotation benefits for an individual crop |
| `GET` | `/api/crops/category/{category}` | Retrieve crops matching a specific category (e.g., Cereal, Nutri-Cereal, Pulse, Plantation) |

---

## 🗺️ Roadmap & Next Steps

- [x] SQLite database setup for persistent farm and parcel profiling (`krishiorbit.db`)
- [x] Crop Intelligence scientific repository & thermal/water boundary catalog (`crops` table)
- [ ] NASA Earth Observation Satellite API integrations (e.g., NDVI, SMAP soil moisture)
- [ ] Crop rotation optimization engine & simulation module (Phase 6)
