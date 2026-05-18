import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OwnerSearch = () => {
    const userRole = sessionStorage.getItem('role') || 'citizen';
    const citizenHash = sessionStorage.getItem('userHash') || '';
    const token = sessionStorage.getItem('token'); // <-- 1. Get the Token!

    // If citizen, pre-lock the search hash input to their own identity string
    const [ownerHash, setOwnerHash] = useState(userRole === 'citizen' ? citizenHash : '');
    const [properties, setProperties] = useState([]);
    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState('');

    // Auto load properties if citizen enters the tab
    useEffect(() => {
        const triggerAutoSearch = async () => {
            if (!token) return; // Prevent search if not logged in
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:3000/api/property/owner/${citizenHash}`, {
                    headers: { 
                        'user-role': userRole,
                        'Authorization': `Bearer ${token}`
                    }
                });
                setProperties(res.data);
            } catch (error) {
                console.error("Auto-search error:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userRole === 'citizen' && citizenHash) {
            triggerAutoSearch();
        }
    }, [userRole, citizenHash, token]);

    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!token) {
            alert("Session expired. Please login again.");
            return;
        }

        setLoading(true);
        setProperties([]);
        setHistoryData(null);

        try {
            const res = await axios.get(`http://localhost:3000/api/property/owner/${ownerHash}`, {
                headers: { 
                    'user-role': userRole,
                    'Authorization': `Bearer ${token}` 
                }
            });
            setProperties(res.data);
        } catch (error) {
            alert(error.response?.data?.error || "Error searching for properties. Check backend logs.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditTrail = async (assetId) => {
        if (!token) return;
        
        setSelectedProperty(assetId);
        try {
            const res = await axios.get(`http://localhost:3000/api/property/history/${assetId}`, {
                headers: { 
                    'user-role': userRole,
                    'Authorization': `Bearer ${token}` // <-- 4. Send Digital ID
                }
            });
            const hData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            setHistoryData(hData);
        } catch (error) {
            alert("Error fetching blockchain history");
        }
    };

    return (
        <div className="card">
            <h2>{userRole === 'citizen' ? 'My Asset Portfolio' : 'Ownership Lookup'}</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
                {userRole === 'citizen' ? 'Verifiable assets connected to your identity hash.' : 'Find all properties assigned to a specific Owner Hash and view their history.'}
            </p>
            
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                <input 
                    style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
                    type="text" 
                    placeholder="Enter Owner Hash" 
                    value={ownerHash} 
                    onChange={(e) => setOwnerHash(e.target.value)} 
                    required 
                    disabled={userRole === 'citizen'} 
                />
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Loading...' : (userRole === 'citizen' ? 'Refresh Portfolio' : 'Search Owner')}
                </button>
            </form>

            {properties.length > 0 && (
                <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                    <h3 style={{ marginBottom: '15px' }}>Properties</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Asset ID (KAEK)</th>
                                <th>Address</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {properties.map((prop) => (
                                <tr key={prop.kaek}>
                                    <td><strong>{prop.kaek}</strong></td>
                                    <td>{prop.fullAddress}</td>
                                    <td>
                                        <button 
                                            style={{ padding: '6px 12px', background: '#34495e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            onClick={() => fetchAuditTrail(prop.kaek)}
                                        >
                                            View Audit Trail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {historyData && (
                <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <h3>Audit Trail for Asset: <span style={{ color: '#3498db' }}>{selectedProperty}</span></h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                        {historyData.map((item, index) => {
                            const rawTs = item.timestamp || item.Timestamp;
                            const date = rawTs && rawTs.seconds ? new Date(rawTs.seconds * 1000).toLocaleString() : 'Unknown Date';
                            const assetData = item.record || item.value || {};
                            const txId = item.txId || item.TxId || 'UnknownTx';
                            const finalOwner = assetData.ownerHash || 'Unknown Owner';
                            const finalDoc = assetData.documentRootHash;

                            return (
                                <div key={index} style={{ padding: '15px', backgroundColor: '#fff', borderLeft: '4px solid #e67e22', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#95a5a6', display: 'block', marginBottom: '5px' }}>{date}</span>
                                    <p style={{ margin: '0 0 5px 0' }}>TxID: <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>{txId}</span></p>
                                    <p style={{ margin: '0 0 5px 0' }}>Owner: <strong>{finalOwner}</strong></p>
                                    {finalDoc && (
                                        <a href={`https://gateway.pinata.cloud/ipfs/${finalDoc}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: '#2ecc71', textDecoration: 'none', fontWeight: 'bold' }}>
                                            View IPFS Document
                                        </a>
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

export default OwnerSearch;