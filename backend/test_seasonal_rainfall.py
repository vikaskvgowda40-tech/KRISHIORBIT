"""
KRISHIORBIT – Phase 7 Seasonal Rainfall Evaluation Test Suite
Validates:
1. Agro-climatic season assignment across multi-crop sequences.
2. Monthly precipitation aggregation per seasonal calendar window.
3. Rainfed moisture deficit accounting vs irrigation buffering.
4. Soil retention differentiation (Vertisol vs Laterite) for post-monsoon crops.
5. Incomplete / partial observation handling without data fabrication.
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from rotation_engine import (
    assign_crop_seasons,
    _extract_seasonal_climate,
    evaluate_climate_suitability,
    compare_rotation_scenarios,
    SEASON_DEFINITIONS
)
from database import list_crops

def run_tests():
    print("=" * 70)
    print("KRISHIORBIT PHASE 7: SEASONAL RAINFALL EVALUATION TEST SUITE")
    print("=" * 70)

    # Load verified crops
    all_crops = list_crops()
    crops_by_id = {c["id"]: c for c in all_crops}
    paddy = crops_by_id[1]
    ragi = crops_by_id[2]
    maize = crops_by_id[3]
    black_gram = crops_by_id[4]
    green_gram = crops_by_id[5]
    arecanut = crops_by_id[6]
    cowpea = crops_by_id[7]

    # TEST 1: Chronological Season Assignment
    print("\n[TEST 1] Chronological Season Assignment")
    seq_paddy_bg = assign_crop_seasons("Kharif", [paddy, black_gram])
    print(f"  Paddy -> Black Gram from Kharif: {seq_paddy_bg}")
    assert seq_paddy_bg == ["Kharif", "Rabi"], f"Failed: {seq_paddy_bg}"

    seq_3crops = assign_crop_seasons("Kharif", [paddy, black_gram, green_gram])
    print(f"  Paddy -> Black Gram -> Green Gram: {seq_3crops}")
    assert seq_3crops == ["Kharif", "Rabi", "Summer"], f"Failed: {seq_3crops}"

    seq_areca_pulse = assign_crop_seasons("Kharif", [arecanut, cowpea])
    print(f"  Arecanut -> Cowpea: {seq_areca_pulse}")
    assert seq_areca_pulse == ["Perennial", "Kharif"], f"Failed: {seq_areca_pulse}"
    print("  ✓ TEST 1 PASSED: Sequences correctly map to agro-climatic calendar.")

    # TEST 2: Monthly Summary Aggregation & Partial Data Detection
    print("\n[TEST 2] Seasonal Climate Extraction from NASA POWER Monthly Summary")
    sample_monthly = [
        {"month": "2026-01", "month_name": "January", "total_precipitation_mm": 0.69, "avg_temperature_c": 22.31, "avg_max_temperature_c": 31.45, "avg_min_temperature_c": 13.08, "days_recorded": 31},
        {"month": "2026-02", "month_name": "February", "total_precipitation_mm": 0.89, "avg_temperature_c": 24.51, "avg_max_temperature_c": 34.22, "avg_min_temperature_c": 14.80, "days_recorded": 28},
        {"month": "2026-03", "month_name": "March", "total_precipitation_mm": 46.45, "avg_temperature_c": 27.05, "avg_max_temperature_c": 37.10, "avg_min_temperature_c": 18.25, "days_recorded": 31},
        {"month": "2026-04", "month_name": "April", "total_precipitation_mm": 29.79, "avg_temperature_c": 28.71, "avg_max_temperature_c": 39.73, "avg_min_temperature_c": 21.14, "days_recorded": 30},
        {"month": "2026-05", "month_name": "May", "total_precipitation_mm": 101.39, "avg_temperature_c": 27.70, "avg_max_temperature_c": 36.40, "avg_min_temperature_c": 21.65, "days_recorded": 31},
        {"month": "2026-06", "month_name": "June", "total_precipitation_mm": 160.39, "avg_temperature_c": 24.98, "avg_max_temperature_c": 30.12, "avg_min_temperature_c": 20.89, "days_recorded": 30},
        {"month": "2026-07", "month_name": "July", "total_precipitation_mm": 202.09, "avg_temperature_c": 24.48, "avg_max_temperature_c": 28.85, "avg_min_temperature_c": 20.91, "days_recorded": 31},
        {"month": "2026-08", "month_name": "August", "total_precipitation_mm": 163.47, "avg_temperature_c": 24.21, "avg_max_temperature_c": 28.45, "avg_min_temperature_c": 20.72, "days_recorded": 31},
        {"month": "2026-09", "month_name": "September", "total_precipitation_mm": 87.41, "avg_temperature_c": 24.90, "avg_max_temperature_c": 30.15, "avg_min_temperature_c": 20.45, "days_recorded": 30},
        {"month": "2026-10", "month_name": "October", "total_precipitation_mm": 87.01, "avg_temperature_c": 24.18, "avg_max_temperature_c": 30.82, "avg_min_temperature_c": 19.82, "days_recorded": 31},
        {"month": "2026-11", "month_name": "November", "total_precipitation_mm": 23.64, "avg_temperature_c": 23.66, "avg_max_temperature_c": 30.20, "avg_min_temperature_c": 17.50, "days_recorded": 11}
    ]
    climate = {
        "annual_summary": {
            "total_precipitation_mm": 903.22,
            "avg_temperature_c": 25.24,
            "max_temperature_recorded_c": 39.73,
            "min_temperature_recorded_c": 13.08,
            "total_days_evaluated": 315
        },
        "monthly_summary": sample_monthly
    }

    # Kharif: Jun, Jul, Aug, Sep, Oct
    kharif = _extract_seasonal_climate(climate, "Kharif")
    print(f"  Kharif Rainfall: {kharif['seasonal_rainfall_mm']} mm (Months: {kharif['months_evaluated']})")
    assert kharif["seasonal_rainfall_mm"] == 700.37
    assert len(kharif["months_evaluated"]) == 5
    assert not kharif["is_partial_data"]

    # Rabi: Nov, Dec, Jan, Feb
    rabi = _extract_seasonal_climate(climate, "Rabi")
    print(f"  Rabi Rainfall: {rabi['seasonal_rainfall_mm']} mm (Evaluated: {rabi['months_evaluated']}, Missing: {rabi['months_missing']})")
    assert rabi["seasonal_rainfall_mm"] == 25.22
    assert "December" in rabi["months_missing"]
    assert rabi["is_partial_data"] is True
    assert "Partial seasonal observations" in rabi["data_completeness_note"]
    print("  ✓ TEST 2 PASSED: Seasonal rainfall correctly summed and partial observations flagged.")

    # TEST 3: Water Score Comparison – Rainfed vs Irrigated Post-Monsoon Rabi
    print("\n[TEST 3] Agronomic Suitability & Deficit Scoring")
    # Black Gram requirement: 350-450 mm
    # A) Rainfed in Laterite soil: Low Rabi rain (25.2 mm) + low soil retention -> Challenging (12 pts)
    rf_lat_eval = evaluate_climate_suitability(black_gram, climate, "Rainfed", "Laterite soil", "Rabi")
    print(f"  Rainfed Rabi Black Gram (Laterite): Water Score = {rf_lat_eval['water_score']}/25 ({rf_lat_eval['water_status']})")
    assert rf_lat_eval["water_score"] == 12
    assert rf_lat_eval["water_status"] == "Challenging"
    assert rf_lat_eval["residual_moisture_dependency"] is True

    # B) Rainfed in Black soil (Vertisol): Residual moisture buffer acknowledged -> Moderate (16 pts)
    rf_blk_eval = evaluate_climate_suitability(black_gram, climate, "Rainfed", "Black soil", "Rabi")
    print(f"  Rainfed Rabi Black Gram (Black soil): Water Score = {rf_blk_eval['water_score']}/25 ({rf_blk_eval['water_status']})")
    assert rf_blk_eval["water_score"] == 16
    assert rf_blk_eval["water_status"] == "Moderate"
    assert "residual moisture" in rf_blk_eval["water_rationale"].lower()

    # C) Irrigated (Borewell): Irrigation buffers seasonal deficit -> Optimal (22 pts)
    irr_eval = evaluate_climate_suitability(black_gram, climate, "Borewell", "Laterite soil", "Rabi")
    print(f"  Irrigated Rabi Black Gram (Borewell): Water Score = {irr_eval['water_score']}/25 ({irr_eval['water_status']})")
    assert irr_eval["water_score"] == 22
    assert irr_eval["water_status"] == "Optimal"
    assert irr_eval["irrigation_buffer_active"] is True
    print("  ✓ TEST 3 PASSED: Scoring accurately reflects moisture deficit & irrigation buffering.")

    # TEST 4: End-to-End Simulation Comparison
    print("\n[TEST 4] End-to-End Simulation Comparison")
    farm_rainfed = {
        "id": 1,
        "farm_name": "Test Malnad Farm",
        "village": "Haranahalli",
        "district": "Shivamogga",
        "state": "Karnataka",
        "latitude": 13.9299,
        "longitude": 75.5681,
        "total_land_acres": 4.5,
        "soil_type": "Laterite soil",
        "current_crop": "Paddy (Rice)",
        "previous_crop": "Paddy (Rice)",
        "farming_season": "Kharif",
        "irrigation_type": "Rainfed",
        "primary_priority": "Soil health"
    }

    farm_irrigated = dict(farm_rainfed, irrigation_type="Borewell")

    scenarios = [
        {"name": "Scenario A: Paddy -> Black Gram", "crop_ids": [1, 4]},
        {"name": "Scenario B: Ragi -> Cowpea", "crop_ids": [2, 7]}
    ]

    res_rf = compare_rotation_scenarios(farm_rainfed, climate, scenarios, crops_by_id)
    res_irr = compare_rotation_scenarios(farm_irrigated, climate, scenarios, crops_by_id)

    rf_scA = res_rf["scenarios"][0]
    irr_scA = res_irr["scenarios"][0]

    rf_water_score = rf_scA["heuristic_score"]["weights_and_breakdown"]["water_and_irrigation"]["score"]
    irr_water_score = irr_scA["heuristic_score"]["weights_and_breakdown"]["water_and_irrigation"]["score"]

    print(f"  Rainfed Scenario A Water Score: {rf_water_score}/25")
    print(f"  Irrigated Scenario A Water Score: {irr_water_score}/25")
    assert irr_water_score > rf_water_score, f"Irrigated score ({irr_water_score}) should exceed Rainfed ({rf_water_score})"

    # Verify transparency disclosures
    trans = res_rf["transparency_and_sources"]
    assert "seasonal_calendars_referenced" in trans
    assert "UAS Bengaluru" in trans["seasonal_calendars_referenced"]["source"]
    print(f"  Transparency references: {trans['seasonal_calendars_referenced']['source']}")
    print("  ✓ TEST 4 PASSED: End-to-end simulation differentiation verified.")

    print("\n" + "=" * 70)
    print("ALL 4 SCIENTIFIC AUDIT TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
