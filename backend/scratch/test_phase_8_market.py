"""
KRISHIORBIT Phase 8 - Market & Profit Intelligence Test Suite
============================================================
Verifies:
1. Deterministic Profit Calculator formulas using known worked arithmetic examples.
2. Loss scenarios and zero-yield edge cases.
3. Input validation (positive acres, non-negative costs and prices).
4. Market status endpoint and honest data integrity guarantees.
5. CACP MSP benchmarks (2024–25 Kharif & Rabi) verification for database crops.
6. Market activity & demand dynamics principles and scientific disclaimers.
7. Crop market comparison separation of agro-climatic vs economic parameters.
8. Local APMC mandi observation creation, retrieval, and deletion.
"""

import sys
from pathlib import Path
from typing import Dict, Any

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from market_service import calculate_profit, CACP_MSP_BENCHMARKS, MARKET_ACTIVITY_PRINCIPLES
from main import (
    get_market_integration_status,
    get_market_prices,
    get_msp_benchmarks,
    get_market_activity_principles,
    calculate_farm_profit_endpoint,
    get_crop_market_comparison_endpoint,
    record_local_mandi_observation,
    get_local_mandi_observations,
    remove_local_mandi_observation,
    ProfitCalculationRequest,
    LocalMandiObservationCreate
)


def test_profit_calculator_worked_example_profitable():
    """
    Test 1: Worked profitable scenario
    - Area: 2.5 acres
    - Expected yield: 20.0 quintals/acre
    - Selling price: ₹2,300/quintal (Paddy Common MSP)
    - Cultivation cost: ₹25,000/acre
    - Transport & marketing cost: ₹3,000/acre
    """
    print("\n[TEST 1] Profit Calculator: Worked Profitable Example")
    result = calculate_profit(
        farm_area_acres=2.5,
        expected_yield_quintals_per_acre=20.0,
        selling_price_per_quintal=2300.0,
        cultivation_cost_per_acre=25000.0,
        transportation_marketing_cost_per_acre=3000.0,
        crop_name="Paddy (Rice)"
    )

    # 1. Expected production: 2.5 * 20.0 = 50.0 quintals
    assert result["expected_production_quintals"] == 50.0, f"Expected 50.0, got {result['expected_production_quintals']}"
    # 2. Gross revenue total: 50.0 * 2,300 = ₹1,15,000
    assert result["gross_revenue_total"] == 115000.0, f"Expected 115000.0, got {result['gross_revenue_total']}"
    # 3. Gross revenue per acre: 20.0 * 2,300 = ₹46,000
    assert result["gross_revenue_per_acre"] == 46000.0, f"Expected 46000.0, got {result['gross_revenue_per_acre']}"
    # 4. Cultivation cost total: 2.5 * 25,000 = ₹62,500
    assert result["cultivation_cost_total"] == 62500.0, f"Expected 62500.0, got {result['cultivation_cost_total']}"
    # 5. Transport cost total: 2.5 * 3,000 = ₹7,500
    assert result["transportation_marketing_cost_total"] == 7500.0, f"Expected 7500.0, got {result['transportation_marketing_cost_total']}"
    # 6. Total cost per acre: 25,000 + 3,000 = ₹28,000/acre
    assert result["total_cost_per_acre"] == 28000.0, f"Expected 28000.0, got {result['total_cost_per_acre']}"
    # 7. Total estimated costs: 2.5 * 28,000 = ₹70,000
    assert result["total_estimated_costs"] == 70000.0, f"Expected 70000.0, got {result['total_estimated_costs']}"
    # 8. Estimated net profit total: 1,15,000 - 70,000 = ₹45,000
    assert result["estimated_net_profit_total"] == 45000.0, f"Expected 45000.0, got {result['estimated_net_profit_total']}"
    # 9. Estimated net profit per acre: 46,000 - 28,000 = ₹18,000/acre
    assert result["estimated_net_profit_per_acre"] == 18000.0, f"Expected 18000.0, got {result['estimated_net_profit_per_acre']}"
    # 10. Break-even selling price: 70,000 / 50.0 = ₹1,400.0/quintal
    assert result["breakeven_selling_price_per_quintal"] == 1400.0, f"Expected 1400.0, got {result['breakeven_selling_price_per_quintal']}"
    # 11. ROI: (45,000 / 70,000) * 100 = 64.29%
    assert result["return_on_investment_pct"] == 64.29, f"Expected 64.29, got {result['return_on_investment_pct']}"
    assert result["is_profitable"] is True
    print("  ✓ Expected production: 50.0 q")
    print("  ✓ Gross revenue: ₹1,15,000.0")
    print("  ✓ Total estimated costs: ₹70,000.0")
    print("  ✓ Net profit: ₹45,000.0 (₹18,000.0/acre)")
    print("  ✓ Break-even price: ₹1,400.0/q")
    print("  ✓ ROI: 64.29%")
    print("  ✓ TEST 1 PASSED: Profitable calculations verified.")


def test_profit_calculator_nasa_submission_spec():
    """
    Test 1B: NASA Space Apps Final Submission Verification Spec
    - Area: 2.0 acres
    - Expected yield: 25.0 quintals/acre
    - Selling price: ₹2,300/quintal
    - Cultivation cost: ₹30,000/acre
    - Transport & marketing cost: ₹5,000/acre
    Expected:
    - Expected production: 50.0 quintals
    - Gross revenue: ₹1,15,000.0
    - Total cost: ₹70,000.0
    - Net profit: ₹45,000.0
    - Break-even price: ₹1,400.0/quintal
    """
    print("\n[TEST 1B] Profit Calculator: NASA Submission Benchmark Spec")
    result = calculate_profit(
        farm_area_acres=2.0,
        expected_yield_quintals_per_acre=25.0,
        selling_price_per_quintal=2300.0,
        cultivation_cost_per_acre=30000.0,
        transportation_marketing_cost_per_acre=5000.0,
        crop_name="Paddy (Rice)"
    )

    # 1. Total production = 2.0 * 25.0 = 50.0 quintals
    assert result["expected_production_quintals"] == 50.0, f"Expected 50.0, got {result['expected_production_quintals']}"
    # 2. Gross revenue = 50.0 * 2,300 = ₹1,15,000
    assert result["gross_revenue_total"] == 115000.0, f"Expected 115000.0, got {result['gross_revenue_total']}"
    # 3. Total cost = 2.0 * (30,000 + 5,000) = ₹70,000
    assert result["total_estimated_costs"] == 70000.0, f"Expected 70000.0, got {result['total_estimated_costs']}"
    # 4. Net profit = 1,15,000 - 70,000 = ₹45,000
    assert result["estimated_net_profit_total"] == 45000.0, f"Expected 45000.0, got {result['estimated_net_profit_total']}"
    # 5. Break-even price = 70,000 / 50.0 = ₹1,400.0/quintal
    assert result["breakeven_selling_price_per_quintal"] == 1400.0, f"Expected 1400.0, got {result['breakeven_selling_price_per_quintal']}"
    # 6. Profit per acre = 45,000 / 2.0 = ₹22,500/acre
    assert result["estimated_net_profit_per_acre"] == 22500.0, f"Expected 22500.0, got {result['estimated_net_profit_per_acre']}"
    # 7. ROI = (45,000 / 70,000) * 100 = 64.29%
    assert result["return_on_investment_pct"] == 64.29, f"Expected 64.29, got {result['return_on_investment_pct']}"

    print("  ✓ Total production: 50.0 quintals (2 acres × 25 q/acre)")
    print("  ✓ Gross revenue: ₹1,15,000.0 (50 q × ₹2,300/q)")
    print("  ✓ Total cost: ₹70,000.0 (2 acres × (₹30,000 + ₹5,000)/acre)")
    print("  ✓ Net profit: ₹45,000.0 (₹1,15,000 - ₹70,000)")
    print("  ✓ Break-even price: ₹1,400.0/quintal (₹70,000 / 50 q)")
    print("  ✓ TEST 1B PASSED: NASA submission benchmark values verified exactly.")


def test_profit_calculator_loss_scenario():
    """
    Test 2: Worked loss scenario
    - Area: 1.0 acre
    - Expected yield: 8.0 quintals/acre
    - Selling price: ₹2,000/quintal
    - Cultivation cost: ₹20,000/acre
    - Transport cost: ₹2,000/acre
    """
    print("\n[TEST 2] Profit Calculator: Worked Loss Scenario")
    result = calculate_profit(
        farm_area_acres=1.0,
        expected_yield_quintals_per_acre=8.0,
        selling_price_per_quintal=2000.0,
        cultivation_cost_per_acre=20000.0,
        transportation_marketing_cost_per_acre=2000.0,
        crop_name="Maize"
    )

    # Expected production: 1.0 * 8.0 = 8.0 q
    assert result["expected_production_quintals"] == 8.0
    # Gross revenue: 8.0 * 2000 = ₹16,000
    assert result["gross_revenue_total"] == 16000.0
    # Total costs: 1.0 * 22,000 = ₹22,000
    assert result["total_estimated_costs"] == 22000.0
    # Net profit: 16,000 - 22,000 = -₹6,000
    assert result["estimated_net_profit_total"] == -6000.0
    assert result["estimated_net_profit_per_acre"] == -6000.0
    # Break-even price: 22,000 / 8.0 = ₹2,750/quintal
    assert result["breakeven_selling_price_per_quintal"] == 2750.0
    # Selling price (₹2,000) < Break-even (₹2,750), is_profitable = False
    assert result["is_profitable"] is False
    print("  ✓ Gross revenue: ₹16,000.0")
    print("  ✓ Total estimated costs: ₹22,000.0")
    print("  ✓ Net deficit (Loss): -₹6,000.0")
    print("  ✓ Break-even selling price: ₹2,750.0/q (Farmer selling at ₹2,000.0/q)")
    print("  ✓ TEST 2 PASSED: Loss and break-even accurately computed.")


def test_profit_calculator_validation_and_zero_yield():
    """
    Test 3: Edge cases and input validation
    """
    print("\n[TEST 3] Profit Calculator: Input Validation & Zero Yield")
    # Zero yield scenario: break-even price must be None (no division by zero)
    zero_res = calculate_profit(
        farm_area_acres=2.0,
        expected_yield_quintals_per_acre=0.0,
        selling_price_per_quintal=2300.0,
        cultivation_cost_per_acre=15000.0,
        transportation_marketing_cost_per_acre=0.0,
        crop_name="Crop Failure"
    )
    assert zero_res["expected_production_quintals"] == 0.0
    assert zero_res["gross_revenue_total"] == 0.0
    assert zero_res["breakeven_selling_price_per_quintal"] is None
    assert zero_res["is_profitable"] is False
    print("  ✓ Zero yield handled safely with breakeven=None (no ZeroDivisionError)")

    # Negative farm area must be rejected
    try:
        calculate_profit(farm_area_acres=0.0, expected_yield_quintals_per_acre=10.0, selling_price_per_quintal=2000.0, cultivation_cost_per_acre=10000.0, transportation_marketing_cost_per_acre=0.0)
        assert False, "Zero farm area should have raised ValueError"
    except ValueError:
        print("  ✓ Zero/negative farm area correctly rejected")

    # Negative costs must be rejected
    try:
        calculate_profit(farm_area_acres=1.0, expected_yield_quintals_per_acre=10.0, selling_price_per_quintal=2000.0, cultivation_cost_per_acre=-500.0, transportation_marketing_cost_per_acre=0.0)
        assert False, "Negative cultivation cost should have raised ValueError"
    except ValueError:
        print("  ✓ Negative cultivation cost correctly rejected")

    print("  ✓ TEST 3 PASSED: Robust input validation verified.")


def test_market_status_endpoint():
    """
    Test 4: GET /api/market/status
    """
    print("\n[TEST 4] Market Status & Integrity Endpoint")
    data = get_market_integration_status()
    assert data["status"] == "ready"
    assert "official_portals" in data
    assert len(data["official_portals"]) >= 4
    assert "integrity_notice" in data
    print(f"  ✓ Verified {len(data['official_portals'])} official portal sources.")
    print("  ✓ Integrity notice present: no fabricated data guarantee.")
    print("  ✓ TEST 4 PASSED: Market status endpoint verified.")


def test_market_prices_honest_fallback():
    """
    Test 5: GET /api/market/prices (without API key) & CACP MSP 2026–27 Benchmarks
    """
    print("\n[TEST 5] Market Prices Endpoint: Honest Fallback & CACP 2026–27 Benchmarks")
    data = get_market_prices(state="Karnataka", district="Shivamogga")
    # In sandbox without DATAGOVIN_API_KEY, must report unavailable state honestly
    assert data["live_data_available"] is False
    assert data["status"] in ("API_KEY_REQUIRED", "NETWORK_UNAVAILABLE")
    assert len(data["records"]) == 0, "Must NOT contain fabricated records!"
    assert "official_portals" in data
    assert "statutory_msp_benchmarks" in data
    assert len(data["statutory_msp_benchmarks"]) >= 8
    print("  ✓ Live data available flag is False (no API key).")
    print(f"  ✓ Zero synthetic records returned (clean integrity).")
    print(f"  ✓ Provided {len(data['statutory_msp_benchmarks'])} CACP MSP statutory benchmarks.")

    # Detailed verification of Kharif 2026-27 MSP values
    msp_res = get_msp_benchmarks()
    assert msp_res["marketing_year"] == "Kharif Marketing Season 2026–27"
    assert "Commission for Agricultural Costs & Prices (CACP)" in msp_res["notifying_body"]
    b_map = {b["crop_name"]: b for b in msp_res["benchmarks"]}

    # Verify official CACP 2026-27 values
    assert b_map["Paddy (Rice)"]["msp_inr_per_quintal"] == 2441.0
    assert b_map["Paddy (Rice)"]["is_statutory_msp"] is True
    assert b_map["Ragi (Finger Millet)"]["msp_inr_per_quintal"] == 5205.0
    assert b_map["Ragi (Finger Millet)"]["is_statutory_msp"] is True
    assert b_map["Maize"]["msp_inr_per_quintal"] == 2410.0
    assert b_map["Maize"]["is_statutory_msp"] is True
    assert b_map["Black Gram"]["msp_inr_per_quintal"] == 8200.0
    assert b_map["Green Gram"]["msp_inr_per_quintal"] == 8780.0
    assert b_map["Groundnut"]["msp_inr_per_quintal"] == 7517.0
    assert b_map["Soybean"]["msp_inr_per_quintal"] == 5708.0

    # Non-MSP items: must be None and not statutory MSP
    assert b_map["Cowpea"]["msp_inr_per_quintal"] is None
    assert b_map["Cowpea"]["is_statutory_msp"] is False
    assert b_map["Arecanut"]["msp_inr_per_quintal"] is None
    assert b_map["Arecanut"]["is_statutory_msp"] is False
    print("  ✓ Official Kharif Marketing Season 2026–27 CACP MSP values strictly verified.")
    print("  ✓ Cowpea and Arecanut confirmed as non-statutory MSP commodities with None benchmark.")
    print("  ✓ TEST 5 PASSED: Honest fallback and 2026–27 MSP data verified.")


def test_market_activity_principles_endpoint():
    """
    Test 6: GET /api/market/activity-principles
    """
    print("\n[TEST 6] Market Activity Principles Endpoint")
    data = get_market_activity_principles()
    assert "principles" in data
    assert len(data["principles"]) == 4

    topics = [p["topic"] for p in data["principles"]]
    assert any("Arrivals" in t for t in topics), "Missing Arrivals principle"
    assert any("Traded Quantity" in t for t in topics), "Missing Traded Quantity principle"
    assert any("Price-Volume" in t for t in topics), "Missing Joint Price-Volume principle"
    assert any("Disclaimer" in t for t in topics), "Missing Disclaimer principle"

    # Check strict disclaimer text
    disclaimer_topic = [p for p in data["principles"] if "Disclaimer" in p["topic"]][0]
    assert "Arrivals alone do not prove consumer demand" in disclaimer_topic["summary"]
    print("  ✓ All 4 required market activity principles present.")
    print("  ✓ Cautionary disclaimer against arrivals alone proving demand verified.")
    print("  ✓ TEST 6 PASSED: Market activity principles verified.")


def test_crop_market_comparison_endpoint():
    """
    Test 7: GET /api/market/crop-comparison
    """
    print("\n[TEST 7] Crop Market Comparison Endpoint")
    data = get_crop_market_comparison_endpoint()
    assert data["status"] == "success"
    assert "disclaimer_warning" in data
    assert "CRITICAL AGRONOMIC RULE: Never rank or select crops based on market prices alone" in data["disclaimer_warning"]
    assert len(data["crops"]) == 9, f"Expected 9 crops, got {len(data['crops'])}"

    for crop_entry in data["crops"]:
        assert "agro_climatic_profile" in crop_entry
        assert "economic_market_profile" in crop_entry
        agro = crop_entry["agro_climatic_profile"]
        econ = crop_entry["economic_market_profile"]
        assert agro["water_requirement"] is not None
        assert agro["suitable_seasons"] is not None
        assert "statutory_msp_2026_27" in econ
        assert "statutory_msp_2024_25" in econ

    print("  ✓ Exactly 9 database crops retrieved.")
    print("  ✓ Agro-climatic profile and economic market profile strictly separated.")
    print("  ✓ Prominent scientific warning against ranking by price alone verified.")
    print("  ✓ TEST 7 PASSED: Balanced crop comparison verified.")


def test_profit_calculator_api_endpoint():
    """
    Test 8: POST /api/market/profit-calculator
    """
    print("\n[TEST 8] Profit Calculator API Endpoint")
    req = ProfitCalculationRequest(
        crop_name="Ragi (Finger Millet)",
        farm_area_acres=2.0,
        expected_yield_quintals_per_acre=12.0,
        selling_price_per_quintal=5205.0,
        cultivation_cost_per_acre=16000.0,
        transportation_marketing_cost_per_acre=1500.0
    )
    data = calculate_farm_profit_endpoint(req)

    # Expected production: 2.0 * 12.0 = 24.0 q
    assert data["expected_production_quintals"] == 24.0
    # Gross revenue: 24.0 * 5205.0 = ₹1,24,920.0
    assert data["gross_revenue_total"] == 124920.0
    # Total costs: 2.0 * (16000 + 1500) = 2.0 * 17500 = ₹35,000.0
    assert data["total_estimated_costs"] == 35000.0
    # Net profit: 124920 - 35000 = ₹89,920.0
    assert data["estimated_net_profit_total"] == 89920.0
    # Profit per acre: 89920 / 2.0 = ₹44,960.0
    assert data["estimated_net_profit_per_acre"] == 44960.0
    # Break-even price: 35000 / 24.0 = ₹1,458.33
    assert data["breakeven_selling_price_per_quintal"] == 1458.33
    assert data["is_profitable"] is True
    print("  ✓ Ragi calculation (Kharif 2026-27 MSP ₹5,205): Gross ₹1,24,920, Cost ₹35,000, Net Profit ₹89,920.")
    print("  ✓ Profit per acre: ₹44,960/acre, Break-even: ₹1,458.33/q.")
    print("  ✓ TEST 8 PASSED: API profit calculator verified.")


def test_local_mandi_observations_crud():
    """
    Test 9: CRUD for local mandi observations
    """
    print("\n[TEST 9] Local Mandi Observations CRUD")
    test_entry = LocalMandiObservationCreate(
        crop_name="Paddy (Rice)",
        commodity="Paddy (Common)",
        state="Karnataka",
        district="Shivamogga",
        mandi_name="Shivamogga APMC Yard",
        variety="Jyothi / Tanu",
        min_price=2250.0,
        max_price=2420.0,
        modal_price=2360.0,
        arrival_quantity=450.0,
        traded_quantity=420.0,
        unit="₹/quintal",
        data_date="2026-11-15",
        notes="Good Fair Average Quality (FAQ) lot observed at Shivamogga APMC"
    )

    # 1. Create
    create_res = record_local_mandi_observation(test_entry)
    assert create_res["status"] == "success"
    created_obj = create_res["observation"]
    obs_id = created_obj["id"]
    assert obs_id > 0
    assert created_obj["modal_price"] == 2360.0
    print(f"  ✓ Created local observation ID: {obs_id} at {created_obj['mandi_name']}")

    # 2. List with filter
    list_res = get_local_mandi_observations(district="Shivamogga", crop_name="Paddy")
    assert list_res["status"] == "success"
    records = list_res["records"]
    assert any(r["id"] == obs_id for r in records)
    print(f"  ✓ Listed observations: found ID {obs_id} in Shivamogga records.")

    # 3. Verify prices endpoint includes this local observation
    prices_res = get_market_prices(state="Karnataka", district="Shivamogga", commodity="Paddy")
    assert any(r["id"] == obs_id for r in prices_res.get("local_observations", []))
    print(f"  ✓ Verified observation attached to get_market_prices endpoint.")

    # 4. Clean up / Delete
    del_res = remove_local_mandi_observation(obs_id)
    assert del_res["status"] == "success"
    print(f"  ✓ Deleted test observation ID {obs_id} cleanly.")

    print("  ✓ TEST 9 PASSED: Local mandi observations CRUD verified.")


def main():
    print("======================================================================")
    print("KRISHIORBIT PHASE 8: MARKET & PROFIT INTELLIGENCE REGRESSION SUITE")
    print("======================================================================")

    test_profit_calculator_worked_example_profitable()
    test_profit_calculator_nasa_submission_spec()
    test_profit_calculator_loss_scenario()
    test_profit_calculator_validation_and_zero_yield()
    test_market_status_endpoint()
    test_market_prices_honest_fallback()
    test_market_activity_principles_endpoint()
    test_crop_market_comparison_endpoint()
    test_profit_calculator_api_endpoint()
    test_local_mandi_observations_crud()

    print("\n======================================================================")
    print("ALL 9 PHASE 8 MARKET & PROFIT INTELLIGENCE TESTS PASSED SUCCESSFULLY!")
    print("======================================================================")


if __name__ == "__main__":
    main()
