import React, { useState, useEffect } from 'react';
import {
  MonthlyRainfallChart,
  MonthlyTemperatureChart,
  MonthlyDataTable,
} from './NasaWeatherCharts';

export default function Dashboard({ backendHealth, onOpenCrops, onOpenFarmProfile, onOpenRotation }) {
  const [nasaData, setNasaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNasaTelemetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/nasa-power');
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.detail || `Server responded with status ${res.status}`);
      }
      const data = await res.json();
      setNasaData(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend NASA POWER endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNasaTelemetry();
  }, []);

  const annual = nasaData?.annual_summary;
  const location = nasaData?.location;

  return (
    <div className="dashboard-container">
      {/* Agricultural landscape banner */}
      <div className="dashboard-banner">
        <div className="banner-content">
          <div className="banner-tag">Agro-Climatic Zone Deck</div>
          <h2 className="banner-title">Karnataka & Western Ghats Agronomic Dashboard</h2>
          <p className="banner-subtitle">
            Synthesizing NASA Earth Observation telemetry, climate cycles, and soil parameters
            for precision crop rotation planning.
          </p>
          <div className="banner-badges">
            <span className="banner-pill">Zone: Malnad & Deccan Transition</span>
            <span className="banner-pill">Latitude: 13.9299°N, Longitude: 75.5681°E</span>
            <span className="banner-pill">Monsoon: South-West Dependent</span>
          </div>
        </div>
      </div>

      {/* NASA POWER Telemetry Station Header */}
      <div className="nasa-telemetry-header">
        <div className="telemetry-info-group">
          <div className="telemetry-source-badge">
            <span className="source-dot"></span>
            <span>Data Source: {nasaData?.metadata?.data_source || 'NASA POWER Agroclimatology (AG)'}</span>
          </div>
          <h3 className="telemetry-station-title">
            Meteorological Observation Deck: Shivamogga, Karnataka
          </h3>
          <p className="telemetry-station-meta">
            <strong>Coordinates:</strong> {location ? `${location.latitude}°N, ${location.longitude}°E` : '13.9299°N, 75.5681°E'} •{' '}
            <strong>Elevation:</strong> {location?.elevation_m ? `${location.elevation_m} m` : '661.12 m'} ASL •{' '}
            <strong>Observation Period:</strong>{' '}
            {nasaData?.metadata
              ? `${nasaData.metadata.period_display_label} (${nasaData.metadata.actual_first_observation} to ${nasaData.metadata.actual_last_observation} • ${nasaData.metadata.total_observations} Complete Observations)`
              : '2026 Year-to-Date (Jan 1 – Nov 11, 2026 • 315 Daily Observations)'} •{' '}
            <strong>Assimilation Model:</strong> {nasaData?.metadata?.assimilation_model || 'MERRA-2, GEOS-IT'}
          </p>
        </div>

        <button
          className="btn-refresh"
          onClick={fetchNasaTelemetry}
          disabled={loading}
          title="Refresh NASA Telemetry Feed"
        >
          <svg
            className={`refresh-icon ${loading ? 'spinning' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && !nasaData && (
        <div className="telemetry-state-card loading-state">
          <div className="spinner-ring"></div>
          <h4>Connecting to NASA POWER Agroclimatology API...</h4>
          <p>
            Fetching verified daily solar, temperature, precipitation, and relative humidity
            telemetry for Shivamogga, Karnataka (2026 Year-to-Date Live Feed).
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !nasaData && (
        <div className="telemetry-state-card error-state">
          <div className="error-icon">⚠️</div>
          <h4>Unable to Load NASA POWER Telemetry</h4>
          <p className="error-message">{error}</p>
          <button className="btn-primary" onClick={fetchNasaTelemetry} style={{ marginTop: '14px' }}>
            Retry Connection
          </button>
        </div>
      )}

      {/* Actual Data Dashboard (Rendered ONLY from real NASA API response) */}
      {nasaData && annual && (
        <>
          {/* Annual Climate Summary Metrics Cards */}
          <div className="annual-metrics-grid">
            {/* Card 1: Average Temperature */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Average Temperature</span>
                <span className="metric-icon-box temp-icon">🌡️</span>
              </div>
              <div className="metric-value-row">
                <span className="metric-val">{annual.avg_temperature_c}</span>
                <span className="metric-unit">°C</span>
              </div>
              <div className="metric-footer">
                <span>{annual.is_complete_year ? 'Annual mean at 2m above ground' : '2026 YTD mean at 2m'}</span>
                <span className="metric-sub-val">Min: {annual.min_temperature_recorded_c}°C</span>
              </div>
            </div>

            {/* Card 2: Total Annual Rainfall */}
            <div className="metric-card highlight-metric">
              <div className="metric-header">
                <span className="metric-label">{annual.rainfall_metric_label || 'Year-to-Date Rainfall (YTD)'}</span>
                <span className="metric-icon-box rain-icon">🌧️</span>
              </div>
              <div className="metric-value-row">
                <span className="metric-val">{annual.total_precipitation_mm}</span>
                <span className="metric-unit">mm</span>
              </div>
              <div className="metric-footer">
                <span>{annual.rainfall_subtitle || 'Cumulative gauge-corrected'}</span>
                <span className="metric-sub-val status-monsoon">
                  {annual.is_complete_year ? 'Full Year Total' : 'Incomplete Year'}
                </span>
              </div>
            </div>

            {/* Card 3: Average Humidity */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Average Relative Humidity</span>
                <span className="metric-icon-box humidity-icon">💧</span>
              </div>
              <div className="metric-value-row">
                <span className="metric-val">{annual.avg_relative_humidity_pct}</span>
                <span className="metric-unit">%</span>
              </div>
              <div className="metric-footer">
                <span>Atmospheric vapor concentration</span>
                <span className="metric-sub-val">{annual.is_complete_year ? 'Full Year Average' : '2026 YTD Mean'}</span>
              </div>
            </div>

            {/* Card 4: Highest Recorded Temperature */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Highest Recorded Temp</span>
                <span className="metric-icon-box max-icon">☀️</span>
              </div>
              <div className="metric-value-row">
                <span className="metric-val">{annual.max_temperature_recorded_c}</span>
                <span className="metric-unit">°C</span>
              </div>
              <div className="metric-footer">
                <span>Peak summer diurnal maximum</span>
                <span className="metric-sub-val">Pre-monsoon High</span>
              </div>
            </div>
          </div>

          {/* Responsive Charts Section */}
          <div className="charts-grid">
            <MonthlyRainfallChart
              monthlyData={nasaData.monthly_summary}
              totalRainfall={annual.total_precipitation_mm}
              metadata={nasaData.metadata}
            />
            <MonthlyTemperatureChart
              monthlyData={nasaData.monthly_summary}
              metadata={nasaData.metadata}
            />
          </div>

          {/* Monthly Climatology Data Table */}
          <MonthlyDataTable
            monthlyData={nasaData.monthly_summary}
            metadata={nasaData.metadata}
          />
        </>
      )}

      {/* Analytical Modules Grid */}
      <div className="dashboard-grid">
        {/* Actual Satellite Intelligence Card */}
        <div className="analytical-card highlight-card">
          <div className="card-top-row">
            <div className="card-badge sat-badge">Actual Satellite Observation</div>
            <span className="card-source-tag">USGS / NASA Landsat</span>
          </div>

          <div className="satellite-viewport">
            <img
              src="/images/landscapes/landsat_surface_reflectance.webp"
              alt="Actual Landsat Multispectral Surface Reflectance"
              className="satellite-img"
              width="800"
              height="480"
              loading="lazy"
            />
            <div className="satellite-overlay-data">
              <span className="sat-overlay-chip">Landsat 8/9 OLI Surface Reflectance</span>
              <span className="sat-overlay-chip">Multispectral Band 4/5 (NDVI)</span>
            </div>
          </div>

          <div className="card-body-content">
            <h3 className="card-headline">Spaceborne Earth Observation Feed</h3>
            <p className="card-text">
              Direct remote sensing telemetry calibrated for vegetation canopy vigor (NDVI) and surface moisture.
              Authentic satellite datasets preserve scientific validity without confounding ground-level photography.
            </p>

            <div className="telemetry-row">
              <div className="telemetry-stat">
                <span className="stat-label">Sensors</span>
                <span className="stat-val">Landsat OLI / Sentinel-2 MSI</span>
              </div>
              <div className="telemetry-stat">
                <span className="stat-label">Resolution</span>
                <span className="stat-val">10m – 30m Multispectral</span>
              </div>
              <div className="telemetry-stat">
                <span className="stat-label">Status</span>
                <span className="stat-val status-ready">API Architecture Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Soil Characteristics Card */}
        <div className="analytical-card">
          <div className="card-top-row">
            <div className="card-badge">Soil Telemetry</div>
            <span className="card-source-tag">Regional Soil Health</span>
          </div>

          <div className="card-body-content" style={{ marginTop: '12px' }}>
            <h3 className="card-headline">Soil Matrix & Fertility Index</h3>
            <p className="card-text">
              Baseline profiles calibrated for Karnataka's prominent soil orders: Coastal Alluvial,
              Western Ghats Humic Laterites, and Deccan Red Sandy Loams.
            </p>

            <div className="soil-metrics-grid">
              <div className="soil-metric-item">
                <span className="metric-name">Humic Laterite</span>
                <span className="metric-desc">High organic matter, acidic pH 5.2 - 6.2</span>
              </div>
              <div className="soil-metric-item">
                <span className="metric-name">Red Sandy Loam</span>
                <span className="metric-desc">Moderate CEC, rapid drainage, neutral pH</span>
              </div>
              <div className="soil-metric-item">
                <span className="metric-name">Nitrogen Depletion</span>
                <span className="metric-desc">Monitored via crop history tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Crop Rotation Strategy Card */}
        <div className="analytical-card">
          <div className="card-top-row">
            <div className="card-badge">Rotation Engine</div>
            <span className="card-source-tag">Restorative Sequencing</span>
          </div>

          <div className="card-body-content" style={{ marginTop: '12px' }}>
            <h3 className="card-headline">Regenerative Rotation Models</h3>
            <p className="card-text">
              Mathematical modeling designed to break monoculture pest life-cycles, rebuild soil organic carbon,
              and balance heavy nitrogen consumers with nitrogen-fixing pulses.
            </p>

            <div className="rotation-path-preview">
              <div className="path-step">
                <span className="step-num">1</span>
                <div>
                  <strong>Primary Feeder</strong>
                  <div style={{ fontSize: '0.8rem', color: '#586960' }}>Paddy or Maize</div>
                </div>
              </div>
              <span className="path-arrow">➔</span>
              <div className="path-step">
                <span className="step-num">2</span>
                <div>
                  <strong>Nitrogen Restorer</strong>
                  <div style={{ fontSize: '0.8rem', color: '#586960' }}>Green Gram / Black Gram</div>
                </div>
              </div>
              <span className="path-arrow">➔</span>
              <div className="path-step">
                <span className="step-num">3</span>
                <div>
                  <strong>Cover / Nutri-Cereal</strong>
                  <div style={{ fontSize: '0.8rem', color: '#586960' }}>Finger Millet (Ragi)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick link banner to Crop Intelligence */}
      <div className="crop-teaser-banner">
        <div className="teaser-text">
          <h3>Explore Karnataka Crop Intelligence</h3>
          <p>
            Inspect individual authentic photographic profiles, growing requirements,
            and rotational roles for all 8 prioritized regional crops.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={onOpenCrops}>
            Crop Intelligence Gallery
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
          {onOpenRotation && (
            <button className="btn-secondary" onClick={onOpenRotation}>
              Rotation Simulator
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
