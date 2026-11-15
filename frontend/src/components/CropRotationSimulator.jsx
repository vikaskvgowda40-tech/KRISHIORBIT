import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../apiConfig';

const API_PROFILES = `${API_BASE_URL}/api/farm-profiles`;
const API_CROPS = `${API_BASE_URL}/api/crops`;
const API_NASA = `${API_BASE_URL}/api/nasa-power`;
const API_NASA_CLIMATOLOGY = `${API_BASE_URL}/api/nasa-power/climatology`;
const API_COMPARE = `${API_BASE_URL}/api/rotation/compare`;

const PRESET_SCENARIOS = [
  {
    name: 'Kharif Paddy → Rabi Black Gram',
    crop_ids: [1, 4],
    desc: 'Classic Malnad rice-pulse rotation; restores nitrogen after heavy cereal harvest.'
  },
  {
    name: 'Kharif Paddy → Summer Green Gram',
    crop_ids: [1, 5],
    desc: 'Short-duration (60–70 day) pulse rotation fitting narrow irrigation windows.'
  },
  {
    name: 'Kharif Paddy → Rabi Cowpea',
    crop_ids: [1, 7],
    desc: 'High-biomass cover pulse; excellent for acidic laterite soil & erosion prevention.'
  },
  {
    name: 'Kharif Ragi → Rabi Cowpea',
    crop_ids: [2, 7],
    desc: 'Drought-hardy nutri-cereal followed by nitrogen-fixing legume; modest water footprint.'
  },
  {
    name: 'Consecutive Cereals (Paddy → Maize)',
    crop_ids: [1, 3],
    desc: 'Double cereal cropping; heavy nutrient extraction requiring intensive replenishment.'
  }
];

export default function CropRotationSimulator({ onOpenFarmProfile, onOpenCrops }) {
  const [profiles, setProfiles] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);

  const [crops, setCrops] = useState([]);
  const [climateData, setClimateData] = useState(null);
  const [climatologyData, setClimatologyData] = useState(null);

  const [scenarios, setScenarios] = useState([
    { name: 'Scenario A: Paddy → Black Gram', crop_ids: [1, 4] },
    { name: 'Scenario B: Paddy → Cowpea', crop_ids: [1, 7] }
  ]);

  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [climateLoading, setClimateLoading] = useState(false);
  const [climatologyLoading, setClimatologyLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customCropSelect, setCustomCropSelect] = useState({ scenarioIndex: null, cropId: 1 });

  // Filter out Perennial / Plantation crops (Arecanut) for annual rotation sequences
  const annualCrops = crops.filter(
    (c) =>
      !c.crop_name.toLowerCase().includes('arecanut') &&
      !(c.crop_category || '').toLowerCase().includes('plantation')
  );

  // 1. Initial Load: Farm Profiles & Crops
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profRes, cropRes] = await Promise.all([
          fetch(API_PROFILES),
          fetch(API_CROPS)
        ]);

        if (!profRes.ok || !cropRes.ok) {
          throw new Error('Failed to load farm profiles or crop catalog');
        }

        const profData = await profRes.json();
        const cropData = await cropRes.json();

        setProfiles(profData);
        setCrops(cropData);

        if (profData && profData.length > 0) {
          setSelectedFarmId(profData[0].id);
          setSelectedFarm(profData[0]);
        }
      } catch (err) {
        setError(err.message || 'Error communicating with backend');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Fetch NASA POWER Climate observations & Climatology baseline when selected farm changes
  useEffect(() => {
    if (!selectedFarm) {
      setClimateData(null);
      setClimatologyData(null);
      return;
    }

    const fetchFarmClimate = async () => {
      setClimateLoading(true);
      setClimatologyLoading(true);
      try {
        const lat = selectedFarm.latitude || 13.9299;
        const lon = selectedFarm.longitude || 75.5681;

        const [dailyRes, climRes] = await Promise.allSettled([
          fetch(`${API_NASA}?latitude=${lat}&longitude=${lon}`),
          fetch(`${API_NASA_CLIMATOLOGY}?latitude=${lat}&longitude=${lon}`)
        ]);

        if (dailyRes.status === 'fulfilled' && dailyRes.value.ok) {
          const data = await dailyRes.value.json();
          setClimateData(data);
        }

        if (climRes.status === 'fulfilled' && climRes.value.ok) {
          const clim = await climRes.value.json();
          setClimatologyData(clim);
        }
      } catch (err) {
        console.warn('NASA climate fetch note:', err);
      } finally {
        setClimateLoading(false);
        setClimatologyLoading(false);
      }
    };

    fetchFarmClimate();
  }, [selectedFarm]);

  // 3. Handle Farm Change
  const handleFarmChange = (e) => {
    const fid = parseInt(e.target.value, 10);
    setSelectedFarmId(fid);
    const found = profiles.find((p) => p.id === fid);
    setSelectedFarm(found || null);
    setComparisonResult(null);
  };

  // 4. Scenario Builder Helpers
  const addScenario = (preset) => {
    if (scenarios.length >= 4) {
      alert('You can compare up to 4 scenarios simultaneously for clear readability.');
      return;
    }
    const newSc = preset || {
      name: `Custom Scenario ${String.fromCharCode(65 + scenarios.length)}`,
      crop_ids: [1, 4]
    };
    setScenarios([...scenarios, newSc]);
    setComparisonResult(null);
  };

  const removeScenario = (index) => {
    if (scenarios.length <= 1) {
      alert('At least one scenario is required for simulation.');
      return;
    }
    const updated = scenarios.filter((_, idx) => idx !== index);
    setScenarios(updated);
    setComparisonResult(null);
  };

  const updateScenarioName = (index, newName) => {
    const updated = [...scenarios];
    updated[index].name = newName;
    setScenarios(updated);
  };

  const addCropToScenario = (scenarioIndex, cropId) => {
    const updated = [...scenarios];
    if (updated[scenarioIndex].crop_ids.length >= 4) {
      alert('A rotation sequence can contain up to 4 sequential crops.');
      return;
    }
    updated[scenarioIndex].crop_ids.push(cropId);
    setScenarios(updated);
    setComparisonResult(null);
  };

  const removeCropFromScenario = (scenarioIndex, cropIndex) => {
    const updated = [...scenarios];
    if (updated[scenarioIndex].crop_ids.length <= 1) {
      alert('A scenario must contain at least 1 crop.');
      return;
    }
    updated[scenarioIndex].crop_ids.splice(cropIndex, 1);
    setScenarios(updated);
    setComparisonResult(null);
  };

  // 5. Run Comparison POST
  const runComparison = async () => {
    if (!selectedFarmId) {
      alert('Please select a saved farm profile first.');
      return;
    }
    if (scenarios.length === 0) {
      alert('Please add at least one scenario to compare.');
      return;
    }

    setComparing(true);
    setError(null);
    try {
      const payload = {
        farm_profile_id: selectedFarmId,
        scenarios: scenarios.map((s) => ({
          name: s.name,
          crop_ids: s.crop_ids
        }))
      };

      const res = await fetch(API_COMPARE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setComparisonResult(data);

      // Scroll to results smoothly
      setTimeout(() => {
        const el = document.getElementById('rotation-results-anchor');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Failed to simulate crop rotation');
    } finally {
      setComparing(false);
    }
  };

  const getCropById = (id) => crops.find((c) => c.id === id);

  if (loading) {
    return (
      <div className="sim-loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Farm Profiles and Agricultural Intelligence Database...</p>
      </div>
    );
  }

  return (
    <div className="simulator-page">
      {/* Page Header */}
      <div className="simulator-header">
        <div className="sim-badge-row">
          <span className="badge-phase">Phase 6</span>
          <span className="badge-source">NASA POWER Telemetry + ICAR Science</span>
        </div>
        <h1 className="simulator-title">Crop Rotation Simulator</h1>
        <p className="simulator-subtitle">
          Connect your saved farm conditions, NASA satellite meteorological data, and verified agronomic
          knowledge to compare multi-crop rotation sequences without guesswork.
        </p>
      </div>

      {error && (
        <div className="sim-alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* SECTION 1: FARM PROFILE SELECTOR OR EMPTY STATE */}
      {profiles.length === 0 ? (
        <div className="sim-empty-card">
          <div className="empty-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9v.01M9 13v.01M9 17v.01"></path>
            </svg>
          </div>
          <h3>No Farm Profiles Found</h3>
          <p>
            To evaluate rotation suitability with actual soil, season, and coordinates, please create a
            Farm Profile first.
          </p>
          <button className="btn-primary" onClick={onOpenFarmProfile}>
            Create Farm Profile
          </button>
        </div>
      ) : (
        <div className="sim-card farm-context-card">
          <div className="card-header-flex">
            <div>
              <span className="card-kicker">Input Context 1</span>
              <h2 className="card-title">Saved Farm Conditions</h2>
            </div>
            <div className="farm-selector-wrapper">
              <label htmlFor="farm-select">Select Farm:</label>
              <select
                id="farm-select"
                value={selectedFarmId || ''}
                onChange={handleFarmChange}
                className="sim-select"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.farm_name || `Farm #${p.id}`} – {p.village}, {p.district}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedFarm && (
            <div className="farm-specs-grid">
              <div className="spec-item">
                <span className="spec-label">Farmer</span>
                <span className="spec-value">{selectedFarm.farmer_name || 'Registered Farmer'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Location</span>
                <span className="spec-value">
                  {selectedFarm.village}, {selectedFarm.district}, {selectedFarm.state}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Coordinates</span>
                <span className="spec-value coord-chip">
                  {selectedFarm.latitude}°N, {selectedFarm.longitude}°E
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Land Area</span>
                <span className="spec-value">{selectedFarm.total_land_acres} Acres</span>
              </div>
              <div className="spec-item highlight-spec">
                <span className="spec-label">Soil Type</span>
                <span className="spec-value">{selectedFarm.soil_type}</span>
              </div>
              <div className="spec-item highlight-spec">
                <span className="spec-label">Irrigation</span>
                <span className="spec-value">{selectedFarm.irrigation_type}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Current Crop</span>
                <span className="spec-value">{selectedFarm.current_crop}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Previous Crop</span>
                <span className="spec-value">{selectedFarm.previous_crop}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Farming Season</span>
                <span className="spec-value">{selectedFarm.farming_season}</span>
              </div>
              <div className="spec-item priority-spec">
                <span className="spec-label">Primary Priority</span>
                <span className="spec-value priority-badge">{selectedFarm.primary_priority}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: NASA POWER TELEMETRY FOR THIS FARM */}
      {selectedFarm && (
        <div className="sim-card climate-telemetry-card">
          <div className="card-header-flex">
            <div>
              <span className="card-kicker">Input Context 2</span>
              <h2 className="card-title">NASA POWER Agroclimatic Telemetry</h2>
            </div>
            <span className="telemetry-badge">
              {climateLoading ? 'Syncing Satellite...' : 'Live Observation Grid (2026)'}
            </span>
          </div>

          <p className="climate-subtext">
            Meteorological observation estimates retrieved for Lat {selectedFarm.latitude}°N, Lon{' '}
            {selectedFarm.longitude}°E (MERRA-2 Satellite Assimilation Archive).
          </p>

          {climateData && climateData.annual_summary ? (
            <div className="climate-tiles-grid">
              <div className="climate-tile">
                <div className="tile-icon">🌡️</div>
                <div className="tile-content">
                  <span className="tile-num">
                    {climateData.annual_summary.avg_temperature_c != null
                      ? `${climateData.annual_summary.avg_temperature_c}°C`
                      : 'N/A'}
                  </span>
                  <span className="tile-label">Mean Temperature (T2M)</span>
                  <span className="tile-range">
                    Range: {climateData.annual_summary.min_temperature_recorded_c}°C –{' '}
                    {climateData.annual_summary.max_temperature_recorded_c}°C
                  </span>
                </div>
              </div>

              <div className="climate-tile">
                <div className="tile-icon">🌧️</div>
                <div className="tile-content">
                  <span className="tile-num">
                    {climateData.annual_summary.total_precipitation_mm != null
                      ? `${climateData.annual_summary.total_precipitation_mm} mm`
                      : 'N/A'}
                  </span>
                  <span className="tile-label">2026 YTD Precipitation</span>
                  <span className="tile-range">
                    {climateData.metadata?.actual_first_observation} to{' '}
                    {climateData.metadata?.actual_last_observation}
                  </span>
                </div>
              </div>

              <div className="climate-tile">
                <div className="tile-icon">💧</div>
                <div className="tile-content">
                  <span className="tile-num">
                    {climateData.annual_summary.avg_relative_humidity_pct != null
                      ? `${climateData.annual_summary.avg_relative_humidity_pct}%`
                      : 'N/A'}
                  </span>
                  <span className="tile-label">Relative Humidity (RH2M)</span>
                  <span className="tile-range">Atmospheric moisture index</span>
                </div>
              </div>

              <div className="climate-tile">
                <div className="tile-icon">🛰️</div>
                <div className="tile-content">
                  <span className="tile-num">{climateData.annual_summary.total_days_evaluated} Days</span>
                  <span className="tile-label">Assimilated Observations</span>
                  <span className="tile-range">Source: NASA Langley POWER</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="climate-loading-box">
              <div className="loading-spinner small"></div>
              <span>Retrieving NASA meteorological grid for this farm coordinate...</span>
            </div>
          )}

          <div className="scientific-disclaimer-callout">
            <strong>Scientific Boundary Note:</strong> NASA POWER provides 0.5° × 0.625° surface
            meteorological estimates. Rainfall is evaluated against each crop's specific seasonal calendar window
            (Kharif: Jun–Oct, Rabi: Nov–Feb, Summer: Mar–May per UAS Bengaluru PoP) rather than cumulative annual totals,
            preventing false water adequacy assumptions for post-monsoon crops.
          </div>
        </div>
      )}

      {/* SECTION 2B: NASA POWER HISTORICAL CLIMATOLOGICAL BASELINE (1991–2020) */}
      {selectedFarm && (
        <div className="sim-card climatology-card" style={{ marginTop: '16px' }}>
          <div className="card-header-flex">
            <div>
              <span className="card-kicker">30-Year Agro-Climatic Normal</span>
              <h2 className="card-title">NASA POWER Historical Climatological Baseline (1991–2020)</h2>
            </div>
            <span className="telemetry-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              MERRA-2 + NOAA CPC Gauge Corrected
            </span>
          </div>

          <div className="scientific-disclaimer-callout" style={{ margin: '10px 0 16px 0', borderLeftColor: '#0284c7' }}>
            <strong>Notice:</strong> Gridded historical climatological estimates, not farm rain-gauge measurements or operational weather forecasts.
            Calculated from NASA POWER 30-year agroclimatology (1991–2020) for coordinates Lat {selectedFarm.latitude}°N, Lon {selectedFarm.longitude}°E.
          </div>

          {climatologyLoading ? (
            <div className="climate-loading-box">
              <div className="loading-spinner small"></div>
              <span>Retrieving NASA POWER 30-year climatology baseline...</span>
            </div>
          ) : climatologyData && climatologyData.annual_summary ? (
            <>
              {/* Summary Metric Tiles */}
              <div className="climate-tiles-grid" style={{ marginBottom: '16px' }}>
                <div className="climate-tile">
                  <div className="tile-icon">🌧️</div>
                  <div className="tile-content">
                    <span className="tile-num">{climatologyData.annual_summary.representative_annual_precipitation_mm} mm</span>
                    <span className="tile-label">Annual Baseline Precipitation</span>
                    <span className="tile-range">Sum of representative monthly totals</span>
                  </div>
                </div>
                <div className="climate-tile">
                  <div className="tile-icon">🌡️</div>
                  <div className="tile-content">
                    <span className="tile-num">{climatologyData.annual_summary.avg_temperature_c}°C</span>
                    <span className="tile-label">Annual Mean Temperature (T2M)</span>
                    <span className="tile-range">
                      Range: {climatologyData.annual_summary.avg_min_temperature_c}°C – {climatologyData.annual_summary.avg_max_temperature_c}°C
                    </span>
                  </div>
                </div>
                <div className="climate-tile">
                  <div className="tile-icon">💧</div>
                  <div className="tile-content">
                    <span className="tile-num">{climatologyData.annual_summary.avg_relative_humidity_pct}%</span>
                    <span className="tile-label">Mean Relative Humidity (RH2M)</span>
                    <span className="tile-range">Atmospheric moisture baseline</span>
                  </div>
                </div>
                <div className="climate-tile">
                  <div className="tile-icon">📅</div>
                  <div className="tile-content">
                    <span className="tile-num">30 Years (1991–2020)</span>
                    <span className="tile-label">Climatological Normal</span>
                    <span className="tile-range">8 Leap Years Weighted (Feb = 28.27d)</span>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', padding: '10px' }}>
                <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '8px 6px', textAlign: 'left' }}>Parameter</th>
                      {climatologyData.monthly_summary?.map((m) => (
                        <th key={m.month_number} style={{ padding: '8px 4px' }}>{m.month_abbr}</th>
                      ))}
                      <th style={{ padding: '8px 6px', background: '#f1f5f9' }}>Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 600, color: '#0369a1' }}>Precipitation (mm)</td>
                      {climatologyData.monthly_summary?.map((m) => (
                        <td
                          key={m.month_number}
                          style={{
                            padding: '8px 4px',
                            fontWeight: m.representative_monthly_precipitation_mm > 100 ? '700' : 'normal',
                            color: m.representative_monthly_precipitation_mm > 100 ? '#0369a1' : '#334155'
                          }}
                        >
                          {m.representative_monthly_precipitation_mm}
                        </td>
                      ))}
                      <td style={{ padding: '8px 6px', fontWeight: 700, color: '#0369a1', background: '#f8fafc' }}>
                        {climatologyData.annual_summary.representative_annual_precipitation_mm}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 600, color: '#b45309' }}>Mean Temp (°C)</td>
                      {climatologyData.monthly_summary?.map((m) => (
                        <td key={m.month_number} style={{ padding: '8px 4px', color: '#475569' }}>
                          {m.mean_temperature_c}
                        </td>
                      ))}
                      <td style={{ padding: '8px 6px', fontWeight: 700, color: '#b45309', background: '#f8fafc' }}>
                        {climatologyData.annual_summary.avg_temperature_c}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 600, color: '#0f766e' }}>Rel. Humidity (%)</td>
                      {climatologyData.monthly_summary?.map((m) => (
                        <td key={m.month_number} style={{ padding: '8px 4px', color: '#475569' }}>
                          {m.relative_humidity_pct}
                        </td>
                      ))}
                      <td style={{ padding: '8px 6px', fontWeight: 700, color: '#0f766e', background: '#f8fafc' }}>
                        {climatologyData.annual_summary.avg_relative_humidity_pct}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>
              Climatological baseline data currently unavailable for this coordinate.
            </div>
          )}
        </div>
      )}

      {/* F-05: TOTAL AVAILABLE WATER (TAW) METHODOLOGY PLACEHOLDER */}
      <div className="sim-card taw-placeholder-card" style={{ marginTop: '16px', background: '#f8fafc', border: '1px dashed #94a3b8' }}>
        <div className="card-header-flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🧪</span>
            <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#334155' }}>
              Soil Total Available Water (TAW) & Readily Available Water (RAW) Capacity
            </h3>
          </div>
          <span className="telemetry-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
            Informational Placeholder (F-05)
          </span>
        </div>
        <p style={{ margin: '8px 0 6px 0', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
          <strong>Scientific Methodology Notice:</strong> Numerical Soil Total Available Water (TAW) and Readily Available Water (RAW)
          calculations are disabled pending validated farm-specific soil textural assays (field capacity, permanent wilting point,
          and dry bulk density). Utilizing generalized textural estimates risks miscalculating root-zone water storage in
          highly weathered laterite and gravelly red profiles of the Western Ghats transition zone.
        </p>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
          Reference: FAO Irrigation and Drainage Paper 56 (Allen et al., 1998) • Calibration pending verified NBSS&LUP Karnataka soil survey data.
        </div>
      </div>

      {/* F-01: PERENNIAL PLANTATION (ARECANUT) SEPARATION PLACEHOLDER */}
      <div className="sim-card perennial-plantation-placeholder-card" style={{ marginTop: '16px', borderLeft: '4px solid #f59e0b' }}>
        <div className="card-header-flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge-tag" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
              Perennial Architecture Separation (F-01)
            </span>
            <h3 style={{ margin: 0, fontSize: '1.02rem', color: '#1e293b' }}>
              Arecanut Plantation Advisory (Separated from Annual Rotation Simulator)
            </h3>
          </div>
          <span className="telemetry-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
            Dedicated Module Coming Soon
          </span>
        </div>
        <p style={{ margin: '8px 0 10px 0', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
          Arecanut (<em>Areca catechu</em>) is a multi-decade perennial plantation crop (30–40 year economic lifespan)
          governed by continuous multi-year evapotranspiration, dry-season protective basin irrigation, and specialized
          multi-tier agroforestry intercropping (black pepper, cocoa, banana). It cannot be sequentially rotated with
          annual field crops (e.g. <code>Paddy → Arecanut</code> is agronomically invalid and blocked).
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            <strong>Planned Capability:</strong> Multi-tier canopy microclimate modeling, basin drip scheduling, and drainage channel management.
          </div>
          <button className="btn-secondary" disabled style={{ opacity: 0.6, cursor: 'not-allowed', fontSize: '0.8rem', padding: '4px 10px' }}>
            Perennial Module (Disabled)
          </button>
        </div>
      </div>

      {/* SECTION 3: SCENARIO BUILDER */}
      <div className="sim-card scenario-builder-card">
        <div className="card-header-flex">
          <div>
            <span className="card-kicker">Interactive Setup</span>
            <h2 className="card-title">Crop Rotation Scenarios to Compare</h2>
          </div>
          <button
            className="btn-add-scenario"
            onClick={() => addScenario()}
            disabled={scenarios.length >= 4}
          >
            + Add Custom Scenario
          </button>
        </div>

        {/* Preset Selector */}
        <div className="preset-bar">
          <span className="preset-title">Quick Presets:</span>
          <div className="preset-buttons">
            {PRESET_SCENARIOS.map((pr, idx) => (
              <button
                key={idx}
                className="btn-preset"
                onClick={() => addScenario({ name: pr.name, crop_ids: [...pr.crop_ids] })}
                disabled={scenarios.length >= 4}
                title={pr.desc}
              >
                + {pr.name}
              </button>
            ))}
          </div>
        </div>

        {/* Scenarios Editor List */}
        <div className="scenarios-list">
          {scenarios.map((sc, sIdx) => (
            <div key={sIdx} className="scenario-item-box">
              <div className="sc-header-row">
                <input
                  type="text"
                  className="sc-name-input"
                  value={sc.name}
                  onChange={(e) => updateScenarioName(sIdx, e.target.value)}
                  placeholder={`Scenario ${String.fromCharCode(65 + sIdx)}`}
                />
                <button
                  className="btn-remove-sc"
                  onClick={() => removeScenario(sIdx)}
                  title="Remove this scenario"
                >
                  ✕ Remove
                </button>
              </div>

              {/* Crop Sequence Builder */}
              <div className="crop-sequence-flow">
                {sc.crop_ids.map((cid, cIdx) => {
                  const cropObj = getCropById(cid);
                  return (
                    <React.Fragment key={cIdx}>
                      <div className="crop-chip">
                        <span className="crop-chip-step">{cIdx + 1}</span>
                        <div className="crop-chip-text">
                          <strong>{cropObj ? cropObj.crop_name : `Crop #${cid}`}</strong>
                          <span className="crop-chip-cat">{cropObj?.crop_category}</span>
                        </div>
                        {sc.crop_ids.length > 1 && (
                          <button
                            className="btn-chip-remove"
                            onClick={() => removeCropFromScenario(sIdx, cIdx)}
                            title="Remove crop from sequence"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {cIdx < sc.crop_ids.length - 1 && <span className="flow-arrow">→</span>}
                    </React.Fragment>
                  );
                })}

                {/* Add Next Crop to Sequence Dropdown */}
                {sc.crop_ids.length < 4 && (
                  <div className="add-next-crop-wrapper">
                    <select
                      className="sim-crop-select"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addCropToScenario(sIdx, parseInt(e.target.value, 10));
                        }
                      }}
                    >
                      <option value="">+ Append Next Crop...</option>
                      {annualCrops.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.crop_name} ({c.crop_category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Run Simulation CTA */}
        <div className="simulator-cta-bar">
          <button
            className="btn-simulate-main"
            onClick={runComparison}
            disabled={comparing || !selectedFarmId || scenarios.length === 0}
          >
            {comparing ? (
              <>
                <div className="loading-spinner small"></div> Simulating Agroclimatic Rotations...
              </>
            ) : (
              <>Simulate & Compare {scenarios.length} Scenarios</>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 4: COMPARISON RESULTS */}
      <div id="rotation-results-anchor"></div>
      {comparisonResult && (
        <div className="sim-results-section">
          <div className="results-header-banner">
            <div>
              <span className="badge-tag">Simulation Complete</span>
              <h2>Agronomic Scenario Comparison for {comparisonResult.farm_name}</h2>
              <p>
                Evaluated against farm soil ({selectedFarm?.soil_type}), irrigation ({selectedFarm?.irrigation_type}),
                and NASA POWER observations. Scenarios compared across biophysical criteria.
              </p>
            </div>
          </div>

          {/* Cards Comparison Grid */}
          <div className="scenarios-comparison-grid">
            {comparisonResult.scenarios.map((sc, sIdx) => {
              const qual = sc.qualitative_suitability || {};
              const category = qual.category || sc.suitability_category || 'Moderate';
              const categoryBadgeClass = {
                Optimal: 'st-optimal',
                Moderate: 'st-moderate',
                Challenging: 'st-challenging',
                'Insufficient data': 'st-insufficient'
              }[category] || 'st-moderate';

              return (
                <div key={sIdx} className="scenario-card">
                  {/* Scenario Header */}
                  <div className="sc-card-top">
                    <div className="sc-badge-rank" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                      Option {String.fromCharCode(65 + sIdx)}
                    </div>
                    <span className={`factor-status-badge ${categoryBadgeClass}`}>
                      {category} Suitability
                    </span>
                  </div>

                  <h3 className="sc-card-name">{sc.name}</h3>
                  <div className="sc-flow-display">{sc.crop_sequence_display}</div>

                  {/* Qualitative Suitability Summary & Limiting Factor Alignment */}
                  <div className="qualitative-suitability-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', marginBottom: '14px' }}>
                    <div className="score-num-row" style={{ marginBottom: '6px' }}>
                      <span className="score-title" style={{ fontWeight: 700, color: '#1e293b' }}>
                        Biophysical Criteria Alignment
                      </span>
                      <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                        Qualitative Categorical Assessment
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: '#334155', margin: '4px 0 8px 0', lineHeight: 1.45 }}>
                      <strong>Assessment:</strong> {qual.explanation || 'Evaluated across biophysical limiting factors.'}
                    </p>

                    {qual.supporting_factors && qual.supporting_factors.length > 0 && (
                      <div style={{ marginBottom: '6px', fontSize: '0.78rem' }}>
                        <strong style={{ color: '#047857' }}>✓ Supporting Alignments:</strong>
                        <ul style={{ margin: '2px 0 0 16px', padding: 0, color: '#334155' }}>
                          {qual.supporting_factors.map((sf, idx) => (
                            <li key={idx} style={{ marginBottom: '2px' }}>{sf}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {qual.limiting_factors && qual.limiting_factors.length > 0 && (
                      <div style={{ marginBottom: '8px', fontSize: '0.78rem' }}>
                        <strong style={{ color: '#be123c' }}>⚠ Management / Limiting Factors:</strong>
                        <ul style={{ margin: '2px 0 0 16px', padding: 0, color: '#334155' }}>
                          {qual.limiting_factors.map((lf, idx) => (
                            <li key={idx} style={{ marginBottom: '2px' }}>{lf}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px', fontSize: '0.78rem', marginTop: '10px' }}>
                      <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        🌱 <strong>Soil:</strong> {sc.soil_compatibility?.overall_status || 'N/A'}
                      </div>
                      <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        🌧️ <strong>Water:</strong> {sc.climate_compatibility?.water_status || 'N/A'}
                      </div>
                      <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        🔄 <strong>Rotation:</strong> {sc.rotation_dynamics?.status || 'N/A'}
                      </div>
                      <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        🌡️ <strong>Thermal:</strong> {sc.climate_compatibility?.thermal_status || 'N/A'}
                      </div>
                      <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        ⏱️ <strong>Calendar:</strong> {sc.calendar_and_season?.status || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Factor 1: Soil Compatibility */}
                  <div className="sc-factor-box">
                    <div className="factor-header">
                      <span className="factor-name">🌱 Soil Compatibility</span>
                      <span className={`factor-status-badge ${{
                        Optimal: 'st-optimal',
                        Moderate: 'st-moderate',
                        Challenging: 'st-challenging',
                        'Insufficient data': 'st-insufficient'
                      }[sc.soil_compatibility.overall_status] || 'st-moderate'}`}>
                        {sc.soil_compatibility.overall_status}
                      </span>
                    </div>
                    {sc.soil_compatibility.per_crop_evaluations.map((se, i) => (
                      <p key={i} className="factor-desc">
                        <strong>{sc.crops_detailed[i]?.name}:</strong> {se.rationale}
                      </p>
                    ))}
                  </div>

                  {/* Factor 2: Climate, Water & Seasonal Rainfall */}
                  <div className="sc-factor-box">
                    <div className="factor-header">
                      <span className="factor-name">🌧️ Water & Seasonal Climate Alignment</span>
                      <span className={`factor-status-badge ${{
                        Optimal: 'st-optimal',
                        Moderate: 'st-moderate',
                        Challenging: 'st-challenging',
                        'Insufficient data': 'st-insufficient'
                      }[sc.climate_compatibility.water_status] || 'st-moderate'}`}>
                        {sc.climate_compatibility.water_status}
                      </span>
                    </div>
                    {sc.climate_compatibility.per_crop_evaluations.map((ce, i) => (
                      <div key={i} className="climate-crop-eval">
                        <div className="crop-season-header-row">
                          <span className="season-window-pill">
                            🗓️ {ce.seasonal_window || ce.assigned_season || 'Seasonal Window'}:{' '}
                            <strong>{ce.seasonal_rainfall_mm != null ? `${ce.seasonal_rainfall_mm} mm` : 'Unavailable (No synthetic allocation)'}</strong>
                          </span>
                          <span className="factor-eval-type-tag">
                            {ce.assigned_season === 'Perennial' ? 'Annual Full-Year' : 'Active Seasonal Window'}
                          </span>
                        </div>

                        <p className="factor-desc">
                          <strong>{sc.crops_detailed[i]?.name}:</strong> {ce.water_rationale}
                        </p>

                        <div className="water-eval-tags-row">
                          <span className="factor-req-tag">Demand: {ce.water_requirement}</span>
                          {ce.irrigation_buffer_active && (
                            <span className="irrigation-pill">
                              💧 Irrigated ({selectedFarm?.irrigation_type || 'Active'})
                            </span>
                          )}
                          {ce.residual_moisture_dependency && (
                            <span className="moisture-warning-pill">
                              ⚠️ Low Rain ({ce.seasonal_rainfall_mm != null ? `${ce.seasonal_rainfall_mm} mm` : 'Deficit'}) — Dependent on Residual Soil Moisture
                            </span>
                          )}
                        </div>

                        {ce.climatology_reference && (
                          <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#0369a1', background: '#f0f9ff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                            📅 <strong>30-Year Climatological Context (1991–2020 Normal):</strong> ~{ce.climatology_reference.seasonal_rainfall_normal_mm} mm ({ce.climatology_reference.months_included?.join(', ')}).
                            <span style={{ display: 'block', fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
                              {ce.climatology_reference.note}
                            </span>
                          </div>
                        )}

                        {ce.data_provenance && (
                          <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '4px' }}>
                            Data Provenance: <em>{ce.data_provenance}</em>
                          </div>
                        )}

                        {ce.is_partial_data && ce.data_completeness_note && (
                          <div className="partial-data-note">
                            ℹ️ {ce.data_completeness_note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Factor 3: Rotation Dynamics & Nitrogen Fixation */}
                  <div className="sc-factor-box">
                    <div className="factor-header">
                      <span className="factor-name">🔄 Rotation Dynamics & Soil Biology</span>
                      <span className="factor-status-badge st-optimal">
                        {sc.rotation_dynamics.status}
                      </span>
                    </div>
                    <ul className="factor-bullet-list">
                      {sc.rotation_dynamics.benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                    {sc.rotation_dynamics.nitrogen_fixation_data && (
                      <div className="nitrogen-box">
                        <strong>Biological Nitrogen Fixation:</strong>
                        {sc.rotation_dynamics.nitrogen_fixation_data.map((n, i) => (
                          <div key={i} className="n-item">
                            • {n}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Factor 4: Calendar Duration */}
                  <div className="sc-factor-box">
                    <div className="factor-header">
                      <span className="factor-name">⏱️ Calendar & Growing Duration</span>
                      <span className="factor-status-badge st-optimal">
                        ~{sc.calendar_and_season.total_days_approx} Days
                      </span>
                    </div>
                    <p className="factor-desc">{sc.calendar_and_season.rationale}</p>
                    <div className="duration-chips">
                      {sc.calendar_and_season.duration_breakdown.map((db, i) => (
                        <span key={i} className="dur-chip">
                          {db}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Factor 5: Farm Priority Alignment */}
                  <div className="sc-factor-box">
                    <div className="factor-header">
                      <span className="factor-name">🎯 Alignment with Farm Priority</span>
                      <span className="factor-status-badge st-optimal">
                        {sc.priority_alignment.alignment_level}
                      </span>
                    </div>
                    <p className="factor-desc">{sc.priority_alignment.explanation}</p>
                  </div>

                  {/* Potential Risks & Limitations */}
                  {sc.potential_limitations && sc.potential_limitations.length > 0 && (
                    <div className="sc-risks-box">
                      <strong>⚠️ Agronomic Cautions & Limitations:</strong>
                      <ul>
                        {sc.potential_limitations.map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SECTION 5: "WHY THIS SCENARIO?" & SCIENTIFIC TRANSPARENCY */}
          {comparisonResult.transparency_and_sources && (
            <div className="sim-card transparency-card">
              <div className="card-header-flex">
                <div>
                  <span className="card-kicker">Transparent Methodology</span>
                  <h2 className="card-title">Why This Scenario? Scientific Disclosures & Sources</h2>
                </div>
              </div>

              <div className="transparency-grid">
                {/* 1. Farm Data Evaluated */}
                <div className="trans-box">
                  <h4>🌾 Farm Data Evaluated</h4>
                  <ul>
                    <li>
                      <strong>Target Parcel:</strong> {comparisonResult.transparency_and_sources.farm_data_used.farm_name}
                    </li>
                    <li>
                      <strong>Coordinates:</strong> {comparisonResult.transparency_and_sources.farm_data_used.coordinates}
                    </li>
                    <li>
                      <strong>Soil Texture:</strong> {comparisonResult.transparency_and_sources.farm_data_used.soil_type}
                    </li>
                    <li>
                      <strong>Water Access:</strong> {comparisonResult.transparency_and_sources.farm_data_used.irrigation_type}
                    </li>
                    <li>
                      <strong>Previous Crop:</strong> {comparisonResult.transparency_and_sources.farm_data_used.previous_crop}
                    </li>
                    <li>
                      <strong>Farmer Priority:</strong> {comparisonResult.transparency_and_sources.farm_data_used.primary_priority}
                    </li>
                  </ul>
                </div>

                {/* 2. NASA Climate Observations */}
                <div className="trans-box">
                  <h4>🛰️ NASA POWER Observations Evaluated</h4>
                  <ul>
                    <li>
                      <strong>Source:</strong> {comparisonResult.transparency_and_sources.nasa_climate_data_used.data_source}
                    </li>
                    <li>
                      <strong>Assimilation Grid:</strong> {comparisonResult.transparency_and_sources.nasa_climate_data_used.assimilation_model}
                    </li>
                    <li>
                      <strong>Evaluated Period:</strong> {comparisonResult.transparency_and_sources.nasa_climate_data_used.observation_period}
                    </li>
                    <li>
                      <strong>Recorded Precipitation:</strong> {comparisonResult.transparency_and_sources.nasa_climate_data_used.rainfall_recorded_ytd_mm} mm
                    </li>
                    <li>
                      <strong>Mean / Max Temp:</strong> {comparisonResult.transparency_and_sources.nasa_climate_data_used.avg_temperature_c}°C / {comparisonResult.transparency_and_sources.nasa_climate_data_used.max_temperature_c}°C
                    </li>
                  </ul>
                </div>

                {/* 3. Institutional Citations */}
                <div className="trans-box">
                  <h4>🏛️ Referenced Scientific Institutions</h4>
                  <ul>
                    {comparisonResult.transparency_and_sources.scientific_institutions_referenced.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>

                {/* 4. Seasonal Crop Calendar Reference */}
                {comparisonResult.transparency_and_sources.seasonal_calendars_referenced && (
                  <div className="trans-box">
                    <h4>🗓️ Agro-Climatic Seasonal Calendar</h4>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 8px 0' }}>
                      Source: {comparisonResult.transparency_and_sources.seasonal_calendars_referenced.source}
                    </p>
                    <ul>
                      {Object.entries(comparisonResult.transparency_and_sources.seasonal_calendars_referenced.seasons).map(([sKey, sVal]) => (
                        <li key={sKey}>
                          <strong>{sKey}:</strong> {sVal.window} ({sVal.months})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 5. Assumptions & Uncertainties */}
                <div className="trans-box">
                  <h4>⚖️ Scientific Assumptions & Uncertainties</h4>
                  <strong>Assumptions:</strong>
                  <ul>
                    {comparisonResult.transparency_and_sources.scientific_assumptions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                  <strong style={{ display: 'block', marginTop: '8px' }}>Uncertainties:</strong>
                  <ul>
                    {comparisonResult.transparency_and_sources.scientific_uncertainties.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strict Disclaimer Banner */}
              <div className="ethical-disclaimer-banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <p>
                  <strong>Agricultural Ethics & Decision-Support Notice:</strong> KRISHIORBIT calculates
                  heuristic compatibility scores derived from published ICAR and UAS agronomic boundaries
                  and NASA POWER environmental observations. It does <em>not</em> forecast guaranteed crop
                  yields, dollar profit margins, fertilizer cost savings, or guaranteed nitrogen credits.
                  Actual field performance varies with localized microclimate, soil biological fertility,
                  and agricultural management practices.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
