"""
KRISHIORBIT – Crop Rotation Simulation & Agronomic Comparison Engine
===================================================================
Connects:
  1. Saved Farm Profiles (SQLite)
  2. NASA POWER Agroclimatology Data (Real observation estimates)
  3. ICAR & UAS Bengaluru Scientific Crop Database (9 verified crops)

Evaluates:
  - Soil physical and chemical compatibility
  - Thermal boundaries against NASA POWER observations
  - Precipitation and irrigation alignment
  - Crop-to-crop sequence dynamics (cereal-legume rotation, N2 fixation, disease disruption)
  - Seasonal duration and calendar feasibility
  - Alignment with farmer's stated primary agricultural priority

Provides transparent scientific disclosures, assumptions, uncertainties, and heuristics.
Does NOT fabricate yields, profits, fertilizer savings, or guaranteed nitrogen credits.
"""

from typing import Dict, List, Any, Optional
import re


def _parse_duration_days(duration_str: str) -> int:
    """Extract approximate middle duration in days from text like '110–150 days'."""
    if not duration_str or "perennial" in duration_str.lower():
        return 365
    nums = [int(n) for n in re.findall(r"\b\d+\b", duration_str)]
    if len(nums) >= 2:
        return (nums[0] + nums[1]) // 2
    elif len(nums) == 1:
        return nums[0]
    return 90


def _parse_water_bounds_mm(water_str: str) -> tuple[float, float]:
    """Extract low and high water requirement bounds in mm."""
    if not water_str:
        return (400.0, 700.0)
    nums = [float(n) for n in re.findall(r"\b\d+\b", water_str)]
    if len(nums) >= 2:
        return (float(nums[0]), float(nums[1]))
    elif len(nums) == 1:
        return (float(nums[0]) * 0.8, float(nums[0]) * 1.2)
    return (400.0, 700.0)


def evaluate_soil_compatibility(farm_soil: str, crop: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate crop suitability against farm soil type based on ICAR/UAS package of practices.
    Returns status ('Optimal', 'Moderate', 'Challenging'), points (0-25), and detailed rationale.
    """
    farm_soil_clean = (farm_soil or "Other / Unknown").strip().lower()
    crop_soils = (crop.get("suitable_soils") or "").lower()
    crop_name = crop.get("crop_name", "")

    # Specific agronomic knowledge matching
    score = 16
    status = "Moderate"
    rationale = f"{crop_name} demonstrates reasonable adaptation to {farm_soil} under sound soil management."

    if "laterite" in farm_soil_clean:
        if "laterite" in crop_soils:
            score = 25
            status = "Optimal"
            rationale = (
                f"{crop_name} is exceptionally well adapted to Western Ghats Laterite soils. "
                "Crops with acidity tolerance and good drainage response thrive in this soil type."
            )
        elif "black" in crop_soils and "laterite" not in crop_soils:
            score = 14
            status = "Challenging"
            rationale = (
                f"{crop_name} typically thrives in heavy, neutral-to-alkaline black soils. "
                "Laterite soils in Malnad are often acidic (pH 4.8–6.0) with high iron/aluminum oxide content, "
                "requiring lime or dolomite application and phosphorus buffering."
            )
        else:
            score = 20
            status = "Moderate"
            rationale = f"{crop_name} can be grown in laterite soils with adequate organic manure and moisture conservation."

    elif "red" in farm_soil_clean:
        if "red" in crop_soils:
            score = 25
            status = "Optimal"
            rationale = (
                f"{crop_name} has high affinity for red loamy/sandy soils, benefiting from good aeration "
                "and friable structure for root elongation."
            )
        elif "clay" in crop_soils and "red" not in crop_soils:
            score = 16
            status = "Moderate"
            rationale = f"{crop_name} prefers heavier clay soils with higher water retention, but succeeds in red soil with irrigation."
        else:
            score = 22
            status = "Optimal"
            rationale = f"Red soil provides favorable physical tilth for {crop_name} cultivation."

    elif "black" in farm_soil_clean:
        if "black" in crop_soils or "clay" in crop_soils:
            score = 25
            status = "Optimal"
            rationale = (
                f"{crop_name} thrives in deep black cotton / vertisol soils with high moisture retention "
                "and natural base saturation."
            )
        elif "groundnut" in crop_name.lower():
            score = 14
            status = "Challenging"
            rationale = (
                "Heavy sticky black clay creates severe resistance to gynophore (peg) penetration and complicates "
                "pod excavation during harvest, causing high pod shedding."
            )
        else:
            score = 18
            status = "Moderate"
            rationale = f"{crop_name} tolerates black soil provided deep drainage channels prevent water stagnation."

    elif "alluvial" in farm_soil_clean:
        score = 24
        status = "Optimal"
        rationale = (
            f"Alluvial valley soils offer balanced texture, high natural fertility, and favorable water holding capacity for {crop_name}."
        )

    elif "sandy" in farm_soil_clean:
        if "sandy" in crop_soils:
            score = 23
            status = "Optimal"
            rationale = f"Light textured sandy loam offers low mechanical impedance for {crop_name} root systems."
        elif "paddy" in crop_name.lower():
            score = 12
            status = "Challenging"
            rationale = (
                "Sandy soils suffer from excessively high percolation rates, making standard puddle ponding for rice "
                "inefficient without substantial clay amendment or aerobic management."
            )
        else:
            score = 16
            status = "Moderate"
            rationale = f"Sandy soil requires split fertilizer applications and frequent irrigation due to rapid leaching."

    else:
        score = 18
        status = "Moderate"
        rationale = f"General soil suitability reported for {crop_name}: {crop.get('suitable_soils', 'Standard agricultural soils')}."

    return {
        "status": status,
        "score": score,
        "max_score": 25,
        "farm_soil": farm_soil,
        "suitable_soils_reference": crop.get("suitable_soils", "Not specified"),
        "rationale": rationale
    }


# ==============================================================================
# CANONICAL AGRO-CLIMATIC SEASONS FOR KARNATAKA (ICAR & UAS BENGALURU)
# ==============================================================================
SEASON_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "Kharif": {
        "display_name": "Kharif (Monsoon)",
        "window_description": "June to October (South-West Monsoon)",
        "months": ["06", "07", "08", "09", "10"],
        "month_names": ["June", "July", "August", "September", "October"],
        "source": "UAS Bengaluru & ICAR Package of Practices for Karnataka",
        "characteristics": "High precipitation period delivering 70–85% of annual rainfall; primary cropping window for cereals and kharif pulses."
    },
    "Rabi": {
        "display_name": "Rabi (Post-Monsoon / Winter)",
        "window_description": "November to February (Post-Monsoon / Dry Winter)",
        "months": ["11", "12", "01", "02"],
        "month_names": ["November", "December", "January", "February"],
        "source": "UAS Bengaluru & ICAR-IIPR (Rice-Fallow Pulses Protocol)",
        "characteristics": "Low in-season precipitation; rainfed cropping relies heavily on residual subsoil moisture from the preceding Kharif or supplemental irrigation."
    },
    "Summer": {
        "display_name": "Summer (Pre-Monsoon / Dry)",
        "window_description": "March to May (Pre-Monsoon Dry Season)",
        "months": ["03", "04", "05"],
        "month_names": ["March", "April", "May"],
        "source": "UAS Bengaluru Department of Agronomy",
        "characteristics": "High evaporative demand and temperatures; negligible reliable rain; unviable for rainfed field crops without assured irrigation."
    },
    "Perennial": {
        "display_name": "Perennial (Full Year)",
        "window_description": "January to December (Year-Round)",
        "months": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
        "month_names": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        "source": "ICAR - CPCRI Kasaragod & UAHS Shivamogga",
        "characteristics": "Multi-year commercial palm system requiring continuous year-round water management and dry season protective irrigation."
    }
}


def assign_crop_seasons(
    starting_season: str,
    sequence_crops: List[Dict[str, Any]]
) -> List[str]:
    """
    Assign each sequential crop to its chronological season in Karnataka's agricultural calendar.
    Cycle: Kharif -> Rabi -> Summer -> Kharif ...
    Perennial crops (e.g. Arecanut) are always assigned 'Perennial'.
    """
    season_cycle = ["Kharif", "Rabi", "Summer"]
    start_clean = (starting_season or "Kharif").strip().capitalize()
    if start_clean not in season_cycle:
        start_clean = "Kharif"
    start_idx = season_cycle.index(start_clean)

    assigned: List[str] = []
    cycle_offset = 0

    for crop in sequence_crops:
        crop_name = (crop.get("crop_name") or "").lower()
        crop_seasons = (crop.get("suitable_seasons") or "").lower()
        if "perennial" in crop_seasons or "arecanut" in crop_name:
            assigned.append("Perennial")
        else:
            season = season_cycle[(start_idx + cycle_offset) % len(season_cycle)]
            assigned.append(season)
            cycle_offset += 1

    return assigned


def _extract_seasonal_climate(
    climate: Dict[str, Any],
    assigned_season: str
) -> Dict[str, Any]:
    """
    Extract NASA POWER monthly precipitation and thermal observations matching the active seasonal window.
    Detects complete vs partial records and accounts for trailing observation latency.
    """
    season_key = assigned_season if assigned_season in SEASON_DEFINITIONS else "Kharif"
    s_def = SEASON_DEFINITIONS[season_key]
    target_months: List[str] = s_def["months"]
    target_month_names: List[str] = s_def["month_names"]

    monthly_summary: List[Dict[str, Any]] = climate.get("monthly_summary", [])
    annual_summary: Dict[str, Any] = climate.get("annual_summary", {})

    seasonal_precip = 0.0
    matched_t2m: List[float] = []
    matched_t2m_max: List[float] = []
    matched_t2m_min: List[float] = []
    months_found: List[str] = []
    days_recorded_total = 0

    if monthly_summary:
        for m in monthly_summary:
            m_code = ""
            m_str = str(m.get("month", ""))
            if "-" in m_str:
                parts = m_str.split("-")
                if len(parts) >= 2:
                    m_code = parts[1]
            elif len(m_str) == 6:
                m_code = m_str[4:6]

            if m_code in target_months:
                p_val = m.get("total_precipitation_mm")
                if isinstance(p_val, (int, float)):
                    seasonal_precip += float(p_val)

                t_avg = m.get("avg_temperature_c")
                if isinstance(t_avg, (int, float)):
                    matched_t2m.append(float(t_avg))

                t_max = m.get("avg_max_temperature_c")
                if isinstance(t_max, (int, float)):
                    matched_t2m_max.append(float(t_max))

                t_min = m.get("avg_min_temperature_c")
                if isinstance(t_min, (int, float)):
                    matched_t2m_min.append(float(t_min))

                m_name = m.get("month_name", m_str)
                if m_name not in months_found:
                    months_found.append(m_name)

                d_rec = m.get("days_recorded", 0)
                if isinstance(d_rec, int):
                    days_recorded_total += d_rec

    missing_month_names = [name for name in target_month_names if name not in months_found]
    is_partial = len(missing_month_names) > 0 or not monthly_summary

    if not monthly_summary:
        ann_precip_raw = annual_summary.get("total_precipitation_mm", 0.0)
        ann_precip = float(ann_precip_raw) if isinstance(ann_precip_raw, (int, float)) else 0.0

        if season_key == "Kharif":
            seasonal_precip = round(ann_precip * 0.75, 2)
        elif season_key == "Rabi":
            seasonal_precip = round(ann_precip * 0.08, 2)
        elif season_key == "Summer":
            seasonal_precip = round(ann_precip * 0.17, 2)
        else:
            seasonal_precip = round(ann_precip, 2)

        raw_t2m = annual_summary.get("avg_temperature_c", 25.0)
        seasonal_t2m = float(raw_t2m) if isinstance(raw_t2m, (int, float)) else 25.0
        raw_max = annual_summary.get("max_temperature_recorded_c", 38.0)
        seasonal_max = float(raw_max) if isinstance(raw_max, (int, float)) else 38.0
        raw_min = annual_summary.get("min_temperature_recorded_c", 14.0)
        seasonal_min = float(raw_min) if isinstance(raw_min, (int, float)) else 14.0

        data_note = (
            f"Monthly summary not found in climate record; estimated proportional seasonal rainfall ({seasonal_precip:.1f} mm) "
            "from cumulative observations with high uncertainty."
        )
    else:
        seasonal_precip = round(seasonal_precip, 2)

        if matched_t2m:
            seasonal_t2m = round(sum(matched_t2m) / len(matched_t2m), 2)
        else:
            raw_t2m = annual_summary.get("avg_temperature_c", 25.0)
            seasonal_t2m = float(raw_t2m) if isinstance(raw_t2m, (int, float)) else 25.0

        if matched_t2m_max:
            seasonal_max = round(max(matched_t2m_max), 2)
        else:
            raw_max = annual_summary.get("max_temperature_recorded_c", 38.0)
            seasonal_max = float(raw_max) if isinstance(raw_max, (int, float)) else 38.0

        if matched_t2m_min:
            seasonal_min = round(min(matched_t2m_min), 2)
        else:
            raw_min = annual_summary.get("min_temperature_recorded_c", 14.0)
            seasonal_min = float(raw_min) if isinstance(raw_min, (int, float)) else 14.0

        if missing_month_names:
            data_note = (
                f"Partial seasonal observations: {len(months_found)} of {len(target_month_names)} months evaluated "
                f"({', '.join(months_found)}). Missing: {', '.join(missing_month_names)} "
                "(unassimilated or outside current observation window)."
            )
        else:
            data_note = f"Complete seasonal observation record: {len(months_found)} of {len(target_month_names)} months evaluated."

    return {
        "season_key": season_key,
        "display_name": s_def["display_name"],
        "window_description": s_def["window_description"],
        "seasonal_rainfall_mm": seasonal_precip,
        "months_evaluated": months_found,
        "months_missing": missing_month_names,
        "days_recorded": days_recorded_total,
        "is_partial_data": is_partial,
        "data_completeness_note": data_note,
        "seasonal_avg_temp_c": seasonal_t2m,
        "seasonal_max_temp_c": seasonal_max,
        "seasonal_min_temp_c": seasonal_min,
        "characteristics": s_def["characteristics"],
        "source": s_def["source"]
    }


def evaluate_climate_suitability(
    crop: Dict[str, Any],
    climate: Dict[str, Any],
    irrigation_type: str,
    farm_soil: str = "Laterite soil",
    assigned_season: str = "Kharif"
) -> Dict[str, Any]:
    """
    Evaluate seasonal temperature and precipitation boundaries from NASA POWER observations and irrigation capability.
    Replaces cumulative annual YTD rainfall with season-specific rainfall aligned with UAS Bengaluru & ICAR calendars.
    """
    annual_summary = climate.get("annual_summary", {})
    raw_ann_precip = annual_summary.get("total_precipitation_mm", 0.0)
    rainfall_ytd = float(raw_ann_precip) if isinstance(raw_ann_precip, (int, float)) else 0.0

    crop_name = crop.get("crop_name", "")
    temp_spec = crop.get("temperature_suitability_c", "")
    water_spec = crop.get("water_requirement", "")
    rainfall_spec = crop.get("rainfall_suitability_mm", "")

    # Parse crop water requirement bounds
    low_water, high_water = _parse_water_bounds_mm(water_spec)

    # Extract seasonal NASA POWER climate metrics
    s_clim = _extract_seasonal_climate(climate, assigned_season)
    seasonal_precip = s_clim["seasonal_rainfall_mm"]
    seasonal_t2m = s_clim["seasonal_avg_temp_c"]
    seasonal_max = s_clim["seasonal_max_temp_c"]
    seasonal_min = s_clim["seasonal_min_temp_c"]

    # 1. Thermal alignment (Max 20 pts)
    thermal_score = 18
    thermal_status = "Optimal"
    thermal_rationale = (
        f"NASA seasonal observed mean temperature of {seasonal_t2m}°C (range {seasonal_min}°C–{seasonal_max}°C during {s_clim['display_name']}) "
        f"aligns with published agronomic limits for {crop_name} ({temp_spec})."
    )

    if seasonal_max and seasonal_max > 38.0 and any(w in crop_name.lower() for w in ["paddy", "maize", "soybean"]):
        thermal_score = 14
        thermal_status = "Moderate"
        thermal_rationale = (
            f"Peak recorded temperature of {seasonal_max}°C approaches critical thermal thresholds for {crop_name} "
            "(temperatures > 35°C during flowering/silking induce spikelet or pollen sterility)."
        )
    elif seasonal_min and seasonal_min < 16.0 and any(w in crop_name.lower() for w in ["black gram", "green gram", "groundnut"]):
        thermal_score = 15
        thermal_status = "Moderate"
        thermal_rationale = (
            f"Cool winter night temperatures ({seasonal_min}°C minimum recorded during {s_clim['display_name']}) "
            f"retard vegetative elongation and slow nodulation in {crop_name}."
        )

    # 2. Water & Irrigation alignment (Max 25 pts) - SEASONAL EVALUATION
    is_irrigated = any(i in irrigation_type.lower() for i in ["borewell", "canal", "drip", "sprinkler", "mixed", "open well"])
    farm_soil_clean = (farm_soil or "Laterite soil").strip().lower()
    has_heavy_soil = any(s in farm_soil_clean for s in ["black", "clay", "vertisol", "alluvial"])

    water_score = 20
    water_status = "Moderate"
    water_rationale = ""
    residual_moisture_dependency = False

    if is_irrigated:
        # Irrigated systems: irrigation reliably buffers seasonal deficits
        if assigned_season == "Perennial":
            water_score = 23
            water_status = "Optimal"
            water_rationale = (
                f"Controlled {irrigation_type} reliably sustains perennial water requirement ({low_water:.0f}–{high_water:.0f} mm / 15–20 L/palm/day) "
                f"through extended dry months. NASA observed annual rainfall ({rainfall_ytd:.1f} mm) replenishes aquifer storage."
            )
        elif seasonal_precip >= low_water:
            water_score = 24
            water_status = "Optimal"
            water_rationale = (
                f"Controlled irrigation ({irrigation_type}) buffers crop water requirement ({low_water:.0f}–{high_water:.0f} mm). "
                f"High seasonal precipitation ({seasonal_precip:.1f} mm observed in {s_clim['display_name']}) provides primary moisture, "
                "significantly reducing groundwater pumping demand and power costs."
            )
        else:
            water_score = 22
            water_status = "Optimal"
            water_rationale = (
                f"Low in-season precipitation ({seasonal_precip:.1f} mm observed in {s_clim['display_name']}) is fully buffered "
                f"by controlled {irrigation_type} to meet {crop_name}'s water requirement ({low_water:.0f}–{high_water:.0f} mm). "
                "Continuous irrigation during dry months requires dependable water table access."
            )
    else:
        # Rainfed systems: critically dependent on in-season rainfall and residual soil moisture
        if assigned_season == "Perennial":
            water_score = 13
            water_status = "Challenging"
            water_rationale = (
                f"Arecanut requires 1500–2500 mm distributed precipitation. In rainfed Malnad tracts, prolonged 5–6 month dry spells "
                f"(observed annual rainfall {rainfall_ytd:.1f} mm) cause severe moisture stress, crown wilting, and premature nut drop without supplemental basin irrigation."
            )
        elif assigned_season == "Kharif":
            if "paddy" in crop_name.lower():
                if seasonal_precip >= 1000:
                    water_score = 22
                    water_status = "Optimal"
                    water_rationale = (
                        f"Rainfed Kharif monsoon rainfall ({seasonal_precip:.1f} mm observed) delivers adequate water depth "
                        f"for lowland paddy valleys (1100–1400 mm required)."
                    )
                else:
                    water_score = 16
                    water_status = "Moderate"
                    water_rationale = (
                        f"Observed Kharif rainfall ({seasonal_precip:.1f} mm in June–October) provides substantial base moisture, "
                        f"but falls below the 1100–1400 mm threshold for continuous standing water ponding. "
                        "Rainfed paddy succeeds in low-lying valley floors (bailu); mid-season dry breaks risk moisture stress at panicle initiation."
                    )
            elif any(w in crop_name.lower() for w in ["ragi", "black gram", "green gram", "cowpea"]):
                water_score = 25
                water_status = "Optimal"
                water_rationale = (
                    f"{crop_name} is drought-hardy with modest seasonal demand ({low_water:.0f}–{high_water:.0f} mm). "
                    f"Observed Kharif rainfall ({seasonal_precip:.1f} mm) fully satisfies its crop water requirements."
                )
            else:
                water_score = 22
                water_status = "Optimal"
                water_rationale = (
                    f"Observed Kharif rainfall ({seasonal_precip:.1f} mm) aligns well with {crop_name}'s seasonal water requirement "
                    f"({low_water:.0f}–{high_water:.0f} mm)."
                )
        elif assigned_season == "Rabi":
            # Post-monsoon / winter: low in-season rainfall (typically 20–60 mm)
            residual_moisture_dependency = True
            if has_heavy_soil:
                water_score = 16
                water_status = "Moderate"
                water_rationale = (
                    f"Severe in-season rainfall deficit: Observed Rabi precipitation is only {seasonal_precip:.1f} mm against {low_water:.0f}–{high_water:.0f} mm required by {crop_name}. "
                    f"Under rainfed conditions, cultivation is strictly dependent on residual moisture stored in {farm_soil} from the preceding Kharif monsoon. "
                    "Timely post-harvest relay sowing (before plow layer dries) is imperative for root establishment."
                )
            else:
                water_score = 12
                water_status = "Challenging"
                water_rationale = (
                    f"Critical seasonal moisture deficit: Observed Rabi rainfall is only {seasonal_precip:.1f} mm against {low_water:.0f}–{high_water:.0f} mm required by {crop_name}. "
                    f"In {farm_soil}, rapid drainage and low moisture retention capacity make rainfed post-monsoon cropping highly vulnerable to terminal drought "
                    "during flowering and pod set without supplemental protective irrigation."
                )
        else:  # Summer
            water_score = 8
            water_status = "Challenging"
            water_rationale = (
                f"Severe seasonal moisture deficit: Observed summer rainfall ({seasonal_precip:.1f} mm) is critically inadequate for {crop_name} "
                f"({low_water:.0f}–{high_water:.0f} mm required), and preceding monsoon residual moisture is exhausted by March. "
                "Rainfed summer cropping is agronomically unviable in Karnataka without assured irrigation."
            )

    return {
        "assigned_season": assigned_season,
        "seasonal_window": s_clim["display_name"],
        "window_description": s_clim["window_description"],
        "seasonal_rainfall_mm": seasonal_precip,
        "months_evaluated": s_clim["months_evaluated"],
        "months_missing": s_clim["months_missing"],
        "days_recorded": s_clim["days_recorded"],
        "is_partial_data": s_clim["is_partial_data"],
        "data_completeness_note": s_clim["data_completeness_note"],
        "seasonal_characteristics": s_clim["characteristics"],
        "seasonal_source": s_clim["source"],
        "irrigation_buffer_active": is_irrigated,
        "residual_moisture_dependency": residual_moisture_dependency,
        "thermal_score": thermal_score,
        "thermal_status": thermal_status,
        "thermal_rationale": thermal_rationale,
        "water_score": water_score,
        "water_status": water_status,
        "water_rationale": water_rationale,
        "water_requirement": water_spec,
        "rainfall_suitability": rainfall_spec,
        "nasa_rainfall_ytd_mm": rainfall_ytd,
        "nasa_avg_temp_c": seasonal_t2m,
        "nasa_temp_range": f"{seasonal_min}°C – {seasonal_max}°C"
    }


def evaluate_rotation_dynamics(
    previous_crop: str,
    sequence_crops: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluate biological, structural, and pest-cycle interactions across crop sequence transitions.
    Max score: 20 points.
    """
    prev_clean = (previous_crop or "").strip().lower()
    score = 15
    status = "Moderate"
    benefits: List[str] = []
    risks: List[str] = []
    nitrogen_credits: List[str] = []

    # Analyze transition from previous crop to first crop
    first_crop = sequence_crops[0]
    first_cat = first_crop.get("crop_category", "").lower()
    first_name = first_crop.get("crop_name", "")

    # Check for cereal -> pulse or pulse -> cereal dynamics
    is_prev_cereal = any(c in prev_clean for c in ["paddy", "rice", "maize", "ragi", "sorghum"])
    is_prev_pulse = any(p in prev_clean for p in ["gram", "cowpea", "bean", "soybean", "pulse", "groundnut"])

    is_first_pulse = "pulse" in first_cat or "legume" in first_cat
    is_first_cereal = "cereal" in first_cat

    if is_prev_cereal and is_first_pulse:
        score += 3
        benefits.append(
            f"Excellent cereal–legume rotation: Rotating {first_name} after {previous_crop} breaks cereal stem-borer "
            "and sheath blight cycles while fixing atmospheric nitrogen into the soil profile."
        )
    elif is_prev_pulse and is_first_cereal:
        score += 3
        benefits.append(
            f"Beneficial sequence: {first_name} capitalizes on biologically fixed residual nitrogen and improved topsoil tilth "
            f"left behind by preceding {previous_crop}."
        )
    elif is_prev_cereal and is_first_cereal:
        risks.append(
            f"Consecutive cereal cropping ({previous_crop} followed by {first_name}): Heavy continuous uptake of soil nitrogen, "
            "phosphorus, and potassium with increased potential for carryover of fungal pathogen inocula."
        )

    # Analyze internal sequence transitions if multi-crop (e.g. Crop 1 -> Crop 2)
    for i in range(len(sequence_crops) - 1):
        c1 = sequence_crops[i]
        c2 = sequence_crops[i + 1]
        c1_cat = c1.get("crop_category", "").lower()
        c2_cat = c2.get("crop_category", "").lower()
        c1_name = c1.get("crop_name", "")
        c2_name = c2.get("crop_name", "")

        c1_is_pulse = "pulse" in c1_cat or "legume" in c1_cat
        c2_is_pulse = "pulse" in c2_cat or "legume" in c2_cat
        c1_is_cereal = "cereal" in c1_cat
        c2_is_cereal = "cereal" in c2_cat

        if c1_is_cereal and c2_is_pulse:
            score += 3
            benefits.append(
                f"Classic relay/sequential rotation ({c1_name} → {c2_name}): Exhaustive cereal is followed by a leguminous restorer, "
                "rebuilding microbial biodiversity and organic nitrogen."
            )
        elif c1_is_pulse and c2_is_cereal:
            score += 2
            benefits.append(
                f"Efficient nutrient scavenging ({c1_name} → {c2_name}): Deep cereal root system recovers minerals mobilized by the preceding pulse."
            )
        elif c1_is_pulse and c2_is_pulse:
            risks.append(
                f"Back-to-back legumes ({c1_name} → {c2_name}): High susceptibility to shared soil-borne damping-off and root-rot fungi "
                "(Rhizoctonia / Fusarium solani); requires seed treatment with biocontrol agents (Trichoderma)."
            )

    # Collect documented biological nitrogen fixation data
    for c in sequence_crops:
        n_info = c.get("nitrogen_fixation_info")
        if n_info:
            nitrogen_credits.append(f"{c['crop_name']}: {n_info}")

    score = min(20, max(8, score))
    status = "Optimal" if score >= 17 else ("Moderate" if score >= 13 else "Challenging")

    return {
        "status": status,
        "score": score,
        "max_score": 20,
        "benefits": benefits if benefits else ["Standard single-crop or unlinked rotation pattern."],
        "risks": risks if risks else ["No acute rotational pathogen or nutrient depletion conflicts identified."],
        "nitrogen_fixation_data": nitrogen_credits if nitrogen_credits else ["Non-leguminous sequence; atmospheric nitrogen fixation not applicable."]
    }


def evaluate_calendar_and_season(
    farm_season: str,
    sequence_crops: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluate total growing duration and calendar feasibility across the agricultural year.
    Max score: 10 points.
    """
    total_days = 0
    duration_breakdown = []
    season_notes = []

    for c in sequence_crops:
        d = _parse_duration_days(c.get("growing_duration_days", ""))
        total_days += d
        duration_breakdown.append(f"{c['crop_name']} ({d} days)")
        crop_seasons = c.get("suitable_seasons", "")
        season_notes.append(f"{c['crop_name']}: {crop_seasons}")

    score = 8
    status = "Optimal"
    rationale = ""

    # Perennial palm check (Arecanut separated from annual rotation engine)
    if any("arecanut" in c.get("crop_name", "").lower() or "plantation" in c.get("crop_category", "").lower() for c in sequence_crops):
        score = 0
        status = "Invalid"
        rationale = "Arecanut is a multi-decade perennial palm (>25 year life cycle); seasonal annual crop rotation does not apply."
    elif total_days <= 240:
        score = 10
        status = "Optimal"
        rationale = (
            f"Total sequence duration of ~{total_days} days fits comfortably into the 365-day annual calendar, "
            f"allowing seamless transition between Kharif (June–October) and Rabi (November–February)."
        )
    elif total_days <= 320:
        score = 8
        status = "Moderate"
        rationale = (
            f"Total sequence duration of ~{total_days} days is feasible but requires strict planting discipline "
            "and rapid field turnaround between harvest and second-crop sowing."
        )
    else:
        score = 5
        status = "Challenging"
        rationale = (
            f"Combined duration of ~{total_days} days exceeds realistic annual window; overlaps with monsoon onset or "
            "demands unviable off-season field occupancy."
        )

    return {
        "status": status,
        "score": score,
        "max_score": 10,
        "total_days_approx": total_days,
        "duration_breakdown": duration_breakdown,
        "season_alignments": season_notes,
        "rationale": rationale
    }


def evaluate_priority_alignment(
    primary_priority: str,
    sequence_crops: List[Dict[str, Any]],
    rotation_eval: Dict[str, Any],
    soil_evals: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluate how well the scenario aligns with the farmer's self-declared priority.
    """
    priority = (primary_priority or "Balanced sustainability").strip()
    p_lower = priority.lower()
    crop_names = [c.get("crop_name", "") for c in sequence_crops]
    has_legume = any("pulse" in c.get("crop_category", "").lower() or "legume" in c.get("crop_category", "").lower() for c in sequence_crops)
    has_commercial = any("commercial" in c.get("crop_category", "").lower() or "arecanut" in c.get("crop_name", "").lower() for c in sequence_crops)

    alignment = "High"
    explanation = f"Scenario directly supports farmer's priority of '{priority}'."

    if "soil health" in p_lower:
        if has_legume:
            alignment = "High"
            explanation = (
                f"Strong alignment with 'Soil health improvement': Inclusion of {', '.join([c['crop_name'] for c in sequence_crops if 'pulse' in c.get('crop_category', '').lower() or 'legume' in c.get('crop_category', '').lower()])} "
                "introduces biological nitrogen fixation and active root-nodule biomass that builds soil organic tilth."
            )
        else:
            alignment = "Moderate"
            explanation = (
                f"Moderate alignment with 'Soil health improvement': None of the selected crops ({', '.join(crop_names)}) are leguminous; "
                "supplementary green manuring or heavy compost application will be required to maintain soil structure."
            )

    elif "water conservation" in p_lower:
        if any("paddy" in c.lower() for c in crop_names) and len([c for c in crop_names if any(w in c.lower() for w in ["paddy", "maize"])]) > 1:
            alignment = "Moderate"
            explanation = "Moderate-to-low alignment with 'Water conservation': Sequence includes multiple high-water-demand cereals."
        elif any(c in ["Ragi (Finger Millet)", "Cowpea", "Black Gram", "Green Gram"] for c in crop_names):
            alignment = "High"
            explanation = "High alignment with 'Water conservation': Selected crops feature modest water footprints and high drought resistance."
        else:
            alignment = "Moderate"
            explanation = f"Moderate water conservation footprint for sequence: {', '.join(crop_names)}."

    elif "income" in p_lower:
        if has_commercial or "Maize" in crop_names or "Paddy (Rice)" in crop_names:
            alignment = "High"
            explanation = "High market alignment: Produces established cash-flow commodities with ready Mandi procurement in Karnataka."
        else:
            alignment = "Moderate"
            explanation = "Moderate market alignment: Focuses primarily on subsistence and soil restoration rather than peak commercial returns."

    elif "climate resilience" in p_lower or "risk" in p_lower:
        if len(sequence_crops) >= 2 and has_legume:
            alignment = "High"
            explanation = "High climate resilience: Crop diversification buffers against weather volatility and pest outbreaks."
        else:
            alignment = "Moderate"
            explanation = "Moderate resilience: Diversity is limited; diversifying crop families improves climate buffer."

    return {
        "priority_label": priority,
        "alignment_level": alignment,
        "explanation": explanation
    }


def _extract_score(sc: Dict[str, Any]) -> float:
    hs = sc.get("heuristic_score")
    if isinstance(hs, dict):
        val = hs.get("total_score")
        if isinstance(val, (int, float)):
            return float(val)
    return 0.0


def compare_rotation_scenarios(
    farm: Dict[str, Any],
    climate_data: Dict[str, Any],
    scenarios_input: List[Dict[str, Any]],
    crops_catalog: Dict[int, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Main entry point for comparing rotation scenarios.
    Computes rigorous agronomic compatibility, heuristic scoring, and transparent disclosures.
    """
    evaluated_scenarios = []

    for s_idx, sc in enumerate(scenarios_input):
        sc_name = sc.get("name", f"Scenario {chr(65 + s_idx)}")
        crop_ids = sc.get("crop_ids", [])
        sequence_crops = [crops_catalog[cid] for cid in crop_ids if cid in crops_catalog]

        if not sequence_crops:
            continue

        # Strict validation: Reject any scenario containing Arecanut / Perennial plantation crops
        for c in sequence_crops:
            c_name = (c.get("crop_name") or "").lower()
            c_cat = (c.get("crop_category") or "").lower()
            if "arecanut" in c_name or "plantation" in c_cat:
                raise ValueError(
                    f"Crop '{c.get('crop_name')}' is a perennial plantation palm (30–40 year economic lifespan) "
                    "and cannot be evaluated in an annual seasonal crop rotation sequence. "
                    "Please refer to the dedicated Perennial Plantation advisory module."
                )

        # 1. Soil evaluation across crops
        soil_evals = [evaluate_soil_compatibility(farm.get("soil_type", "Laterite soil"), c) for c in sequence_crops]
        soil_score = sum(se["score"] for se in soil_evals) / len(soil_evals)
        soil_status = "Optimal" if soil_score >= 22 else ("Moderate" if soil_score >= 16 else "Challenging")

        # 2. Climate & Thermal/Water evaluation using seasonal rainfall
        crop_seasons = assign_crop_seasons(farm.get("farming_season", "Kharif"), sequence_crops)
        climate_evals = [
            evaluate_climate_suitability(
                crop=c,
                climate=climate_data,
                irrigation_type=farm.get("irrigation_type", "Rainfed"),
                farm_soil=farm.get("soil_type", "Laterite soil"),
                assigned_season=crop_seasons[i]
            )
            for i, c in enumerate(sequence_crops)
        ]
        thermal_score = sum(ce["thermal_score"] for ce in climate_evals) / len(climate_evals)
        thermal_status = "Optimal" if thermal_score >= 17 else ("Moderate" if thermal_score >= 13 else "Challenging")
        water_score = sum(ce["water_score"] for ce in climate_evals) / len(climate_evals)
        water_status = "Optimal" if water_score >= 21 else ("Moderate" if water_score >= 16 else "Challenging")

        # 3. Rotation dynamics
        rotation_eval = evaluate_rotation_dynamics(farm.get("previous_crop", ""), sequence_crops)

        # 4. Seasonal and calendar feasibility
        calendar_eval = evaluate_calendar_and_season(farm.get("farming_season", "Kharif"), sequence_crops)

        # 5. Farmer priority alignment
        priority_eval = evaluate_priority_alignment(farm.get("primary_priority", "Climate resilience"), sequence_crops, rotation_eval, soil_evals)

        # Calculate Total Heuristic Score (Out of 100)
        # Weights: Soil (25) + Water (25) + Rotation Dynamics (20) + Thermal (20) + Calendar (10) = 100
        total_heuristic_score = round(soil_score + water_score + rotation_eval["score"] + thermal_score + calendar_eval["score"], 1)

        # Compile comprehensive scenario result
        evaluated_scenarios.append({
            "name": sc_name,
            "crop_ids": crop_ids,
            "crop_names": [c["crop_name"] for c in sequence_crops],
            "crop_sequence_display": " → ".join([c["crop_name"] for c in sequence_crops]),
            "crops_detailed": [
                {
                    "id": c["id"],
                    "name": c["crop_name"],
                    "scientific_name": c["scientific_name"],
                    "category": c["crop_category"],
                    "duration": c["growing_duration_days"],
                    "water_requirement": c["water_requirement"],
                    "nitrogen_fixation": c.get("nitrogen_fixation_info"),
                    "assigned_season": crop_seasons[i],
                    "seasonal_window": climate_evals[i]["seasonal_window"],
                    "seasonal_rainfall_mm": climate_evals[i]["seasonal_rainfall_mm"],
                    "is_partial_data": climate_evals[i]["is_partial_data"],
                    "residual_moisture_dependency": climate_evals[i]["residual_moisture_dependency"]
                }
                for i, c in enumerate(sequence_crops)
            ],
            "heuristic_score": {
                "total_score": total_heuristic_score,
                "score_out_of": 100,
                "evaluation_label": "Biophysical Criteria Alignment (Qualitative)",
                "score_label": "Biophysical Criteria Alignment (Qualitative)",
                "weights_and_breakdown": {
                    "soil_compatibility": {"score": round(soil_score, 1), "max": 25, "weight_pct": "25%"},
                    "water_and_irrigation": {"score": round(water_score, 1), "max": 25, "weight_pct": "25%"},
                    "rotation_dynamics": {"score": round(rotation_eval["score"], 1), "max": 20, "weight_pct": "20%"},
                    "thermal_climate": {"score": round(thermal_score, 1), "max": 20, "weight_pct": "20%"},
                    "seasonal_calendar": {"score": round(calendar_eval["score"], 1), "max": 10, "weight_pct": "10%"}
                },
                "disclaimer": "Experimental unvalidated heuristic index based on published ICAR / UAS agronomic boundaries and NASA POWER environmental estimates. Not a validated empirical score, crop yield prediction, or economic profitability forecast."
            },
            "soil_compatibility": {
                "overall_status": soil_status,
                "farm_soil": farm.get("soil_type", "Laterite soil"),
                "per_crop_evaluations": soil_evals
            },
            "climate_compatibility": {
                "thermal_status": thermal_status,
                "water_status": water_status,
                "per_crop_evaluations": climate_evals
            },
            "rotation_dynamics": rotation_eval,
            "calendar_and_season": calendar_eval,
            "priority_alignment": priority_eval,
            "potential_limitations": (
                rotation_eval["risks"] +
                [f"Drainage management: {farm.get('soil_type', 'Laterite')} in high-rainfall spells requires raised beds or drainage furrows to avoid standing water." if "paddy" not in [c["crop_name"].lower() for c in sequence_crops] else "Lowland paddies require perimeter bunding to hold saturated water depths."]
            ),
            "missing_information": [
                "Farm-specific soil pH, organic carbon content, and electrical conductivity assays.",
                "Subsurface soil hydraulic conductivity and hardpan depth.",
                "Historical pest and weed seed bank distribution in this specific parcel."
            ]
        })

    # Scenarios preserve input submission order; no arbitrary ranking or sorting by heuristic score

    # Compile Top-Level Why This Scenario & Transparency Metadata
    annual_cl = climate_data.get("annual_summary", {})
    nasa_meta = climate_data.get("metadata", {})

    transparency = {
        "farm_data_used": {
            "farm_name": farm.get("farm_name"),
            "farmer_name": farm.get("farmer_name"),
            "location": f"{farm.get('village')}, {farm.get('district')}, {farm.get('state')}",
            "coordinates": f"Lat {farm.get('latitude')}, Lon {farm.get('longitude')}",
            "soil_type": farm.get("soil_type"),
            "total_land_acres": farm.get("total_land_acres"),
            "current_crop": farm.get("current_crop"),
            "previous_crop": farm.get("previous_crop"),
            "farming_season": farm.get("farming_season"),
            "irrigation_type": farm.get("irrigation_type"),
            "primary_priority": farm.get("primary_priority")
        },
        "nasa_climate_data_used": {
            "data_source": nasa_meta.get("data_source", "NASA POWER API"),
            "assimilation_model": nasa_meta.get("assimilation_model", "MERRA-2 / GEOS-IT"),
            "coordinates_evaluated": f"Lat {farm.get('latitude')}, Lon {farm.get('longitude')}",
            "observation_period": f"{nasa_meta.get('actual_first_observation')} to {nasa_meta.get('actual_last_observation')}",
            "total_days_evaluated": annual_cl.get("total_days_evaluated"),
            "rainfall_recorded_ytd_mm": annual_cl.get("total_precipitation_mm"),
            "avg_temperature_c": annual_cl.get("avg_temperature_c"),
            "max_temperature_c": annual_cl.get("max_temperature_recorded_c"),
            "min_temperature_c": annual_cl.get("min_temperature_recorded_c"),
            "avg_relative_humidity_pct": annual_cl.get("avg_relative_humidity_pct")
        },
        "seasonal_calendars_referenced": {
            "source": "UAS Bengaluru & ICAR Package of Practices for Karnataka",
            "seasons": {
                k: {
                    "window": v["window_description"],
                    "months": ", ".join(v["month_names"]),
                    "characteristics": v["characteristics"]
                }
                for k, v in SEASON_DEFINITIONS.items()
            }
        },
        "scientific_institutions_referenced": [
            "ICAR - Indian Institute of Rice Research (IIRR), Hyderabad",
            "ICAR - Indian Institute of Millets Research (IIMR), Hyderabad",
            "ICAR - Indian Institute of Pulses Research (IIPR), Kanpur",
            "ICAR - Central Plantation Crops Research Institute (CPCRI), Kasaragod",
            "University of Agricultural Sciences (UAS), Bengaluru & Dharwad (Package of Practices for Karnataka)",
            "NASA Langley Research Center - POWER Project (MERRA-2 Satellite Data)"
        ],
        "scientific_assumptions": [
            "Crop seasons follow Karnataka agro-climatic calendar: Kharif (June–Oct), Rabi (Nov–Feb), Summer (March–May), Perennial (Jan–Dec) per UAS Bengaluru Package of Practices.",
            "Sequential crop rotations transition across consecutive calendar seasons (e.g. Kharif Crop 1 → Rabi Crop 2 → Summer Crop 3).",
            "Evaluations assume recommended Package of Practices (PoP) fertilizer application and pest monitoring.",
            "Normal South-West and North-East monsoon progression within Western Ghats historical standard deviations.",
            "Soil physical properties reflect typical regional soil classification profiles in Karnataka."
        ],
        "scientific_uncertainties": [
            "Rainfall totals reflect precipitation in each crop's specific seasonal calendar window; in-season rainfall does NOT equate to effective root-zone moisture without percolation and evapotranspiration accounting.",
            "Post-monsoon rainfed crops rely critically on residual moisture stored in the subsoil from the preceding monsoon; light laterite soils store significantly less residual water than deep vertisols.",
            "NASA POWER meteorological data operates at a 0.5° × 0.625° spatial grid resolution, which may not capture micro-topographical valley cold pockets or local cloud shade.",
            "Biological nitrogen fixation estimates depend upon effective native or inoculated Rhizobium nodulation."
        ]
    }

    return {
        "status": "success",
        "farm_id": farm.get("id"),
        "farm_name": farm.get("farm_name"),
        "total_scenarios_compared": len(evaluated_scenarios),
        "scenarios": evaluated_scenarios,
        "transparency_and_sources": transparency
    }
