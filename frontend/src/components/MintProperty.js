import React, { useState } from 'react';
import axios from 'axios';

const MintProperty = ({ onSuccess }) => {
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

  const handleMint = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
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
      const response = await axios.post('http://localhost:3000/api/property/mint', formData);
      setResult({ success: true, data: response.data });
      
      // Clear form
      setAssetId(''); setOwnerHash(''); setFullAddress(''); setSurfaceArea(''); 
      setObjectiveValue(''); setLandUsage(''); setConstructionYear(''); setFile(null);
      
      // Trigger dashboard reload in parent
      if (onSuccess) onSuccess(); 
    } catch (error) {
      setResult({ success: false, message: error.response?.data?.error || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Register Property (Staff Only)</h2>
      <form onSubmit={handleMint} className="form-group">
        <input type="text" placeholder="Asset ID (e.g., KAEK-100)" value={assetId} onChange={(e) => setAssetId(e.target.value)} required />
        <input type="text" placeholder="Owner Hash" value={ownerHash} onChange={(e) => setOwnerHash(e.target.value)} required />
        <input type="text" placeholder="Full Address" value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} required />
        <div className="row">
          <input type="number" placeholder="Surface Area (sq.m)" value={surfaceArea} onChange={(e) => setSurfaceArea(e.target.value)} required step="0.01" />
          <input type="number" placeholder="Objective Value (€)" value={objectiveValue} onChange={(e) => setObjectiveValue(e.target.value)} step="0.01" />
        </div>
        <div className="row">
          <input type="text" placeholder="Land Usage" value={landUsage} onChange={(e) => setLandUsage(e.target.value)} />
          <input type="number" placeholder="Construction Year" value={constructionYear} onChange={(e) => setConstructionYear(e.target.value)} />
        </div>
        <div className="file-input">
          <label>Upload Title Deed (PDF):</label>
          <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files[0])} required />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Processing...' : 'Register'}
        </button>
      </form>
      {result && (
        <div className={`result-box ${result.success ? 'success' : 'error'}`}>
          {result.success ? <p>Success. IPFS: <strong>{result.data.ipfsHash.substring(0, 15)}...</strong></p> : <p>Error: {result.message}</p>}
        </div>
      )}
    </section>
  );
};

export default MintProperty;