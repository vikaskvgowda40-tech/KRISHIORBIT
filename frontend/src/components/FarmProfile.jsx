import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../apiConfig';

const API_BASE = `${API_BASE_URL}/api/farm-profiles`;

const SOIL_OPTIONS = [
  'Red soil',
  'Laterite soil',
  'Black soil',
  'Alluvial soil',
  'Sandy soil',
  'Other / Unknown',
];

const SEASON_OPTIONS = ['Kharif', 'Rabi', 'Summer'];

const IRRIGATION_OPTIONS = [
  'Rainfed',
  'Borewell',
  'Open well',
  'Canal',
  'Drip irrigation',
  'Other',
];

const PRIORITY_OPTIONS = [
  'Improve crop yield',
  'Reduce water consumption',
  'Improve soil health',
  'Reduce farming costs',
  'Climate resilience',
];

const INITIAL_FORM_STATE = {
  farm_name: '',
  farmer_name: '',
  village: '',
  district: '',
  state: 'Karnataka',
  latitude: '',
  longitude: '',
  total_land_acres: '',
  soil_type: 'Laterite soil',
  current_crop: '',
  previous_crop: '',
  farming_season: 'Kharif',
  irrigation_type: 'Rainfed',
  primary_priority: 'Improve soil health',
  notes: '',
};

export default function FarmProfile({ onNavigateToDashboard }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // View state: 'list', 'create', 'edit', 'detail'
  const [viewMode, setViewMode] = useState('list');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all profiles from backend
  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setProfiles(data);
    } catch (err) {
      setError(`Failed to load farm profiles: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.village.trim()) errors.village = 'Village name is required.';
    if (!formData.district.trim()) errors.district = 'District name is required.';
    if (!formData.state.trim()) errors.state = 'State name is required.';

    const acres = parseFloat(formData.total_land_acres);
    if (!formData.total_land_acres || isNaN(acres) || acres <= 0) {
      errors.total_land_acres = 'Total land area must be greater than 0 acres.';
    }

    if (!formData.current_crop.trim()) errors.current_crop = 'Current crop is required.';
    if (!formData.previous_crop.trim()) errors.previous_crop = 'Previous crop is required.';

    if (formData.latitude !== '' && formData.latitude !== null && formData.latitude !== undefined) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.latitude = 'Latitude must be a valid number between -90.0 and 90.0.';
      }
    }

    if (formData.longitude !== '' && formData.longitude !== null && formData.longitude !== undefined) {
      const lon = parseFloat(formData.longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        errors.longitude = 'Longitude must be a valid number between -180.0 and 180.0.';
      }
    }

    if (!SOIL_OPTIONS.includes(formData.soil_type)) {
      errors.soil_type = 'Please select a valid soil type.';
    }
    if (!SEASON_OPTIONS.includes(formData.farming_season)) {
      errors.farming_season = 'Please select a valid season.';
    }
    if (!IRRIGATION_OPTIONS.includes(formData.irrigation_type)) {
      errors.irrigation_type = 'Please select a valid irrigation method.';
    }
    if (!PRIORITY_OPTIONS.includes(formData.primary_priority)) {
      errors.primary_priority = 'Please select a primary priority.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error as user types
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const startCreate = () => {
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    setEditingId(null);
    setViewMode('create');
  };

  const startEdit = (profile) => {
    setFormData({
      farm_name: profile.farm_name || '',
      farmer_name: profile.farmer_name || '',
      village: profile.village || '',
      district: profile.district || '',
      state: profile.state || 'Karnataka',
      latitude: profile.latitude !== null && profile.latitude !== undefined ? profile.latitude : '',
      longitude: profile.longitude !== null && profile.longitude !== undefined ? profile.longitude : '',
      total_land_acres: profile.total_land_acres || '',
      soil_type: profile.soil_type || 'Laterite soil',
      current_crop: profile.current_crop || '',
      previous_crop: profile.previous_crop || '',
      farming_season: profile.farming_season || 'Kharif',
      irrigation_type: profile.irrigation_type || 'Rainfed',
      primary_priority: profile.primary_priority || 'Improve soil health',
      notes: profile.notes || '',
    });
    setFormErrors({});
    setEditingId(profile.id);
    setViewMode('edit');
  };

  const viewDetail = (profile) => {
    setSelectedProfile(profile);
    setViewMode('detail');
  };

  const handleFillDemoCoordinates = () => {
    setFormData((prev) => ({
      ...prev,
      district: prev.district || 'Shivamogga',
      latitude: '13.9299',
      longitude: '75.5681',
    }));
  };

  const handleClearCoordinates = () => {
    setFormData((prev) => ({
      ...prev,
      latitude: '',
      longitude: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      farm_name: formData.farm_name.trim() || null,
      farmer_name: formData.farmer_name.trim() || null,
      village: formData.village.trim(),
      district: formData.district.trim(),
      state: formData.state.trim() || 'Karnataka',
      latitude: formData.latitude !== '' ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude !== '' ? parseFloat(formData.longitude) : null,
      total_land_acres: parseFloat(formData.total_land_acres),
      soil_type: formData.soil_type,
      current_crop: formData.current_crop.trim(),
      previous_crop: formData.previous_crop.trim(),
      farming_season: formData.farming_season,
      irrigation_type: formData.irrigation_type,
      primary_priority: formData.primary_priority,
      notes: formData.notes.trim() || null,
    };

    try {
      const isEdit = viewMode === 'edit' && editingId;
      const url = isEdit ? `${API_BASE}/${editingId}` : API_BASE;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.detail || `Server error ${res.status}`);
      }

      const saved = await res.json();
      setSuccessMsg(
        isEdit
          ? `Farm profile for "${saved.farm_name || saved.village}" updated successfully.`
          : `Farm profile for "${saved.farm_name || saved.village}" registered successfully.`
      );

      await fetchProfiles();
      setViewMode('list');
      setEditingId(null);
    } catch (err) {
      setError(err.message || 'Failed to save farm profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (profile, e) => {
    if (e) e.stopPropagation();
    setDeleteTarget(profile);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned HTTP ${res.status}`);
      }
      setSuccessMsg(`Farm profile #${deleteTarget.id} deleted successfully.`);
      setDeleteTarget(null);
      if (viewMode === 'detail' && selectedProfile?.id === deleteTarget.id) {
        setViewMode('list');
      }
      await fetchProfiles();
    } catch (err) {
      setError(`Failed to delete profile: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="farm-profile-container">
      {/* Top Banner */}
      <div className="farm-header-card">
        <div className="farm-header-text">
          <div className="badge-inline">Phase 4 • Farm Profile Module</div>
          <h2 className="farm-title">Farm Parcel Registry & Agro-Ecological Profiling</h2>
          <p className="farm-subtitle">
            Configure parcel boundaries, dominant soil classifications, crop cycles, and water
            infrastructure to ground NASA Earth Observation datasets into precision agronomic intelligence.
          </p>
        </div>

        <div className="farm-header-actions">
          {viewMode !== 'create' && (
            <button className="btn-primary" onClick={startCreate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Register New Farm</span>
            </button>
          )}

          {viewMode !== 'list' && (
            <button className="btn-secondary" onClick={() => setViewMode('list')}>
              <span>View All Profiles ({profiles.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="alert-banner alert-success">
          <div className="alert-icon">✓</div>
          <div className="alert-text">{successMsg}</div>
          <button className="alert-close" onClick={() => setSuccessMsg(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error">
          <div className="alert-icon">⚠️</div>
          <div className="alert-text">{error}</div>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* VIEW: CREATE / EDIT FORM */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="form-card">
          <div className="form-card-header">
            <div>
              <h3 className="form-heading">
                {viewMode === 'edit' ? `Edit Farm Profile #${editingId}` : 'Register New Farm Parcel'}
              </h3>
              <p className="form-subheading">
                Fields marked with <span className="req-star">*</span> are required for parcel identification and rotation analysis.
              </p>
            </div>
            <button className="btn-ghost" onClick={() => setViewMode('list')}>Cancel</button>
          </div>

          <form onSubmit={handleSubmit} className="farm-form">
            {/* SECTION 1: Basic Farm Information */}
            <fieldset className="form-section">
              <legend className="section-legend">
                <span className="legend-icon">🏡</span>
                <span>Basic Farm Information</span>
              </legend>

              <div className="form-grid-3">
                <div className="form-field">
                  <label htmlFor="farm_name">Farm Name (Optional)</label>
                  <input
                    type="text"
                    id="farm_name"
                    name="farm_name"
                    placeholder="e.g. Sahyadri Agro Farm"
                    value={formData.farm_name}
                    onChange={handleInputChange}
                    maxLength={120}
                  />
                  <span className="field-hint">Identifier for the parcel or holding</span>
                </div>

                <div className="form-field">
                  <label htmlFor="farmer_name">Farmer Name (Optional)</label>
                  <input
                    type="text"
                    id="farmer_name"
                    name="farmer_name"
                    placeholder="e.g. Basavaraj Gowda"
                    value={formData.farmer_name}
                    onChange={handleInputChange}
                    maxLength={120}
                  />
                  <span className="field-hint">Primary parcel operator</span>
                </div>

                <div className="form-field">
                  <label htmlFor="village">
                    Village <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="village"
                    name="village"
                    placeholder="e.g. Agumbe / Thirthahalli"
                    value={formData.village}
                    onChange={handleInputChange}
                    className={formErrors.village ? 'input-error' : ''}
                    required
                  />
                  {formErrors.village && <span className="error-hint">{formErrors.village}</span>}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="district">
                    District <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="district"
                    name="district"
                    placeholder="e.g. Shivamogga, Chikkamagaluru, Hassan"
                    value={formData.district}
                    onChange={handleInputChange}
                    className={formErrors.district ? 'input-error' : ''}
                    required
                  />
                  {formErrors.district && <span className="error-hint">{formErrors.district}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="state">
                    State <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={formErrors.state ? 'input-error' : ''}
                    required
                  />
                  {formErrors.state && <span className="error-hint">{formErrors.state}</span>}
                </div>
              </div>
            </fieldset>

            {/* SECTION 2: Geographic Coordinates */}
            <fieldset className="form-section">
              <legend className="section-legend">
                <span className="legend-icon">📍</span>
                <span>Geographic Location Coordinates</span>
              </legend>

              <div className="coordinate-helper-box">
                <div className="helper-info">
                  <strong>Satellite Spatial Calibration:</strong> Enter your farm's actual latitude and longitude
                  to enable localized NASA POWER agroclimatology and Landsat remote sensing feeds.
                  Shivamogga coordinates are provided only as an optional quick-fill reference demonstration.
                </div>
                <div className="helper-actions">
                  <button
                    type="button"
                    className="btn-helper"
                    onClick={handleFillDemoCoordinates}
                    title="Load Shivamogga demonstration coordinates"
                  >
                    Load Shivamogga Demo (13.9299°N, 75.5681°E)
                  </button>
                  {(formData.latitude || formData.longitude) && (
                    <button
                      type="button"
                      className="btn-helper-clear"
                      onClick={handleClearCoordinates}
                    >
                      Clear Coordinates
                    </button>
                  )}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="latitude">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    id="latitude"
                    name="latitude"
                    placeholder="e.g. 13.9299"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className={formErrors.latitude ? 'input-error' : ''}
                  />
                  <span className="field-hint">Range: -90.0° to +90.0°</span>
                  {formErrors.latitude && <span className="error-hint">{formErrors.latitude}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="longitude">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="-180"
                    max="180"
                    id="longitude"
                    name="longitude"
                    placeholder="e.g. 75.5681"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className={formErrors.longitude ? 'input-error' : ''}
                  />
                  <span className="field-hint">Range: -180.0° to +180.0°</span>
                  {formErrors.longitude && <span className="error-hint">{formErrors.longitude}</span>}
                </div>
              </div>
            </fieldset>

            {/* SECTION 3: Land & Soil Information */}
            <fieldset className="form-section">
              <legend className="section-legend">
                <span className="legend-icon">🌱</span>
                <span>Land & Soil Information</span>
              </legend>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="total_land_acres">
                    Total Land Area (Acres) <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    id="total_land_acres"
                    name="total_land_acres"
                    placeholder="e.g. 3.5"
                    value={formData.total_land_acres}
                    onChange={handleInputChange}
                    className={formErrors.total_land_acres ? 'input-error' : ''}
                    required
                  />
                  <span className="field-hint">Parcel size in acres (must be greater than 0)</span>
                  {formErrors.total_land_acres && <span className="error-hint">{formErrors.total_land_acres}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="soil_type">
                    Dominant Soil Type <span className="req-star">*</span>
                  </label>
                  <select
                    id="soil_type"
                    name="soil_type"
                    value={formData.soil_type}
                    onChange={handleInputChange}
                    className={formErrors.soil_type ? 'input-error' : ''}
                    required
                  >
                    {SOIL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">Key determinant for nutrient retention & water percolation</span>
                  {formErrors.soil_type && <span className="error-hint">{formErrors.soil_type}</span>}
                </div>
              </div>
            </fieldset>

            {/* SECTION 4: Agricultural & Cropping Cycle */}
            <fieldset className="form-section">
              <legend className="section-legend">
                <span className="legend-icon">🌾</span>
                <span>Agricultural & Cropping Cycle</span>
              </legend>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="current_crop">
                    Current Active Crop <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="current_crop"
                    name="current_crop"
                    placeholder="e.g. Paddy (Rice), Maize, Ragi, Groundnut"
                    value={formData.current_crop}
                    onChange={handleInputChange}
                    className={formErrors.current_crop ? 'input-error' : ''}
                    required
                  />
                  <span className="field-hint">Crop currently standing or planned for this immediate cycle</span>
                  {formErrors.current_crop && <span className="error-hint">{formErrors.current_crop}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="previous_crop">
                    Previous Harvested Crop <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="previous_crop"
                    name="previous_crop"
                    placeholder="e.g. Cowpea, Green Gram, Soybean, Black Gram, Fallow"
                    value={formData.previous_crop}
                    onChange={handleInputChange}
                    className={formErrors.previous_crop ? 'input-error' : ''}
                    required
                  />
                  <span className="field-hint">Preceding crop informs residual nitrogen & soil exhaustion</span>
                  {formErrors.previous_crop && <span className="error-hint">{formErrors.previous_crop}</span>}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="farming_season">
                    Farming Season <span className="req-star">*</span>
                  </label>
                  <select
                    id="farming_season"
                    name="farming_season"
                    value={formData.farming_season}
                    onChange={handleInputChange}
                    className={formErrors.farming_season ? 'input-error' : ''}
                    required
                  >
                    {SEASON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} {opt === 'Kharif' ? '(Monsoon / June–Oct)' : opt === 'Rabi' ? '(Winter / Nov–March)' : '(Summer / April–May)'}
                      </option>
                    ))}
                  </select>
                  {formErrors.farming_season && <span className="error-hint">{formErrors.farming_season}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="irrigation_type">
                    Irrigation Availability <span className="req-star">*</span>
                  </label>
                  <select
                    id="irrigation_type"
                    name="irrigation_type"
                    value={formData.irrigation_type}
                    onChange={handleInputChange}
                    className={formErrors.irrigation_type ? 'input-error' : ''}
                    required
                  >
                    {IRRIGATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {formErrors.irrigation_type && <span className="error-hint">{formErrors.irrigation_type}</span>}
                </div>
              </div>
            </fieldset>

            {/* SECTION 5: Farmer's Primary Priority */}
            <fieldset className="form-section">
              <legend className="section-legend">
                <span className="legend-icon">🎯</span>
                <span>Farmer's Primary Priority</span>
              </legend>

              <div className="priority-options-grid">
                {PRIORITY_OPTIONS.map((p) => {
                  const isChecked = formData.primary_priority === p;
                  return (
                    <label
                      key={p}
                      className={`priority-card ${isChecked ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="primary_priority"
                        value={p}
                        checked={isChecked}
                        onChange={handleInputChange}
                      />
                      <span className="priority-check-circle"></span>
                      <span className="priority-label-text">{p}</span>
                    </label>
                  );
                })}
              </div>
              {formErrors.primary_priority && <span className="error-hint">{formErrors.primary_priority}</span>}
            </fieldset>

            {/* SECTION 6: Additional Information */}
            <fieldset className="form-section">
              <legend className="section-legend">
                <span className="legend-icon">📝</span>
                <span>Additional Agronomic Notes (Optional)</span>
              </legend>

              <div className="form-field">
                <label htmlFor="notes">Notes / Observations</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  placeholder="e.g. Sloping topography with terraced bunds; historically prone to stem borer; relies on farmyard organic manure..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  maxLength={1000}
                ></textarea>
                <span className="field-hint">Optional context regarding soil drainage, topography, or pest history ({formData.notes.length}/1000)</span>
              </div>
            </fieldset>

            {/* Form Action Buttons */}
            <div className="form-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewMode('list')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <span>Saving Profile to SQLite...</span>
                ) : (
                  <span>{viewMode === 'edit' ? 'Update Farm Profile' : 'Save Farm Profile'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: DETAIL CARD */}
      {viewMode === 'detail' && selectedProfile && (
        <div className="detail-card">
          <div className="detail-header">
            <div>
              <div className="badge-inline">Farm Profile #{selectedProfile.id}</div>
              <h3 className="detail-title">
                {selectedProfile.farm_name || `${selectedProfile.village} Parcel`}
              </h3>
              <p className="detail-subtitle">
                Operator: <strong>{selectedProfile.farmer_name || 'Independent Holder'}</strong> • Location: <strong>{selectedProfile.village}, {selectedProfile.district}, {selectedProfile.state}</strong>
              </p>
            </div>
            <div className="detail-actions">
              <button className="btn-secondary" onClick={() => startEdit(selectedProfile)}>
                Edit Profile
              </button>
              <button className="btn-danger" onClick={(e) => confirmDelete(selectedProfile, e)}>
                Delete Profile
              </button>
              <button className="btn-ghost" onClick={() => setViewMode('list')}>
                ← Back to List
              </button>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-section-box">
              <h4 className="detail-section-title">📍 Parcel Location</h4>
              <div className="detail-stat-row">
                <span className="stat-name">Village & District:</span>
                <span className="stat-val">{selectedProfile.village}, {selectedProfile.district}</span>
              </div>
              <div className="detail-stat-row">
                <span className="stat-name">State:</span>
                <span className="stat-val">{selectedProfile.state}</span>
              </div>
              <div className="detail-stat-row">
                <span className="stat-name">Coordinates:</span>
                <span className="stat-val">
                  {selectedProfile.latitude && selectedProfile.longitude
                    ? `${selectedProfile.latitude}°N, ${selectedProfile.longitude}°E`
                    : 'Not specified (manual entry)'}
                </span>
              </div>
            </div>

            <div className="detail-section-box">
              <h4 className="detail-section-title">🌱 Soil & Land Characteristics</h4>
              <div className="detail-stat-row">
                <span className="stat-name">Total Parcel Area:</span>
                <span className="stat-val highlight">{selectedProfile.total_land_acres} Acres</span>
              </div>
              <div className="detail-stat-row">
                <span className="stat-name">Dominant Soil Type:</span>
                <span className="stat-val">
                  <span className="chip-soil">{selectedProfile.soil_type}</span>
                </span>
              </div>
              <div className="detail-stat-row">
                <span className="stat-name">Irrigation Source:</span>
                <span className="stat-val">{selectedProfile.irrigation_type}</span>
              </div>
            </div>

            <div className="detail-section-box">
              <h4 className="detail-section-title">🌾 Cropping Sequence</h4>
              <div className="detail-stat-row">
                <span className="stat-name">Current Standing Crop:</span>
                <span className="stat-val bold-crop">{selectedProfile.current_crop}</span>
              </div>
              <div className="detail-stat-row">
                <span className="stat-name">Previous Harvested Crop:</span>
                <span className="stat-val">{selectedProfile.previous_crop}</span>
              </div>
              <div className="detail-stat-row">
                <span className="stat-name">Active Season:</span>
                <span className="stat-val">
                  <span className="chip-season">{selectedProfile.farming_season}</span>
                </span>
              </div>
            </div>

            <div className="detail-section-box">
              <h4 className="detail-section-title">🎯 Farmer's Strategy & Priority</h4>
              <div className="detail-stat-row">
                <span className="stat-name">Primary Goal:</span>
                <span className="stat-val">
                  <span className="chip-priority">{selectedProfile.primary_priority}</span>
                </span>
              </div>
              <div className="detail-stat-row">
                <span className="stat-name">Created:</span>
                <span className="stat-val sub-text">
                  {new Date(selectedProfile.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="detail-stat-row">
                <span className="stat-name">Last Updated:</span>
                <span className="stat-val sub-text">
                  {new Date(selectedProfile.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {selectedProfile.notes && (
            <div className="detail-notes-card">
              <h4 className="notes-heading">Agronomic Observations & Field Notes:</h4>
              <p className="notes-content">{selectedProfile.notes}</p>
            </div>
          )}

          <div className="detail-footer-bar">
            <span>Ready for upcoming Crop Intelligence & Rotation Simulator integration.</span>
            {onNavigateToDashboard && (
              <button className="btn-secondary" onClick={onNavigateToDashboard}>
                View Weather Dashboard →
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW: PROFILES LIST */}
      {viewMode === 'list' && (
        <div className="profiles-list-section">
          <div className="list-heading-bar">
            <div>
              <h3 className="section-title">Registered Farm Parcels ({profiles.length})</h3>
              <p className="section-desc">
                Profiles are persistently stored in SQLite (`backend/krishiorbit.db`).
              </p>
            </div>
          </div>

          {loading && (
            <div className="loading-card">
              <div className="spinner-ring"></div>
              <h4>Loading Farm Profiles from SQLite...</h4>
            </div>
          )}

          {!loading && profiles.length === 0 && (
            <div className="empty-state-card">
              <div className="empty-icon">🌾</div>
              <h3>No Farm Profiles Registered Yet</h3>
              <p>
                Register your first parcel with soil characteristics, acreage, and cropping sequence
                to prepare for AI-driven rotation modeling.
              </p>
              <button className="btn-primary" onClick={startCreate} style={{ marginTop: '16px' }}>
                + Register First Farm Profile
              </button>
            </div>
          )}

          {!loading && profiles.length > 0 && (
            <div className="farm-cards-grid">
              {profiles.map((p) => (
                <div key={p.id} className="farm-parcel-card" onClick={() => viewDetail(p)}>
                  <div className="card-top">
                    <div className="parcel-id-tag">Parcel #{p.id}</div>
                    <span className="season-pill">{p.farming_season}</span>
                  </div>

                  <h4 className="parcel-name">{p.farm_name || `${p.village} Parcel`}</h4>
                  <div className="parcel-operator">
                    Farmer: <strong>{p.farmer_name || 'Individual Operator'}</strong>
                  </div>

                  <div className="parcel-location">
                    📍 {p.village}, {p.district}
                  </div>

                  <div className="parcel-metrics-grid">
                    <div className="metric-box">
                      <span className="box-lbl">Land Area</span>
                      <span className="box-val">{p.total_land_acres} ac</span>
                    </div>
                    <div className="metric-box">
                      <span className="box-lbl">Soil Type</span>
                      <span className="box-val">{p.soil_type.replace(' soil', '')}</span>
                    </div>
                    <div className="metric-box">
                      <span className="box-lbl">Current Crop</span>
                      <span className="box-val highlight-crop">{p.current_crop}</span>
                    </div>
                    <div className="metric-box">
                      <span className="box-lbl">Irrigation</span>
                      <span className="box-val">{p.irrigation_type}</span>
                    </div>
                  </div>

                  <div className="parcel-priority-chip">
                    <span className="priority-bullet"></span>
                    <span>{p.primary_priority}</span>
                  </div>

                  <div className="parcel-card-footer" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-card-action edit"
                      onClick={() => startEdit(p)}
                      title="Edit Profile"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-card-action delete"
                      onClick={(e) => confirmDelete(p, e)}
                      title="Delete Profile"
                    >
                      Delete
                    </button>
                    <button
                      className="btn-card-action view"
                      onClick={() => viewDetail(p)}
                      title="View Full Profile"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-danger">⚠️</div>
              <h4>Delete Farm Profile?</h4>
            </div>
            <p className="modal-body">
              Are you sure you want to delete the farm profile for{' '}
              <strong>"{deleteTarget.farm_name || deleteTarget.village}"</strong> (Parcel #{deleteTarget.id})?
              This record will be permanently deleted from the SQLite database.
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={executeDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
