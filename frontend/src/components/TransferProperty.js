import React, { useState } from 'react';
import axios from 'axios';

const TransferProperty = ({ onSuccess }) => {
  const [transAssetId, setTransAssetId] = useState('');
  const [currentOwner, setCurrentOwner] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [transFile, setTransFile] = useState(null);
  const [transLoading, setTransLoading] = useState(false);
  const [transResult, setTransResult] = useState(null);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransLoading(true);
    setTransResult(null);
    
    const formData = new FormData();
    formData.append('assetId', transAssetId);
    formData.append('currentOwnerHash', currentOwner);
    formData.append('newOwnerHash', newOwner);
    formData.append('document', transFile);

    try {
      const response = await axios.post('http://localhost:3000/api/property/transfer', formData);
      setTransResult({ success: true, data: response.data });
      
      // Clear form
      setTransAssetId(''); setCurrentOwner(''); setNewOwner(''); setTransFile(null);
      
      // Trigger dashboard reload in parent
      if (onSuccess) onSuccess();
    } catch (error) {
      setTransResult({ success: false, message: error.response?.data?.error || 'Transfer failed' });
    } finally {
      setTransLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Transfer Ownership (Notary Only)</h2>
      <form onSubmit={handleTransfer} className="form-group">
        <input type="text" placeholder="Asset ID" value={transAssetId} onChange={(e) => setTransAssetId(e.target.value)} required />
        <input type="text" placeholder="Current Owner Hash" value={currentOwner} onChange={(e) => setCurrentOwner(e.target.value)} required />
        <input type="text" placeholder="New Owner Hash" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} required />
        <div className="file-input">
          <label>Upload New Contract (PDF):</label>
          <input type="file" accept=".pdf,.txt" onChange={(e) => setTransFile(e.target.files[0])} required />
        </div>
        <button type="submit" className="btn-secondary" disabled={transLoading}>
          {transLoading ? 'Processing...' : 'Transfer'}
        </button>
      </form>
      {transResult && (
        <div className={`result-box ${transResult.success ? 'success' : 'error'}`}>
          {transResult.success ? <p>Success. New Hash: <strong>{transResult.data.newIpfsHash.substring(0, 15)}...</strong></p> : <p>Error: {transResult.message}</p>}
        </div>
      )}
    </section>
  );
};

export default TransferProperty;