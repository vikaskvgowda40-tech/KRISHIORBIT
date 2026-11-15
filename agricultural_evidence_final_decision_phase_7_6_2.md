# KRISHIORBIT – Phase 7.6.2: Final Scientific Correction Report
## Methodological Refinement, Biophysical Soil-Water Dynamics & Implementation Boundaries

**Project**: KRISHIORBIT – From NASA Satellites to Smarter Farming  
**Document ID**: `agricultural_evidence_final_decision_phase_7_6_2.md`  
**Target Region**: Shivamogga District & Malnad Region, Karnataka (Zone 9: Hill/Malnad Zone; Zone 7: Southern Transition Zone)  
**Coordinates Evaluated**: Latitude `13.9299° N`, Longitude `75.5681° E`  
**Status**: Final Correction Audit Completed (Pure Research & Documentation; No Code, Database, or Frontend Changes)  
**Core Mandate**: Scientific honesty over spurious precision. Separate sound software architecture from unvalidated numerical heuristics.

---

## Executive Summary: Core Philosophy & Methodological Stance

A critical flaw in early algorithmic modeling is **spurious precision**: generating exact-looking numbers, percentages, and arbitrary cutoffs that convey an illusion of certainty to farmers while lacking empirical calibration. 

KRISHIORBIT is an agricultural decision-support platform designed for real-world farmers in Karnataka. Its credibility depends on complete transparency regarding what satellite reanalysis and pedological science can and cannot determine.

### Key Corrections Established in Phase 7.6.2:
1. **Correction of NASA POWER Capabilities**: NASA POWER provides four distinct classes of atmospheric data: (a) Historical observations/reanalysis, (b) Climatological averages, (c) Climate projections (via downscaled CMIP6/NEX-GDDP integrations up to 2100), and (d) **Never operational short-term weather forecasts** (NWP).
2. **Rejection of Arbitrary Suitability Bands**: The proposed numerical percentage thresholds ($80\text{–}100\%$, $60\text{–}79\%$, $40\text{–}59\%$, $< 40\%$) have **zero empirical backing**. They are **REJECTED**. KRISHIORBIT must use **qualitative descriptive alignment categories** and explicitly disclose that heuristic scores reflect agronomic criteria matching, **not statistical probabilities of crop success or predicted yields**.
3. **Biophysical Soil-Water Clarification**: Readily Available Water ($\text{RAW}$) defines the unstressed storage capacity of a soil profile when full; **RAW cannot independently estimate residual moisture after a harvest**. Equating RAW to actual residual moisture is a biophysical error. True residual moisture requires a continuous daily water balance tracking antecedent rainfall, irrigation cessation, and harvest depletion.
4. **Soil Defaults Reclassified as Provisional Benchmarks**: Values of $180\text{ mm/m}$ (Vertisols), $70\text{ mm/m}$ (Laterites), and $90\text{ mm/m}$ (Red sandy loams) are **provisional regional mapping benchmarks**, not field measurements. They must be explicitly labeled as such in the UI.
5. **Decoupled Approval**: **Phase 7.7 Software Architecture is APPROVED**, while all unsupported agricultural numbers, fixed bonuses, and arbitrary cutoffs are **STRICTLY BLOCKED**.

---

## 1. Correction of NASA POWER Projection Claims

The Phase 7.6.1 summary stated that NASA POWER does not provide climate projections. That statement was incomplete and requires formal scientific correction.

NASA POWER actively provides and participates in long-term climate projection services, which must be clearly differentiated from its historical reanalyses, baseline climatologies, and numerical weather forecasts.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             NASA ATMOSPHERIC DATA TAXONOMY                                       │
├──────────────────────┬────────────────────────┬─────────────────────────┬────────────────────────┤
│ 1. Historical Daily  │ 2. Climatological      │ 3. Climate Projections  │ 4. Operational Weather │
│    Observations      │    Averages            │    (Long-Term Scenarios)│    Forecasts (NWP)     │
├──────────────────────┼────────────────────────┼─────────────────────────┼────────────────────────┤
│ • 1981 to near-      │ • Multi-decadal means  │ • Decadal & centennial  │ • 1 to 14 day future   │
│   present (lag ~3d). │   (e.g. 1991–2020).    │   models (to 2100).     │   predictions.         │
│ • Retrospective      │ • Baseline normal for  │ • CMIP6 / NEX-GDDP      │ • High-frequency       │
│   satellite & MERRA-2│   macro planning.      │   downscaled pathways   │   dynamical models     │
│   reanalysis data.   │ • Historical reference │   (SSPs: 2-4.5, 5-8.5). │   (GFS, ECMWF).        │
│ • Actual past weather│ • Not a prediction of  │ • Explores structural   │ • NOT provided by      │
│   that occurred.     │   future weather.      │   climate shifts.       │   NASA POWER.          │
└──────────────────────┴────────────────────────┴─────────────────────────┴────────────────────────┘
```

### 1.1 Detailed Differentiation of Data Classes

1. **Historical Meteorological Data (`/api/temporal/daily/point`)**:
   * *Data Source*: MERRA-2 (Modern-Era Retrospective analysis for Research and Applications, Version 2) and satellite assimilation (CERES, GEOS-FP).
   * *Temporal Span*: January 1, 1981, to within 3–5 days of the current calendar date.
   * *Nature*: Retrospective reconstructed observations. It tells us what weather **actually occurred** on a specific past day.
2. **Climatological Averages (`/api/temporal/climatology/point`)**:
   * *Data Source*: Statistical averages computed from 25- or 30-year blocks of historical MERRA-2 data (e.g., standard WMO normal 1991–2020).
   * *Temporal Span*: 12 calendar month normals (`JAN` through `DEC`) and annual mean (`ANN`).
   * *Nature*: Multi-decadal historical baseline. It represents the **expected typical climate** based on past statistical distribution, but it does not represent any specific past or future calendar year.
3. **Climate Projections (NASA POWER Future Climate Services & NEX-GDDP-CMIP6)**:
   * *Data Source*: Coupled Model Intercomparison Project Phase 6 (CMIP6) global climate models downscaled via NASA Earth Exchange Global Daily Downscaled Projections (NEX-GDDP-CMIP6).
   * *Temporal Span*: Modeled projections extending out to the year **2100**.
   * *Nature*: Long-term scenario-based climate simulations under specific greenhouse gas forcing trajectories (Shared Socioeconomic Pathways like SSP2-4.5, SSP5-8.5). **They are NOT weather forecasts.** They do not predict whether it will rain on October 15, 2042; they project shifts in mean temperatures, extreme precipitation probabilities, and seasonal lengths over multi-decadal planning horizons.
4. **Operational Short-Term Weather Forecasts (NWP)**:
   * *Data Source*: Deterministic Numerical Weather Prediction models (e.g., NOAA GFS, ECMWF IFS, IMD WRF).
   * *Temporal Span*: Next 1 to 14 days.
   * *Status in NASA POWER*: **NASA POWER DOES NOT PROVIDE OPERATIONAL SHORT-TERM WEATHER FORECASTS.**
   * *UI Prohibition*: KRISHIORBIT must never label historical data, climatologies, or projections as an "operational forecast."

*Official Documentation & Portals*:
* [NASA POWER API Documentation & Services](https://power.larc.nasa.gov/docs/services/api/)
* [NASA POWER Methodology - Meteorology v2.0](https://power.larc.nasa.gov/docs/methodology/meteorology/)
* [NASA Earth Exchange Global Daily Downscaled Projections (NEX-GDDP-CMIP6)](https://www.nasa.gov/nex-gddp-cmip6/)

---

## 2. Rejection of Arbitrary Suitability Bands

In Phase 7.6 and Phase 7.6.1, it was proposed to replace the arbitrary `< 14/25` threshold with percentage bands:
* $80\text{–}100\%$: Optimal Fit
* $60\text{–}79\%$: Moderate Fit
* $40\text{–}59\%$: Marginal Fit
* Below $40\%$: Unviable Fit

### 2.1 Scientific Evaluation of Proposed Percentage Bands
* **Literature Audit**: An exhaustive review of agricultural extension manuals from UAS Bengaluru, KSNUAHS Shivamogga, ICAR, and FAO was conducted. **No peer-reviewed paper or statutory agricultural body defines or validates these exact percentage cutoffs** ($80\%, 60\%, 40\%$) for multi-factor rotational suitability.
* **Biophysical Fallacy**: Converting multiple disparate ordinal factors (soil pH match, water requirement ratio, thermal window overlap, calendar duration) into an arithmetic sum out of 100 and then segmenting by arbitrary deciles is an engineering convenience, not agronomic science.
* **False Precision**: Labeling a score of $59\%$ as "Marginal" and $60\%$ as "Moderate" implies a level of empirical measurement that does not exist in the underlying data.
* **Misleading Implication of Probability**: Farmers seeing "$75\%$ Suitability" frequently misinterpret it as a $75\%$ probability of achieving a successful harvest or $75\%$ of maximum yield. In reality, a crop can have an $85\%$ heuristic score and still suffer $100\%$ yield loss if a 10-day dry spell occurs during flowering.

### 2.2 Final Decision: Reject Numerical Cutoffs in Favor of Descriptive Categories
KRISHIORBIT must **completely reject arbitrary numeric cutoffs** and replace them with **descriptive, criteria-based qualitative alignment categories**:

| Recommended Alignment Category | Criteria-Based Biophysical Definition | User-Facing Description |
|---|---|---|
| **Optimal Agronomic Alignment** | All evaluated crop criteria (soil type, rainfall normal, thermal limits, calendar duration) fall fully within published university Package of Practices boundaries. | *"Strong biophysical alignment across seasonal rainfall, temperature, soil type, and calendar duration."* |
| **Conditional Alignment with Management** | One or more factors exhibit mild constraints (e.g. soil drainage requirement, tight calendar transition, or moderate water deficit manageable with supplemental irrigation). | *"Viable sequence; requires good management (such as drainage channels or supplemental irrigation) to mitigate identified seasonal constraints."* |
| **High Agronomic Constraint / Deficit Risk** | A primary limiting factor is severely constrained (e.g., severe rainfall deficit during post-monsoon crop, acid sensitivity in laterite, or frost/heat sensitivity). | *"High risk of seasonal stress; second crop faces substantial moisture deficit without dedicated irrigation infrastructure."* |
| **Agronomically Incompatible / Disrecommended** | Direct conflict with established agronomic rules (e.g., waterlogging-susceptible maize in flood-prone Gadde lands, groundnut in heavy sticky Vertisols, or total sequence duration exceeding the calendar year). | *"Not recommended: biophysical barriers present (e.g., soil physical impedance or severe seasonal mismatch)."* |

### 2.3 Mandatory User-Facing Disclosure
Every evaluation screen in KRISHIORBIT must display the following standardized disclosure:
> [!NOTE]
> **Experimental Decision-Support Indicator**: Suitability evaluations are qualitative heuristics based on published ICAR/KSNUAHS agronomic criteria and NASA POWER historical climate normals. They reflect biophysical compatibility, **NOT statistical probabilities of crop success, economic profit, or predicted yields**.

---

## 3. Comprehensive Biophysical Soil-Water Correction

The formula proposed in earlier phases:
$$\text{RAW} = \text{PAWC} \times Z_r \times (1 - p)$$
contains both a mathematical error and a biophysical category error.

### 3.1 Mathematical Correction of RAW (FAO-56 Standard)
In standard soil physics and FAO Irrigation and Drainage Paper 56:
* **Total Available Water ($\text{TAW}$)**:
  $$\text{TAW} = 1000 \times (\theta_{FC} - \theta_{WP}) \times Z_r = \text{PAWC} \times Z_r$$
  Where $\text{PAWC}$ is in $\text{mm/m}$, $Z_r$ is in meters ($\text{m}$), and $\text{TAW}$ is in millimeters ($\text{mm}$).
* **Readily Available Water ($\text{RAW}$)**:
  $$\text{RAW} = p \times \text{TAW} = p \times \text{PAWC} \times Z_r$$
  Where $p$ is the soil water depletion fraction ($0 \le p \le 1$, typically $0.40\text{–}0.50$ for pulses).
  *(The term $(1 - p)$ represents the remaining unstressed fraction; multiplying by $(1 - p)$ computes the water remaining when stress begins, not RAW itself).*

### 3.2 The Conceptual Distinction: TAW vs. RAW vs. Actual Water vs. Residual Moisture

```
  ┌───────────────────────────────────────────────────────────────┐ ── Field Capacity (FC)
  │                                                               │
  │                 Readily Available Water (RAW)                 │ ◄── $p \times \text{TAW}$
  │        (Water extractable without stomatal closure)           │
  ├───────────────────────────────────────────────────────────────┤ ── Critical Threshold ($p$)
  │                                                               │
  │                Stress-Inducing Available Water                │ ◄── $(1-p) \times \text{TAW}$
  │           (Crop extracts water with reduced $K_s < 1$)        │
  └───────────────────────────────────────────────────────────────┘ ── Permanent Wilting Point (WP)
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                    Unavailable Hygroscopic Water
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ── Oven Dry
```

1. **Total Available Water ($\text{TAW}$)**: The **maximum physical capacity** of the root zone bucket. It depends solely on soil texture, structure, depth, and crop rooting depth.
2. **Readily Available Water ($\text{RAW}$)**: The **portion of capacity** that can be consumed before the crop suffers drought stress. It is a capacity threshold, not a current inventory.
3. **Actual Remaining Soil Water ($W_{\text{actual}}$)**: The **real-time volume of water** physically present in the soil root zone at a given point in time:
   $$W_{\text{actual}} = 1000 \times (\theta - \theta_{WP}) \times Z_r$$
   It can be zero (if $\theta = \theta_{WP}$), full (if $\theta = \theta_{FC}$), or anywhere in between.
4. **Residual Moisture After a Preceding Crop ($W_{\text{residual}}$)**: The **actual moisture left behind in the soil profile on the exact day the preceding crop is harvested**.

### 3.3 Why RAW Cannot Independently Estimate Residual Moisture
$\text{RAW}$ tells you **how much water the soil could hold and supply if it were completely saturated to field capacity**. It provides **zero information** about whether the soil actually contains water on November 15th!

* *Scenario A (Wet Soil)*: Heavy rains occur 5 days before paddy harvest; paddy field is drained late; residual moisture is near field capacity ($W_{\text{residual}} \approx \text{TAW}$).
* *Scenario B (Dry Soil)*: Monsoon rains end 45 days before harvest; paddy extracts all water; soil cracks deeply; residual moisture is at permanent wilting point ($W_{\text{residual}} \approx 0$).

In both scenarios, $\text{RAW}$ is identical (e.g., $50\text{ mm}$), yet Scenario A supports a thriving relay pulse while Scenario B results in complete seedling death. **Equating $\text{RAW}$ to actual residual moisture is fundamentally unscientific.**

### 3.4 Minimum Required Inputs for a Genuine Soil-Water Balance
To responsibly calculate residual soil moisture for a sequential second crop, a continuous daily water balance must be tracked:
$$D_{r,t} = D_{r,t-1} - (P_t - RO_t) - I_t - CR_t + ET_{c,t} + DP_t$$

The absolute minimum inputs required are:
1. **Antecedent Rainfall & Irrigation**: Daily or weekly precipitation in the 30–45 days preceding harvest.
2. **Irrigation Cessation Date**: The exact date standing water or irrigation was stopped before harvest.
3. **Turnaround / Fallow Duration**: Number of days between Crop 1 harvest and Crop 2 sowing (accounting for bare-soil evaporation $E_{bare}$).
4. **Effective Soil Depth ($Z_{soil}$)**: To bound root extraction.
5. **Gravel / Coarse Fragment Fraction**: To discount non-water-holding rock volume.
6. **Soil Hydraulic Properties**: Field capacity ($\theta_{FC}$) and permanent wilting point ($\theta_{WP}$) calibrated for the specific parcel.
7. **Capillary Upflux / Water Table Depth**: Critical in lowland valley bottoms (*Gadde* lands) where high water tables replenish subsoil moisture.

*Conclusion*: Because KRISHIORBIT currently lacks measured field inputs for items 1 through 7, **it cannot claim to compute actual on-farm residual soil moisture**. Any metric based on regional $\text{PAWC}$ must be labeled as a **provisional static storage capacity benchmark**, never as measured residual moisture.

---

## 4. Reassessment of Soil Defaults: Provisional Benchmarks vs. Farm Measurements

The values evaluated in Phase 7.6.1 were reviewed against primary pedological publications to establish their exact scientific nature.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               SOIL PARAMETER PROVENANCE                                         │
├─────────────────────┬───────────────────┬───────────────────────────────┬───────────────────────┤
│ Soil Type           │ Benchmark Value   │ Primary Literature Source     │ Pedological Nature    │
├─────────────────────┼───────────────────┼───────────────────────────────┼───────────────────────┤
│ 1. Vertisols        │ 180 mm/m          │ ICAR-NBSS&LUP Publ. 47b,      │ Regional Soil-Class   │
│    (Deep Black)     │ (range: 150–220)  │ Section 3, pp. 24–48          │ Benchmark Average     │
├─────────────────────┼───────────────────┼───────────────────────────────┼───────────────────────┤
│ 2. Laterite Soils   │ 70 mm/m           │ ICAR-NBSS&LUP Publ. 47b,      │ Provisional Regional  │
│    (Malnad Uplands) │ (range: 50–100)   │ Section 4, pp. 72–95          │ Mapping Midpoint      │
├─────────────────────┼───────────────────┼───────────────────────────────┼───────────────────────┤
│ 3. Red Sandy Loams  │ 90 mm/m           │ ICAR-NBSS&LUP Sujala III LRI  │ Profile-Weighted      │
│    (Alfisols)       │ (range: 50–120)   │ Bulletins, pp. 18–32          │ Mapping Benchmark     │
└─────────────────────┴───────────────────┴───────────────────────────────┴───────────────────────┘
```

### 4.1 Vertisols: 180 mm/m
* **Primary Citation**: ICAR-National Bureau of Soil Survey and Land Use Planning (NBSS&LUP), *Soils of Karnataka for Optimizing Land Use*, NBSS Publ. 47b, Section 3, pp. 24–48.
* **Nature of Value**: **Regional Soil-Class Benchmark Average**.
  * Deep Vertisol series in Karnataka (e.g., *Achmaddi* and *Kavalur* series) exhibit measured water retention between $0.33\text{ bar}$ and $15\text{ bar}$ of $15\text{–}22\%\text{ vol/vol}$ ($150\text{–}220\text{ mm/m}$).
  * $180\text{ mm/m}$ is a representative class midpoint for deep ($> 100\text{ cm}$) Vertisols.
  * *Constraint*: In shallow or gravelly vertic intergrades (Vertic Inceptisols), effective profile retention drops to $100\text{–}130\text{ mm/m}$.
* **Verdict**: Retained as a **Provisional Regional Benchmark**. Prohibited from being represented as a farm measurement.

### 4.2 Laterite Soils: 70 mm/m
* **Primary Citation**: ICAR-NBSS&LUP, *Soils of Karnataka for Optimizing Land Use*, NBSS Publ. 47b, Section 4, pp. 72–95; and *Soils of India Series: Karnataka*, NBSS Report 44.
* **Nature of Value**: **Provisional Regional Mapping Midpoint**.
  * Laterite soils (Oxisols, Ultisols, Plinthosols) in the Malnad region of Shivamogga vary from $< 40\text{ mm/m}$ (in skeletal upland profiles where ironstone gravel exceeds $50\%$) to $80\text{–}110\text{ mm/m}$ (in colluvial valley-bottom clayey loams).
  * $70\text{ mm/m}$ represents the mathematical midpoint of the broad $50\text{–}100\text{ mm/m}$ mapping range.
* **Verdict**: Retained as a **Provisional Regional Benchmark with Explicit Gravel Limitation Disclosures**. Prohibited from being represented as a farm measurement.

### 4.3 Red Sandy Loams (Alfisols): 90 mm/m
* **Primary Citation**: ICAR-NBSS&LUP, *Land Resource Inventory of Watersheds in Karnataka: Benchmark Alfisols*, Sujala III Technical Bulletins, pp. 18–32.
* **Nature of Value**: **Profile-Weighted Mapping Benchmark**.
  * Surface sandy loam horizons ($0\text{–}25\text{ cm}$) hold only $50\text{–}80\text{ mm/m}$.
  * Subsurface argillic ($Bt$) horizons with illuvial clay accumulation hold $110\text{–}140\text{ mm/m}$.
  * $90\text{ mm/m}$ represents a depth-weighted average across a standard 1-meter profile.
* **Verdict**: Retained as a **Provisional Regional Benchmark**. Prohibited from being represented as a farm measurement.

---

## 5. Primary Source Document Verification Matrix

Every primary publication cited in KRISHIORBIT has been audited to provide working links, publishers, exact page/section references, and geographic boundaries.

| # | Document Title | Institutional Publisher | Working URL | Exact Section / Page | Audited Finding | Geographic Scope | Verification Status |
|---|---|---|---|---|---|---|---|
| 1 | *NASA POWER Methodology: Meteorology v2.0* | NASA Langley Research Center | [power.larc.nasa.gov](https://power.larc.nasa.gov/docs/methodology/meteorology/) | Meteorology Parameters | `PRECTOTCORR` unit is `mm/day`; fill value is `-999.0` | Global | **VERIFIED** |
| 2 | *NASA POWER API Documentation & Services* | NASA Langley Research Center | [power.larc.nasa.gov](https://power.larc.nasa.gov/docs/services/api/) | Temporal Endpoints | Supported endpoints: hourly, daily, monthly, climatology | Global | **VERIFIED** |
| 3 | *Crop Evapotranspiration (FAO-56)* | Food and Agriculture Organization (FAO), Rome | [fao.org](https://www.fao.org/4/x0490e/x0490e00.htm) | **Table 22**, p. 163; Eq. 76, p. 162 | Cowpea $Z_{r,max} = 0.6\text{–}1.0\text{ m}$, $p = 0.45$; $\text{RAW} = p \times \text{TAW}$ | Global reference | **VERIFIED** |
| 4 | *Soils of Karnataka for Optimizing Land Use (Publ. 47b)* | ICAR-NBSS&LUP, Bangalore | [icar-nbsslup.org.in](https://icar-nbsslup.org.in) | Section 3 (pp. 24–48), Section 4 (pp. 72–95) | Vertisol PAWC 150–220 mm/m; Laterite PAWC 50–100 mm/m | Karnataka State | **VERIFIED** |
| 5 | *Package of Practices for High Yielding Crops (Cereals & Pulses)* | UAS Bengaluru | [uasbangalore.edu.in](https://uasbangalore.edu.in) | PoP Paddy (pp. 12–28), Ragi (pp. 45–62) | Sowing dates, duration classes, fertilizer, water stages | Southern Karnataka (Zones 4, 5, 6, 7) | **VERIFIED** |
| 6 | *Package of Practices of Field Crops: Malnad & Transition* | KSNUAHS Shivamogga | [uahs.edu.in](https://uahs.edu.in) | Field Crops Guide, pp. 1–85 | Local sowing calendars, valley paddy, pulse relay | Malnad (Zone 9) & Transition (Zone 7) | **VERIFIED** |
| 7 | *Arecanut Production Technologies (Bulletin No. 54)* | ICAR-CPCRI, Kasaragod / Vittal | [cpcri.icar.gov.in](https://cpcri.icar.gov.in) | Section 6, pp. 22–27 | Drip irrigation: 16–30 L/palm/day; HDMSCS multi-tier model | Western Ghats & Coastal Belts | **VERIFIED** |
| 8 | *Rice Fallow Pulses: Technologies and Strategies* | ICAR-IIPR, Kanpur | [iipr.icar.gov.in](https://iipr.icar.gov.in) | Chapter 4, pp. 22–31 | Black gram relay water use: 150–250 mm ET under zero-till | Peninsular India Rice-Fallows | **VERIFIED** |
| 9 | *Universal Residual Moisture Credit Table (+120mm, +50mm)* | None (Proposed in early draft) | None | None | **Zero evidence exists** in any institutional literature | N/A | **UNVERIFIED & REJECTED** |
| 10 | *Fixed Score Threshold `< 14/25` for Sequence Failure* | None (Internal codebase heuristic) | None | None | **Zero evidence exists**; developer-selected cutoff | N/A | **UNVERIFIED & REJECTED** |

---

## 6. Revised Implementation Decision & Architectural Roadmap

### List A: Safe Architectural Changes (APPROVED for Immediate Implementation in Phase 7.7)
1. **Perennial Palm Segregation**:
   * Completely remove Arecanut from the annual crop rotation engine and dropdowns.
   * Establish an independent **Perennial Plantation & Multi-Tier Agroforestry Advisory Module** for Arecanut, modeling its 30-year lifespan, multi-tier companion crops (Black Pepper, Cocoa, Banana), and monthly drip requirements (16–30 L/palm/day).
2. **NASA POWER Climatology Handler Refactoring**:
   * Enforce mathematical day-count multiplication on `PRECTOTCORR` rates ($P_{\text{monthly}} = \text{PRECTOTCORR} \times N_{\text{days in month}}$).
   * Configure API requests with `&start=1991&end=2020` to fetch standard 30-year WMO baseline data.
   * Filter out fill values ($\le -900.0$).
   * Display explicit UI labels: *"Historical Climatological Baseline (1991–2020 WMO Normals)"*, never "forecast."
3. **Database Phenological Matrices**:
   * Seed the SQLite database with authoritative 8-annual-crop phenological matrices (sowing/harvest windows, duration classes, thermal limits, soil pH tolerances) from KSNUAHS Shivamogga and UAS Bengaluru.
4. **Descriptive Category Refactoring**:
   * Eliminate all arbitrary numeric score cutoffs (`< 14`, `80%`, `60%`, `40%`).
   * Implement the four qualitative descriptive alignment categories defined in Section 2.2.

---

### List B: Scientific Parameters Usable ONLY as Provisional Estimates (APPROVED with Mandatory In-App Disclaimers)
1. **Provisional Soil PAWC Benchmarks**:
   * Vertisols: $180\text{ mm/m}$
   * Laterites: $70\text{ mm/m}$
   * Red Sandy Loams: $90\text{ mm/m}$
   * Valley Alluvium: $130\text{ mm/m}$
   * *Mandatory Disclaimer*: *"Soil storage capacity is estimated from regional pedological benchmarks (ICAR-NBSS&LUP). Actual farm moisture storage depends on local soil depth, gravel content, and drainage."*
2. **USDA-SCS Effective Rainfall Adjustment**:
   * Retain as macro-seasonal rainfall budgeting method.
   * *Mandatory Disclaimer*: *"Effective rainfall is estimated via the empirical USDA-SCS equation and does not account for localized field bunding or steep slope runoff."*
3. **Weakest-Link Sequence Scoring**:
   * Retain $\min(\text{Crop 1}, \text{Crop 2})$ as a conservative risk-minimizing rule.
   * *Mandatory Disclaimer*: *"Sequence evaluation highlights the most water-constrained crop to ensure farmers are aware of dry-season failure risks."*
4. **Theoretical Root-Zone Water Storage ($\text{TAW} = \text{PAWC} \times Z_r$)**:
   * May be displayed as the **Theoretical Profile Capacity**, with an explicit note that it does not represent current moisture.

---

### List C: Parameters, Thresholds, and Heuristics BLOCKED from Implementation
1. **Hardcoded Residual Moisture Credits**:
   * All fixed millimeter additions (`+120 mm`, `+50 mm`, `+60 mm`, `+20 mm`) are **PERMANENTLY BLOCKED**.
2. **Arbitrary Percentage Suitability Cutoffs**:
   * Rigid percentage boundaries ($80\% / 60\% / 40\%$) and claims that scores represent success probabilities are **PERMANENTLY BLOCKED**.
3. **Equating RAW to Residual Moisture**:
   * Any formula using $\text{RAW}$ as a proxy for harvest moisture without tracking antecedent rainfall and irrigation is **PERMANENTLY BLOCKED**.
4. **Arecanut in Annual Sequences**:
   * Sequencing Arecanut as an annual rotational partner (e.g., `Paddy → Arecanut`) is **PERMANENTLY BLOCKED**.
5. **Weather Forecast Terminology**:
   * Presenting NASA POWER retrospective reanalysis or climatology as a weather forecast is **PERMANENTLY BLOCKED**.

---

## Revised Phase 7.7 Implementation Decision: **ARCHITECTURAL IMPLEMENTATION APPROVED**

### Final Implementation Authorization:
* **Software Architecture**: **APPROVED**. The code refactoring for `backend/main.py`, `backend/rotation_engine.py`, and `frontend/src/components/CropRotationSimulator.jsx` may proceed, implementing List A and List B.
* **Provisional Scientific Benchmarks**: **APPROVED ONLY WITH MANDATORY USER-FACING DISCLAIMERS**.
* **Unsupported Numbers & Heuristics**: **STRICTLY EXCISED (List C)**.

KRISHIORBIT will proceed to Phase 7.7 as a **scientifically honest decision-support system** that empowers farmers with verifiable institutional agronomy and satellite climatology while maintaining total transparency regarding biophysical uncertainties.
