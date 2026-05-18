import React, { useState } from 'react';
import axios from 'axios';

const MintProperty = () => {
  const [assetId, setAssetId] = useState('');
  const [ownerHash, setOwnerHash] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [surfaceArea, setSurfaceArea] = useState('');
  const [objectiveValue, setObjectiveValue] = useState('');
  const [landUsage, setLandUsage] = useState('');
  const [constructionYear, setConstructionYear] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Retrieve role and token from sessionStorage
  const userRole = sessionStorage.getItem('role') || 'citizen';
  const token = sessionStorage.getItem('token'); 

  const handleMint = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // 1. SECURITY CHECK: Check if token exists in session!
    if (!token) {
        setResult({ success: false, message: 'System Error: No valid session token found. Please hit Logout on the bottom left and Login again.' });
        setLoading(false);
        return;
    }
    
    const formData = new FormData();
    formData.append('assetId', assetId);
    formData.append('ownerHash', ownerHash);
    formData.append('fullAddress', fullAddress);
    formData.append('surfaceArea', surfaceArea);
    if (objectiveValue) formData.append('objectiveValue', objectiveValue);
    if (landUsage) formData.append('landUsage', landUsage);
    if (constructionYear) formData.append('constructionYear', constructionYear);
    formData.append('document', file);

    try {
      const axiosConfig = {
          headers: {
              'user-role': 'Staff', 
              'Authorization': `Bearer ${token}` 
          }
      };

      const response = await axios.post('http://localhost:3000/api/property/mint', formData, axiosConfig);
      setResult({ success: true, data: response.data });
      
      setAssetId(''); setOwnerHash(''); setFullAddress(''); setSurfaceArea('');
      setObjectiveValue(''); setLandUsage(''); setConstructionYear(''); setFile(null);
    } catch (error) {
      setResult({ success: false, message: error.response?.data?.error || 'Registration failed due to backend permissions' });
    } finally {
      setLoading(false);
    }
  };

  // Stricter RBAC condition: Only staff allowed
  if (userRole !== 'staff') {
    return <div className="card"><h2 style={{ color: '#e74c3c' }}>Access Denied</h2><p>Only Land Registry Staff can access this registration panel.</p></div>;
  }

  return (
    <div className="card">
      <h2>Register New Property (Staff Only)</h2>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Fill in the details to register a new property in the Blockchain and Database.</p>
      
      <form onSubmit={handleMint} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
            <input style={{ flex: 1, padding: '10px' }} type="text" placeholder="Asset ID (KAEK)" value={assetId} onChange={(e) => setAssetId(e.target.value)} required />
            <input style={{ flex: 1, padding: '10px' }} type="text" placeholder="Owner Hash (AFM)" value={ownerHash} onChange={(e) => setOwnerHash(e.target.value)} required />
        </div>
        <input style={{ padding: '10px' }} type="text" placeholder="Full Address" value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} required />
        <div style={{ display: 'flex', gap: '15px' }}>
          <input style={{ flex: 1, padding: '10px' }} type="number" placeholder="Surface Area (sq.m)" value={surfaceArea} onChange={(e) => setSurfaceArea(e.target.value)} required step="0.01" />
          <input style={{ flex: 1, padding: '10px' }} type="number" placeholder="Objective Value (€)" value={objectiveValue} onChange={(e) => setObjectiveValue(e.target.value)} step="0.01" />
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <input style={{ flex: 1, padding: '10px' }} type="text" placeholder="Land Usage" value={landUsage} onChange={(e) => setLandUsage(e.target.value)} />
          <input style={{ flex: 1, padding: '10px' }} type="number" placeholder="Construction Year" value={constructionYear} onChange={(e) => setConstructionYear(e.target.value)} />
        </div>
        <div style={{ padding: '10px', border: '1px dashed #bdc3c7', borderRadius: '4px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Upload Title Deed (PDF):</label>
          <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files[0])} required />
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
          {loading ? 'Processing Transaction...' : 'Register Property'}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: '20px', padding: '15px', borderRadius: '4px', backgroundColor: result.success ? '#d4edda' : '#f8d7da', color: result.success ? '#155724' : '#721c24' }}>
          {result.success ? <p style={{ margin: 0 }}>Success! IPFS Hash: <strong>{result.data.ipfsHash}</strong></p> : <p style={{ margin: 0 }}>Error: {result.message}</p>}
        </div>
      )}
    </div>
  );
};

export default MintProperty;