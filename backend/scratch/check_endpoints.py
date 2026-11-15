import urllib.request
import json

base = 'http://127.0.0.1:8000'

endpoints = ['/api/health', '/api/farm-profiles', '/api/crops', '/api/nasa-power', '/api/nasa-power/climatology']

for ep in endpoints:
    req = urllib.request.Request(base + ep)
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.loads(r.read().decode())
        print(f"=== {ep} (HTTP {r.getcode()}) ===")
        if ep == '/api/health':
            print(" ", d)
        elif ep == '/api/farm-profiles':
            print(f"  {len(d)} farm profile(s): ID {d[0]['id']}, Farm: {d[0]['farm_name']}, Farmer: {d[0]['farmer_name']}")
        elif ep == '/api/crops':
            print(f"  {len(d)} crops cataloged: {[c['crop_name'] for c in d]}")
        elif ep == '/api/nasa-power':
            print(f"  Obs: {d['metadata']['total_observations']} days, YTD rain: {d['annual_summary']['total_precipitation_mm']} mm, Mean temp: {d['annual_summary']['avg_temperature_c']} C")
        elif ep == '/api/nasa-power/climatology':
            print(f"  Label: {d.get('climatology_label')}")
            print(f"  Caveat: {d.get('caveat')}")
            print(f"  Baseline Rain: {d['annual_summary']['representative_annual_precipitation_mm']} mm across 12 months")
            print(f"  Annual Mean Temp: {d['annual_summary']['avg_temperature_c']} C")
