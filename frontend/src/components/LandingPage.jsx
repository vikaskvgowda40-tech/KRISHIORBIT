import React from 'react';

export default function LandingPage({ onOpenDashboard, onOpenCrops, onOpenFarmProfile, onOpenRotation, onOpenMarket }) {
  const pillars = [
    {
      title: 'NASA Satellite Observation',
      description: 'Leveraging spaceborne remote sensing (Landsat & Sentinel) to monitor multispectral vegetation indices (NDVI) and surface moisture.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="2"></circle>
          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
        </svg>
      ),
    },
    {
      title: 'Climate & Weather Intelligence',
      description: 'Analyzing precipitation patterns, monsoon progression, and temperature cycles across the Western Ghats and Deccan Plateau.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
        </svg>
      ),
    },
    {
      title: 'Soil Characteristics',
      description: 'Tracking laterite, red loamy, and black cotton soil profiles to prevent nutrient depletion and soil acidification.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
    },
    {
      title: 'Crop Rotation Optimization',
      description: 'Recommending restorative crop cycles—such as alternating nitrogen-exhausting cereals with restorative pulses and cover crops.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
      ),
    },
    {
      title: 'Market & Profit Intelligence',
      description: 'Evaluating official APMC mandi prices, CACP statutory MSP benchmarks, market activity signals, and deterministic farm profitability.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
    },
  ];

  const agroZones = [
    {
      name: 'Malnad Hill Ecosystem',
      desc: 'Agumbe rainforest canopy and mist-covered rolling green ridges of the Western Ghats across Shimoga and Chikmagalur districts.',
      tag: 'Western Ghats Ridge',
      img: '/images/landscapes/western_ghats_agumbe.webp',
      alt: 'Mystic layers of Agumbe rainforest in the Western Ghats, Karnataka',
    },
    {
      name: 'Paddy Valley & Wetlands',
      desc: 'Lush terraced valley paddy flanked by traditional areca nut and coconut groves in Chikmagalur and Malnad river basins.',
      tag: 'Malnad Valley Farming',
      img: '/images/landscapes/paddy_areca_valley.webp',
      alt: 'Paddy and areca nut fields in Chikmagalur, Karnataka',
    },
    {
      name: 'Deccan Transition & Drylands',
      desc: 'Semi-arid red soil plains cultivating hardy finger millet (Ragi) and drought-tolerant pulses that rejuvenate dry soils.',
      tag: 'Nutri-Cereal Belt',
      img: '/images/landscapes/deccan_drylands_ragi.webp',
      alt: 'Finger millet (Ragi) field in Karnataka Deccan plateau',
    },
  ];

  return (
    <div className="landing-container">
      {/* Hero Section with authentic Malnad landscape photograph */}
      <section className="landing-hero with-photo-bg">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="pill-dot"></span>
            <span>NASA Space Apps 2026 • Earth Observation for Agriculture</span>
          </div>
          <h1 className="hero-title">
            Empowering Farmers with Space-Driven Agricultural Intelligence
          </h1>
          <p className="hero-subtitle">
            KRISHIORBIT unites NASA satellite remote sensing, regional climate telemetry,
            and soil characteristics to help farmers across Karnataka and the Western Ghats
            design sustainable, regenerative crop rotation strategies.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={onOpenDashboard}>
              Launch Dashboard
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button className="btn-secondary" onClick={onOpenFarmProfile}>
              Register Farm Profile
            </button>
            <button className="btn-secondary" onClick={onOpenCrops}>
              Explore Crop Intelligence
            </button>
            <button className="btn-secondary" onClick={onOpenRotation}>
              Rotation Simulator
            </button>
            <button className="btn-secondary" onClick={onOpenMarket}>
              Market Intelligence
            </button>
          </div>
          <div className="hero-photo-credit">
            <span>📍 Authentic Photography: Paddy fields amidst the Western Ghats foothills, Karnataka</span>
          </div>
        </div>
      </section>

      {/* Regional Agro-Ecological Landscape Overview */}
      <section className="agro-zones-section">
        <div className="section-heading">
          <div className="badge-inline">Target Agricultural Landscapes</div>
          <h2 className="section-title">Karnataka & Western Ghats Agro-Climatic Diversity</h2>
          <p className="section-desc">
            Tailoring crop rotation systems to the verified ecosystems of the Western Ghats, Malnad, and Deccan plains.
          </p>
        </div>

        <div className="agro-zones-grid">
          {agroZones.map((zone, idx) => (
            <div key={idx} className="agro-zone-card">
              <div className="agro-zone-img-wrapper">
                <img
                  src={zone.img}
                  alt={zone.alt}
                  className="agro-zone-img"
                  width="800"
                  height="500"
                  loading="lazy"
                />
                <span className="agro-zone-tag">{zone.tag}</span>
              </div>
              <div className="agro-zone-info">
                <h4>{zone.name}</h4>
                <p>{zone.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Intelligence Pillars */}
      <section style={{ marginTop: '40px' }}>
        <div className="section-heading">
          <div className="badge-inline">Platform Architecture</div>
          <h2 className="section-title">Core Intelligence Pillars</h2>
          <p className="section-desc">
            Scientific foundation synthesizing Earth observation data with practical agronomy.
          </p>
        </div>

        <div className="pillars-grid">
          {pillars.map((pillar, idx) => (
            <div key={idx} className="pillar-card">
              <div className="pillar-icon-box">{pillar.icon}</div>
              <h3 className="pillar-title">{pillar.title}</h3>
              <p className="pillar-text">{pillar.description}</p>
            </div>
          ))}
        </div>

        <div className="info-banner">
          <div className="info-banner-text">
            <h4>Ready to explore regional agricultural telemetry?</h4>
            <p>Access the unified dashboard to view platform readiness and explore crop rotation profiles.</p>
          </div>
          <button className="btn-primary" onClick={onOpenDashboard}>
            Go to Dashboard
          </button>
        </div>
      </section>
    </div>
  );
}
