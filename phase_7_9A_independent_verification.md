# KRISHIORBIT – Phase 7.9A Independent Verification Audit Report

**Audit Date:** November 15, 2026  
**Auditor:** Antigravity AI – Independent Verification Module  
**Project Workspace:** `C:\Users\K V VIKAS\OneDrive\Documents\Nasa\KRISHIORBIT`  
**Git Repository:** `https://github.com/vikaskvgowda40-tech/KRISHIORBIT` (`main` branch)  
**Audit Type:** Strict Read-Only Scientific & Architecture Audit  

---

## Executive Summary

This independent audit assesses the current state of KRISHIORBIT following the implementation of **Phase 7.9A: Critical Scientific Corrections**. In strict accordance with audit instructions, this review is **read-only**—no source code, database tables, or configurations were modified during this audit.

The audit investigated six critical operational and scientific dimensions:
1. **Defensibility of Qualitative Suitability Categories** (`Optimal`, `Moderate`, `Challenging`, `Insufficient data`).
2. **Soil Data Gap Risk** (whether missing/unknown soil profiles can inadvertently generate `Optimal` classifications).
3. **Vertisol & Laterite Moisture Assumptions** (evaluating whether residual moisture logic relies on unsupported hardcoded constants vs. biophysical principles).
4. **Seasonal Chronology & Provenance** (evaluating Rabi 4-month coverage [Nov–Feb] and distinction between 30-year climatology normals and daily satellite telemetry).
5. **NASA Climatology Fallback Coordinate Alignment** (verifying that fallback queries use the selected farm's coordinates and completely eliminate wrong-location substitutions).
6. **Pyrefly Diagnostic Status & Python Environment Verification** (reporting actual exit codes and IDE language server diagnostic states).

---

## 1. Defensibility of Qualitative Categories

### 1.1 Verified Results
- **Liebig's Law of the Minimum at System Level:** `synthesize_qualitative_suitability()` in `backend/rotation_engine.py` (lines 890–990) strictly enforces Liebig’s Law across the five core biophysical dimensions (`Soil Compatibility`, `Water & Moisture Security`, `Thermal Alignment`, `Rotation Dynamics`, `Seasonal Calendar Feasibility`):
  - If any factor is marked `Challenging` (or calendar status is `Invalid`), the sequence is rated **Challenging**.
  - If any factor is marked `Moderate` (and none `Challenging`), the sequence is rated **Moderate**.
  - Only if **all** evaluated factors are `Optimal` does the sequence receive the **Optimal** classification.
  - If precipitation records are absent or `has_insufficient_data` is flagged, the system returns **Insufficient data** rather than defaulting or interpolating.
- **Elimination of Uncalibrated Scoring:** The arbitrary 0–100 composite scoring system, arbitrary numerical cutoffs (e.g., `>= 75` Highly Recommended), and synthetic percentage weights have been completely removed from both backend response payloads and frontend UI components.
- **Transparent Biophysical Explanations:** The UI (`CropRotationSimulator.jsx`) renders distinct sections for *Supporting Alignments*, *Limiting Constraints*, and a granular *Factor Status Grid*, citing ICAR and UAS Bengaluru agronomic baselines.

### 1.2 Unresolved Concerns & Architectural Limitations
- **Sequence-Level Arithmetic Averaging of Sub-Scores:**  
  While `synthesize_qualitative_suitability()` applies Liebig's Law across factors, the individual factor statuses (`soil_status`, `water_status`, `thermal_status`) in `compare_rotation_scenarios()` (`backend/rotation_engine.py` lines 1026–1048) are derived from the **arithmetic mean of numerical sub-scores across crops in the sequence**, rather than the minimum crop status:
  ```python
  water_score = sum(ce["water_score"] for ce in climate_evals) / len(climate_evals)
  water_status = "Optimal" if water_score >= 21 else ("Moderate" if water_score >= 16 else ("Insufficient data" if any(ce["water_status"] == "Insufficient data" for ce in climate_evals) else "Challenging"))
  ```
  **Concrete Vulnerability:** In a rainfed sequence of Kharif Ragi followed by Rabi Black Gram on Laterite soil:
  - Kharif Ragi receives `water_score = 25` (`Optimal`).
  - Rainfed Rabi Black Gram receives `water_score = 12` (`Challenging` due to terminal post-monsoon drought).
  - The arithmetic mean is $(25 + 12) / 2 = 18.5$.
  - Because $18.5 \ge 16$, the aggregate `water_status` is assigned **Moderate**.
  - Consequently, the severe moisture deficit of the Rabi crop is diluted, and the overall scenario is classified as `Moderate` instead of `Challenging`.
  - *Recommendation for Phase 7.9B:* Refactor factor status derivation to use the strict minimum status across crops in the rotation (`min_status = "Challenging" if any(ce["water_status"] == "Challenging") else ...`).

---

## 2. Soil Information Gap & "Optimal" False-Positive Risk

### 2.1 Verified Results
- **Handling of "Other / Unknown":** In `evaluate_soil_compatibility()` (`backend/rotation_engine.py` lines 80–178):
  - When a farm profile specifies `"Other / Unknown"`, `farm_soil_clean` fails to match `"laterite"`, `"red"`, `"black"`, `"alluvial"`, or `"sandy"`.
  - The code enters the fallback `else` branch (lines 166–170):
    ```python
    else:
        score = 18
        status = "Moderate"
        rationale = f"General soil suitability reported for {crop_name}: {crop.get('suitable_soils', 'Standard agricultural soils')}."
    ```
  - An average soil score of $18.0$ across the sequence maps to `soil_status = "Moderate"` ($18.0 < 22$).
  - Therefore, selecting `"Other / Unknown"` **does not directly generate an "Optimal" rating**.

### 2.2 Unresolved Concerns & Architectural Limitations
- **Silent Fallback to "Laterite soil" on Missing Keys:**  
  In `backend/rotation_engine.py` line 1027:
  ```python
  soil_evals = [evaluate_soil_compatibility(farm.get("soil_type", "Laterite soil"), c) for c in sequence_crops]
  ```
  If a farm profile dictionary lacks the `soil_type` key or supplies `None`, the engine silently defaults to `"Laterite soil"`. For crops whose knowledge record includes laterite (e.g., Ragi, Cowpea, Green Gram), this generates an `Optimal` rating ($25/25$).
- **Absence of "Insufficient data" Classification for Soil:**  
  Unlike precipitation (which transitions to `Insufficient data` when records are missing), soil compatibility has no `Insufficient data` state. An uncharacterized soil is automatically scored $18/25$ (`Moderate`) rather than prompting the user for soil texture or lab analysis.
- **Unconditional "Optimal" for Alluvial Soil:**  
  In lines 142–147, any farm with `"alluvial"` in its soil string receives `score = 24` and `status = "Optimal"` unconditionally for all crops, without verifying whether poorly drained or saline alluvium might restrict specific crops.

---

## 3. Vertisol and Laterite Moisture Assumptions

### 3.1 Verified Results
- **Elimination of Arbitrary Millimeter Bonuses:**  
  In Phase 7.7A and Phase 7.9A, the unscientific addition of fixed synthetic rainfall bonuses (e.g., $+35\text{ mm}$ or $+40\text{ mm}$ added to observed rainfall) was **completely eradicated**.
- **Agronomic Grounding:**  
  The qualitative differentiation between Vertisols and Laterites for post-monsoon rainfed cropping is agronomically sound and aligned with ICAR-IIPR and UAS Bengaluru guidelines:
  - **Vertisols (Black Cotton Soils):** High montmorillonite clay content ($>40\%$) and high water-holding capacity ($>150\text{--}200\text{ mm/m}$) allow sufficient residual moisture storage from the Kharif monsoon to support short-duration relay pulses (Black Gram / Bengal Gram) under prompt post-harvest sowing.
  - **Laterites (Oxisols/Ultisols in Western Ghats/Malnad):** Kaolinitic mineralogy, high macroporosity, and acidic profile result in rapid gravitational drainage, low available water capacity ($50\text{--}90\text{ mm/m}$), and rapid surface crusting/drying post-October. Rainfed Rabi crops in laterite face acute terminal drought without supplemental irrigation.

### 3.2 Unresolved Concerns & Architectural Limitations
- **Hardcoded Discrete Sub-Scores ($16$ vs. $12$):**  
  In `backend/rotation_engine.py` lines 612–627:
  - Heavy soils (Vertisol / Black / Clay) are hardcoded to `water_score = 16` (`Moderate`).
  - Light/Laterite soils are hardcoded to `water_score = 12` (`Challenging`).
  These discrete values are heuristic step-functions rather than continuous hydrological functions.
- **Feature F-05 Status (TAW Unimplemented):**  
  As mandated by Phase 7.7A architecture constraints, numerical Total Available Water ($TAW = 1000 \cdot (\theta_{FC} - \theta_{WP}) \cdot Z_r$) and daily root-zone water balance modeling remain disabled. The application correctly labels soil moisture behavior as qualitative guidance, but true soil-moisture simulation awaits integration of validated physical soil database layers (e.g., SoilGrids / ICAR-NBSS&LUP).

---

## 4. Rabi Season Coverage & Climatology vs. Observations

### 4.1 Verified Results
- **Full 4-Month Rabi Window:**  
  In `SEASON_DEFINITIONS["Rabi"]` (`backend/rotation_engine.py` lines 194–202), the seasonal window is defined as **November to February** (`month_numbers = [11, 12, 1, 2]`), reflecting the canonical Karnataka post-monsoon cropping calendar.
- **Robust Month Matching:**  
  `normalize_month_record()` accurately resolves integer month indices (`1..12`) as well as string names (`'November'`, `'dec'`), preventing silent dropping of months across differing payload formats.
- **Strict Differentiation of Data Provenance:**
  - **Daily Telemetry (`daily_observed`):** When NASA POWER daily records are ingested, missing months (such as December in near-real-time telemetry) are explicitly identified in `months_missing`, `is_partial_data` is set to `True`, and the user is notified:  
    `"Partial seasonal observations: 3 of 4 months evaluated (January, February, November). Missing: December (unassimilated or outside current observation window)."`
  - **30-Year Climatology (`climatology`):** Climatological baseline records evaluate all 4 months, flag `is_partial_data: False`, and clearly display:  
    `"30-Year Historical Climatological Normal (1991–2020): 4 of 4 months evaluated. Represents long-term climate normals, not measured current-year weather."`
  - **Contextual Baseline Reference:** When daily observations are active, `_extract_seasonal_climate()` embeds a distinct `climatology_reference` block (lines 421–438) providing the 30-year normal rainfall for comparative context without conflating it with observed weather.

### 4.2 Unresolved Concerns & Architectural Limitations
- **Rolling-Window Calendar Stitching for Rabi:**  
  The NASA POWER 365-day daily endpoint returns calendar months within a single year (January through December). Rabi crops span across the calendar year boundary (Nov–Dec of Year $N$ and Jan–Feb of Year $N+1$). Summing months $1, 2, 11, 12$ from a single calendar year combines early-year conditions with late-year conditions. While acceptable as a seasonal climatological proxy, multi-year contiguous season tracking will be necessary for precision hindcasting.

---

## 5. NASA Climatology Fallback Coordinate Alignment

### 5.1 Verified Results
- **Farm-Specific Coordinate Queries:**  
  In `backend/main.py` lines 1106–1122:
  ```python
  farm_lat = float(farm.get("latitude") or 13.9299)
  farm_lon = float(farm.get("longitude") or 75.5681)
  climate_res = get_nasa_power_data(latitude=farm_lat, longitude=farm_lon)
  climatology_res = get_nasa_power_climatology(latitude=farm_lat, longitude=farm_lon)
  ```
  Both daily satellite telemetry and 30-year climatology baseline API calls strictly pass the selected farm's coordinates (`farm_lat`, `farm_lon`).
- **Audit Verification on SQLite Database:**  
  Querying the active database `backend/krishiorbit.db` for Farm Profile ID 2 (`Agumbe Valley Eco-Holding`):
  - Latitude: `13.5186° N`
  - Longitude: `75.0911° E`
  When simulation runs for Farm 2, both calls target Agumbe coordinates ($13.5186, 75.0911$), which reflects the high-precipitation Western Ghats ecosystem ($>3500\text{ mm}$ annual).
- **Total Elimination of Silent Hardcoded Fallback:**  
  The previously identified flaw—where an API failure silently substituted a hardcoded Shivamogga dictionary (`rainfall_ytd: 903.22 mm`)—is **completely eradicated**.
  If both daily and climatology calls fail for the target coordinates, line 1149 raises an **HTTP 503 Service Unavailable** exception rather than returning falsified meteorological data.
- **Explicit Metadata Provenance:**  
  When climatology fallback activates, the response payload includes:
  - `status: "climatology_fallback"`
  - `is_climatology_fallback: True`
  - `coordinates_evaluated: {"latitude": farm_lat, "longitude": farm_lon}`
  - An explicit fallback notice detailing why climatology was utilized.

### 5.2 Unresolved Concerns & Architectural Limitations
- **Silent Fallback for Profiles with Null Coordinates:**  
  If a farm profile is saved with `latitude = NULL` or `longitude = NULL` (the database schema allows `NULL` for coordinates in `farm_profiles`), line 1106 silently defaults to Shivamogga coordinates (`13.9299, 75.5681`). A farm located in Bidar or Mysore created without GPS coordinates would silently receive Shivamogga weather data.
  *Recommendation for Phase 7.9B:* Enforce mandatory latitude/longitude validation on farm profile creation or prompt the user before running simulation.

---

## 6. Pyrefly Diagnostics & Environment Verification

### 6.1 Verified Results
- **Pyrefly Architecture in Antigravity IDE:**  
  Pyrefly is an integrated Language Server Protocol (LSP) daemon bundled inside Antigravity IDE:
  - Binary path: `C:\Users\K V VIKAS\.antigravity-ide\extensions\meta.pyrefly-1.4.1-win32-x64\bin\pyrefly.exe`
  - Workspace config: `C:\Users\K V VIKAS\OneDrive\Documents\Nasa\pyrefly.toml`
  - Target Python interpreter: `C:/Users/K V VIKAS/AppData/Local/Programs/Python/Python311/python.exe`
- **Current Pyrefly Diagnostic Status (LSP Output Log):**  
  Inspection of the active Pyrefly language server logs (`3-Pyrefly language server.log`, lines 945–980) confirms **zero active diagnostics**:
  - `backend/main.py`: **0 diagnostics**
  - `backend/rotation_engine.py`: **0 diagnostics**
  - `backend/scratch/test_phase_7_7a.py`: **0 diagnostics**
  - All four historical warnings (line 541/542 `int()` calls in `main.py`, `urllib.error` import in `test_phase_7_7a.py`, and line 381 `unnecessary-type-conversion` in `rotation_engine.py`) have been **completely cleared**.
- **Python AST & Compilation Integrity:**  
  Execution of `compileall` in the project Python environment:
  ```powershell
  & "C:\Users\K V VIKAS\AppData\Local\Programs\Python\Python311\python.exe" -m compileall backend
  ```
  - **Actual Exit Code: 0**
  - All modules (`main.py`, `rotation_engine.py`, `database.py`, test scripts) compiled cleanly with zero syntax or typing exceptions.
- **Regression Test Suite Verification:**  
  - `backend/scratch/test_phase_7_9a.py`: **5 of 5 tests PASSED** (Exit Code: 0).
  - `backend/test_seasonal_rainfall.py`: **4 of 4 tests PASSED** (Exit Code: 0).

### 6.2 Unresolved Concerns & Operational Details
- **CLI vs. LSP Discrepancy:**  
  Pyrefly is packaged as a compiled LSP server binary, not a pip package within the Python environment. Attempting to invoke `python -m pyrefly` in the shell returns **Exit Code 1** (`No module named pyrefly`). CLI validation must rely on Python compilation (`compileall`), automated pytest suites, and reading the IDE extension LSP logs.

---

## 7. Audit Synthesis & Summary Matrix

| Investigation Focus Area | Audit Status | Key Finding | Primary Risk / Unresolved Concern |
| :--- | :--- | :--- | :--- |
| **1. Qualitative Categories** | **VERIFIED** | Liebig's Law of the Minimum strictly enforced at top level; 0–100 score eradicated. | Factor sub-scores use arithmetic mean across crops, potentially diluting single-crop severe deficits. |
| **2. Soil Gap Handling** | **VERIFIED** | `"Other / Unknown"` yields `Moderate`, not `Optimal`. | Missing profile `soil_type` defaults to `"Laterite soil"`, which can yield `Optimal` for laterite-adapted crops. |
| **3. Vertisol / Laterite Moisture** | **VERIFIED** | Fixed rainfall bonuses removed; Vertisol vs. Laterite distinction grounded in ICAR agronomy. | Internal scores ($16$ vs. $12$) remain heuristic constants; TAW physics modeling (F-05) remains disabled. |
| **4. Rabi Coverage & Telemetry** | **VERIFIED** | 4 months (Nov–Feb) evaluated; daily partial observations and 30-year climatology clearly labeled. | Single calendar-year daily data combines Jan/Feb of start year with Nov/Dec of end year. |
| **5. NASA Fallback Coordinates** | **VERIFIED** | Queries farm coordinates (e.g. Agumbe); silent Shivamogga fallback completely eliminated; HTTP 503 on dual failure. | Farms created with NULL coordinates fall back to Shivamogga coordinates (`13.9299, 75.5681`) without a validation prompt. |
| **6. Pyrefly Diagnostics** | **VERIFIED** | All warnings cleared (0 diagnostics across all files); Python 3.11 `compileall` returns Exit Code 0. | Pyrefly is an IDE LSP daemon, not a pip CLI utility; shell execution requires `compileall` or LSP log inspection. |

---

## 8. Actionable Recommendations for Phase 7.9B / Phase 8

1. **Refactor Factor Aggregation to Strict Minimum:**  
   Replace `sum(scores) / len(scores)` with a minimum-status evaluator across crops in `compare_rotation_scenarios()` so that a crop experiencing severe drought or disease susceptibility automatically sets that factor to `Challenging`.
2. **Add "Insufficient data" Soil State:**  
   When `farm.soil_type` is `"Other / Unknown"` or unspecified, classify soil compatibility as `Insufficient data` rather than assuming `Moderate`.
3. **Mandatory Coordinate Validation:**  
   Require valid decimal degrees for latitude and longitude in `farm_profiles` before enabling NASA POWER satellite climate integration.
4. **Implement Physical TAW Modeling (Phase 8):**  
   Once horizon-specific soil hydraulic properties are integrated, calculate numerical available water capacity and root-zone water balance to replace heuristic sub-scores.

---
*Report certified by Antigravity AI – Independent Verification Suite.*
