import React, { useState } from 'react';
import axios from 'axios';

const SearchProperty = () => {
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const userRole = sessionStorage.getItem('role') || 'citizen';
  const userHash = sessionStorage.getItem('userHash') || '';

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchResult(null);
    setHistoryData(null);

    try {
      const res = await axios.get(`http://localhost:3000/api/property/${searchId}`);
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      
      // Security Check: Citizens cannot view details of properties they do not own
      if (userRole === 'citizen' && data.ownerHash !== userHash) {
          setSearchResult({ success: false, message: 'Access Denied: You do not own this property.' });
          setSearchLoading(false);
          return;
      }

      setSearchResult({ success: true, data: data });

      const histRes = await axios.get(`http://localhost:3000/api/property/history/${searchId}`, {
          headers: { 'user-role': userRole }
      });
      const hData = typeof histRes.data === 'string' ? JSON.parse(histRes.data) : histRes.data;
      setHistoryData(hData);
    } catch (error) {
      setSearchResult({ success: false, message: error.response?.data?.error || 'Property not found' });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Search Property by KAEK</h2>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Enter the unique Asset ID to verify the current status and view the audit trail.</p>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <input style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} type="text" placeholder="Enter Asset ID (KAEK)" value={searchId} onChange={(e) => setSearchId(e.target.value)} required />
        <button type="submit" className="btn-primary" disabled={searchLoading}>
          {searchLoading ? 'Searching...' : 'Search Ledger'}
        </button>
      </form>

      {searchResult && (
        <div style={{ padding: '20px', borderLeft: searchResult.success ? '4px solid #2ecc71' : '4px solid #e74c3c', backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
          {searchResult.success ? (
            <div>
              <p><strong>Asset ID:</strong> {searchResult.data.assetId}</p>
              <p><strong>Current Owner:</strong> {searchResult.data.ownerHash}</p>
              <p><strong>Status:</strong> <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{searchResult.data.status || 'Active'}</span></p>
              <a href={`https://gateway.pinata.cloud/ipfs/${searchResult.data.documentRootHash}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '10px', color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>
                📄 View Title Deed
              </a>
            </div>
          ) : <p style={{ color: '#e74c3c', margin: 0 }}>{searchResult.message}</p>}
        </div>
      )}

      {historyData && historyData.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Blockchain Audit Trail</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            {historyData.map((historyItem, index) => {
              const rawTs = historyItem.timestamp || historyItem.Timestamp;
              const date = rawTs && rawTs.seconds ? new Date(rawTs.seconds * 1000).toLocaleString() : 'Unknown Date';
              const assetData = historyItem.record || historyItem.Record || historyItem.value || {};
              const txId = historyItem.txId || historyItem.TxId || 'UnknownTx';
              const finalOwner = assetData.ownerHash || assetData.OwnerHash || 'Unknown Owner';
              const finalDoc = assetData.documentRootHash || assetData.DocumentRootHash;

              return (
                <div key={index} style={{ padding: '15px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '4px', position: 'relative', borderLeft: '4px solid #3498db' }}>
                  <span style={{ fontSize: '0.8rem', color: '#7f8c8d', display: 'block', marginBottom: '5px' }}>{date}</span>
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>TxID: <strong>{txId.substring(0, 20)}...</strong></p>
                  <p style={{ margin: '0 0 5px 0' }}>Owner: {finalOwner}</p>
                  {finalDoc && (
                     <a href={`https://gateway.pinata.cloud/ipfs/${finalDoc}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: '#e67e22', textDecoration: 'none' }}>View Document at this state</a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchProperty;