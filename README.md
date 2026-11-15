# KRISHIORBIT 🛰️🌱

**NASA Space Apps Challenge 2026**  
*Agricultural Intelligence Platform for Smarter Crop Rotation & Sustainable Farming*

---

## 🌾 Project Overview

**KRISHIORBIT** is an agricultural intelligence platform that synthesizes NASA satellite Earth observations, agro-climatology indicators, soil characteristics, and crop agronomic profiles to empower farmers with resilient, sustainable, and economically viable crop rotation strategies.

By bridging spaceborne environmental telemetry with ground-level agricultural realities, KRISHIORBIT provides holistic farm management across:
1. **Farm Parcel Registry & Soil Profiling**: Persistent geo-referenced parcel management with soil texture and irrigation profiling.
2. **NASA Agroclimatology Intelligence**: Weather progression, thermal regimes, and seasonal rainfall analysis via NASA POWER.
3. **Crop Intelligence Repository**: Scientifically validated thermal, water, soil pH, and nutrient boundaries for Indian cropping systems.
4. **Crop Rotation Simulation Engine**: Multi-season rotation planning that enforces crop family diversity, legume nitrogen fixation, pest break intervals, and soil texture suitability.
5. **Market & Profit Intelligence**: Statutory Government of India CACP MSP benchmarks, APMC mandi dynamics, and deterministic farm profitability economics.

---

## 📁 Project Architecture

```
KRISHIORBIT/
├── backend/
│   ├── main.py                   # FastAPI REST API application & routing
│   ├── database.py               # SQLite connection, schema migrations & CRUD queries
│   ├── rotation_engine.py        # Agronomic rotation rules & multi-season evaluation engine
│   ├── market_service.py         # CACP MSP benchmarks, profit calculations & APMC integration
│   ├── krishiorbit.db            # Persistent SQLite database (gitignored)
│   ├── requirements.txt          # Python dependencies
│   └── scratch/
│       ├── test_phase_7_9a.py    # Rotation engine unit and regression tests
│       ├── test_phase_7_9b.py    # Scientific data integrity & coordinate tests
│       └── test_phase_8_market.py# Market & profit intelligence test suite
├── frontend/
│   ├── index.html                # HTML entry template
│   ├── package.json              # React & Vite configuration
│   ├── vite.config.js            # Vite build configuration
│   └── src/
│       ├── App.jsx               # Main application controller & navigation state
│       ├── App.css               # Design system (forest-green / off-white & responsive layout)
│       ├── index.css             # Base typography & resets
│       ├── main.jsx              # React DOM mounting root
│       └── components/
│           ├── Sidebar.jsx       # Navigation sidebar & backend connectivity status
│           ├── LandingPage.jsx   # Platform overview, agro-zones & core pillars
│           ├── Dashboard.jsx     # Analytical workspace & landscape banner
│           ├── FarmProfile.jsx   # Farm parcel registry, soil profiling & CRUD management
│           ├── NasaWeatherCharts.jsx    # Responsive SVG rainfall & temperature progression
│           ├── CropIntelligence.jsx     # Authentic Indian crop photographic profiles & boundaries
│           ├── CropRotationSimulator.jsx# Rotation sequence planner & soil health scoring
│           └── MarketIntelligence.jsx   # Market price intelligence, CACP MSP & profit calculator
└── README.md                     # Project documentation & architectural specification
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, JavaScript (ES6+), HTML5, Semantic CSS3 (Forest Green & Off-White Palette)
- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic v2
- **Database**: SQLite 3 (persistent relational store via `backend/database.py` managing `farm_profiles`, `crops`, and `local_mandi_observations`)
- **Space Data Integration**: NASA POWER (Prediction Of Worldwide Energy Resources) Agroclimatology API

---

## 🛰️ NASA Earth Data Notice & Scientific Methodology

- **NASA POWER Agroclimatology**: KRISHIORBIT fetches environmental parameters (`T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`) from the NASA POWER API.
- **Gridded Resolution Clarification**: NASA POWER data represents global gridded environmental reanalysis and assimilation products (~0.5° latitude × 0.625° longitude, derived from NASA GMAO MERRA-2 and GEOS-IT systems), rather than in-situ ground weather sensors or parcel-level probe measurements. It provides macro-climatological context, thermal regimes, and seasonal rainfall patterns for the farm's geographical coordinates.
- **Scientific Integrity Policy**: The platform strictly avoids claiming unimplemented satellite sensors (such as live SAR or hyperspectral imagery). Rotation compatibility calculations use empirical agronomic criteria established by Indian agricultural research institutes (ICAR, UAS Dharwad, TNAU).

---

## 📊 Market Data & Transparency Policy

- **Statutory CACP MSP Benchmarks**: Official procurement benchmark prices established by the Commission for Agricultural Costs & Prices (CACP), Department of Agriculture & Farmers Welfare, Ministry of Agriculture & Farmers Welfare, Government of India for the **Kharif Marketing Season 2026–27** (Paddy Common ₹2,441/q, Paddy Grade A ₹2,461/q, Ragi ₹5,205/q, Maize ₹2,410/q, Black Gram ₹8,200/q, Green Gram ₹8,780/q, Groundnut ₹7,517/q, Soybean ₹5,708/q).
- **Non-MSP Commodities**: Crops not covered by statutory Central Government MSP (e.g., Cowpea, Arecanut) are explicitly designated as non-statutory commodities, requiring farmers to reference local mandi rates or manual quotes rather than non-existent statutory floors.
- **Live Mandi API Disclosure**: Live daily APMC mandi market feeds require an official `DATAGOVIN_API_KEY` (from data.gov.in AGMARKNET). When this key is unconfigured, KRISHIORBIT operates in an honest, transparent offline state—clearly displaying official CACP statutory benchmarks and allowing verified local farmer observations rather than displaying fabricated or synthetic price quotes.
- **Agronomic Priority Disclaimer**: KRISHIORBIT upholds the critical agronomic principle that **crops must never be chosen based on market prices alone**. Agro-climatic suitability, soil capability, water balance, and rotation diversity must always take precedence over short-term price fluctuations.

---

## 🚀 Running the Project

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend (FastAPI)

1. Open a terminal and navigate to `KRISHIORBIT/backend`:
   ```bash
   cd KRISHIORBIT/backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI application server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
4. Verify backend health:
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
4. Open the application in your browser:
   ```
   http://localhost:5173
   ```

---

## 📡 Implemented API Endpoints

### System & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API Welcome message & version metadata |
| `GET` | `/api/health` | Backend service health, timestamp & operational status |

### NASA Agroclimatology
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/nasa-power` | Fetches NASA POWER agroclimatology telemetry (T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M) with daily telemetry and monthly aggregations |

### Farm Parcel Profiling (SQLite)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/farm-profiles` | Retrieve all registered farm parcel profiles sorted by recency |
| `POST` | `/api/farm-profiles` | Create and persist a new farm parcel profile in SQLite |
| `GET` | `/api/farm-profiles/{id}` | Retrieve a specific farm profile by primary key ID |
| `PUT` | `/api/farm-profiles/{id}` | Update parcel acreage, soil texture, irrigation status, or coordinates |
| `DELETE` | `/api/farm-profiles/{id}` | Remove a farm profile from SQLite |

### Crop Intelligence Repository
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/crops` | Retrieve all scientifically cataloged crops with category and search filters |
| `GET` | `/api/crops/{crop_id}` | Retrieve detailed growing parameters, temperature/water thresholds, and rotation benefits |
| `GET` | `/api/crops/category/{category}` | Retrieve crops by classification (Cereal, Nutri-Cereal, Pulse, Plantation) |

### Crop Rotation Simulation Engine
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/rotation/compare` | Evaluate a multi-season crop rotation against parcel soil, climate regimes, botanical diversity, legume balance, and pest break rules |

### Market & Profit Intelligence
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/market/status` | Official data portal integration status, API key status, and data integrity guarantees |
| `GET` | `/api/market/prices` | APMC mandi market price queries with honest fallback and CACP reference values |
| `GET` | `/api/market/msp-benchmarks` | Official Government of India CACP Kharif Marketing Season 2026–27 MSP rates |
| `GET` | `/api/market/activity-principles` | Agricultural economics education: arrivals, traded volume, demand signals, and disclaimers |
| `POST` | `/api/market/profit-calculator` | Deterministic farm profitability model (gross revenue, costs, net profit, break-even price, ROI) |
| `GET` | `/api/market/crop-comparison` | Side-by-side comparison separating agro-climatic boundaries from economic MSP indicators |
| `GET` | `/api/market/observations` | Retrieve verified local APMC mandi price observations from SQLite |
| `POST` | `/api/market/observations` | Record a new farmer-verified local APMC mandi price observation |
| `DELETE` | `/api/market/observations/{id}` | Delete a local APMC observation record |

---

## 🗺️ Completed Modules & Roadmap

- [x] **SQLite Relational Store**: Fully implemented persistent storage (`backend/database.py`, `krishiorbit.db`) for farm parcels, crop taxonomy, and local mandi quotes.
- [x] **Crop Intelligence Repository**: 9 comprehensive crop profiles with empirical agronomic thresholds (Paddy, Ragi, Maize, Black Gram, Green Gram, Groundnut, Soybean, Cowpea, Arecanut).
- [x] **NASA Agroclimatology Visualizer**: Integrated NASA POWER API client with dynamic temperature regimes and seasonal rainfall charts.
- [x] **Crop Rotation Simulation Engine**: Agronomic evaluation engine scoring rotation sequences on botanical family rotation, legume inclusion, root depth variation, and soil compatibility.
- [x] **Market & Profit Intelligence MVP**: Statutory CACP 2026–27 MSP benchmarks, deterministic profit and break-even calculator, market activity principles, and local mandi observation registry.
- [ ] **Future Work**: Integration of high-resolution SAR and optical satellite layers (e.g., Copernicus Sentinel-2 NDVI, NASA-ISRO NISAR soil moisture) as ground-validated data pipelines become available.
