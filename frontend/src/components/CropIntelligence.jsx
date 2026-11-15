import React, { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api/crops';

const CATEGORIES = [
  { id: 'all', label: 'All Crops' },
  { id: 'Cereal', label: 'Cereals' },
  { id: 'Nutri-Cereal', label: 'Nutri-Cereals (Millets)' },
  { id: 'Pulse', label: 'Pulses & Legumes' },
  { id: 'Plantation', label: 'Plantation & Cash Crops' },
];

export default function CropIntelligence() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Detail Modal
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const fetchCrops = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = API_BASE;
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setCrops(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to crop knowledge repository');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCrops();
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchTerm]);

  const handleImageError = (cropId) => {
    setImgErrors((prev) => ({ ...prev, [cropId]: true }));
  };

  const openCropDetail = async (crop) => {
    try {
      const res = await fetch(`${API_BASE}/${crop.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setSelectedCrop(fullData);
      } else {
        setSelectedCrop(crop);
      }
    } catch {
      setSelectedCrop(crop);
    }
  };

  return (
    <div className="crop-intelligence-container">
      {/* Header Banner */}
      <div className="crop-intel-header-card">
        <div className="header-text-group">
          <div className="badge-inline">Phase 5 • Scientific Knowledge Base</div>
          <h2 className="crop-intel-main-title">Crop Intelligence & Agro-Climatic Atlas</h2>
          <p className="crop-intel-subtitle">
            Scientifically verified growing boundaries, thermal limits, water requirements, and rotational dynamics
            for Karnataka, Malnad, and Western Ghats crops. Curated from ICAR, UAS Bengaluru, and UAHS Shivamogga.
          </p>
        </div>

        <div className="header-stat-pills">
          <span className="stat-pill">🌱 {crops.length} Cataloged Crops</span>
          <span className="stat-pill">🏛️ ICAR & University Sources</span>
          <span className="stat-pill">🔄 Rotation-Calibrated</span>
        </div>
      </div>

      {/* Control Bar: Search and Category Filter Tabs */}
      <div className="crop-controls-card">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by crop name, botanical name, soil type, season, or benefits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="Clear search">
              ×
            </button>
          )}
        </div>

        <div className="category-filter-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`cat-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && crops.length === 0 && (
        <div className="loading-card">
          <div className="spinner-ring"></div>
          <h4>Querying Crop Intelligence Repository...</h4>
          <p>Retrieving scientifically verified parameters and thermal thresholds from SQLite.</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert-banner alert-error">
          <div className="alert-icon">⚠️</div>
          <div className="alert-text">{error}</div>
          <button className="btn-secondary" onClick={fetchCrops} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && crops.length === 0 && !error && (
        <div className="empty-state-card">
          <div className="empty-icon">🔍</div>
          <h3>No Crops Match Your Filter</h3>
          <p>No agricultural entries matched the search term "{searchTerm}". Try clearing filters or searching for terms like "paddy", "laterite", or "kharif".</p>
          <button
            className="btn-primary"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            style={{ marginTop: '14px' }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Crops Cards Grid */}
      <div className="crop-cards-grid">
        {crops.map((crop) => {
          const isLegume = Boolean(crop.nitrogen_fixation_info);

          return (
            <div
              key={crop.id}
              className="scientific-crop-card"
              onClick={() => openCropDetail(crop)}
            >
              <div className="crop-img-container">
                {!imgErrors[crop.id] ? (
                  <img
                    src={crop.image_url}
                    alt={crop.crop_name}
                    className="crop-card-img"
                    loading="lazy"
                    onError={() => handleImageError(crop.id)}
                  />
                ) : (
                  <div className="crop-img-fallback">
                    <span>🌾</span>
                  </div>
                )}
                <span className="crop-badge-category">{crop.crop_category}</span>
                {isLegume && (
                  <span className="crop-badge-nfix" title="Biological Nitrogen Fixer">
                    ⚡ N-Fixing Legume
                  </span>
                )}
              </div>

              <div className="crop-card-content">
                <div className="crop-names-header">
                  <h3 className="crop-primary-name">{crop.crop_name}</h3>
                  <span className="crop-scientific-name">{crop.scientific_name}</span>
                </div>

                <div className="parameters-strip">
                  <div className="param-item" title="Growing Duration">
                    <span className="param-icon">⏱️</span>
                    <span className="param-text">{crop.growing_duration_days.split('(')[0].trim()}</span>
                  </div>
                  <div className="param-item" title="Water Requirement">
                    <span className="param-icon">💧</span>
                    <span className="param-text">{crop.water_requirement.split('(')[0].trim()}</span>
                  </div>
                  <div className="param-item" title="Temperature Suitability">
                    <span className="param-icon">🌡️</span>
                    <span className="param-text">{crop.temperature_suitability_c.split('(')[0].trim()}</span>
                  </div>
                </div>

                <div className="crop-summary-block">
                  <div className="summary-label">Rotation Role & Soil Impact:</div>
                  <p className="summary-desc">
                    {crop.crop_rotation_benefits.length > 135
                      ? `${crop.crop_rotation_benefits.slice(0, 135)}...`
                      : crop.crop_rotation_benefits}
                  </p>
                </div>

                <div className="card-action-bar">
                  <span className="source-tag">{crop.source_institution.split('&')[0].trim()}</span>
                  <button className="btn-view-crop" onClick={() => openCropDetail(crop)}>
                    View Scientific Profile →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INDIVIDUAL CROP SCIENTIFIC DETAIL MODAL */}
      {selectedCrop && (
        <div className="modal-backdrop" onClick={() => setSelectedCrop(null)}>
          <div className="crop-modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="crop-modal-header">
              <div className="modal-crop-identity">
                <div className="badge-inline">{selectedCrop.crop_category}</div>
                <h3 className="modal-crop-name">{selectedCrop.crop_name}</h3>
                <span className="modal-crop-botanical">Scientific / Botanical: <em>{selectedCrop.scientific_name}</em></span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCrop(null)} aria-label="Close dialog">
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="crop-modal-scrollable">
              {/* Hero Image & Quick Identity */}
              <div className="modal-hero-split">
                <div className="modal-hero-img-box">
                  <img
                    src={selectedCrop.image_url}
                    alt={selectedCrop.crop_name}
                    className="modal-hero-img"
                  />
                  <div className="img-attribution-chip">
                    Verified Authentic Photograph • Public Domain / CC Licensed
                  </div>
                </div>

                {/* 4 Essential Agronomic Metrics Deck */}
                <div className="modal-metrics-deck">
                  <div className="metric-deck-card">
                    <div className="deck-card-top">
                      <span className="deck-icon">⏱️</span>
                      <span className="deck-title">Growing Duration</span>
                    </div>
                    <div className="deck-value">{selectedCrop.growing_duration_days}</div>
                  </div>

                  <div className="metric-deck-card highlight-water">
                    <div className="deck-card-top">
                      <span className="deck-icon">💧</span>
                      <span className="deck-title">Water Requirement</span>
                    </div>
                    <div className="deck-value">{selectedCrop.water_requirement}</div>
                  </div>

                  <div className="metric-deck-card">
                    <div className="deck-card-top">
                      <span className="deck-icon">🌡️</span>
                      <span className="deck-title">Thermal Range</span>
                    </div>
                    <div className="deck-value">{selectedCrop.temperature_suitability_c}</div>
                  </div>

                  <div className="metric-deck-card">
                    <div className="deck-card-top">
                      <span className="deck-icon">🌧️</span>
                      <span className="deck-title">Rainfall Envelope</span>
                    </div>
                    <div className="deck-value">{selectedCrop.rainfall_suitability_mm}</div>
                  </div>
                </div>
              </div>

              {/* Scientific Deep-Dive Sections */}
              <div className="scientific-sections-grid">
                {/* Section 1: Soil Suitability & Conditions */}
                <div className="scientific-section-card">
                  <h4 className="sec-title">
                    <span className="sec-icon">🌍</span>
                    <span>Soil Affinity & Edaphic Requirements</span>
                  </h4>
                  <div className="sec-content">
                    <p><strong>Suitable Soil Types:</strong> {selectedCrop.suitable_soils}</p>
                    <p style={{ marginTop: '8px' }}>
                      <strong>Critical Growing Conditions:</strong> {selectedCrop.important_growing_conditions}
                    </p>
                  </div>
                </div>

                {/* Section 2: Rotational Dynamics */}
                <div className="scientific-section-card">
                  <h4 className="sec-title">
                    <span className="sec-icon">🔄</span>
                    <span>Crop Rotation & Agro-Ecosystem Dynamics</span>
                  </h4>
                  <div className="sec-content">
                    <p>{selectedCrop.crop_rotation_benefits}</p>
                    <div className="seasons-tag-row" style={{ marginTop: '10px' }}>
                      <strong>Applicable Seasons:</strong>
                      {selectedCrop.suitable_seasons.split(',').map((s, i) => (
                        <span key={i} className="season-mini-badge">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3: Nitrogen Fixation */}
                <div className={`scientific-section-card ${selectedCrop.nitrogen_fixation_info ? 'nfix-card' : ''}`}>
                  <h4 className="sec-title">
                    <span className="sec-icon">🧬</span>
                    <span>Biological Nitrogen Fixation</span>
                  </h4>
                  <div className="sec-content">
                    {selectedCrop.nitrogen_fixation_info ? (
                      <div className="nfix-verified">
                        <div className="nfix-chip-pill">Active Symbiotic Nodulation</div>
                        <p>{selectedCrop.nitrogen_fixation_info}</p>
                      </div>
                    ) : (
                      <p className="non-legume-note">
                        <em>Non-leguminous crop.</em> Does not form symbiotic root nodules with nitrogen-fixing rhizobia.
                        Typically acts as an exhaustive feeder that benefits from being preceded or succeeded by a pulse or green manure crop.
                      </p>
                    )}
                  </div>
                </div>

                {/* Section 4: Credible Source Attribution & Reference Link */}
                <div className="scientific-section-card">
                  <h4 className="sec-title">
                    <span className="sec-icon">🏛️</span>
                    <span>Source Attribution & Reference Repository</span>
                  </h4>
                  <div className="sec-content">
                    <p><strong>Authoritative Institution:</strong> {selectedCrop.source_institution}</p>
                    <p style={{ marginTop: '6px' }}>
                      <strong>Reference Link:</strong>{' '}
                      <a
                        href={selectedCrop.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-ref-link"
                      >
                        {selectedCrop.reference_url} ↗
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Reliability & Limitations Alert Box */}
              <div className="reliability-alert-box">
                <div className="rel-header">
                  <span className="rel-icon">ℹ️</span>
                  <strong>Data Reliability & Agronomic Variability Notice:</strong>
                </div>
                <p className="rel-text">{selectedCrop.data_reliability_or_limitations}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="crop-modal-footer">
              <span className="footer-disclaimer">
                Data prepared for upcoming Crop Rotation Simulator & NASA POWER climate cross-matching.
              </span>
              <button className="btn-secondary" onClick={() => setSelectedCrop(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
