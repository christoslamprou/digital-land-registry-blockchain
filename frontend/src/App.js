import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Minting State
  const [assetId, setAssetId] = useState('');
  const [ownerHash, setOwnerHash] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Query State
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Handle Registration (Mint)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('assetId', assetId);
    formData.append('ownerHash', ownerHash);
    formData.append('document', file);

    try {
      const response = await axios.post('http://localhost:3000/api/property/mint', formData);
      setResult({ success: true, data: response.data });
    } catch (error) {
      setResult({ success: false, message: error.response?.data?.error || 'Error connecting to server' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Search (Query)
  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchResult(null);

    try {
      const response = await axios.get(`http://localhost:3000/api/property/${searchId}`);
      // The backend returns a stringified JSON, so we parse it if it's a string
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      setSearchResult({ success: true, data: data });
    } catch (error) {
      setSearchResult({ success: false, message: error.response?.data?.error || 'Property not found' });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Digital Land Registry</h1>
        <p>Blockchain & IPFS Document Verification System</p>
      </header>

      <main className="container">
        {/* SECTION 1: REGISTRATION */}
        <section className="card">
          <h2>Register New Property</h2>
          <form onSubmit={handleSubmit} className="form-group">
            <input 
              type="text" placeholder="Asset ID (e.g. KAEK-123)" 
              value={assetId} onChange={(e) => setAssetId(e.target.value)} required 
            />
            <input 
              type="text" placeholder="Owner Hash" 
              value={ownerHash} onChange={(e) => setOwnerHash(e.target.value)} required 
            />
            <div className="file-input">
              <label>Upload Title Deed (PDF/TXT):</label>
              <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files[0])} required />
            </div>
            <button type="submit" className="btn-mint" disabled={loading}>
              {loading ? 'Processing Transaction...' : 'Register on Blockchain'}
            </button>
          </form>

          {result && (
            <div className={`result-box ${result.success ? 'success' : 'error'}`}>
              {result.success ? (
                <>
                  <p>✅ <strong>Success!</strong> Property anchored to Block.</p>
                  <p><strong>IPFS Hash:</strong> {result.data.ipfsHash}</p>
                </>
              ) : <p>❌ {result.message}</p>}
            </div>
          )}
        </section>

        <hr className="divider" />

        {/* SECTION 2: SEARCH */}
        <section className="card">
          <h2>Search Property Registry</h2>
          <form onSubmit={handleSearch} className="form-group row">
            <input 
              type="text" placeholder="Enter Asset ID to verify..." 
              value={searchId} onChange={(e) => setSearchId(e.target.value)} required 
            />
            <button type="submit" className="btn-search" disabled={searchLoading}>
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResult && (
            <div className={`result-box ${searchResult.success ? 'info' : 'error'}`}>
              {searchResult.success ? (
                <div className="details">
                  <p><strong>Asset ID:</strong> {searchResult.data.assetId}</p>
                  <p><strong>Owner Hash:</strong> {searchResult.data.ownerHash}</p>
                  <p><strong>Status:</strong> <span className="status-tag">{searchResult.data.status}</span></p>
                  <p><strong>Verified Document:</strong></p>
                  <a 
                    href={`https://gateway.pinata.cloud/ipfs/${searchResult.data.documentRootHash}`} 
                    target="_blank" rel="noreferrer" className="ipfs-link"
                  >
                    View Original Deed on IPFS 🔗
                  </a>
                </div>
              ) : <p>❌ {searchResult.message}</p>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;