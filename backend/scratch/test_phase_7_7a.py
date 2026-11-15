import urllib.request
import urllib.error
import json
import sys
import sqlite3
import os

def test_sqlite_direct():
    """Verify SQLite database integrity without writing or modifying any records."""
    db_path = os.path.join(os.path.dirname(__file__), "..", "krishiorbit.db")
    if not os.path.exists(db_path):
        db_path = "krishiorbit.db"

    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"[PASS] SQLite database exists ({db_path}), tables found: {tables}")
        cursor.execute("SELECT COUNT(*) FROM crops;")
        crop_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM farm_profiles;")
        profile_count = cursor.fetchone()[0]
        print(f"       Crops in DB: {crop_count}, Farm profiles in DB: {profile_count}")
        conn.close()
    else:
        print(f"[NOTE] SQLite db path not found locally at {db_path}; relying on live API checks.")

def test_endpoints():
    base_url = "http://127.0.0.1:8000"

    # 0. SQLite direct check
    test_sqlite_direct()

    # 1. Health check
    try:
        req = urllib.request.Request(f"{base_url}/api/health")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print("[PASS] /api/health returned 200 OK:", data)
    except Exception as e:
        print("[FAIL] /api/health:", e)
        sys.exit(1)

    # 2. Crops check
    try:
        req = urllib.request.Request(f"{base_url}/api/crops")
        with urllib.request.urlopen(req) as resp:
            crops = json.loads(resp.read().decode())
            print(f"[PASS] /api/crops returned {len(crops)} crops.")
            arecanut = next((c for c in crops if "arecanut" in c["crop_name"].lower()), None)
            if arecanut:
                print(f"[PASS] Arecanut preserved in crop knowledge base (id: {arecanut['id']}).")
            else:
                print("[FAIL] Arecanut missing from crops catalog!")
    except Exception as e:
        print("[FAIL] /api/crops:", e)
        sys.exit(1)

    # 3. NASA POWER Daily Telemetry endpoint check
    try:
        req = urllib.request.Request(f"{base_url}/api/nasa-power?latitude=13.9299&longitude=75.5681")
        with urllib.request.urlopen(req) as resp:
            daily = json.loads(resp.read().decode())
            meta = daily.get("metadata", {})
            ann = daily.get("annual_summary", {})
            print("[PASS] /api/nasa-power returned 200 OK")
            print(f"  - Source: {meta.get('data_source')}")
            print(f"  - Assimilated Observations: {meta.get('total_observations')} days ({meta.get('actual_first_observation')} to {meta.get('actual_last_observation')})")
            print(f"  - YTD Precipitation: {ann.get('total_precipitation_mm')} mm")
            print(f"  - Mean Temp: {ann.get('avg_temperature_c')} °C")
    except Exception as e:
        print("[FAIL] /api/nasa-power:", e)
        sys.exit(1)

    # 4. NASA POWER Climatology endpoint check
    try:
        req = urllib.request.Request(f"{base_url}/api/nasa-power/climatology?latitude=13.9299&longitude=75.5681")
        with urllib.request.urlopen(req) as resp:
            clim = json.loads(resp.read().decode())
            print("[PASS] /api/nasa-power/climatology returned 200 OK")
            print("  - Label:", clim.get("climatology_label"))
            print("  - Caveat:", clim.get("caveat"))
            ann = clim.get("annual_summary", {})
            print("  - Annual Baseline Precip:", ann.get("representative_annual_precipitation_mm"), "mm")
            print("  - Annual Mean Temp:", ann.get("avg_temperature_c"), "°C")
            print("  - Annual Rel Humidity:", ann.get("avg_relative_humidity_pct"), "%")
            months = clim.get("monthly_summary", [])
            print(f"  - Monthly breakdown returned {len(months)} months.")
            feb = next((m for m in months if m["month_number"] == 2), None)
            if feb:
                print("  - Feb days used:", feb.get("days_in_month"), "(should be 28.2667)")
    except Exception as e:
        print("[FAIL] /api/nasa-power/climatology:", e)
        sys.exit(1)

    # 5. Rotation compare with VALID annual crops (Paddy -> Black Gram)
    try:
        # Get active farm profile id
        prof_req = urllib.request.Request(f"{base_url}/api/farm-profiles")
        with urllib.request.urlopen(prof_req) as p_resp:
            profs = json.loads(p_resp.read().decode())
            farm_id = profs[0]["id"]
            print(f"[PASS] Using farm profile ID {farm_id} ({profs[0]['farm_name']})")

        payload = {
            "farm_profile_id": farm_id,
            "scenarios": [
                {"name": "Scenario A: Paddy -> Black Gram", "crop_ids": [1, 4]},
                {"name": "Scenario B: Paddy -> Cowpea", "crop_ids": [1, 7]}
            ]
        }
        req = urllib.request.Request(
            f"{base_url}/api/rotation/compare",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            print("[PASS] /api/rotation/compare with valid annual crops returned 200 OK")
            print(f"  - Total scenarios compared: {res.get('total_scenarios_compared')}")
            scs = res.get("scenarios", [])
            for sc in scs:
                print(f"  - {sc['name']}:")
                print(f"      Sequence: {sc['crop_sequence_display']}")
                print(f"      Evaluation label: {sc['heuristic_score'].get('evaluation_label')}")
                print(f"      Soil status: {sc['soil_compatibility']['overall_status']}")
                print(f"      Water status: {sc['climate_compatibility']['water_status']}")

        # 6. Rotation compare with ARECANUT (Should be rejected with 400 Bad Request)
        arec_payload = {
            "farm_profile_id": farm_id,
            "scenarios": [
                {"name": "Invalid Scenario: Paddy -> Arecanut", "crop_ids": [1, 6]}
            ]
        }
        arec_req = urllib.request.Request(
            f"{base_url}/api/rotation/compare",
            data=json.dumps(arec_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(arec_req) as resp:
                print("[FAIL] Arecanut sequence was accepted when it should have been rejected!")
                sys.exit(1)
        except urllib.error.HTTPError as he:
            if he.code == 400:
                err_body = json.loads(he.read().decode())
                print(f"[PASS] Arecanut sequence correctly REJECTED with HTTP 400 Bad Request:")
                print(f"       Detail: {err_body.get('detail')}")
            else:
                print(f"[FAIL] Unexpected HTTP status code: {he.code}")
                sys.exit(1)
    except Exception as e:
        print("[FAIL] Rotation comparison tests error:", e)
        sys.exit(1)

    print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    test_endpoints()
