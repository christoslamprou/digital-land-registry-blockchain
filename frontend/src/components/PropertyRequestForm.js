import React, { useState } from 'react';
import axios from 'axios';

const PropertyRequestForm = () => {
    const [requestType, setRequestType] = useState('MINT'); // 'MINT' or 'UPDATE'
    const [assetId, setAssetId] = useState('');
    const [fullAddress, setFullAddress] = useState('');
    const [surfaceArea, setSurfaceArea] = useState('');
    const [objectiveValue, setObjectiveValue] = useState('');
    const [landUsage, setLandUsage] = useState('');
    const [constructionYear, setConstructionYear] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const token = sessionStorage.getItem('token');
    const ownerHash = sessionStorage.getItem('userHash'); // Get logged-in citizen's hash

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('requestType', requestType);
        formData.append('assetId', assetId);
        formData.append('ownerHash', ownerHash);
        formData.append('fullAddress', fullAddress);
        formData.append('surfaceArea', surfaceArea);
        if (objectiveValue) formData.append('objectiveValue', objectiveValue);
        if (landUsage) formData.append('landUsage', landUsage);
        if (constructionYear) formData.append('constructionYear', constructionYear);
        if (file) formData.append('document', file);

        try {
            const res = await axios.post('http://localhost:3000/api/requests/submit', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            setMessage(`Success: ${res.data.message}`);
            // Clear form
            setAssetId(''); setFullAddress(''); setSurfaceArea(''); setFile(null);
        } catch (error) {
            setMessage(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>Submit Property Request</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
                Submit a new property registration or modify an existing one. Your request will be reviewed by an Engineer.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <select 
                    value={requestType} 
                    onChange={(e) => setRequestType(e.target.value)} 
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="MINT">New Property Registration (MINT)</option>
                    <option value="UPDATE">Update Existing Property (UPDATE)</option>
                </select>

                <input type="text" placeholder="Asset ID (KAEK)" value={assetId} onChange={(e) => setAssetId(e.target.value)} required style={{ padding: '10px' }} />
                <input type="text" placeholder="Full Address" value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} required style={{ padding: '10px' }} />
                <input type="number" placeholder="Surface Area (sqm)" value={surfaceArea} onChange={(e) => setSurfaceArea(e.target.value)} required style={{ padding: '10px' }} />
                <input type="number" placeholder="Objective Value (€)" value={objectiveValue} onChange={(e) => setObjectiveValue(e.target.value)} style={{ padding: '10px' }} />
                <input type="text" placeholder="Land Usage (e.g., Residential)" value={landUsage} onChange={(e) => setLandUsage(e.target.value)} style={{ padding: '10px' }} />
                <input type="number" placeholder="Construction Year" value={constructionYear} onChange={(e) => setConstructionYear(e.target.value)} style={{ padding: '10px' }} />
                
                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Upload Topographic/Deed (PDF):</label>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Submitting Request...' : 'Submit Request'}
                </button>
            </form>

            {message && (
                <div style={{ marginTop: '20px', padding: '15px', borderRadius: '4px', backgroundColor: message.includes('') ? '#f8d7da' : '#d4edda', color: message.includes('') ? '#721c24' : '#155724' }}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default PropertyRequestForm;