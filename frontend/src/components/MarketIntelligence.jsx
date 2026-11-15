import React, { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api';

const KARNATAKA_DISTRICTS = [
  'Shivamogga',
  'Davanagere',
  'Chikkamagaluru',
  'Udupi',
  'Hassan',
  'Belagavi',
  'Ballari',
  'Mysuru',
  'Dharwad',
];

// Indian Rupee formatting utility
function formatINR(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export default function MarketIntelligence({ onOpenFarmProfile, onOpenCrops, onOpenRotation }) {
  const [activeTab, setActiveTab] = useState('prices'); // 'prices' | 'activity' | 'calculator' | 'comparison'
  const [selectedDistrict, setSelectedDistrict] = useState('Shivamogga');
  const [selectedCommodityFilter, setSelectedCommodityFilter] = useState('all');

  // Backend state
  const [marketStatus, setMarketStatus] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [mspBenchmarks, setMspBenchmarks] = useState([]);
  const [cropComparison, setCropComparison] = useState(null);
  const [farmProfiles, setFarmProfiles] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profit Calculator State
  const [calcCrop, setCalcCrop] = useState('Paddy (Rice)');
  const [calcArea, setCalcArea] = useState(2.5);
  const [calcYield, setCalcYield] = useState(20.0);
  const [calcPrice, setCalcPrice] = useState(2441.0);
  const [calcCultivationCost, setCalcCultivationCost] = useState(25000.0);
  const [calcTransportCost, setCalcTransportCost] = useState(3000.0);
  const [calcResult, setCalcResult] = useState(null);

  // Local Mandi Entry Modal/Form State
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    crop_name: 'Paddy (Rice)',
    commodity: 'Paddy (Common)',
    district: 'Shivamogga',
    mandi_name: 'Shivamogga APMC Yard',
    variety: 'FAQ',
    modal_price: '',
    min_price: '',
    max_price: '',
    arrival_quantity: '',
    traded_quantity: '',
    data_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [entrySubmitting, setEntrySubmitting] = useState(false);
  const [entryMessage, setEntryMessage] = useState(null);

  // Fetch initial market status, prices, comparison, and farms
  const loadMarketData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch market status
      const statusRes = await fetch(`${API_BASE}/market/status`);
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setMarketStatus(sData);
      }

      // 2. Fetch market prices for selected district
      const pricesUrl = `${API_BASE}/market/prices?state=Karnataka&district=${encodeURIComponent(selectedDistrict)}`;
      const pricesRes = await fetch(pricesUrl);
      if (pricesRes.ok) {
        const pData = await pricesRes.json();
        setMarketData(pData);
      }

      // 3. Fetch MSP benchmarks
      const mspRes = await fetch(`${API_BASE}/market/msp-benchmarks`);
      if (mspRes.ok) {
        const mData = await mspRes.json();
        setMspBenchmarks(mData.benchmarks || []);
      }

      // 4. Fetch crop comparison
      const compRes = await fetch(`${API_BASE}/market/crop-comparison`);
      if (compRes.ok) {
        const cData = await compRes.json();
        setCropComparison(cData);
      }

      // 5. Fetch farm profiles to allow prefilling calculator
      const farmRes = await fetch(`${API_BASE}/farm-profiles`);
      if (farmRes.ok) {
        const fData = await farmRes.json();
        setFarmProfiles(fData);
        if (fData.length > 0 && !selectedFarmId) {
          const defaultFarm = fData[0];
          setSelectedFarmId(defaultFarm.id.toString());
          if (defaultFarm.total_land_acres) {
            setCalcArea(parseFloat(defaultFarm.total_land_acres) || 2.5);
          }
          if (defaultFarm.district) {
            setSelectedDistrict(defaultFarm.district);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to KRISHIORBIT market intelligence service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData();
  }, [selectedDistrict]);

  // Compute profit dynamically on client side for instant reactivity
  useEffect(() => {
    const area = parseFloat(calcArea) || 0;
    const yld = parseFloat(calcYield) || 0;
    const price = parseFloat(calcPrice) || 0;
    const cult = parseFloat(calcCultivationCost) || 0;
    const trans = parseFloat(calcTransportCost) || 0;

    if (area <= 0) {
      setCalcResult(null);
      return;
    }

    const expectedProduction = Math.round(area * yld * 100) / 100;
    const grossRevenueTotal = Math.round(expectedProduction * price * 100) / 100;
    const grossRevenuePerAcre = Math.round(yld * price * 100) / 100;

    const cultivationCostTotal = Math.round(area * cult * 100) / 100;
    const transportCostTotal = Math.round(area * trans * 100) / 100;
    const totalCostPerAcre = Math.round((cult + trans) * 100) / 100;
    const totalEstimatedCosts = Math.round(area * totalCostPerAcre * 100) / 100;

    const netProfitTotal = Math.round((grossRevenueTotal - totalEstimatedCosts) * 100) / 100;
    const netProfitPerAcre = Math.round((grossRevenuePerAcre - totalCostPerAcre) * 100) / 100;

    const breakeven = expectedProduction > 0 ? Math.round((totalEstimatedCosts / expectedProduction) * 100) / 100 : null;
    const roi = totalEstimatedCosts > 0 ? Math.round((netProfitTotal / totalEstimatedCosts) * 10000) / 100 : 0.0;

    setCalcResult({
      expectedProduction,
      grossRevenueTotal,
      grossRevenuePerAcre,
      cultivationCostTotal,
      transportCostTotal,
      totalCostPerAcre,
      totalEstimatedCosts,
      netProfitTotal,
      netProfitPerAcre,
      breakeven,
      roi,
      isProfitable: netProfitTotal >= 0,
    });
  }, [calcArea, calcYield, calcPrice, calcCultivationCost, calcTransportCost, calcCrop]);

  // Handle farm profile selection in profit calculator
  const handleFarmSelect = (e) => {
    const farmId = e.target.value;
    setSelectedFarmId(farmId);
    const farm = farmProfiles.find((f) => f.id.toString() === farmId);
    if (farm) {
      if (farm.total_land_acres) {
        setCalcArea(parseFloat(farm.total_land_acres));
      }
      if (farm.district) {
        setSelectedDistrict(farm.district);
      }
      // If farm's current crop matches one of our crops, set it
      if (farm.current_crop) {
        const matched = mspBenchmarks.find(
          (b) => b.crop_name.toLowerCase().includes(farm.current_crop.toLowerCase())
        );
        if (matched) {
          setCalcCrop(matched.crop_name);
          setCalcPrice(matched.msp_inr_per_quintal);
        }
      }
    }
  };

  // Prefill price from MSP benchmark for a given crop
  const handleSelectCropForCalculator = (cropName, benchmarkPrice) => {
    setCalcCrop(cropName);
    if (benchmarkPrice) {
      setCalcPrice(benchmarkPrice);
    }
    setActiveTab('calculator');
  };

  // Handle saving new local mandi observation
  const handleSaveObservation = async (e) => {
    e.preventDefault();
    setEntrySubmitting(true);
    setEntryMessage(null);
    try {
      const payload = {
        ...newEntry,
        modal_price: parseFloat(newEntry.modal_price),
        min_price: newEntry.min_price ? parseFloat(newEntry.min_price) : null,
        max_price: newEntry.max_price ? parseFloat(newEntry.max_price) : null,
        arrival_quantity: newEntry.arrival_quantity ? parseFloat(newEntry.arrival_quantity) : null,
        traded_quantity: newEntry.traded_quantity ? parseFloat(newEntry.traded_quantity) : null,
      };

      const res = await fetch(`${API_BASE}/market/observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to save local mandi observation');
      }

      setEntryMessage({ type: 'success', text: 'Local APMC mandi price successfully recorded!' });
      setShowEntryForm(false);
      // Refresh prices to show new local observation
      loadMarketData();
    } catch (err) {
      setEntryMessage({ type: 'error', text: err.message });
    } finally {
      setEntrySubmitting(false);
    }
  };

  // Filtered MSP benchmarks
  const filteredMsp = mspBenchmarks.filter((b) => {
    if (selectedCommodityFilter === 'all') return true;
    return b.category.toLowerCase().includes(selectedCommodityFilter.toLowerCase()) ||
      b.crop_name.toLowerCase().includes(selectedCommodityFilter.toLowerCase());
  });

  return (
    <div className="market-intelligence-container">
      {/* Platform & Module Header */}
      <div className="market-header-card">
        <div className="market-header-left">
          <div className="badge-tag">Phase 8 • Market Intelligence MVP</div>
          <h2 className="market-title">Market & Profit Intelligence</h2>
          <p className="market-subtitle">
            Authoritative Agricultural Market Data, CACP Statutory MSP Benchmarks,
            Market Activity Signals, and Farm Profitability Calculator.
          </p>
          <div className="market-meta-pills">
            <span className="meta-pill">Region: Karnataka Mandis</span>
            <span className="meta-pill">Selected District: {selectedDistrict}</span>
            <span className="meta-pill">Marketing Season: Kharif 2026–27</span>
          </div>
        </div>

        <div className="market-district-selector-box">
          <label className="selector-label">APMC District Focus</label>
          <select
            className="sim-select"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            {KARNATAKA_DISTRICTS.map((dist) => (
              <option key={dist} value={dist}>
                {dist} APMC Markets
              </option>
            ))}
          </select>
          <small className="selector-hint">Prioritizes local Karnataka regulated markets</small>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="market-nav-tabs">
        <button
          className={`market-tab-btn ${activeTab === 'prices' ? 'active' : ''}`}
          onClick={() => setActiveTab('prices')}
        >
          <span className="tab-icon">📊</span>
          <span>Market Prices & MSP</span>
        </button>
        <button
          className={`market-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <span className="tab-icon">📈</span>
          <span>Market Activity & Demand</span>
        </button>
        <button
          className={`market-tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <span className="tab-icon">🧮</span>
          <span>Farm Profit Calculator</span>
        </button>
        <button
          className={`market-tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          <span className="tab-icon">⚖️</span>
          <span>Crop Market vs Climate</span>
        </button>
      </div>

      {/* TAB 1: MARKET PRICES & MSP BENCHMARKS */}
      {activeTab === 'prices' && (
        <div className="market-tab-content">
          {/* Honest Live API Status Card */}
          <div className="market-status-alert">
            <div className="status-alert-icon">🏛️</div>
            <div className="status-alert-body">
              <div className="status-badge-row">
                <span className="badge-offline">
                  {marketStatus?.api_key_configured ? 'Live AGMARKNET Connected' : 'Live AGMARKNET Feed: Offline'}
                </span>
                <span className="badge-official">Official Data Verification Policy</span>
              </div>
              <h4>Official AGMARKNET & e-NAM Mandi Integration Status</h4>
              <p>
                {marketData?.message ||
                  'Official live AGMARKNET API access requires a registered data.gov.in API key in the DATAGOVIN_API_KEY environment variable. KRISHIORBIT strictly forbids generating synthetic spot prices. Farmers can consult official portals, view statutory CACP MSP benchmarks below, or record verified local APMC auction rates.'}
              </p>
            </div>
          </div>

          {/* Official Portals Quick Links */}
          <div className="official-portals-section">
            <h3 className="sub-heading">Official Agricultural Market Gateways</h3>
            <p className="sub-desc">
              Direct access to Government of India regulated agricultural market data feeds:
            </p>
            <div className="portals-grid">
              {(marketStatus?.official_portals || []).map((portal) => (
                <a
                  key={portal.id}
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portal-card"
                >
                  <div className="portal-header">
                    <h4>{portal.name}</h4>
                    <span className="external-link-icon">↗</span>
                  </div>
                  <div className="portal-agency">{portal.agency}</div>
                  <p className="portal-desc">{portal.description}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Local Mandi Observations & Record Button */}
          <div className="local-observations-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">Local APMC Mandi Observations ({selectedDistrict})</h3>
                <p className="card-subtitle">
                  Verified farmer-reported auction rates from local APMC yards in {selectedDistrict} district.
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => setShowEntryForm(!showEntryForm)}
              >
                {showEntryForm ? '✕ Close Form' : '+ Record Local Mandi Price'}
              </button>
            </div>

            {/* Inline Entry Form */}
            {showEntryForm && (
              <form className="mandi-entry-form" onSubmit={handleSaveObservation}>
                <h4 className="form-title">Record Verified APMC Mandi Auction Rate</h4>
                {entryMessage && (
                  <div className={`alert-msg ${entryMessage.type}`}>{entryMessage.text}</div>
                )}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Crop Name</label>
                    <select
                      className="sim-select"
                      value={newEntry.crop_name}
                      onChange={(e) => {
                        const cName = e.target.value;
                        setNewEntry({
                          ...newEntry,
                          crop_name: cName,
                          commodity: cName.split(' ')[0],
                        });
                      }}
                    >
                      <option value="Paddy (Rice)">Paddy (Rice)</option>
                      <option value="Ragi (Finger Millet)">Ragi (Finger Millet)</option>
                      <option value="Maize">Maize</option>
                      <option value="Black Gram">Black Gram</option>
                      <option value="Green Gram">Green Gram</option>
                      <option value="Groundnut">Groundnut</option>
                      <option value="Soybean">Soybean</option>
                      <option value="Cowpea">Cowpea</option>
                      <option value="Arecanut">Arecanut</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Mandi / Market Name</label>
                    <input
                      type="text"
                      className="sim-input"
                      placeholder="e.g. Shivamogga APMC"
                      value={newEntry.mandi_name}
                      onChange={(e) => setNewEntry({ ...newEntry, mandi_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Modal Auction Price (₹/quintal) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="sim-input"
                      placeholder="e.g. 2350"
                      value={newEntry.modal_price}
                      onChange={(e) => setNewEntry({ ...newEntry, modal_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Min Price (₹/quintal)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="sim-input"
                      placeholder="e.g. 2200"
                      value={newEntry.min_price}
                      onChange={(e) => setNewEntry({ ...newEntry, min_price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Price (₹/quintal)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="sim-input"
                      placeholder="e.g. 2420"
                      value={newEntry.max_price}
                      onChange={(e) => setNewEntry({ ...newEntry, max_price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Arrival Quantity (quintals)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="sim-input"
                      placeholder="e.g. 350"
                      value={newEntry.arrival_quantity}
                      onChange={(e) => setNewEntry({ ...newEntry, arrival_quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Traded Quantity (quintals)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="sim-input"
                      placeholder="e.g. 320"
                      value={newEntry.traded_quantity}
                      onChange={(e) => setNewEntry({ ...newEntry, traded_quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Observation Date</label>
                    <input
                      type="date"
                      className="sim-input"
                      value={newEntry.data_date}
                      onChange={(e) => setNewEntry({ ...newEntry, data_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions-row">
                  <button type="submit" className="btn-primary" disabled={entrySubmitting}>
                    {entrySubmitting ? 'Saving...' : '💾 Save Mandi Observation'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowEntryForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List of Local Observations */}
            <div className="observations-table-wrapper">
              {marketData?.local_observations && marketData.local_observations.length > 0 ? (
                <table className="mandi-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Mandi</th>
                      <th>Crop / Commodity</th>
                      <th>Modal Price</th>
                      <th>Min – Max</th>
                      <th>Arrivals / Traded</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.local_observations.map((obs) => (
                      <tr key={obs.id}>
                        <td>{obs.data_date}</td>
                        <td>
                          <strong>{obs.mandi_name}</strong>
                          <div className="td-sub">{obs.district}, {obs.state}</div>
                        </td>
                        <td>
                          <strong>{obs.crop_name}</strong>
                          {obs.variety && <span className="variety-badge">{obs.variety}</span>}
                        </td>
                        <td className="price-modal">{formatINR(obs.modal_price)} / q</td>
                        <td>
                          {obs.min_price ? formatINR(obs.min_price) : '—'} –{' '}
                          {obs.max_price ? formatINR(obs.max_price) : '—'}
                        </td>
                        <td>
                          {obs.arrival_quantity ? `${obs.arrival_quantity} q arr.` : '—'} /{' '}
                          {obs.traded_quantity ? `${obs.traded_quantity} q trd.` : '—'}
                        </td>
                        <td>
                          <button
                            className="btn-small-action"
                            onClick={() => handleSelectCropForCalculator(obs.crop_name, obs.modal_price)}
                          >
                            Use in Calculator
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state-box">
                  <p>No local APMC observations recorded yet for {selectedDistrict} district.</p>
                  <button className="btn-secondary" onClick={() => setShowEntryForm(true)}>
                    + Add First Local Mandi Rate
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Statutory CACP MSP Benchmarks (Kharif 2026–27) */}
          <div className="msp-benchmarks-section">
            <div className="card-header-flex">
              <div>
                <div className="badge-tag">Statutory Reference Benchmark</div>
                <h3 className="card-title">Government of India CACP Minimum Support Prices (Kharif 2026–27)</h3>
                <p className="card-subtitle">
                  Official procurement benchmark rates recommended by the Commission for Agricultural Costs & Prices (CACP), DA&FW, Ministry of Agriculture & Farmers Welfare, GoI.
                </p>
              </div>

              {/* Filter */}
              <div className="filter-group">
                <label className="selector-label">Filter Category</label>
                <select
                  className="sim-select"
                  value={selectedCommodityFilter}
                  onChange={(e) => setSelectedCommodityFilter(e.target.value)}
                >
                  <option value="all">All Commodities</option>
                  <option value="Cereal">Cereals</option>
                  <option value="Nutri-Cereal">Nutri-Cereals (Millets)</option>
                  <option value="Pulse">Pulses</option>
                  <option value="Oilseed">Oilseeds</option>
                  <option value="Plantation">Commercial Plantation</option>
                </select>
              </div>
            </div>

            <div className="msp-cards-grid">
              {filteredMsp.map((bench) => (
                <div key={bench.crop_name} className="msp-card">
                  <div className="msp-card-header">
                    <div>
                      <h4 className="msp-crop-title">{bench.crop_name}</h4>
                      <span className="msp-category-pill">{bench.category}</span>
                    </div>
                    {bench.is_statutory_msp ? (
                      <span className="msp-badge-statutory">CACP MSP</span>
                    ) : (
                      <span className="msp-badge-commercial">Non-MSP / Local Quote</span>
                    )}
                  </div>

                  <div className="msp-price-display">
                    <span className="msp-price-val">
                      {bench.msp_inr_per_quintal != null ? formatINR(bench.msp_inr_per_quintal) : 'Manual Entry'}
                    </span>
                    <span className="msp-price-unit">
                      {bench.msp_inr_per_quintal != null ? 'per quintal' : '(Non-MSP commodity)'}
                    </span>
                  </div>

                  <div className="msp-details-list">
                    <div className="detail-item">
                      <span className="detail-label">Marketing Season:</span>
                      <span className="detail-val">{bench.marketing_season}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Commodity:</span>
                      <span className="detail-val">{bench.commodity}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Storage Characteristic:</span>
                      <span className="detail-val">{bench.perishability}</span>
                    </div>
                  </div>

                  <p className="msp-card-notes">{bench.notes}</p>

                  <div className="msp-card-footer">
                    <button
                      className="btn-primary-small"
                      onClick={() => handleSelectCropForCalculator(bench.crop_name, bench.msp_inr_per_quintal)}
                    >
                      {bench.msp_inr_per_quintal != null ? 'Calculate Profit with this Price →' : 'Enter Local Price in Calculator →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MARKET ACTIVITY & DEMAND SIGNALS */}
      {activeTab === 'activity' && (
        <div className="market-tab-content">
          <div className="activity-intro-card">
            <div className="badge-tag">Economic Dynamics</div>
            <h3 className="section-title">Understanding Agricultural Market Activity & Demand Signals</h3>
            <p className="section-desc">
              Agricultural markets operate under complex interplay between seasonal harvest supply and continuous consumer demand.
              Learn how to interpret market arrivals, traded volume, and auction price movements.
            </p>
          </div>

          {/* 4 Core Principles Cards */}
          <div className="principles-grid">
            <div className="principle-card">
              <div className="principle-icon-circle">🚚</div>
              <h4>1. Market Supply Velocity (Arrivals)</h4>
              <div className="principle-summary">Higher arrivals can indicate greater physical market supply.</div>
              <p>
                Arrivals quantify the total volume of produce delivered to regulated APMC yards on a given day.
                During peak harvest windows, sudden surges in arrivals frequently cause temporary local supply gluts
                if local milling, storage, or transport infrastructure cannot rapidly absorb the produce.
              </p>
            </div>

            <div className="principle-card">
              <div className="principle-icon-circle">🤝</div>
              <h4>2. Recorded Trading Activity (Traded Quantity)</h4>
              <div className="principle-summary">Traded quantity indicates actual concluded transactions.</div>
              <p>
                Traded volume measures the actual produce that successfully cleared auction and was purchased by traders.
                A large divergence between high arrivals and low traded quantity indicates unsold carryover, buyer resistance,
                or produce failing Fair Average Quality (FAQ) standards.
              </p>
            </div>

            <div className="principle-card">
              <div className="principle-icon-circle">📊</div>
              <h4>3. Joint Price-Volume Dynamics</h4>
              <div className="principle-summary">Price trends and traded volume together help assess market conditions.</div>
              <p>
                Evaluating price and traded volume concurrently provides actionable clarity:
              </p>
              <ul className="principle-bullet-list">
                <li><strong>Rising Price + Rising Volume:</strong> Robust processor and consumer demand.</li>
                <li><strong>Falling Price + Surging Arrivals:</strong> Harvest supply glut or distress selling.</li>
                <li><strong>High Price + Low Arrivals:</strong> Off-season scarcity or thin market liquidity.</li>
              </ul>
            </div>

            <div className="principle-card caution-border">
              <div className="principle-icon-circle caution">⚠️</div>
              <h4>4. Analytical Boundary & Caution</h4>
              <div className="principle-summary caution-text">
                Never claim that arrivals alone prove consumer demand or predict future market prices.
              </div>
              <p>
                Scientific and Econometric Prudence: Physical APMC arrivals represent only one channel of grain circulation.
                They do not reflect direct farm-gate procurement, private corporate contracts, transit bottlenecks, or speculative holding.
                Farmers must never assume that past arrivals guarantee future spot price behavior.
              </p>
            </div>
          </div>

          {/* Practical Matrix for Karnataka Farmers */}
          <div className="market-matrix-card">
            <h4 className="matrix-title">Market Condition Decision Matrix</h4>
            <div className="matrix-grid">
              <div className="matrix-box green">
                <span className="matrix-label">High Volume + Rising Price</span>
                <h5>Favorable Selling Window</h5>
                <p>Demand exceeds available supply. Millers actively procuring. Good liquidity for spot sales.</p>
              </div>
              <div className="matrix-box yellow">
                <span className="matrix-label">High Volume + Falling Price</span>
                <h5>Harvest Glut / Softening</h5>
                <p>Peak post-harvest deliveries. Consider safe hermetic grain storage if holding capacity permits.</p>
              </div>
              <div className="matrix-box blue">
                <span className="matrix-label">Low Volume + High Price</span>
                <h5>Off-Season Scarcity</h5>
                <p>High nominal price quotes, but low auction depth. Suitable for staged release of stored grain.</p>
              </div>
              <div className="matrix-box red">
                <span className="matrix-label">Low Volume + Falling Price</span>
                <h5>Sluggish Demand / Off-Grade</h5>
                <p>Subdued trading interest or lot quality degradation. Assess alternative processing or value-addition.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FARM PROFIT & BREAK-EVEN CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="market-tab-content">
          <div className="calculator-wrapper">
            {/* Input Controls Column */}
            <div className="calculator-inputs-card">
              <div className="card-header-flex">
                <div>
                  <h3 className="card-title">Operational Farm Parameters</h3>
                  <p className="card-subtitle">
                    Enter operational acreage, expected yield, and verified market price to project margins.
                  </p>
                </div>
              </div>

              {/* Prefill from Farm Profile */}
              {farmProfiles.length > 0 && (
                <div className="form-group prefill-group">
                  <label>Prefill Acreage from Saved Farm Profile</label>
                  <select
                    className="sim-select"
                    value={selectedFarmId}
                    onChange={handleFarmSelect}
                  >
                    {farmProfiles.map((f) => (
                      <option key={f.id} value={f.id.toString()}>
                        {f.farm_name || f.farmer_name || `Farm #${f.id}`} ({f.total_land_acres} acres • {f.village}, {f.district})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Crop Selector */}
              <div className="form-group">
                <label>Select Target Crop</label>
                <select
                  className="sim-select"
                  value={calcCrop}
                  onChange={(e) => {
                    const cName = e.target.value;
                    setCalcCrop(cName);
                    // Match MSP price
                    const matched = mspBenchmarks.find((b) => b.crop_name === cName);
                    if (matched) {
                      setCalcPrice(matched.msp_inr_per_quintal);
                    }
                  }}
                >
                  <option value="Paddy (Rice)">Paddy (Rice)</option>
                  <option value="Ragi (Finger Millet)">Ragi (Finger Millet)</option>
                  <option value="Maize">Maize</option>
                  <option value="Black Gram">Black Gram</option>
                  <option value="Green Gram">Green Gram</option>
                  <option value="Groundnut">Groundnut</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Cowpea">Cowpea</option>
                  <option value="Arecanut">Arecanut</option>
                </select>
              </div>

              {/* Farm Area */}
              <div className="form-group">
                <div className="label-flex">
                  <label>Cultivated Land Area (Acres)</label>
                  <span className="field-val-badge">{calcArea} acres</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="sim-input"
                  value={calcArea}
                  onChange={(e) => setCalcArea(parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Expected Yield */}
              <div className="form-group">
                <div className="label-flex">
                  <label>Expected Yield per Acre (Quintals / Acre)</label>
                  <span className="field-val-badge">{calcYield} q/acre</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="sim-input"
                  value={calcYield}
                  onChange={(e) => setCalcYield(parseFloat(e.target.value) || 0)}
                />
                <small className="field-hint">
                  Typical: Paddy 18–25 q; Ragi 10–15 q; Maize 20–30 q; Pulses 4–8 q; Arecanut 10–15 q
                </small>
              </div>

              {/* Selling Price */}
              <div className="form-group">
                <div className="label-flex">
                  <label>Selling Price per Quintal (₹ / Quintal)</label>
                  <span className="field-val-badge">{formatINR(calcPrice)} / q</span>
                </div>
                <input
                  type="number"
                  step="10"
                  min="0"
                  className="sim-input"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(parseFloat(e.target.value) || 0)}
                />
                <div className="quick-fill-row">
                  {mspBenchmarks.find((b) => b.crop_name === calcCrop && b.msp_inr_per_quintal != null) && (
                    <button
                      type="button"
                      className="btn-quick-fill"
                      onClick={() => {
                        const b = mspBenchmarks.find((b) => b.crop_name === calcCrop);
                        if (b && b.msp_inr_per_quintal != null) setCalcPrice(b.msp_inr_per_quintal);
                      }}
                    >
                      ↺ Reset to Kharif 2026–27 CACP MSP: {formatINR(mspBenchmarks.find((b) => b.crop_name === calcCrop)?.msp_inr_per_quintal)}
                    </button>
                  )}
                </div>
              </div>

              {/* Cultivation Cost per Acre */}
              <div className="form-group">
                <div className="label-flex">
                  <label>Cultivation Cost per Acre (₹ / Acre)</label>
                  <span className="field-val-badge">{formatINR(calcCultivationCost)} / acre</span>
                </div>
                <input
                  type="number"
                  step="500"
                  min="0"
                  className="sim-input"
                  value={calcCultivationCost}
                  onChange={(e) => setCalcCultivationCost(parseFloat(e.target.value) || 0)}
                />
                <small className="field-hint">
                  Includes seeds, fertilizer, farm machinery/tractor hire, labor, pest protection, and irrigation.
                </small>
              </div>

              {/* Transportation & Marketing Cost per Acre */}
              <div className="form-group">
                <div className="label-flex">
                  <label>Transportation & Marketing Cost (₹ / Acre)</label>
                  <span className="field-val-badge">{formatINR(calcTransportCost)} / acre</span>
                </div>
                <input
                  type="number"
                  step="200"
                  min="0"
                  className="sim-input"
                  value={calcTransportCost}
                  onChange={(e) => setCalcTransportCost(parseFloat(e.target.value) || 0)}
                />
                <small className="field-hint">
                  Includes bagging, gunny bags, transport to APMC yard, weighing, and loading fees.
                </small>
              </div>
            </div>

            {/* Calculations & Results Display Column */}
            <div className="calculator-results-card">
              <h3 className="results-header-title">Estimated Farm Economics & Net Profit</h3>
              <p className="results-header-subtitle">
                Deterministic calculations for {calcCrop} on {calcArea} acres:
              </p>

              {calcResult ? (
                <div className="results-content-deck">
                  {/* Primary Profit Banner */}
                  <div className={`profit-banner-box ${calcResult.isProfitable ? 'profit' : 'loss'}`}>
                    <div className="banner-kpi-label">
                      {calcResult.isProfitable ? 'ESTIMATED NET PROFIT' : 'ESTIMATED NET DEFICIT (LOSS)'}
                    </div>
                    <div className="banner-kpi-val">
                      {formatINR(calcResult.netProfitTotal)}
                    </div>
                    <div className="banner-kpi-sub">
                      {formatINR(calcResult.netProfitPerAcre)} per acre • ROI: {calcResult.roi}%
                    </div>
                  </div>

                  {/* KPI Metrics Grid */}
                  <div className="kpi-metrics-grid">
                    <div className="kpi-metric-tile">
                      <div className="kpi-tile-label">Expected Total Production</div>
                      <div className="kpi-tile-val">{calcResult.expectedProduction} quintals</div>
                      <div className="kpi-tile-hint">({calcYield} q/acre × {calcArea} acres)</div>
                    </div>

                    <div className="kpi-metric-tile">
                      <div className="kpi-tile-label">Gross Farm Revenue</div>
                      <div className="kpi-tile-val">{formatINR(calcResult.grossRevenueTotal)}</div>
                      <div className="kpi-tile-hint">({formatINR(calcResult.grossRevenuePerAcre)}/acre)</div>
                    </div>

                    <div className="kpi-metric-tile">
                      <div className="kpi-tile-label">Total Estimated Costs</div>
                      <div className="kpi-tile-val">{formatINR(calcResult.totalEstimatedCosts)}</div>
                      <div className="kpi-tile-hint">({formatINR(calcResult.totalCostPerAcre)}/acre total)</div>
                    </div>

                    <div className="kpi-metric-tile highlight">
                      <div className="kpi-tile-label">Break-Even Selling Price</div>
                      <div className="kpi-tile-val">
                        {calcResult.breakeven ? `${formatINR(calcResult.breakeven)} / q` : 'N/A'}
                      </div>
                      <div className="kpi-tile-hint">
                        {calcResult.breakeven && calcPrice >= calcResult.breakeven ? (
                          <span className="safe-margin">
                            Selling at +{formatINR(calcPrice - calcResult.breakeven)}/q above break-even
                          </span>
                        ) : (
                          <span className="deficit-margin">
                            Selling below break-even cost!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown Accordion/Table */}
                  <div className="cost-breakdown-card">
                    <h4 className="breakdown-title">Operational Cost Structure</h4>
                    <div className="breakdown-row">
                      <span>Field Cultivation Cost ({calcArea} acres)</span>
                      <strong>{formatINR(calcResult.cultivationCostTotal)}</strong>
                    </div>
                    <div className="breakdown-row">
                      <span>Transportation & Marketing ({calcArea} acres)</span>
                      <strong>{formatINR(calcResult.transportCostTotal)}</strong>
                    </div>
                    <div className="breakdown-row total">
                      <span>Total Operational Outlay</span>
                      <strong>{formatINR(calcResult.totalEstimatedCosts)}</strong>
                    </div>
                  </div>

                  {/* Scientific & Economic Transparency Disclosure */}
                  <div className="calc-disclaimer-box">
                    <div className="disclaimer-header">
                      <span className="disclaimer-icon">ℹ️</span>
                      <strong>Scientific & Economic Disclosure</strong>
                    </div>
                    <p>
                      Profit calculations are computational estimates based exclusively on farmer-provided operational variables
                      (yield, selling price, and field expenses). KRISHIORBIT does not fabricate crop yields or operational costs.
                      Actual farm income is subject to localized rainfall timing, pest incidence, post-harvest losses, and volatile
                      spot mandi realizations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="empty-state-box">
                  <p>Please enter a valid farm area greater than 0 acres to calculate profit.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CROP MARKET VS CLIMATE COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="market-tab-content">
          {/* Critical Agronomic Warning Alert */}
          <div className="critical-agronomic-alert">
            <div className="alert-icon-box">⚠️</div>
            <div className="alert-body">
              <h4>CRITICAL AGRONOMIC RULE: Never Select Crops by Market Price Alone!</h4>
              <p>
                A crop with high market prices (e.g. Pulses or Arecanut) will incur catastrophic financial loss
                if your land's soil drainage, seasonal rainfall, and irrigation capacity do not satisfy its biological
                requirements. Agro-Climatic Suitability must be verified first before evaluating market potential.
              </p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="crop-comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Crop & Category</th>
                  <th style={{ width: '42%' }}>1. Agro-Climatic Suitability (EVALUATE FIRST)</th>
                  <th style={{ width: '24%' }}>2. Economic & Market Parameters</th>
                  <th style={{ width: '12%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(cropComparison?.crops || []).map((item) => {
                  const agro = item.agro_climatic_profile;
                  const econ = item.economic_market_profile;
                  return (
                    <tr key={item.crop_id}>
                      {/* Crop Info */}
                      <td>
                        <strong className="crop-comp-name">{item.crop_name}</strong>
                        <div className="crop-comp-sci">{item.scientific_name}</div>
                        <span className="crop-comp-cat">{item.crop_category}</span>
                      </td>

                      {/* Agro-Climatic Profile */}
                      <td>
                        <div className="agro-profile-box">
                          <div className="agro-profile-line">
                            <strong>Suitable Seasons:</strong> {agro.suitable_seasons}
                          </div>
                          <div className="agro-profile-line">
                            <strong>Water Requirement:</strong> {agro.water_requirement}
                          </div>
                          <div className="agro-profile-line">
                            <strong>Suitable Soils:</strong> {agro.suitable_soils}
                          </div>
                          <div className="agro-profile-line">
                            <strong>Duration:</strong> {agro.growing_duration}
                          </div>
                        </div>
                      </td>

                      {/* Economic & Market Profile */}
                      <td>
                        <div className="econ-profile-box">
                          <div className="econ-price-tag">
                            {(econ.statutory_msp_2026_27 || econ.statutory_msp_2024_25)
                              ? `${formatINR(econ.statutory_msp_2026_27 || econ.statutory_msp_2024_25)} / q`
                              : 'Manual Local Quote'}
                          </div>
                          <div className="econ-sub-status">
                            {econ.is_statutory_msp ? (
                              <span className="badge-msp-yes">CACP Statutory MSP</span>
                            ) : (
                              <span className="badge-msp-no">Non-MSP / Local Quote</span>
                            )}
                          </div>
                          <div className="econ-detail-text">
                            <strong>Storage:</strong> {econ.perishability}
                          </div>
                          <div className="econ-detail-text">
                            <strong>Agency:</strong> {econ.notifying_agency}
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          className="btn-small-action"
                          onClick={() => handleSelectCropForCalculator(item.crop_name, econ.statutory_msp_2026_27 || econ.statutory_msp_2024_25)}
                        >
                          Calculate Profit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attribution & Provenance Footer */}
      <footer className="market-footer">
        <div className="footer-content">
          <div className="footer-logos-text">
            <strong>Official Agricultural Data Sources:</strong> data.gov.in AGMARKNET • e-NAM SFAC •
            Commission for Agricultural Costs & Prices (CACP) • KSAMB Karnataka • NASA POWER Agroclimatology
          </div>
          <p className="footer-subtext">
            KRISHIORBIT Agricultural Intelligence Platform • NASA Space Apps Challenge 2026 • Strict Scientific Integrity Policy
          </p>
        </div>
      </footer>
    </div>
  );
}
