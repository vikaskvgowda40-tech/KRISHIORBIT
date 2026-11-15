"""
KRISHIORBIT Phase 7.9B Comprehensive Regression Test Suite
Validates:
1. Missing, null, blank, and unknown soil types -> 'Insufficient data' & category 'Insufficient data'
2. Severe Rabi water constraint NOT hidden by favorable Kharif result -> 'Challenging'
3. Missing latitude validation -> HTTP 400 Bad Request
4. Missing longitude validation -> HTTP 400 Bad Request
5. Valid Agumbe coordinates handling
6. Valid Shivamogga coordinates handling
7. Existing farm profile compatibility and Arecanut rejection
"""

import sys
import os
from pathlib import Path
from typing import Dict, Any

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from rotation_engine import (
    evaluate_soil_compatibility,
    evaluate_climate_suitability,
    compare_rotation_scenarios,
    aggregate_crop_statuses,
    synthesize_qualitative_suitability
)
from database import list_crops, list_farm_profiles


def get_mock_climate_agumbe() -> Dict[str, Any]:
    """Mock Agumbe NASA POWER climate data (high precipitation Western Ghats)."""
    return {
        "metadata": {
            "data_source": "NASA Prediction Of Worldwide Energy Resources (POWER)",
            "assimilation_model": "MERRA-2 / GEOS-IT",
            "coordinates_evaluated": {"latitude": 13.5186, "longitude": 75.0911},
            "actual_first_observation": "2026-01-01",
            "actual_last_observation": "2026-11-12",
            "total_observations": 316
        },
        "annual_summary": {
            "total_precipitation_mm": 3450.2,
            "avg_temperature_c": 23.5,
            "max_temperature_recorded_c": 32.1,
            "min_temperature_recorded_c": 16.4,
            "total_days_evaluated": 316
        },
        "monthly_summary": [
            {"month_number": 1, "month_name": "January", "total_precipitation_mm": 5.2, "avg_temperature_c": 22.1, "avg_max_temperature_c": 29.5, "avg_min_temperature_c": 16.2, "days_recorded": 31},
            {"month_number": 2, "month_name": "February", "total_precipitation_mm": 4.1, "avg_temperature_c": 23.4, "avg_max_temperature_c": 31.0, "avg_min_temperature_c": 17.1, "days_recorded": 28},
            {"month_number": 3, "month_name": "March", "total_precipitation_mm": 18.5, "avg_temperature_c": 25.2, "avg_max_temperature_c": 33.2, "avg_min_temperature_c": 18.5, "days_recorded": 31},
            {"month_number": 4, "month_name": "April", "total_precipitation_mm": 45.0, "avg_temperature_c": 26.1, "avg_max_temperature_c": 34.0, "avg_min_temperature_c": 20.1, "days_recorded": 30},
            {"month_number": 5, "month_name": "May", "total_precipitation_mm": 120.4, "avg_temperature_c": 26.5, "avg_max_temperature_c": 33.5, "avg_min_temperature_c": 21.0, "days_recorded": 31},
            {"month_number": 6, "month_name": "June", "total_precipitation_mm": 850.2, "avg_temperature_c": 23.8, "avg_max_temperature_c": 28.5, "avg_min_temperature_c": 20.5, "days_recorded": 30},
            {"month_number": 7, "month_name": "July", "total_precipitation_mm": 1150.8, "avg_temperature_c": 22.9, "avg_max_temperature_c": 26.8, "avg_min_temperature_c": 20.1, "days_recorded": 31},
            {"month_number": 8, "month_name": "August", "total_precipitation_mm": 720.5, "avg_temperature_c": 23.1, "avg_max_temperature_c": 27.2, "avg_min_temperature_c": 20.0, "days_recorded": 31},
            {"month_number": 9, "month_name": "September", "total_precipitation_mm": 380.2, "avg_temperature_c": 23.5, "avg_max_temperature_c": 28.1, "avg_min_temperature_c": 19.8, "days_recorded": 30},
            {"month_number": 10, "month_name": "October", "total_precipitation_mm": 135.0, "avg_temperature_c": 24.0, "avg_max_temperature_c": 29.5, "avg_min_temperature_c": 19.2, "days_recorded": 31},
            {"month_number": 11, "month_name": "November", "total_precipitation_mm": 20.3, "avg_temperature_c": 23.0, "avg_max_temperature_c": 29.0, "avg_min_temperature_c": 18.0, "days_recorded": 12}
        ]
    }


def get_mock_climate_shivamogga() -> Dict[str, Any]:
    """Mock Shivamogga NASA POWER climate data."""
    return {
        "metadata": {
            "data_source": "NASA Prediction Of Worldwide Energy Resources (POWER)",
            "assimilation_model": "MERRA-2 / GEOS-IT",
            "coordinates_evaluated": {"latitude": 13.9299, "longitude": 75.5681},
            "actual_first_observation": "2026-01-01",
            "actual_last_observation": "2026-11-12",
            "total_observations": 316
        },
        "annual_summary": {
            "total_precipitation_mm": 903.22,
            "avg_temperature_c": 25.23,
            "max_temperature_recorded_c": 36.4,
            "min_temperature_recorded_c": 14.8,
            "total_days_evaluated": 316
        },
        "monthly_summary": [
            {"month_number": 1, "month_name": "January", "total_precipitation_mm": 0.0, "avg_temperature_c": 23.1, "avg_max_temperature_c": 31.5, "avg_min_temperature_c": 15.2, "days_recorded": 31},
            {"month_number": 2, "month_name": "February", "total_precipitation_mm": 1.2, "avg_temperature_c": 25.4, "avg_max_temperature_c": 33.8, "avg_min_temperature_c": 17.0, "days_recorded": 28},
            {"month_number": 3, "month_name": "March", "total_precipitation_mm": 12.0, "avg_temperature_c": 27.8, "avg_max_temperature_c": 36.4, "avg_min_temperature_c": 19.5, "days_recorded": 31},
            {"month_number": 4, "month_name": "April", "total_precipitation_mm": 35.1, "avg_temperature_c": 28.5, "avg_max_temperature_c": 36.0, "avg_min_temperature_c": 21.0, "days_recorded": 30},
            {"month_number": 5, "month_name": "May", "total_precipitation_mm": 68.2, "avg_temperature_c": 28.1, "avg_max_temperature_c": 34.5, "avg_min_temperature_c": 21.8, "days_recorded": 31},
            {"month_number": 6, "month_name": "June", "total_precipitation_mm": 185.3, "avg_temperature_c": 25.0, "avg_max_temperature_c": 29.5, "avg_min_temperature_c": 21.0, "days_recorded": 30},
            {"month_number": 7, "month_name": "July", "total_precipitation_mm": 295.4, "avg_temperature_c": 24.1, "avg_max_temperature_c": 28.0, "avg_min_temperature_c": 20.5, "days_recorded": 31},
            {"month_number": 8, "month_name": "August", "total_precipitation_mm": 175.2, "avg_temperature_c": 24.3, "avg_max_temperature_c": 28.5, "avg_min_temperature_c": 20.6, "days_recorded": 31},
            {"month_number": 9, "month_name": "September", "total_precipitation_mm": 95.0, "avg_temperature_c": 24.9, "avg_max_temperature_c": 29.8, "avg_min_temperature_c": 20.2, "days_recorded": 30},
            {"month_number": 10, "month_name": "October", "total_precipitation_mm": 31.8, "avg_temperature_c": 25.0, "avg_max_temperature_c": 30.5, "avg_min_temperature_c": 19.8, "days_recorded": 31},
            {"month_number": 11, "month_name": "November", "total_precipitation_mm": 4.02, "avg_temperature_c": 24.2, "avg_max_temperature_c": 30.1, "avg_min_temperature_c": 18.2, "days_recorded": 12}
        ]
    }


def run_tests():
    print("=" * 70)
    print("KRISHIORBIT PHASE 7.9B REGRESSION TEST SUITE")
    print("=" * 70)

    crops_list = list_crops()
    crops_catalog = {c["id"]: c for c in crops_list}
    ragi = next(c for c in crops_list if "ragi" in c["crop_name"].lower())
    black_gram = next(c for c in crops_list if "black gram" in c["crop_name"].lower())
    paddy = next(c for c in crops_list if "paddy" in c["crop_name"].lower() or "rice" in c["crop_name"].lower())
    arecanut = next(c for c in crops_list if "arecanut" in c["crop_name"].lower())

    climate_agumbe = get_mock_climate_agumbe()
    climate_shivamogga = get_mock_climate_shivamogga()

    # ------------------------------------------------------------------
    # TEST 1: Missing, Null, Blank, and Unknown Soil Types
    # ------------------------------------------------------------------
    print("\n[TEST 1] Missing, Null, Blank, and Unknown Soil Types")
    test_soil_inputs = [None, "", "   ", "Other / Unknown", "unknown", "None", "null", "undefined"]
    for s_in in test_soil_inputs:
        res = evaluate_soil_compatibility(s_in, ragi)
        assert res["status"] == "Insufficient data", f"Expected 'Insufficient data' for {repr(s_in)}, got {res['status']}"
        assert res["score"] == 0, f"Expected 0 points for {repr(s_in)}, got {res['score']}"
        assert "laboratory soil test" in res["rationale"].lower(), "Rationale must explain that a soil test is required."
        print(f"  ✓ Soil input {repr(s_in):<20} -> status='Insufficient data', score=0")

    # In rotation comparison, missing soil MUST yield 'Insufficient data' category
    farm_missing_soil = {
        "farm_name": "Unspecified Soil Parcel",
        "latitude": 13.9299,
        "longitude": 75.5681,
        "soil_type": None,
        "farming_season": "Kharif",
        "irrigation_type": "Rainfed",
        "previous_crop": "Fallow"
    }
    sc_input = [{"name": "Ragi -> Black Gram", "crop_ids": [ragi["id"], black_gram["id"]]}]
    comp_res = compare_rotation_scenarios(farm_missing_soil, climate_shivamogga, sc_input, crops_catalog)
    cat = comp_res["scenarios"][0]["suitability_category"]
    assert cat == "Insufficient data", f"Expected 'Insufficient data' for missing soil in scenario, got '{cat}'"
    print(f"  ✓ Scenario with soil_type=None correctly produced category='{cat}' (not Optimal or Moderate)")

    # Test with soil_type='Other / Unknown'
    farm_unknown_soil = dict(farm_missing_soil, soil_type="Other / Unknown")
    comp_res2 = compare_rotation_scenarios(farm_unknown_soil, climate_shivamogga, sc_input, crops_catalog)
    cat2 = comp_res2["scenarios"][0]["suitability_category"]
    assert cat2 == "Insufficient data", f"Expected 'Insufficient data' for 'Other / Unknown' soil, got '{cat2}'"
    print(f"  ✓ Scenario with soil_type='Other / Unknown' correctly produced category='{cat2}'")
    print("  ✓ TEST 1 PASSED: Missing soil types cannot produce unjustified Optimal.")

    # ------------------------------------------------------------------
    # TEST 2: Severe Rabi Water Constraint NOT Hidden by Favorable Kharif
    # ------------------------------------------------------------------
    print("\n[TEST 2] Severe Rabi Constraint NOT Hidden by Favorable Kharif Result")
    farm_rainfed_laterite = {
        "farm_name": "Rainfed Laterite Farm",
        "latitude": 13.9299,
        "longitude": 75.5681,
        "soil_type": "Laterite soil",
        "farming_season": "Kharif",
        "irrigation_type": "Rainfed",
        "previous_crop": "Fallow"
    }
    # Kharif Ragi (Optimal water) -> Rabi Black Gram (Rainfed Laterite: Challenging water)
    sc_seq = [{"name": "Kharif Ragi -> Rabi Black Gram", "crop_ids": [ragi["id"], black_gram["id"]]}]
    res_seq = compare_rotation_scenarios(farm_rainfed_laterite, climate_shivamogga, sc_seq, crops_catalog)
    sc0 = res_seq["scenarios"][0]
    water_st = sc0["climate_compatibility"]["water_status"]
    cat_st = sc0["suitability_category"]
    per_crop_water = [ce["water_status"] for ce in sc0["climate_compatibility"]["per_crop_evaluations"]]

    print(f"  Per-crop water statuses: {per_crop_water} (Kharif Ragi: {per_crop_water[0]}, Rabi Black Gram: {per_crop_water[1]})")
    print(f"  Rotation-level water status: '{water_st}'")
    print(f"  Overall scenario suitability: '{cat_st}'")

    assert per_crop_water[0] == "Optimal", "Kharif Ragi water should be Optimal"
    assert per_crop_water[1] == "Challenging", "Rainfed Rabi Black Gram on Laterite should be Challenging"
    assert water_st == "Challenging", f"Rotation water_status must be 'Challenging', got '{water_st}'"
    assert cat_st == "Challenging", f"Overall scenario must be 'Challenging', got '{cat_st}'"

    # Verify limiting factor contains specific Rabi Black Gram constraint
    lim_factors = sc0["qualitative_suitability"]["limiting_factors"]
    has_rabi_mention = any("black gram" in lf.lower() and "water" in lf.lower() for lf in lim_factors)
    assert has_rabi_mention, f"Limiting factors must explicitly name Black Gram water constraint: {lim_factors}"
    print(f"  ✓ Limiting factors explicitly identify Rabi constraint: {[lf for lf in lim_factors if 'black gram' in lf.lower()]}")
    print("  ✓ TEST 2 PASSED: Favorable Kharif crop does NOT mask severe Rabi water constraint.")

    # ------------------------------------------------------------------
    # TEST 3 & 4: Missing Latitude & Longitude Validation
    # ------------------------------------------------------------------
    print("\n[TEST 3 & 4] Missing Latitude and Longitude Validation")
    from fastapi import HTTPException
    import main
    from main import compare_crop_rotations_endpoint, RotationCompareRequest, RotationScenarioInput

    # Create dummy request
    rot_req = RotationCompareRequest(
        farm_profile_id=999,
        scenarios=[RotationScenarioInput(name="Test Scenario", crop_ids=[ragi["id"]])]
    )

    # Test Missing Latitude via the actual endpoint
    farm_no_lat = {
        "id": 999,
        "farm_name": "No Lat Farm",
        "latitude": None,
        "longitude": 75.5681,
        "soil_type": "Red soil",
        "current_crop": "Ragi",
        "previous_crop": "Fallow",
        "farming_season": "Kharif",
        "irrigation_type": "Rainfed",
        "primary_priority": "Improve soil health"
    }

    # Monkeypatch get_farm_profile to return farm_no_lat
    original_get_farm = main.get_farm_profile
    main.get_farm_profile = lambda profile_id: farm_no_lat

    try:
        compare_crop_rotations_endpoint(rot_req)
        assert False, "Expected HTTPException for missing latitude"
    except HTTPException as e:
        assert e.status_code == 400
        assert "missing geographic coordinates" in e.detail.lower()
        print(f"  ✓ Missing latitude rejected by endpoint with HTTP 400: {e.detail}")

    # Test Missing Longitude via the actual endpoint
    farm_no_lon = dict(farm_no_lat, latitude=13.9299, longitude=None)
    main.get_farm_profile = lambda profile_id: farm_no_lon
    try:
        compare_crop_rotations_endpoint(rot_req)
        assert False, "Expected HTTPException for missing longitude"
    except HTTPException as e:
        assert e.status_code == 400
        assert "missing geographic coordinates" in e.detail.lower()
        print(f"  ✓ Missing longitude rejected by endpoint with HTTP 400: {e.detail}")

    # Test Blank Coordinate String
    farm_blank_lat = dict(farm_no_lat, latitude="   ", longitude=75.5681)
    main.get_farm_profile = lambda profile_id: farm_blank_lat
    try:
        compare_crop_rotations_endpoint(rot_req)
        assert False, "Expected HTTPException for blank latitude"
    except HTTPException as e:
        assert e.status_code == 400
        assert "missing geographic coordinates" in e.detail.lower()
        print(f"  ✓ Blank latitude string rejected by endpoint with HTTP 400: {e.detail}")

    # Restore get_farm_profile
    main.get_farm_profile = original_get_farm

    print("  ✓ TEST 3 & 4 PASSED: Missing coordinates strictly rejected without silent Shivamogga default.")

    # ------------------------------------------------------------------
    # TEST 5 & 6: Valid Agumbe and Shivamogga Coordinates
    # ------------------------------------------------------------------
    print("\n[TEST 5 & 6] Valid Agumbe and Shivamogga Coordinates Handling")
    farm_agumbe = {
        "id": 999,
        "farm_name": "Agumbe Valid Farm",
        "latitude": 13.5186,
        "longitude": 75.0911,
        "soil_type": "Laterite soil",
        "current_crop": "Paddy",
        "previous_crop": "Fallow",
        "farming_season": "Kharif",
        "irrigation_type": "Rainfed",
        "primary_priority": "Improve soil health"
    }
    agumbe_res = compare_rotation_scenarios(farm_agumbe, climate_agumbe, sc_input, crops_catalog)
    assert len(agumbe_res["scenarios"]) == 1
    coords_used = agumbe_res["transparency_and_sources"]["farm_data_used"]["coordinates"]
    assert "13.5186" in coords_used and "75.0911" in coords_used
    print(f"  ✓ Valid Agumbe coordinates verified in rotation comparison: {coords_used}")

    farm_shivamogga = {
        "id": 998,
        "farm_name": "Shivamogga Valid Farm",
        "latitude": 13.9299,
        "longitude": 75.5681,
        "soil_type": "Red soil",
        "current_crop": "Ragi",
        "previous_crop": "Fallow",
        "farming_season": "Kharif",
        "irrigation_type": "Rainfed",
        "primary_priority": "Improve soil health"
    }
    shiv_res = compare_rotation_scenarios(farm_shivamogga, climate_shivamogga, sc_input, crops_catalog)
    assert len(shiv_res["scenarios"]) == 1
    coords_used_shiv = shiv_res["transparency_and_sources"]["farm_data_used"]["coordinates"]
    assert "13.9299" in coords_used_shiv and "75.5681" in coords_used_shiv
    print(f"  ✓ Valid Shivamogga coordinates verified in rotation comparison: {coords_used_shiv}")
    print("  ✓ TEST 5 & 6 PASSED: Legitimate farm coordinates preserved.")

    # ------------------------------------------------------------------
    # TEST 7: Existing Farm Profiles & Arecanut Rejection
    # ------------------------------------------------------------------
    print("\n[TEST 7] Existing Farm Profile Compatibility & Arecanut Rejection")
    profiles = list_farm_profiles()
    assert len(profiles) > 0, "At least 1 farm profile must exist in database"
    active_farm = profiles[0]
    print(f"  Found active farm profile: ID {active_farm['id']} ('{active_farm['farm_name']}')")
    print(f"    Location: {active_farm['village']}, {active_farm['district']}")
    print(f"    Coordinates: Lat {active_farm['latitude']}, Lon {active_farm['longitude']}")
    print(f"    Soil: {active_farm['soil_type']}")

    # Valid coordinates for existing profile
    assert active_farm["latitude"] is not None and active_farm["longitude"] is not None

    # Test Arecanut rejection
    arec_sc = [{"name": "Invalid Arecanut Rotation", "crop_ids": [paddy["id"], arecanut["id"]]}]
    try:
        compare_rotation_scenarios(dict(active_farm), climate_agumbe, arec_sc, crops_catalog)
        assert False, "Expected ValueError when evaluating Arecanut in annual rotation sequence"
    except ValueError as ve:
        assert "perennial plantation palm" in str(ve).lower()
        print(f"  ✓ Arecanut sequence correctly rejected: {ve}")

    # Test valid crops with existing farm profile
    valid_sc = [{"name": "Valid Sequence", "crop_ids": [paddy["id"], black_gram["id"]]}]
    valid_res = compare_rotation_scenarios(dict(active_farm), climate_agumbe, valid_sc, crops_catalog)
    assert len(valid_res["scenarios"]) == 1
    print(f"  ✓ Existing farm profile evaluated successfully: category='{valid_res['scenarios'][0]['suitability_category']}'")
    print("  ✓ TEST 7 PASSED: Existing profiles fully compatible and Arecanut rejected.")

    print("\n" + "=" * 70)
    print("ALL 7 PHASE 7.9B REGRESSION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
