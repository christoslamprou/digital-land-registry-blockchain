import React, { useState } from 'react';
import axios from 'axios';

const TransferProperty = () => {
  const [transAssetId, setTransAssetId] = useState('');
  const [currentOwner, setCurrentOwner] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [transFile, setTransFile] = useState(null);
  const [transLoading, setTransLoading] = useState(false);
  const [transResult, setTransResult] = useState(null);

  // Retrieve role and token from sessionStorage
  const userRole = sessionStorage.getItem('role') || 'citizen';
  const token = sessionStorage.getItem('token');

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransLoading(true);
    setTransResult(null);

    // 1. SECURITY CHECK: Check if token exists in session!
    if (!token) {
        setTransResult({ success: false, message: 'System Error: No valid session token found. Please hit Logout on the bottom left and Login again.' });
        setTransLoading(false);
        return;
    }
    
    const formData = new FormData();
    formData.append('assetId', transAssetId);
    formData.append('currentOwnerHash', currentOwner);
    formData.append('newOwnerHash', newOwner);
    formData.append('document', transFile);

    try {
      const axiosConfig = {
          headers: {
              'user-role': 'Notary', 
              'Authorization': `Bearer ${token}` 
          }
      };

      const response = await axios.post('http://localhost:3000/api/property/transfer', formData, axiosConfig);
      setTransResult({ success: true, data: response.data });
      
      // Clear form on success
      setTransAssetId(''); setCurrentOwner(''); setNewOwner(''); setTransFile(null);
    } catch (error) {
      setTransResult({ success: false, message: error.response?.data?.error || 'Transfer failed due to backend permissions' });
    } finally {
      setTransLoading(false);
    }
  };

  // Stricter RBAC condition: Only notary allowed
  if (userRole !== 'notary') {
    return <div className="card"><h2 style={{ color: '#e74c3c' }}>Access Denied</h2><p>Only authorized notaries can access this transfer system.</p></div>;
  }

  return (
    <div className="card">
      <h2>Transfer Ownership (Notary Panel)</h2>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Transfer a property to a new owner and upload the new legal contract.</p>
      
      <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input style={{ padding: '10px' }} type="text" placeholder="Asset ID (KAEK)" value={transAssetId} onChange={(e) => setTransAssetId(e.target.value)} required />
        <div style={{ display: 'flex', gap: '15px' }}>
            <input style={{ flex: 1, padding: '10px' }} type="text" placeholder="Current Owner Hash" value={currentOwner} onChange={(e) => setCurrentOwner(e.target.value)} required />
            <input style={{ flex: 1, padding: '10px' }} type="text" placeholder="New Owner Hash" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} required />
        </div>
        <div style={{ padding: '10px', border: '1px dashed #bdc3c7', borderRadius: '4px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Upload New Contract (PDF):</label>
          <input type="file" accept=".pdf,.txt" onChange={(e) => setTransFile(e.target.files[0])} required />
        </div>
        <button type="submit" className="btn-primary" disabled={transLoading} style={{ alignSelf: 'flex-start' }}>
          {transLoading ? 'Processing on Blockchain...' : 'Execute Transfer'}
        </button>
      </form>
      {transResult && (
        <div style={{ marginTop: '20px', padding: '15px', borderRadius: '4px', backgroundColor: transResult.success ? '#d4edda' : '#f8d7da', color: transResult.success ? '#155724' : '#721c24' }}>
          {transResult.success ? <p style={{ margin: 0 }}>Success! New IPFS Hash: <strong>{transResult.data.newIpfsHash}</strong></p> : <p style={{ margin: 0 }}>Error: {transResult.message}</p>}
        </div>
      )}
    </div>
  );
};

export default TransferProperty;