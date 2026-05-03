import React, { useState } from 'react';
import './App.css';

// Import Components
import Auth from './components/Auth';
import MintProperty from './components/MintProperty';
import TransferProperty from './components/TransferProperty';
import SearchProperty from './components/SearchProperty';
import Dashboard from './components/Dashboard';

function App() {
  // Authentication State
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [role, setRole] = useState(sessionStorage.getItem('role') || null);

  // State to force Dashboard refresh after new mint/transfer
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
  };

  // 1. Render Auth Screen if not logged in
  if (!token) {
    return <Auth setToken={setToken} setRole={setRole} />;
  }

  // 2. Render Main App if logged in
  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h1>Digital Land Registry</h1>
          <p>Logged in as: <strong>{role ? role.toUpperCase() : ''}</strong></p>
        </div>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </header>

      <main className="container">
        <div className="column">
          {/* Conditional Rendering based on Role */}
          {role === 'staff' && <MintProperty onSuccess={triggerRefresh} />}
          {role === 'notary' && <TransferProperty onSuccess={triggerRefresh} />}
          {role === 'citizen' && (
            <section className="card">
              <h2>Welcome, Citizen</h2>
              <p>You have read-only access to the public land registry. Use the search panel to verify property records and trace ownership history on the blockchain.</p>
            </section>
          )}
        </div>

        <div className="column">
          {/* Search is available to everyone */}
          <SearchProperty />
        </div>

        {/* Dashboard is available to everyone */}
        {/* We use 'key' to force the component to re-mount and re-fetch data on update */}
        <Dashboard key={refreshKey} />
      </main>
    </div>
  );
}

export default App;