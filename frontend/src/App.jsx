import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import FarmProfile from './components/FarmProfile';
import CropIntelligence from './components/CropIntelligence';
import CropRotationSimulator from './components/CropRotationSimulator';
import MarketIntelligence from './components/MarketIntelligence';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [backendHealth, setBackendHealth] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/health');
        if (res.ok) {
          const data = await res.json();
          setBackendHealth(data);
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  const getViewTitle = () => {
    switch (currentView) {
      case 'landing':
        return 'Overview';
      case 'dashboard':
        return 'Dashboard';
      case 'farm-profile':
        return 'Farm Profile';
      case 'crops':
        return 'Crop Intelligence';
      case 'rotation':
        return 'Crop Rotation Simulator';
      case 'market':
        return 'Market & Profit Intelligence';
      default:
        return 'Overview';
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        backendStatus={backendStatus}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="main-wrapper">
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <span className="top-nav-title">{getViewTitle()}</span>
          </div>

          <div className="top-nav-actions">
            <span className="badge-tag">NASA Space Apps 2026</span>
          </div>
        </header>

        <main className="content-canvas">
          {currentView === 'landing' && (
            <LandingPage
              onOpenDashboard={() => setCurrentView('dashboard')}
              onOpenCrops={() => setCurrentView('crops')}
              onOpenFarmProfile={() => setCurrentView('farm-profile')}
              onOpenRotation={() => setCurrentView('rotation')}
              onOpenMarket={() => setCurrentView('market')}
            />
          )}
          {currentView === 'dashboard' && (
            <Dashboard
              backendHealth={backendHealth}
              onOpenCrops={() => setCurrentView('crops')}
              onOpenFarmProfile={() => setCurrentView('farm-profile')}
              onOpenRotation={() => setCurrentView('rotation')}
              onOpenMarket={() => setCurrentView('market')}
            />
          )}
          {currentView === 'farm-profile' && (
            <FarmProfile
              onNavigateToDashboard={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'crops' && <CropIntelligence />}
          {currentView === 'rotation' && (
            <CropRotationSimulator
              onOpenFarmProfile={() => setCurrentView('farm-profile')}
              onOpenCrops={() => setCurrentView('crops')}
            />
          )}
          {currentView === 'market' && (
            <MarketIntelligence
              onOpenFarmProfile={() => setCurrentView('farm-profile')}
              onOpenCrops={() => setCurrentView('crops')}
              onOpenRotation={() => setCurrentView('rotation')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
