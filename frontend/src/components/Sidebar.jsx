import React from 'react';

export default function Sidebar({ currentView, setCurrentView, backendStatus, mobileOpen, setMobileOpen }) {
  const navItems = [
    {
      id: 'landing',
      label: 'Home & Overview',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
      ),
    },
    {
      id: 'farm-profile',
      label: 'Farm Profile',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9v.01M9 13v.01M9 17v.01"></path>
        </svg>
      ),
    },
    {
      id: 'crops',
      label: 'Crop Intelligence',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
    },
    {
      id: 'rotation',
      label: 'Rotation Simulator',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
      ),
    },
    {
      id: 'market',
      label: 'Market Intelligence',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
    },
  ];

  const comingSoonItems = [
    { id: 'perennial', label: 'Perennial Plantation (Arecanut)' },
    { id: 'satellite', label: 'Landsat / Sentinel Data' },
    { id: 'climate', label: 'Monsoon Telemetry' },
    { id: 'soil', label: 'Soil Health Sensors' },
  ];

  const handleNavClick = (id) => {
    setCurrentView(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <span className="brand-badge">NASA Space Apps 2026</span>
        <h1 className="brand-title">
          <span>KRISHI</span>ORBIT
        </h1>
        <p className="brand-subtitle">Agricultural Intelligence Platform</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => handleNavClick(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <div className="nav-section-title" style={{ marginTop: '16px' }}>Upcoming Integrations</div>
        {comingSoonItems.map((item) => (
          <div key={item.id} className="nav-item disabled" title="Scheduled for upcoming phase">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="backend-indicator">
          <div className={`status-dot ${backendStatus === 'online' ? 'connected' : ''}`}></div>
          <div>
            <div style={{ fontWeight: 600, color: '#d8f3dc' }}>
              Backend: {backendStatus === 'online' ? 'Online' : 'Checking...'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#83a594' }}>FastAPI Service</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
