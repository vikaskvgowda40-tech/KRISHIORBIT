"""
KRISHIORBIT Market & Profit Intelligence Service (Phase 8 MVP)
==============================================================
Provides official agricultural market data access, CACP statutory MSP benchmarks,
market activity/demand explanations, and deterministic farm profitability calculations.

Data Sources & References:
1. data.gov.in - AGMARKNET Daily Market Prices (Directorate of Marketing & Inspection, DA&FW)
   Catalog: https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi
2. e-NAM - National Agriculture Market Trading Details (Small Farmers Agri-Business Consortium)
   Portal: https://www.enam.gov.in/web/trading-details
3. Commission for Agricultural Costs & Prices (CACP) - Minimum Support Prices (MSP) 2024–25
   Portal: https://cacp.dacnet.nic.in
4. Karnataka State Agricultural Marketing Board (KSAMB)
   Portal: https://ksamb.karnataka.gov.in
"""

import os
from datetime import datetime
from typing import Optional, List, Dict, Any
import requests


# Official agricultural market portals
OFFICIAL_MARKET_PORTALS = [
    {
        "id": "agmarknet_official",
        "name": "AGMARKNET Official Portal",
        "agency": "Directorate of Marketing & Inspection, DA&FW, GoI",
        "url": "https://agmarknet.gov.in",
        "description": "Daily commodity prices, arrivals, and grade-wise spot auction rates across all APMC mandis in India."
    },
    {
        "id": "data_gov_in_agmarknet",
        "name": "data.gov.in AGMARKNET Catalog",
        "agency": "National Informatics Centre (NIC) / Open Government Data Platform India",
        "url": "https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi",
        "description": "Official Open Government Data (OGD) API feed for daily mandi prices and arrivals."
    },
    {
        "id": "enam_trading",
        "name": "e-NAM (National Agriculture Market)",
        "agency": "Small Farmers Agri-Business Consortium (SFAC), Ministry of Agriculture",
        "url": "https://www.enam.gov.in/web/trading-details",
        "description": "Pan-India electronic trading portal displaying real-time mandi trade volume, arrivals, and prices."
    },
    {
        "id": "ksamb_karnataka",
        "name": "KSAMB Karnataka State Agricultural Marketing Board",
        "agency": "Government of Karnataka",
        "url": "https://ksamb.karnataka.gov.in",
        "description": "State marketing board providing daily rates for Karnataka APMCs including Shivamogga, Davanagere, and Sagar."
    },
    {
        "id": "cacp_msp",
        "name": "Commission for Agricultural Costs & Prices (CACP)",
        "agency": "Ministry of Agriculture & Farmers Welfare, GoI",
        "url": "https://cacp.dacnet.nic.in",
        "description": "Statutory Minimum Support Price (MSP) recommendations and gazetted price support policy."
    }
]


# Statutory Minimum Support Prices (MSP) announced by Government of India for Kharif Marketing Season 2026–27
# Source: Commission for Agricultural Costs & Prices (CACP), Department of Agriculture & Farmers Welfare,
# Ministry of Agriculture & Farmers Welfare, Government of India (https://cacp.dacnet.nic.in)
CACP_MSP_BENCHMARKS: Dict[str, Dict[str, Any]] = {
    "Paddy (Rice)": {
        "crop_name": "Paddy (Rice)",
        "commodity": "Paddy (Common)",
        "variety_benchmarks": [
            {"variety": "Common", "msp_inr_per_quintal": 2441.0},
            {"variety": "Grade A", "msp_inr_per_quintal": 2461.0}
        ],
        "msp_inr_per_quintal": 2441.0,
        "marketing_season": "Kharif Marketing Season 2026–27",
        "category": "Cereal",
        "notifying_agency": "Commission for Agricultural Costs & Prices (CACP), Department of Agriculture & Farmers Welfare, GoI",
        "source_url": "https://cacp.dacnet.nic.in",
        "is_statutory_msp": True,
        "perishability": "Non-perishable grain (durable with dry storage)",
        "notes": "Statutory procurement benchmark for Fair Average Quality (FAQ) Common Paddy."
    },
    "Ragi (Finger Millet)": {
        "crop_name": "Ragi (Finger Millet)",
        "commodity": "Ragi",
        "variety_benchmarks": [
            {"variety": "Standard FAQ", "msp_inr_per_quintal": 5205.0}
        ],
        "msp_inr_per_quintal": 5205.0,
        "marketing_season": "Kharif Marketing Season 2026–27",
        "category": "Nutri-Cereal",
        "notifying_agency": "Commission for Agricultural Costs & Prices (CACP), Department of Agriculture & Farmers Welfare, GoI",
        "source_url": "https://cacp.dacnet.nic.in",
        "is_statutory_msp": True,
        "perishability": "Highly durable nutri-cereal grain (exceptional multi-year storage longevity)",
        "notes": "Statutory procurement benchmark for FAQ Finger Millet (Ragi) under Shree Anna nutri-cereal promotion."
    },
    "Maize": {
        "crop_name": "Maize",
        "commodity": "Maize",
        "variety_benchmarks": [
            {"variety": "Yellow / White Hybrid", "msp_inr_per_quintal": 2410.0}
        ],
        "msp_inr_per_quintal": 2410.0,
        "marketing_season": "Kharif Marketing Season 2026–27",
        "category": "Cereal / Feed",
        "notifying_agency": "Commission for Agricultural Costs & Prices (CACP), Department of Agriculture & Farmers Welfare, GoI",
        "source_url": "https://cacp.dacnet.nic.in",
        "is_statutory_msp": True,
        "perishability": "Semi-durable cereal grain (requires < 14% moisture to prevent fungal aflatoxins)",
        "notes": "Statutory procurement benchmark for FAQ Maize (Yellow/White)."
    },
    "Black Gram": {
        "crop_name": "Black Gram",
        "commodity": "Urad",
        "variety_benchmarks": [
            {"variety": "Standard FAQ", "msp_inr_per_quintal": 8200.0}
        ],
        "msp_inr_per_quintal": 8200.0,
        "marketing_season": "Kharif Marketing Season 2026–27",
        "category": "Pulse / Legume",
        "notifying_agency": "Commission for Agricultural Costs & Prices (CACP), Department of Agriculture & Farmers Welfare, GoI",
        "source_url": "https://cacp.dacnet.nic.in",
        "is_statutory_msp": True,
        "perishability": "Dry pulse grain (susceptible to pulse beetle bruchids in humid storage)",
        "notes": "Statutory procurement benchmark for FAQ Black Gram (Urad)."
    },
    "Green Gram": {
        "crop_name": "Green Gram",
        "commodity": "Moong",
        "variety_benchmarks": [
            {"variety": "Standard FAQ", "msp_inr_per_quintal": 8780.0}
        ],
        "msp_inr_per_quintal": 8780.0,
        "marketing_season": "Kharif Marketing Season 2026–27",
        "category": "Pulse / Legume",
        "notifying_agency": "Commission for Agricultural Costs & Prices (CACP), Department of Agriculture & Farmers Welfare, GoI",
        "source_url": "https://cacp.dacnet.nic.in",
        "is_statutory_msp": True,
        "perishability": "Dry pulse grain (requires dry, airtight storage)",
        "notes": "Statutory procurement benchmark for FAQ Green Gram (Moong)."
    },
    "Groundnut": {
        "crop_name": "Groundnut",
        "commodity": "Groundnut in Shell",
        "variety_benchmarks": [
            {"variety": "Pods with shell (FAQ)", "msp_inr_per_quintal": 7517.0}
        ],
        "msp_inr_per_quintal": 7517.0,
        "marketing_season": "Kharif Marketing Season 2026–27",
        "category": "Oilseed Legume",
        "notifying_agency": "Commission for Agricultural Costs & Prices (CACP), Department of Agriculture & Farmers Welfare, GoI",
        "source_url": "https://cacp.dacnet.nic.in",
        "is_statutory_msp": True,
        "perishability": "Pods require thorough drying (< 8% moisture) to prevent Aspergillus aflatoxins",
        "notes": "Statutory procurement benchmark for FAQ Groundnut in shell."
    },
    "Soybean": {
        "crop_name": "Soybean",
        "commodity": "Soybean (Yellow)",
        "variety_benchmarks": [
            {"variety": "Yellow FAQ", "msp_inr_per_quintal": 5708.0}
        ],
        "msp_inr_per_quintal": 5708.0,
        "marketing_season": "Kharif Marketing Season 2026–27",
        "category": "Oilseed / Legume",
        "notifying_agency": "Commission for Agricultural Costs & Prices (CACP), Department of Agriculture & Farmers Welfare, GoI",
        "source_url": "https://cacp.dacnet.nic.in",
        "is_statutory_msp": True,
        "perishability": "Dry oilseed grain (sensitive to heat and humidity during storage)",
        "notes": "Statutory procurement benchmark for FAQ Soybean (Yellow)."
    },
    "Cowpea": {
        "crop_name": "Cowpea",
        "commodity": "Cowpea (Alasande / Lobia)",
        "variety_benchmarks": [],
        "msp_inr_per_quintal": None,
        "marketing_season": "Non-MSP Commodity (Manual Local Entry)",
        "category": "Pulse / Legume",
        "notifying_agency": "Not under Central CACP MSP Schedule",
        "source_url": "https://agmarknet.gov.in",
        "is_statutory_msp": False,
        "perishability": "Dry pulse grain",
        "notes": "Cowpea is not covered under the central CACP Minimum Support Price schedule. Fixed benchmark prices are not assigned to maintain scientific honesty. Farmers should record verified local APMC auction rates in the Local Mandi Observations section or enter prevailing spot prices manually in the Profit Calculator."
    },
    "Arecanut": {
        "crop_name": "Arecanut",
        "commodity": "Arecanut (Supari / Betel Nut)",
        "variety_benchmarks": [],
        "msp_inr_per_quintal": None,
        "marketing_season": "Perennial Plantation (Non-MSP Commercial)",
        "category": "Commercial Plantation",
        "notifying_agency": "Not eligible for CACP MSP (Tracked via CAMPCO / APMC)",
        "source_url": "https://campco.org",
        "is_statutory_msp": False,
        "perishability": "Commercial cured nut (requires de-husking, boiling, sun-curing; shelf-stable once dried)",
        "notes": "Arecanut is a perennial commercial palm and is NOT eligible for government CACP MSP price support. Fixed benchmark prices are omitted to prevent misleading price assumptions. Market quotations fluctuate by grade (Rashi, Chali, Bette) and are monitored via CAMPCO and local APMC auctions (Shivamogga, Sagar, Sirsi). Farmers should record verified local mandi rates or enter spot market prices manually."
    }
}


# Educational and scientific guidance on market activity and demand dynamics
MARKET_ACTIVITY_PRINCIPLES = {
    "title": "Understanding Agricultural Market Activity & Demand Dynamics",
    "principles": [
        {
            "topic": "Market Supply Velocity (Arrivals)",
            "summary": "Higher arrivals indicate greater physical market supply.",
            "explanation": (
                "Arrivals (in quintals or tonnes) quantify the total volume of farm produce delivered "
                "to regulated APMC mandi yards on a given trading day. Peak harvest periods often witness "
                "surges in arrivals. If local storage, processing mills, or transportation infrastructure "
                "cannot immediately absorb high arrivals, spot auction prices may face temporary downward pressure."
            )
        },
        {
            "topic": "Recorded Trading Activity (Traded Quantity)",
            "summary": "Traded quantity indicates actual concluded transactions.",
            "explanation": (
                "While arrivals measure total supply delivered to the market, traded quantity measures "
                "the fraction of that supply that cleared auction and was purchased by buyers at agreed prices. "
                "A significant discrepancy between arrivals and traded quantity may signal buyer resistance, "
                "sub-standard fair average quality (FAQ), or excessive seller reserve pricing."
            )
        },
        {
            "topic": "Joint Price-Volume Dynamics",
            "summary": "Price trends and traded volume together help assess market conditions.",
            "explanation": (
                "Evaluating price and volume concurrently provides deeper insight than examining price alone:\n"
                "• Rising prices alongside rising trade volume: Signals robust processor and consumer demand.\n"
                "• Falling prices alongside surging arrivals: Signals a seasonal harvest glut or distress selling.\n"
                "• High prices alongside negligible arrivals: Signals off-season scarcity or low local market liquidity."
            )
        },
        {
            "topic": "Strict Analytical Boundary & Disclaimer",
            "summary": "Arrivals alone do not prove consumer demand or predict future market prices.",
            "explanation": (
                "Scientific & Econometric Caution: Physical arrivals at regulated APMC mandis represent only one "
                "channel of commodity movement. Mandi arrivals do not account for direct farm-gate procurement, "
                "private corporate contracts, regional transit delays, weather bottlenecks, or speculative holding. "
                "Farmers must never assume that past arrivals guarantee future price behavior."
            )
        }
    ],
    "disclaimer": (
        "Market activity indicators are descriptive historical records of regulated market transactions. "
        "They do not constitute financial forecasts, price guarantees, or speculative trading advice."
    )
}


def fetch_agmarknet_live_data(
    state: str = "Karnataka",
    district: Optional[str] = "Shivamogga",
    commodity: Optional[str] = None,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Fetch official AGMARKNET daily mandi price data from data.gov.in if API key is configured.
    If no API key is configured, or if the external service is unreachable, returns an
    honest unavailable-data status without fabricating synthetic price data.
    """
    api_key = os.getenv("DATAGOVIN_API_KEY") or os.getenv("AGMARKNET_API_KEY")

    if not api_key:
        return {
            "live_data_available": False,
            "api_key_configured": False,
            "status": "API_KEY_REQUIRED",
            "reason": (
                "Official real-time AGMARKNET API access requires a registered data.gov.in API key. "
                "The environment variable DATAGOVIN_API_KEY is currently unset."
            ),
            "message": (
                "Live mandi price feeds are currently offline to uphold KRISHIORBIT scientific integrity. "
                "No synthetic market prices have been generated. Farmers can consult official market portals, "
                "review statutory CACP MSP benchmarks, or enter verified local APMC auction rates manually."
            ),
            "official_portals": OFFICIAL_MARKET_PORTALS,
            "records": [],
            "statutory_msp_benchmarks": list(CACP_MSP_BENCHMARKS.values()),
            "last_checked_at": datetime.now().isoformat()
        }

    # Official data.gov.in resource ID for daily mandi prices
    # Catalog: current-daily-price-various-commodities-various-markets-mandi
    resource_id = "9ef84268-d588-465a-a308-a864a43d0070"
    base_url = f"https://api.data.gov.in/resource/{resource_id}"

    params = {
        "api-key": api_key,
        "format": "json",
        "offset": 0,
        "limit": limit,
    }

    if state:
        params["filters[state]"] = state
    if district:
        params["filters[district]"] = district
    if commodity:
        params["filters[commodity]"] = commodity

    try:
        response = requests.get(base_url, params=params, timeout=6.0)
        if response.status_code == 200:
            data = response.json()
            raw_records = data.get("records", [])
            formatted_records = []
            for rec in raw_records:
                formatted_records.append({
                    "state": rec.get("state", state),
                    "district": rec.get("district", district),
                    "mandi": rec.get("market") or rec.get("market_name", "Local APMC"),
                    "commodity": rec.get("commodity", commodity or "Unspecified"),
                    "variety": rec.get("variety", "FAQ"),
                    "min_price": float(rec["min_price"]) if rec.get("min_price") is not None and str(rec["min_price"]).strip() != "" else None,
                    "max_price": float(rec["max_price"]) if rec.get("max_price") is not None and str(rec["max_price"]).strip() != "" else None,
                    "modal_price": float(rec.get("modal_price", 0.0)),
                    "arrival_quantity": float(rec["arrival"]) if rec.get("arrival") is not None and str(rec["arrival"]).strip() != "" else None,
                    "traded_quantity": float(rec["traded"]) if rec.get("traded") is not None and str(rec["traded"]).strip() != "" else None,
                    "unit": "₹/quintal",
                    "data_date": rec.get("arrival_date") or rec.get("date", datetime.now().strftime("%Y-%m-%d")),
                    "source": "data.gov.in AGMARKNET Live Feed",
                    "source_url": "https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi"
                })

            return {
                "live_data_available": True,
                "api_key_configured": True,
                "status": "ONLINE",
                "message": f"Successfully retrieved {len(formatted_records)} live mandi records from data.gov.in AGMARKNET feed.",
                "total_records": len(formatted_records),
                "official_portals": OFFICIAL_MARKET_PORTALS,
                "records": formatted_records,
                "statutory_msp_benchmarks": list(CACP_MSP_BENCHMARKS.values()),
                "last_checked_at": datetime.now().isoformat()
            }
        else:
            return {
                "live_data_available": False,
                "api_key_configured": True,
                "status": "UPSTREAM_ERROR",
                "http_status": response.status_code,
                "reason": f"data.gov.in responded with HTTP {response.status_code}: {response.text[:200]}",
                "message": "AGMARKNET live feed is temporarily unreachable. Using honest unavailable state.",
                "official_portals": OFFICIAL_MARKET_PORTALS,
                "records": [],
                "statutory_msp_benchmarks": list(CACP_MSP_BENCHMARKS.values()),
                "last_checked_at": datetime.now().isoformat()
            }
    except requests.RequestException as exc:
        return {
            "live_data_available": False,
            "api_key_configured": True,
            "status": "NETWORK_UNAVAILABLE",
            "reason": f"Connection to data.gov.in timed out or failed: {str(exc)}",
            "message": "AGMARKNET network connection unavailable. Farmers can use manual price entry or CACP MSP benchmarks.",
            "official_portals": OFFICIAL_MARKET_PORTALS,
            "records": [],
            "statutory_msp_benchmarks": list(CACP_MSP_BENCHMARKS.values()),
            "last_checked_at": datetime.now().isoformat()
        }


def calculate_profit(
    farm_area_acres: float,
    expected_yield_quintals_per_acre: float,
    selling_price_per_quintal: float,
    cultivation_cost_per_acre: float,
    transportation_marketing_cost_per_acre: float,
    crop_name: Optional[str] = "Crop"
) -> Dict[str, Any]:
    """
    Deterministically calculate farm revenue, production cost, net profit,
    profit per acre, and break-even selling price.

    Formulas:
    1. Expected production (quintals) = farm_area_acres * expected_yield_quintals_per_acre
    2. Gross revenue (₹) = expected_production_quintals * selling_price_per_quintal
    3. Gross revenue per acre (₹/acre) = expected_yield_quintals_per_acre * selling_price_per_quintal
    4. Cultivation cost total (₹) = farm_area_acres * cultivation_cost_per_acre
    5. Transportation & marketing cost total (₹) = farm_area_acres * transportation_marketing_cost_per_acre
    6. Total cost per acre (₹/acre) = cultivation_cost_per_acre + transportation_marketing_cost_per_acre
    7. Total estimated costs (₹) = farm_area_acres * total_cost_per_acre
    8. Estimated net profit (₹) = Gross revenue - Total estimated costs
    9. Estimated profit per acre (₹/acre) = Gross revenue per acre - Total cost per acre
    10. Break-even selling price (₹/quintal) = Total estimated costs / Expected production
    11. Return on Investment (ROI %) = (Estimated net profit / Total estimated costs) * 100
    """
    if farm_area_acres <= 0:
        raise ValueError("Farm area in acres must be greater than zero.")
    if expected_yield_quintals_per_acre < 0:
        raise ValueError("Expected yield per acre cannot be negative.")
    if selling_price_per_quintal < 0:
        raise ValueError("Selling price per quintal cannot be negative.")
    if cultivation_cost_per_acre < 0:
        raise ValueError("Cultivation cost per acre cannot be negative.")
    if transportation_marketing_cost_per_acre < 0:
        raise ValueError("Transportation and marketing cost per acre cannot be negative.")

    # Core mathematical calculations
    expected_production_quintals = round(farm_area_acres * expected_yield_quintals_per_acre, 2)
    gross_revenue_total = round(expected_production_quintals * selling_price_per_quintal, 2)
    gross_revenue_per_acre = round(expected_yield_quintals_per_acre * selling_price_per_quintal, 2)

    cultivation_cost_total = round(farm_area_acres * cultivation_cost_per_acre, 2)
    transport_marketing_cost_total = round(farm_area_acres * transportation_marketing_cost_per_acre, 2)
    total_cost_per_acre = round(cultivation_cost_per_acre + transportation_marketing_cost_per_acre, 2)
    total_estimated_costs = round(farm_area_acres * total_cost_per_acre, 2)

    estimated_net_profit_total = round(gross_revenue_total - total_estimated_costs, 2)
    estimated_net_profit_per_acre = round(gross_revenue_per_acre - total_cost_per_acre, 2)

    # Break-even selling price calculation
    if expected_production_quintals > 0:
        breakeven_selling_price = round(total_estimated_costs / expected_production_quintals, 2)
    else:
        breakeven_selling_price = None

    # Return on Investment (%)
    if total_estimated_costs > 0:
        roi_pct = round((estimated_net_profit_total / total_estimated_costs) * 100.0, 2)
    else:
        roi_pct = 0.0

    return {
        "crop_name": crop_name,
        "farm_area_acres": farm_area_acres,
        "expected_yield_quintals_per_acre": expected_yield_quintals_per_acre,
        "selling_price_per_quintal": selling_price_per_quintal,
        "cultivation_cost_per_acre": cultivation_cost_per_acre,
        "transportation_marketing_cost_per_acre": transportation_marketing_cost_per_acre,
        "expected_production_quintals": expected_production_quintals,
        "gross_revenue_total": gross_revenue_total,
        "gross_revenue_per_acre": gross_revenue_per_acre,
        "cultivation_cost_total": cultivation_cost_total,
        "transportation_marketing_cost_total": transport_marketing_cost_total,
        "total_cost_per_acre": total_cost_per_acre,
        "total_estimated_costs": total_estimated_costs,
        "estimated_net_profit_total": estimated_net_profit_total,
        "estimated_net_profit_per_acre": estimated_net_profit_per_acre,
        "breakeven_selling_price_per_quintal": breakeven_selling_price,
        "return_on_investment_pct": roi_pct,
        "is_profitable": estimated_net_profit_total >= 0,
        "currency": "INR",
        "currency_symbol": "₹",
        "calculation_timestamp": datetime.now().isoformat(),
        "disclaimer": (
            "Scientific & Economic Disclosure: Profit calculations are computational projections based strictly "
            "on farmer-entered inputs (expected yield, selling price, cultivation and transportation costs). "
            "KRISHIORBIT does not fabricate yields, costs, or revenues. Actual returns fluctuate based on seasonal "
            "weather anomalies, soil nutrient dynamics, pest incidence, post-harvest losses, and spot mandi prices."
        )
    }


def generate_crop_market_comparison(crops_catalog: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate a balanced comparison between agro-climatic requirements and economic/market
    indicators for the crops in KRISHIORBIT database.
    Explicitly presents climate suitability and market parameters separately to prevent
    dangerous price-only crop selection.
    """
    comparison_entries = []

    for crop in crops_catalog:
        crop_name = crop.get("crop_name", "")
        # Find matching CACP MSP benchmark
        msp_info = CACP_MSP_BENCHMARKS.get(crop_name)
        if not msp_info:
            # Check loose match
            for key, val in CACP_MSP_BENCHMARKS.items():
                if key.lower() in crop_name.lower() or crop_name.lower() in key.lower():
                    msp_info = val
                    break

        comparison_entries.append({
            "crop_id": crop.get("id"),
            "crop_name": crop_name,
            "scientific_name": crop.get("scientific_name"),
            "crop_category": crop.get("crop_category"),
            # Agro-climatic suitability parameters (MUST BE EVALUATED FIRST)
            "agro_climatic_profile": {
                "suitable_seasons": crop.get("suitable_seasons"),
                "growing_duration": crop.get("growing_duration_days"),
                "water_requirement": crop.get("water_requirement"),
                "rainfall_suitability_mm": crop.get("rainfall_suitability_mm"),
                "temperature_suitability_c": crop.get("temperature_suitability_c"),
                "suitable_soils": crop.get("suitable_soils"),
                "source_institution": crop.get("source_institution")
            },
            # Economic and market parameters (EVALUATED SECOND)
            "economic_market_profile": {
                "statutory_msp_2026_27": msp_info.get("msp_inr_per_quintal") if msp_info else None,
                "statutory_msp_2024_25": msp_info.get("msp_inr_per_quintal") if msp_info else None,
                "is_statutory_msp": msp_info.get("is_statutory_msp", False) if msp_info else False,
                "marketing_season": msp_info.get("marketing_season", "Kharif Marketing Season 2026–27") if msp_info else "Manual Local Quote",
                "notifying_agency": msp_info.get("notifying_agency") if msp_info else "Local APMC Market Trade",
                "perishability": msp_info.get("perishability", "Dry storage grain") if msp_info else "Market Produce",
                "source_url": msp_info.get("source_url", "https://cacp.dacnet.nic.in") if msp_info else "https://agmarknet.gov.in",
                "notes": msp_info.get("notes", "") if msp_info else ""
            }
        })

    return {
        "status": "success",
        "disclaimer_warning": (
            "CRITICAL AGRONOMIC RULE: Never rank or select crops based on market prices alone! "
            "A crop with high market prices (e.g. Pulses or Arecanut) will incur catastrophic financial loss "
            "if your land's soil drainage, seasonal rainfall, and irrigation capacity do not satisfy its biological "
            "requirements. Always verify Agro-Climatic Suitability first."
        ),
        "total_crops": len(comparison_entries),
        "crops": comparison_entries,
        "official_sources": OFFICIAL_MARKET_PORTALS
    }
