import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Button, Alert, Chip, Divider } from '@mui/material';

const ConsentManager = () => {
    const [transfers, setTransfers] = useState([]);
    const [message, setMessage] = useState(null);
    const token = sessionStorage.getItem('token');
    const userRole = sessionStorage.getItem('role');
    const userHash = sessionStorage.getItem('userHash'); // Assuming you store the user's hash on login

    const fetchPendingConsents = useCallback(async () => {
        try {
            // Fetch transfers where this user is involved
            const res = await axios.get(`http://localhost:3000/api/property/transfers/list?userHash=${userHash}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'user-role': userRole }
            });
            setTransfers(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [token, userRole, userHash]);

    useEffect(() => {
        fetchPendingConsents();
    }, [fetchPendingConsents]);

    const handleApprove = async (requestId) => {
        setMessage(null);
        try {
            await axios.post('http://localhost:3000/api/property/transfer/approve', 
                { requestId, userHash }, 
                { headers: { 'Authorization': `Bearer ${token}`, 'user-role': userRole } }
            );
            setMessage({ type: 'success', text: 'You have successfully approved the transfer.' });
            fetchPendingConsents();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to approve transfer.' });
        }
    };

    if (userRole !== 'citizen') return null;

    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto', mt: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>My Pending Transfers (Dual Consent)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review and approve transfers involving your properties.
            </Typography>

            {message && <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>}

            {transfers.length === 0 ? (
                <Alert severity="info">You have no pending transfers requiring your signature.</Alert>
            ) : (
                transfers.map(t => {
                    const isCurrentOwner = t.currentOwnerHash === userHash;
                    const myApprovalStatus = isCurrentOwner ? t.currentOwnerApproved : t.newOwnerApproved;
                    
                    return (
                        <Card key={t.id} sx={{ mb: 2, borderLeft: '4px solid #1976d2' }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold">Asset ID: {t.assetId}</Typography>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="body2">Role: {isCurrentOwner ? 'Seller / Current Owner' : 'Buyer / New Owner'}</Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Status: {t.status === 'READY' ? <Chip label="Waiting for Notary" color="success" size="small" /> : <Chip label="Pending Consents" color="warning" size="small" />}
                                </Typography>
                                
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    disabled={myApprovalStatus}
                                    onClick={() => handleApprove(t.id)}
                                >
                                    {myApprovalStatus ? 'Signed (Approved)' : 'I Consent & Sign'}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </Box>
    );
};

export default ConsentManager;