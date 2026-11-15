# KRISHIORBIT – Phase 7.9B Data Integrity Report

**Implementation Date:** November 15, 2026  
**Auditor & Implementation Agent:** Antigravity AI  
**Project Workspace:** `C:\Users\K V VIKAS\OneDrive\Documents\Nasa\KRISHIORBIT`  
**Git Branch:** `main` (uncommitted working tree per strict instruction)  
**Database File:** `backend/krishiorbit.db` (verified intact, untouched)  

---

## Executive Summary

Phase 7.9B addressed remaining scientific, agronomic, and data-integrity vulnerabilities identified during the Phase 7.9A independent verification audit. Specifically:
1. **Eliminated silent fallback to `"Laterite soil"`:** Missing, null, blank, or unknown soil types now categorically classify as `"Insufficient data"` with zero score points and an explicit explanation that laboratory soil testing or regional soil classification is required.
2. **Enforced Liebig's Law across multi-crop rotations:** Replaced arithmetic score averaging across sequence crops with strict categorical limiting-constraint aggregation (`aggregate_crop_statuses`). A favorable Kharif crop can no longer hide an acute Rabi moisture deficit.
3. **Eliminated silent coordinate substitution:** Farms with missing, null, blank, or out-of-range coordinates are rejected with `HTTP 400 Bad Request` and clear validation instructions, rather than quietly receiving Shivamogga coordinates (`13.9299° N, 75.5681° E`).
4. **Diagnosed integration test `test_phase_7_7a.py`:** Pinpointed the exact cause of `[WinError 10013]` as Windows sandbox inter-process loopback socket permission boundaries, and verified that against the live backend server outside the sandbox, **all endpoints pass 100% cleanly**.
5. **Executed regression suite:** Implemented `test_phase_7_9b.py` covering all 7 required conditions (**7 of 7 PASSED**), ran Phase 7.9A tests (**5 of 5 PASSED**), seasonal tests (**4 of 4 PASSED**), and verified the frontend production build (**built in 3.93s with 0 errors**).

---

## 1. Resolution of Missing Soil Information

### 1.1 Root Cause in Phase 7.9A
Previously in `backend/rotation_engine.py` line 1027, the engine evaluated soil compatibility with:
```python
soil_evals = [evaluate_soil_compatibility(farm.get("soil_type", "Laterite soil"), c) for c in sequence_crops]
```
If a farm profile omitted `soil_type`, or supplied `None` or an empty string, the engine defaulted to `"Laterite soil"`. For crops adapted to laterite (e.g., Ragi, Cowpea, Green Gram), this falsely awarded $25/25$ points and an `Optimal` rating. Furthermore, selecting `"Other / Unknown"` mapped to a generic `Moderate` (18/25 points).

### 1.2 Implemented Corrections in Phase 7.9B
1. **Removal of Silent Default:** In [rotation_engine.py](file:///c:/Users/K%20V%20VIKAS/OneDrive/Documents/Nasa/KRISHIORBIT/backend/rotation_engine.py#L1099-L1105):
   ```python
   raw_soil = farm.get("soil_type")
   soil_evals = [evaluate_soil_compatibility(raw_soil, c) for c in sequence_crops]
   ```
2. **Explicit Detection in `evaluate_soil_compatibility`:** In [rotation_engine.py](file:///c:/Users/K%20V%20VIKAS/OneDrive/Documents/Nasa/KRISHIORBIT/backend/rotation_engine.py#L70-L105):
   ```python
   if farm_soil is None:
       is_unknown = True
   else:
       soil_str = str(farm_soil).strip().lower()
       is_unknown = (
           not soil_str
           or soil_str in ["none", "null", "undefined"]
           or "unknown" in soil_str
           or soil_str in ["other", "other / unknown", "not specified", "unspecified"]
       )

   if is_unknown:
       return {
           "status": "Insufficient data",
           "score": 0,
           "max_score": 25,
           "farm_soil": str(farm_soil).strip() if farm_soil is not None and str(farm_soil).strip() else "Missing / Unspecified",
           "suitable_soils_reference": crop.get("suitable_soils", "Not specified"),
           "rationale": (
               f"Soil classification is missing or unknown for {crop_name}. "
               "A laboratory soil test or verified regional soil classification (texture, drainage, pH) "
               "is required to evaluate agronomic compatibility and prevent crop-soil mismatch."
           )
       }
   ```
3. **Cascade into Qualitative Category:**
   When `soil_status` is `"Insufficient data"`, `synthesize_qualitative_suitability()` automatically sets the scenario's overall classification to **`Insufficient data`**, and attaches a management note:
   `"Soil classification is unspecified or unknown; verified soil test or regional classification required."`
4. **Removal from Climate Evaluation:**
   `evaluate_climate_suitability(..., farm_soil=None)` no longer defaults to `"Laterite soil"`. In rainfed Rabi seasons where soil moisture storage is essential, an unspecified soil classification assigns `water_status = "Insufficient data"` ($0\text{ pts}$) because subsoil water retention cannot be evaluated.

---

## 2. Rotation-Level Limiting Constraints (Liebig's Law)

### 2.1 Root Cause in Phase 7.9A
In Phase 7.9A, factor statuses across a sequence were computed via arithmetic score means:
```python
water_score = sum(ce["water_score"] for ce in climate_evals) / len(climate_evals)
water_status = "Optimal" if water_score >= 21 else ("Moderate" if water_score >= 16 else ...)
```
In a sequence of Kharif Ragi (Optimal: $25\text{ pts}$) followed by rainfed Rabi Black Gram on Laterite (Challenging: $12\text{ pts}$), the average was $(25 + 12) / 2 = 18.5$. Because $18.5 \ge 16$, `water_status` was scored as `Moderate`. The acute terminal drought risk of the Rabi crop was concealed from the user.

### 2.2 Implemented Corrections in Phase 7.9B
1. **Categorical Aggregation Function:** Implemented `aggregate_crop_statuses` in [rotation_engine.py](file:///c:/Users/K%20V%20VIKAS/OneDrive/Documents/Nasa/KRISHIORBIT/backend/rotation_engine.py#L932-L950) strictly applying Liebig's Law of the Minimum:
   ```python
   def aggregate_crop_statuses(statuses: List[str]) -> str:
       if not statuses:
           return "Insufficient data"
       if any(s == "Insufficient data" for s in statuses):
           return "Insufficient data"
       if any(s == "Challenging" for s in statuses):
           return "Challenging"
       if any(s == "Moderate" for s in statuses):
           return "Moderate"
       if all(s == "Optimal" for s in statuses):
           return "Optimal"
       return "Moderate"
   ```
2. **Applied to Core Dimensions:**
   - `soil_status = aggregate_crop_statuses([se["status"] for se in soil_evals])`
   - `water_status = aggregate_crop_statuses([ce["water_status"] for ce in climate_evals])`
   - `thermal_status = aggregate_crop_statuses([ce["thermal_status"] for ce in climate_evals])`
   - Sub-scores report the limiting minimum score (`min(ce["water_score"]...)`), avoiding misleading averages.
3. **Crop-Level Limiting Constraint Visibility:**
   Specific per-crop constraints are now harvested directly from `climate_evals` and `soil_evals` and injected into `qual_eval["limiting_factors"]`:
   ```python
   crop_limiting_factors: List[str] = []
   for i, c in enumerate(sequence_crops):
       c_name = c.get("crop_name", f"Crop {i+1}")
       s_name = crop_seasons[i]
       if ce.get("water_status") == "Challenging":
           crop_limiting_factors.append(f"Water constraint for {c_name} in {s_name}: {ce.get('water_rationale')}")
   ```
   **Result:** A Kharif Ragi $\to$ Rabi Black Gram sequence on rainfed laterite now evaluates to **`Challenging`**, explicitly warning the farmer of terminal moisture deficit during flowering/pod set.

---

## 3. Missing Farm Coordinates Validation

### 3.1 Root Cause in Phase 7.9A
In `backend/main.py` lines 1106–1107:
```python
farm_lat = float(farm.get("latitude") or 13.9299)
farm_lon = float(farm.get("longitude") or 75.5681)
```
If a farm was saved without coordinates, it silently queried weather data for Shivamogga, misrepresenting agro-climatic conditions for farms located elsewhere in Karnataka.

### 3.2 Implemented Corrections in Phase 7.9B
In [main.py](file:///c:/Users/K%20V%20VIKAS/OneDrive/Documents/Nasa/KRISHIORBIT/backend/main.py#L1105-L1138), explicit coordinate validation was added to the `/api/rotation/compare` endpoint:
```python
raw_lat = farm.get("latitude")
raw_lon = farm.get("longitude")

if raw_lat is None or raw_lon is None or str(raw_lat).strip() == "" or str(raw_lon).strip() == "":
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=(
            f"Farm profile '{farm.get('farm_name', 'Selected Farm')}' (ID: {request.farm_profile_id}) "
            "is missing geographic coordinates (latitude and longitude). "
            "Valid geographic coordinates are required to query location-specific NASA POWER satellite meteorological "
            "observations and historical climatology. Please update the farm profile with valid latitude and longitude."
        )
    )

try:
    farm_lat = float(raw_lat)
    farm_lon = float(raw_lon)
except (ValueError, TypeError):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Farm profile '{farm.get('farm_name')}' has invalid coordinate values: latitude={raw_lat}, longitude={raw_lon}."
    )

if not (-90.0 <= farm_lat <= 90.0) or not (-180.0 <= farm_lon <= 180.0):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Coordinates out of valid bounds: latitude={farm_lat}, longitude={farm_lon}."
    )
```
- No silent fallback coordinates are used.
- Device GPS spoofing/substitution is not used.
- Legitimate coordinates (e.g. Agumbe `13.5186° N, 75.0911° E`) continue to operate uninterrupted.

---

## 4. Investigation of Failed Integration Test (`test_phase_7_7a.py`)

### 4.1 Test Execution & Failure Capture
Execution of `backend/scratch/test_phase_7_7a.py` inside the standard terminal sandbox produced:
```
[PASS] SQLite database exists (backend\scratch\..\krishiorbit.db), tables found: ['farm_profiles', 'sqlite_sequence', 'crops']
       Crops in DB: 9, Farm profiles in DB: 1
[FAIL] /api/health: <urlopen error [WinError 10013] An attempt was made to access a socket in a way forbidden by its access permissions>
Command exited with code 1.
```

### 4.2 Determination
| Hypothesis | Finding | Evidence |
| :--- | :--- | :--- |
| **A. Genuine Regression** | **DISPROVED** | The backend server process is running healthy and successfully answers health probes on port 8000. |
| **B. Outdated Test Expectation** | **DISPROVED** | All endpoint URLs, JSON structures, status codes (`200 OK`, `400 Bad Request` for Arecanut) are completely up to date. |
| **C. Server / Environment Problem** | **CONFIRMED** | **Windows Sandbox Socket Isolation.** In standard execution mode, the Windows PowerShell sandbox prohibits child processes in a new command session from opening outbound TCP loopback sockets to `127.0.0.1:8000` (WinError 10013). |

### 4.3 Direct Verification (Outside Sandbox Isolation)
When executed with permission to access local network sockets:
```
[PASS] SQLite database exists, tables found: ['farm_profiles', 'sqlite_sequence', 'crops']
       Crops in DB: 9, Farm profiles in DB: 1
[PASS] /api/health returned 200 OK: {'status': 'healthy', 'message': 'KRISHIORBIT backend is running successfully', 'service': 'KRISHIORBIT API', 'version': '1.4.0'}
[PASS] /api/crops returned 9 crops.
[PASS] Arecanut preserved in crop knowledge base (id: 6).
[PASS] /api/nasa-power returned 200 OK
  - Source: NASA Prediction Of Worldwide Energy Resources (POWER)
  - Assimilated Observations: 316 days (2026-01-01 to 2026-11-12)
  - YTD Precipitation: 903.22 mm
  - Mean Temp: 25.23 °C
[PASS] /api/nasa-power/climatology returned 200 OK
  - Label: NASA POWER Historical Climatological Baseline (1991–2020)
  - Feb days used: 28.2667 (should be 28.2667)
[PASS] Using farm profile ID 2 (Agumbe Valley Eco-Holding)
[PASS] /api/rotation/compare with valid annual crops returned 200 OK
  - Total scenarios compared: 2
  - Scenario A: Paddy -> Black Gram: Soil: Moderate, Water: Moderate
  - Scenario B: Paddy -> Cowpea: Soil: Optimal, Water: Moderate
[PASS] Arecanut sequence correctly REJECTED with HTTP 400 Bad Request:
       Detail: Crop 'Arecanut' is a perennial plantation palm (30–40 year economic lifespan) and cannot be evaluated in an annual seasonal crop rotation sequence.
ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! (Exit Code: 0)
```
**Conclusion:** `test_phase_7_7a.py` has zero test logic regressions. No modifications to `test_phase_7_7a.py` were required or made.

---

## 5. Comprehensive Regression Testing

A dedicated test suite [backend/scratch/test_phase_7_9b.py](file:///c:/Users/K%20V%20VIKAS/OneDrive/Documents/Nasa/KRISHIORBIT/backend/scratch/test_phase_7_9b.py) was created and executed using Python 3.11:

### 5.1 Test Results Breakdown

```
======================================================================
KRISHIORBIT PHASE 7.9B REGRESSION TEST SUITE
======================================================================

[TEST 1] Missing, Null, Blank, and Unknown Soil Types
  ✓ Soil input None                 -> status='Insufficient data', score=0
  ✓ Soil input ''                   -> status='Insufficient data', score=0
  ✓ Soil input '   '                -> status='Insufficient data', score=0
  ✓ Soil input 'Other / Unknown'    -> status='Insufficient data', score=0
  ✓ Soil input 'unknown'            -> status='Insufficient data', score=0
  ✓ Soil input 'None'               -> status='Insufficient data', score=0
  ✓ Soil input 'null'               -> status='Insufficient data', score=0
  ✓ Soil input 'undefined'          -> status='Insufficient data', score=0
  ✓ Scenario with soil_type=None correctly produced category='Insufficient data' (not Optimal or Moderate)
  ✓ Scenario with soil_type='Other / Unknown' correctly produced category='Insufficient data'
  ✓ TEST 1 PASSED: Missing soil types cannot produce unjustified Optimal.

[TEST 2] Severe Rabi Constraint NOT Hidden by Favorable Kharif Result
  Per-crop water statuses: ['Optimal', 'Challenging'] (Kharif Ragi: Optimal, Rabi Black Gram: Challenging)
  Rotation-level water status: 'Challenging'
  Overall scenario suitability: 'Challenging'
  ✓ Limiting factors explicitly identify Rabi constraint: ['Water constraint for Black Gram in Rabi: Critical seasonal moisture deficit: Observed Rabi rainfall is only 5.2 mm against 350–450 mm required by Black Gram. In Laterite soil, rapid drainage and low moisture retention capacity make rainfed post-monsoon cropping highly vulnerable to terminal drought during flowering and pod set without supplemental protective irrigation.', 'Soil constraint for Black Gram: Black Gram typically thrives in heavy, neutral-to-alkaline black soils. Laterite soils in Malnad are often acidic (pH 4.8–6.0) with high iron/aluminum oxide content, requiring lime or dolomite application and phosphorus buffering.']
  ✓ TEST 2 PASSED: Favorable Kharif crop does NOT mask severe Rabi water constraint.

[TEST 3 & 4] Missing Latitude and Longitude Validation
  ✓ Missing latitude rejected by endpoint with HTTP 400: Farm profile 'No Lat Farm' (ID: 999) is missing geographic coordinates (latitude and longitude). Valid geographic coordinates are required to query location-specific NASA POWER satellite meteorological observations and historical climatology. Please update the farm profile with valid latitude and longitude.
  ✓ Missing longitude rejected by endpoint with HTTP 400: Farm profile 'No Lat Farm' (ID: 999) is missing geographic coordinates (latitude and longitude). Valid geographic coordinates are required to query location-specific NASA POWER satellite meteorological observations and historical climatology. Please update the farm profile with valid latitude and longitude.
  ✓ Blank latitude string rejected by endpoint with HTTP 400: Farm profile 'No Lat Farm' (ID: 999) is missing geographic coordinates (latitude and longitude). Valid geographic coordinates are required to query location-specific NASA POWER satellite meteorological observations and historical climatology. Please update the farm profile with valid latitude and longitude.
  ✓ TEST 3 & 4 PASSED: Missing coordinates strictly rejected without silent Shivamogga default.

[TEST 5 & 6] Valid Agumbe and Shivamogga Coordinates Handling
  ✓ Valid Agumbe coordinates verified in rotation comparison: Lat 13.5186, Lon 75.0911
  ✓ Valid Shivamogga coordinates verified in rotation comparison: Lat 13.9299, Lon 75.5681
  ✓ TEST 5 & 6 PASSED: Legitimate farm coordinates preserved.

[TEST 7] Existing Farm Profile Compatibility & Arecanut Rejection
  Found active farm profile: ID 2 ('Agumbe Valley Eco-Holding')
    Location: Agumbe, Shivamogga
    Coordinates: Lat 13.5186, Lon 75.0911
    Soil: Laterite soil
  ✓ Arecanut sequence correctly rejected: Crop 'Arecanut' is a perennial plantation palm (30–40 year economic lifespan) and cannot be evaluated in an annual seasonal crop rotation sequence. Please refer to the dedicated Perennial Plantation advisory module.
  ✓ Existing farm profile evaluated successfully: category='Challenging'
  ✓ TEST 7 PASSED: Existing profiles fully compatible and Arecanut rejected.

======================================================================
ALL 7 PHASE 7.9B REGRESSION TESTS PASSED SUCCESSFULLY!
======================================================================
```

### 5.2 Full Regression Suite Summary

| Suite / Script | Target Scope | Result | Exit Code |
| :--- | :--- | :--- | :--- |
| `backend/scratch/test_phase_7_9b.py` | Missing soil, Rabi constraint masking, coordinate validation, Arecanut rejection | **7 of 7 PASSED** | `0` |
| `backend/scratch/test_phase_7_9a.py` | C-01 Paddy variants, Rabi 4-month coverage, synthetic rainfall removal, 0–100 removal | **5 of 5 PASSED** | `0` |
| `backend/test_seasonal_rainfall.py` | Seasonal window extraction, deficit scoring, end-to-end simulation | **4 of 4 PASSED** | `0` |
| `backend/scratch/test_phase_7_7a.py` | Live FastAPI backend endpoints, NASA POWER daily & climatology, DB integrity | **ALL PASSED** | `0` |
| `python -m compileall backend` | Python AST compilation across all backend scripts | **ALL PASSED** | `0` |
| `npm run build --prefix frontend` | Vite React production build and asset bundling | **BUILT (3.93s)** | `0` |

---

## 6. Database and Data Integrity Verification

SQLite direct inspection on `backend/krishiorbit.db`:
- **Schema Modifications:** Zero (no tables, columns, indexes, or constraints modified).
- **Crops Knowledge Base:** 9 records preserved intact (including Arecanut).
- **Farm Profiles Table:** 1 profile preserved intact (`Agumbe Valley Eco-Holding`, ID 2, Lat `13.5186`, Lon `75.0911`, Soil `'Laterite soil'`).
- **Data Protection:** No credentials, API keys, personal identification, or test artifacts written to the database.

---

## 7. Changed Files Matrix

| File Path | Nature of Change | Lines Changed |
| :--- | :--- | :--- |
| `backend/rotation_engine.py` | Added `aggregate_crop_statuses` (Liebig's Law); updated `evaluate_soil_compatibility` for missing/unknown soils; updated `evaluate_climate_suitability` to remove `"Laterite soil"` default; collected crop-level limiting constraints into `qualitative_suitability`. | +65 / -18 lines |
| `backend/main.py` | Added coordinate validation in `/api/rotation/compare`; removed silent Shivamogga coordinates substitution; returns HTTP 400 with actionable feedback on missing/invalid lat/lon. | +34 / -2 lines |
| `frontend/src/App.css` | Added CSS styling rules for `.st-challenging` (rose) and `.st-insufficient` (slate) factor status badges. | +10 lines |
| `frontend/src/components/CropRotationSimulator.jsx` | Updated factor badge class mapping to render `st-optimal`, `st-moderate`, `st-challenging`, and `st-insufficient` accurately. | +12 / -2 lines |
| `backend/scratch/test_phase_7_9b.py` | New comprehensive regression test suite covering all 7 Phase 7.9B requirements. | +315 lines (new test file) |

---

## 8. Unresolved Issues & Recommendations for Future Phases

1. **Phase 8 Physical Soil Water Balance (F-05):**  
   While heuristic numerical averaging was removed and replaced with strict Liebig categorical logic, quantitative Total Available Water ($TAW$) and root-zone soil water depletion ($D_r$) modeling remains disabled. When horizon-specific soil hydraulic layers (e.g. SoilGrids, ICAR-NBSS&LUP) are integrated, physical water balance calculations should replace heuristic sub-scores.
2. **Cross-Calendar-Year Rabi Tracking:**  
   NASA POWER's rolling 365-day endpoint combines January/February of the current year with November of the same year. For retrospective multi-year season tracking, stitching across calendar years ($N \to N+1$) should be formalized in Phase 8.

---
*Report certified by Antigravity AI – Phase 7.9B Implementation & Verification.*
