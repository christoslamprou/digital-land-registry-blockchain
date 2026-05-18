import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import MintProperty from './components/MintProperty';
import TransferProperty from './components/TransferProperty';
import SearchProperty from './components/SearchProperty';
import OwnerSearch from './components/OwnerSearch';


import PropertyRequestForm from './components/PropertyRequestForm';
import RequestManager from './components/RequestManager';

import './App.css';

const App = () => {
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const userRole = sessionStorage.getItem('role') || 'citizen';

  const handleLogout = () => {
    sessionStorage.clear();
    setToken(null);
  };

  if (!token) {
    return <Auth setToken={setToken} />;
  }

  return (
    <Router>
      <div className="app-layout">
        
        {/* Fixed Sidebar with updated RBAC rules */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Land Registry</h2>
            <span className="role-badge">{userRole.toUpperCase()}</span>
          </div>
          
          <nav className="sidebar-nav">
            <Link to="/" className="nav-item">Dashboard</Link>
            <Link to="/search-kaek" className="nav-item">Search by KAEK</Link>
            
            {/* Accessible to all, but dynamically changes title and behavior for citizens */}
            <Link to="/search-owner" className="nav-item">
              {userRole === 'citizen' ? 'My Properties' : 'Search by Owner'}
            </Link>
            
            {/* --- NEW ROLE-BASED LINKS --- */}

            {/* ONLY Citizen can submit new requests */}
            {userRole === 'citizen' && (
              <Link to="/submit-request" className="nav-item">Submit Request</Link>
            )}

            {/* ONLY Engineer can review pending requests */}
            {userRole === 'engineer' && (
              <Link to="/requests" className="nav-item">Review Requests</Link>
            )}

            {/* ONLY Staff can Register properties directly OR approve requests */}
            {userRole === 'staff' && (
              <>
                <Link to="/mint" className="nav-item">Register Property</Link>
                <Link to="/requests" className="nav-item">Pending Approvals</Link>
              </>
            )}
            
            {/* ONLY Notary can Transfer properties */}
            {userRole === 'notary' && (
              <Link to="/transfer" className="nav-item">Transfer Property</Link>
            )}
          </nav>
          
          <button onClick={handleLogout} className="logout-btn">
             Logout
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <header className="topbar">
            <h1>Digital Land Registry System</h1>
          </header>
          
          <div className="content-wrapper">
            <Routes>
              {/* Existing Routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/search-kaek" element={<SearchProperty />} />
              <Route path="/search-owner" element={<OwnerSearch />} />
              <Route path="/mint" element={<MintProperty />} />
              <Route path="/transfer" element={<TransferProperty />} />
              
              {/* --- NEW ROUTES --- */}
              <Route path="/submit-request" element={<PropertyRequestForm />} />
              <Route path="/requests" element={<RequestManager />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
        
      </div>
    </Router>
  );
};

export default App;