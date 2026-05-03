import React, { useState } from 'react';
import axios from 'axios';

const SearchProperty = () => {
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchResult(null);
    setHistoryData(null);

    try {
      const res = await axios.get(`http://localhost:3000/api/property/${searchId}`);
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      setSearchResult({ success: true, data: data });

      const histRes = await axios.get(`http://localhost:3000/api/property/history/${searchId}`);
      const hData = typeof histRes.data === 'string' ? JSON.parse(histRes.data) : histRes.data;
      setHistoryData(hData);
    } catch (error) {
      setSearchResult({ success: false, message: error.response?.data?.error || 'Property not found' });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Search Property</h2>
      <form onSubmit={handleSearch} className="form-group row">
        <input type="text" placeholder="Enter Asset ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} required />
        <button type="submit" className="btn-primary" disabled={searchLoading}>
          {searchLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchResult && (
        <div className={`result-box ${searchResult.success ? 'info' : 'error'}`}>
          {searchResult.success ? (
            <div className="details">
              <p><strong>Asset ID:</strong> {searchResult.data.assetId}</p>
              <p><strong>Owner:</strong> {searchResult.data.ownerHash}</p>
              <p><strong>Status:</strong> <span className="status-tag">{searchResult.data.status || 'Active'}</span></p>
              <a href={`https://gateway.pinata.cloud/ipfs/${searchResult.data.documentRootHash}`} target="_blank" rel="noreferrer" className="ipfs-link">View Document</a>
            </div>
          ) : <p>Error: {searchResult.message}</p>}
        </div>
      )}

      {/* Audit Trail Timeline */}
      {historyData && historyData.length > 0 && (
        <div className="history-section">
          <h3>Audit Trail</h3>
          <div className="timeline">
            {historyData.map((historyItem, index) => {
              const rawTs = historyItem.timestamp || historyItem.Timestamp;
              const date = rawTs && rawTs.seconds 
                  ? new Date(rawTs.seconds * 1000).toLocaleString() 
                  : 'Unknown Date';

              const assetData = historyItem.record || historyItem.Record || historyItem.value || {};
              const txId = historyItem.txId || historyItem.TxId || 'UnknownTx';
              const finalOwner = assetData.ownerHash || assetData.OwnerHash || 'Unknown Owner';
              const finalDoc = assetData.documentRootHash || assetData.DocumentRootHash;

              return (
                <div key={index} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timestamp">{date}</span>
                    <p className="tx-id">TxID: {txId.substring(0, 12)}...</p>
                    <p><strong>Owner:</strong> {finalOwner}</p>
                    {finalDoc && (
                       <a href={`https://gateway.pinata.cloud/ipfs/${finalDoc}`} target="_blank" rel="noreferrer" className="hist-link">View Document</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default SearchProperty;