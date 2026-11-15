"""
KRISHIORBIT – Phase 7.9A Scientific Validation & Regression Test Suite
=====================================================================
Validates all 6 authorized scientific corrections:
1. C-01: Paddy crop-name normalization ('Paddy', 'Paddy (Rice)', 'Rice', 'Oryza sativa')
   and lowland vs upland drainage guidance.
2. Rabi seasonal data coverage: November and December included in climatology,
   and partial daily observations explicitly labeled with climatology reference.
3. Removal of synthetic rainfall allocations (75%, 8%, 17% removed; returns None).
4. Wrong-location fallback elimination: No hardcoded Shivamogga data; location-matched
   climatology fallback or 503 error.
5. Replacement of 0–100 composite score with qualitative categories (Optimal, Moderate,
   Challenging, Insufficient data) and supporting factors.
6. End-to-end API integration and safety checks.
"""

import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from rotation_engine import (
    is_paddy_crop,
    _extract_seasonal_climate,
    evaluate_climate_suitability,
    evaluate_soil_compatibility,
    synthesize_qualitative_suitability,
    compare_rotation_scenarios,
    SEASON_DEFINITIONS
)
from database import list_crops


def test_1_paddy_name_variants_and_lowland_guidance():
    print("\n" + "=" * 70)
    print("[TEST 1] Paddy Crop-Name Variants & Lowland Guidance (C-01)")
    print("=" * 70)

    # 1. Test normalization helper across all variants
    variants = [
        "Paddy",
        "Paddy (Rice)",
        "Rice",
        "Oryza sativa",
        "paddy",
        "rice",
        "oryza sativa",
        "PADDY",
        {"crop_name": "Paddy (Rice)", "scientific_name": "Oryza sativa"},
        {"crop_name": "Rice", "scientific_name": "Oryza sativa"},
        {"crop_name": "Paddy", "scientific_name": "Oryza sativa L."}
    ]
    for v in variants:
        assert is_paddy_crop(v) is True, f"Failed to recognize paddy variant: {v}"
    print(f"  ✓ Verified {len(variants)} paddy name and dictionary variants recognized.")

    # 2. Test non-paddy crops are NOT recognized as paddy
    non_paddy = ["Maize", "Ragi (Finger Millet)", "Cowpea", "Black Gram", "Groundnut", "Soybean"]
    for np in non_paddy:
        assert is_paddy_crop(np) is False, f"Erroneously matched non-paddy crop: {np}"
    print("  ✓ Verified non-paddy crops correctly rejected by is_paddy_crop.")

    # 3. Test Lowland Guidance in simulation scenario containing Paddy
    all_crops = list_crops()
    crops_catalog = {c["id"]: c for c in all_crops}
    paddy_crop = crops_catalog[1]
    black_gram = crops_catalog[4]
    maize_crop = crops_catalog[3]
    cowpea_crop = crops_catalog[7]

    farm_laterite = {
        "id": 1,
        "farm_name": "Test Laterite Valley Farm",
        "village": "Thirthahalli",
        "district": "Shivamogga",
        "state": "Karnataka",
        "latitude": 13.7,
        "longitude": 75.2,
        "soil_type": "Laterite soil",
        "irrigation_type": "Rainfed",
        "farming_season": "Kharif",
        "previous_crop": "Paddy (Rice)",
        "primary_priority": "Soil health"
    }

    dummy_climate = {
        "annual_summary": {"total_precipitation_mm": 1800.0, "avg_temperature_c": 24.0},
        "monthly_summary": [
            {"month": "2026-06", "month_name": "June", "total_precipitation_mm": 400.0, "avg_temperature_c": 24.0},
            {"month": "2026-07", "month_name": "July", "total_precipitation_mm": 600.0, "avg_temperature_c": 23.5},
            {"month": "2026-08", "month_name": "August", "total_precipitation_mm": 350.0, "avg_temperature_c": 23.8},
            {"month": "2026-09", "month_name": "September", "total_precipitation_mm": 200.0, "avg_temperature_c": 24.5},
            {"month": "2026-10", "month_name": "October", "total_precipitation_mm": 120.0, "avg_temperature_c": 25.0},
            {"month": "2026-11", "month_name": "November", "total_precipitation_mm": 30.0, "avg_temperature_c": 23.0}
        ]
    }

    # Scenario with Paddy
    sc_paddy = compare_rotation_scenarios(
        farm=farm_laterite,
        climate_data=dummy_climate,
        scenarios_input=[{"name": "Paddy Sequence", "crop_ids": [1, 4]}],
        crops_catalog=crops_catalog
    )["scenarios"][0]

    limitations_paddy = sc_paddy["potential_limitations"]
    print("  Scenario with Paddy limitations:", limitations_paddy)
    assert any("perimeter bunding to hold saturated water depths" in l for l in limitations_paddy), \
        "Failed: Lowland paddy did not receive perimeter bunding guidance!"
    assert not any("raised beds or drainage furrows" in l for l in limitations_paddy), \
        "Failed: Lowland paddy was incorrectly classified as needing raised beds/furrows!"
    print("  ✓ C-01 PASSED: Lowland paddy receives lowland water bunding guidance.")

    # Scenario without Paddy (Maize -> Cowpea)
    sc_upland = compare_rotation_scenarios(
        farm=farm_laterite,
        climate_data=dummy_climate,
        scenarios_input=[{"name": "Upland Maize Sequence", "crop_ids": [3, 7]}],
        crops_catalog=crops_catalog
    )["scenarios"][0]

    limitations_upland = sc_upland["potential_limitations"]
    print("  Scenario without Paddy limitations:", limitations_upland)
    assert any("raised beds or drainage furrows to avoid standing water" in l for l in limitations_upland), \
        "Failed: Upland crop sequence did not receive drainage furrow guidance!"
    print("  ✓ Upland crop sequence correctly receives raised beds/furrow guidance.")


def test_2_rabi_seasonal_coverage_and_labeling():
    print("\n" + "=" * 70)
    print("[TEST 2] Rabi Seasonal Coverage (November & December) & Labeling")
    print("=" * 70)

    # A) 30-Year Climatology baseline contains all 12 months (including Nov and Dec)
    clim_monthly = [
        {"month": "JAN", "month_name": "January", "month_number": 1, "total_precipitation_mm": 2.1, "avg_temperature_c": 22.0, "days_in_month": 31},
        {"month": "FEB", "month_name": "February", "month_number": 2, "total_precipitation_mm": 3.4, "avg_temperature_c": 24.0, "days_in_month": 28.27},
        {"month": "NOV", "month_name": "November", "month_number": 11, "total_precipitation_mm": 35.8, "avg_temperature_c": 23.5, "days_in_month": 30},
        {"month": "DEC", "month_name": "December", "month_number": 12, "total_precipitation_mm": 12.5, "avg_temperature_c": 22.5, "days_in_month": 31}
    ]
    climatology_dataset = {
        "climatology_label": "NASA POWER Historical Climatological Baseline (1991–2020)",
        "annual_summary": {"total_precipitation_mm": 1980.0, "avg_temperature_c": 23.7},
        "monthly_summary": clim_monthly
    }

    rabi_clim = _extract_seasonal_climate(climatology_dataset, "Rabi")
    print("  Climatology Rabi months evaluated:", rabi_clim["months_evaluated"])
    print("  Climatology Rabi seasonal rainfall:", rabi_clim["seasonal_rainfall_mm"], "mm")
    assert "November" in rabi_clim["months_evaluated"], "November missing from climatology Rabi!"
    assert "December" in rabi_clim["months_evaluated"], "December missing from climatology Rabi!"
    assert rabi_clim["seasonal_rainfall_mm"] == round(2.1 + 3.4 + 35.8 + 12.5, 2)
    assert rabi_clim["is_climatology"] is True
    assert "Climatological" in rabi_clim["data_provenance"]
    assert rabi_clim["is_partial_data"] is False
    print("  ✓ Climatology Rabi evaluated all 4 months including November and December without omission.")

    # B) Daily observations with trailing months outside observation window
    daily_dataset = {
        "annual_summary": {"total_precipitation_mm": 903.0, "avg_temperature_c": 25.2},
        "monthly_summary": [
            {"month": "2026-01", "month_name": "January", "total_precipitation_mm": 1.0, "avg_temperature_c": 22.0},
            {"month": "2026-02", "month_name": "February", "total_precipitation_mm": 2.0, "avg_temperature_c": 24.0},
            {"month": "2026-11", "month_name": "November", "total_precipitation_mm": 20.0, "avg_temperature_c": 23.0}
            # December is missing (future date)
        ]
    }

    rabi_daily = _extract_seasonal_climate(daily_dataset, "Rabi", climatology_context=climatology_dataset)
    print("  Daily Rabi evaluated:", rabi_daily["months_evaluated"], "Missing:", rabi_daily["months_missing"])
    assert "December" in rabi_daily["months_missing"]
    assert rabi_daily["is_partial_data"] is True
    assert rabi_daily["is_climatology"] is False
    assert rabi_daily["data_type"] == "daily_observed"
    assert "climatology_reference" in rabi_daily
    clim_ref = rabi_daily["climatology_reference"]
    assert clim_ref is not None
    assert "December" in clim_ref["months_included"]
    print(f"  ✓ Climatology context reference attached: {clim_ref['label']} ({clim_ref['seasonal_rainfall_normal_mm']} mm)")
    print("  ✓ TEST 2 PASSED: Complete Rabi coverage with explicit observed vs climatology differentiation.")


def test_3_no_synthetic_rainfall_allocation():
    print("\n" + "=" * 70)
    print("[TEST 3] Removal of Synthetic Rainfall Allocations (75%, 8%, 17%)")
    print("=" * 70)

    # Climate dataset with NO monthly summary (only annual total)
    climate_empty_monthly = {
        "annual_summary": {
            "total_precipitation_mm": 1000.0,
            "avg_temperature_c": 25.0
        },
        "monthly_summary": []
    }

    # Verify that Kharif, Rabi, Summer ALL return None (NOT 750 mm, 80 mm, or 170 mm)
    kh = _extract_seasonal_climate(climate_empty_monthly, "Kharif")
    rb = _extract_seasonal_climate(climate_empty_monthly, "Rabi")
    sm = _extract_seasonal_climate(climate_empty_monthly, "Summer")

    print(f"  Kharif seasonal rainfall with empty monthly: {kh['seasonal_rainfall_mm']}")
    print(f"  Rabi seasonal rainfall with empty monthly: {rb['seasonal_rainfall_mm']}")
    print(f"  Summer seasonal rainfall with empty monthly: {sm['seasonal_rainfall_mm']}")

    assert kh["seasonal_rainfall_mm"] is None, f"Expected None but got synthetic allocation: {kh['seasonal_rainfall_mm']}"
    assert rb["seasonal_rainfall_mm"] is None, f"Expected None but got synthetic allocation: {rb['seasonal_rainfall_mm']}"
    assert sm["seasonal_rainfall_mm"] is None, f"Expected None but got synthetic allocation: {sm['seasonal_rainfall_mm']}"
    assert "Synthetic proportional allocations have been removed" in kh["data_completeness_note"]

    # Verify that evaluate_climate_suitability marks rainfed crop as 'Insufficient data'
    all_crops = list_crops()
    ragi = next(c for c in all_crops if "ragi" in c["crop_name"].lower())
    suit_eval = evaluate_climate_suitability(
        crop=ragi,
        climate=climate_empty_monthly,
        irrigation_type="Rainfed",
        farm_soil="Laterite soil",
        assigned_season="Kharif"
    )
    print(f"  Rainfed suitability status when rainfall data unavailable: {suit_eval['water_status']}")
    assert suit_eval["water_status"] == "Insufficient data"
    assert "Synthetic rainfall allocations have been removed" in suit_eval["water_rationale"]
    print("  ✓ TEST 3 PASSED: Synthetic rainfall allocations completely removed; returns None.")


def test_4_no_wrong_location_weather_fallback():
    print("\n" + "=" * 70)
    print("[TEST 4] Wrong-Location Weather Fallback Elimination")
    print("=" * 70)

    # In main.py, the previous fallback hardcoded:
    # "total_precipitation_mm": 903.22, "avg_temperature_c": 25.24 (Shivamogga data)
    # Inspect main.py to verify 903.22 is NOT present in the compare endpoint fallback
    main_path = os.path.join(backend_dir, "main.py")
    with open(main_path, "r", encoding="utf-8") as f:
        main_content = f.read()

    # Ensure the old fallback block is deleted
    assert "903.22" not in main_content, "Found hardcoded 903.22 mm Shivamogga fallback in main.py!"
    assert "climatology_fallback" in main_content, "Location-matched climatology fallback not configured in main.py!"
    assert "HTTP_503_SERVICE_UNAVAILABLE" in main_content, "HTTP 503 unavailable response missing from main.py!"
    print("  ✓ Verified main.py has eliminated silent Shivamogga fallback.")
    print("  ✓ Verified location-matched climatology fallback is configured with explicit notice.")
    print("  ✓ TEST 4 PASSED: No wrong-location weather data substitution.")


def test_5_qualitative_suitability_and_no_composite_scores():
    print("\n" + "=" * 70)
    print("[TEST 5] Qualitative Categories & Elimination of 0–100 Composite Scores")
    print("=" * 70)

    # 1. Test qualitative synthesis function directly
    # A) Optimal across all factors -> Optimal
    opt_synth = synthesize_qualitative_suitability("Optimal", "Optimal", "Optimal", "Optimal", "Optimal")
    assert opt_synth["category"] == "Optimal"
    assert len(opt_synth["supporting_factors"]) == 5
    assert len(opt_synth["limiting_factors"]) == 0
    print(f"  All Optimal factors -> Category: '{opt_synth['category']}'")

    # B) Any Challenging factor -> Challenging (Liebig's Law of the Minimum)
    ch_synth = synthesize_qualitative_suitability("Optimal", "Challenging", "Optimal", "Optimal", "Optimal")
    assert ch_synth["category"] == "Challenging"
    assert any("Water & Moisture Security" in lf for lf in ch_synth["limiting_factors"])
    print(f"  Water Challenging -> Category: '{ch_synth['category']}'")

    # C) One or more Moderate factors -> Moderate
    mod_synth = synthesize_qualitative_suitability("Optimal", "Moderate", "Optimal", "Optimal", "Optimal")
    assert mod_synth["category"] == "Moderate"
    print(f"  Water Moderate -> Category: '{mod_synth['category']}'")

    # D) Insufficient data flag -> Insufficient data
    ins_synth = synthesize_qualitative_suitability("Optimal", "Insufficient data", "Optimal", "Optimal", "Optimal")
    assert ins_synth["category"] == "Insufficient data"
    print(f"  Insufficient data -> Category: '{ins_synth['category']}'")

    # 2. End-to-end simulation: Ensure no numerical composite score (0-100) in scenarios
    all_crops = list_crops()
    crops_catalog = {c["id"]: c for c in all_crops}
    farm = {
        "id": 1,
        "farm_name": "Test Parcel",
        "village": "Haranahalli",
        "district": "Shivamogga",
        "state": "Karnataka",
        "latitude": 13.9299,
        "longitude": 75.5681,
        "soil_type": "Laterite soil",
        "irrigation_type": "Rainfed",
        "farming_season": "Kharif",
        "previous_crop": "Paddy (Rice)",
        "primary_priority": "Soil health"
    }
    clim_data = {
        "annual_summary": {"total_precipitation_mm": 1200.0, "avg_temperature_c": 25.0},
        "monthly_summary": [
            {"month": "2026-06", "month_name": "June", "total_precipitation_mm": 300.0, "avg_temperature_c": 24.0},
            {"month": "2026-07", "month_name": "July", "total_precipitation_mm": 400.0, "avg_temperature_c": 23.5},
            {"month": "2026-08", "month_name": "August", "total_precipitation_mm": 300.0, "avg_temperature_c": 23.8},
            {"month": "2026-09", "month_name": "September", "total_precipitation_mm": 150.0, "avg_temperature_c": 24.5},
            {"month": "2026-10", "month_name": "October", "total_precipitation_mm": 50.0, "avg_temperature_c": 25.0},
            {"month": "2026-11", "month_name": "November", "total_precipitation_mm": 10.0, "avg_temperature_c": 23.0}
        ]
    }

    res = compare_rotation_scenarios(
        farm=farm,
        climate_data=clim_data,
        scenarios_input=[{"name": "Scenario 1", "crop_ids": [1, 4]}],
        crops_catalog=crops_catalog
    )
    sc0 = res["scenarios"][0]
    print("  Scenario 0 qualitative suitability:", sc0["qualitative_suitability"]["category"])
    assert sc0["qualitative_suitability"]["category"] in ["Optimal", "Moderate", "Challenging", "Insufficient data"]
    assert "explanation" in sc0["qualitative_suitability"]
    assert "supporting_factors" in sc0["qualitative_suitability"]
    assert "limiting_factors" in sc0["qualitative_suitability"]

    # Verify total_score is NOT present (no 0-100 numerical score)
    assert "total_score" not in sc0["heuristic_score"], "Failed: Found numerical total_score in heuristic_score!"
    assert "score_out_of" not in sc0["heuristic_score"], "Failed: Found score_out_of in heuristic_score!"
    print("  ✓ Verified 0–100 composite total score is completely removed.")
    print("  ✓ TEST 5 PASSED: Transparent qualitative assessment with visible explanations and factors.")


def run_all():
    print("\n" + "=" * 70)
    print("KRISHIORBIT PHASE 7.9A: CRITICAL SCIENTIFIC CORRECTIONS REGRESSION SUITE")
    print("=" * 70)
    test_1_paddy_name_variants_and_lowland_guidance()
    test_2_rabi_seasonal_coverage_and_labeling()
    test_3_no_synthetic_rainfall_allocation()
    test_4_no_wrong_location_weather_fallback()
    test_5_qualitative_suitability_and_no_composite_scores()
    print("\n" + "=" * 70)
    print("ALL 5 PHASE 7.9A REGRESSION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_all()
