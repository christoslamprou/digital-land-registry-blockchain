import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RequestManager = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [comments, setComments] = useState({}); // Store comments for each request by ID

    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');

    // Fetch the appropriate requests based on the user's role
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/requests/list', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'user-role': role
                }
            });
            setRequests(res.data);
        } catch (error) {
            console.error("Error fetching requests:", error);
            alert("Failed to load requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === 'engineer' || role === 'staff') {
            fetchRequests();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, token]);

    // Handle comment change for a specific request
    const handleCommentChange = (id, text) => {
        setComments(prev => ({ ...prev, [id]: text }));
    };

    // Submit review (Approve or Reject)
    const handleReview = async (requestId, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;

        setProcessingId(requestId);
        const endpoint = role === 'engineer' ? '/engineer-review' : '/staff-review';
        const comment = comments[requestId] || '';

        try {
            const res = await axios.post(`http://localhost:3000/api/requests${endpoint}`, 
                { requestId, status, comments: comment },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            alert(`${res.data.message}`);
            // Remove the processed request from the list
            setRequests(requests.filter(req => req.id !== requestId));
        } catch (error) {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    if (role !== 'engineer' && role !== 'staff') {
        return <div className="card"><h3>Access Denied</h3><p>You do not have permission to view this page.</p></div>;
    }

    return (
        <div className="card">
            <h2>{role === 'engineer' ? 'Engineer Workspace - Pending Reviews' : 'Staff Workspace - Final Approvals'}</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
                {role === 'engineer' 
                    ? 'Review technical details and documents submitted by citizens.' 
                    : 'Finalize approved technical requests and commit them to the Blockchain.'}
            </p>

            {loading ? (
                <p>Loading requests...</p>
            ) : requests.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#95a5a6' }}>No pending requests found at the moment.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {requests.map((req) => (
                        <div key={req.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                <h3><span style={{ color: req.requestType === 'MINT' ? '#27ae60' : '#2980b9' }}>[{req.requestType}]</span> Asset ID: {req.assetId}</h3>
                                <span style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Request ID: #{req.id}</span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.95rem' }}>
                                <p><strong>Owner Hash:</strong> {req.ownerHash}</p>
                                <p><strong>Address:</strong> {req.fullAddress}</p>
                                <p><strong>Surface Area:</strong> {req.surfaceArea} sqm</p>
                                <p><strong>Usage:</strong> {req.landUsage || 'N/A'}</p>
                                <p><strong>Objective Value:</strong> {req.objectiveValue ? `€${req.objectiveValue}` : 'N/A'}</p>
                                <p><strong>Constructed:</strong> {req.constructionYear || 'N/A'}</p>
                            </div>

                            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                                <a 
                                    href={`https://gateway.pinata.cloud/ipfs/${req.documentHash}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ padding: '8px 15px', backgroundColor: '#8e44ad', color: 'white', textDecoration: 'none', borderRadius: '4px', display: 'inline-block' }}
                                >
                                    📄 View Uploaded Document
                                </a>
                            </div>

                            <div style={{ marginTop: '10px' }}>
                                <textarea 
                                    placeholder="Add review comments (optional)..." 
                                    value={comments[req.id] || ''}
                                    onChange={(e) => handleCommentChange(req.id, e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px', marginBottom: '10px' }}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        onClick={() => handleReview(req.id, 'APPROVED')} 
                                        disabled={processingId === req.id}
                                        style={{ flex: 1, padding: '10px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {processingId === req.id ? 'Processing...' : 'Approve'}
                                    </button>
                                    <button 
                                        onClick={() => handleReview(req.id, 'REJECTED')} 
                                        disabled={processingId === req.id}
                                        style={{ flex: 1, padding: '10px', backgroundColor: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {processingId === req.id ? 'Processing...' : 'Reject'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RequestManager;