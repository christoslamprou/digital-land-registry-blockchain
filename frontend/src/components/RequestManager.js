import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    Box, Card, CardContent, Typography, TextField, Button, 
    Grid, Alert, CircularProgress, Chip, Divider,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';

// --- MUI Icons ---
import FactCheckIcon from '@mui/icons-material/FactCheck';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

const RequestManager = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [comments, setComments] = useState({});
    const [notification, setNotification] = useState(null);

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionData, setActionData] = useState({ id: null, status: '' });

    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');

    
    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setNotification(null);
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
            setNotification({ type: 'error', text: 'Failed to load requests from the server.' });
        } finally {
            setLoading(false);
        }
    }, [token, role]); 

    useEffect(() => {
        if (role === 'engineer' || role === 'staff') {
            fetchRequests();
        }
    }, [role, fetchRequests]); 

    const handleCommentChange = (id, text) => {
        setComments(prev => ({ ...prev, [id]: text }));
    };

    const initiateReview = (id, status) => {
        setActionData({ id, status });
        setDialogOpen(true);
    };

    const confirmReview = async () => {
        setDialogOpen(false);
        const { id: requestId, status } = actionData;
        
        setProcessingId(requestId);
        setNotification(null);
        
        const endpoint = role === 'engineer' ? '/engineer-review' : '/staff-review';
        const comment = comments[requestId] || '';

        try {
            const res = await axios.post(`http://localhost:3000/api/requests${endpoint}`, 
                { requestId, status, comments: comment },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            setNotification({ type: 'success', text: res.data.message });
            setRequests(requests.filter(req => req.id !== requestId));
        } catch (error) {
            setNotification({ type: 'error', text: error.response?.data?.error || 'Failed to process request.' });
        } finally {
            setProcessingId(null);
            setActionData({ id: null, status: '' });
        }
    };

    if (role !== 'engineer' && role !== 'staff') {
        return (
            <Box sx={{ maxWidth: 800, margin: '0 auto', mt: 4 }}>
                <Alert severity="error" variant="filled" icon={<LockIcon fontSize="inherit" />} sx={{ borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Access Denied</Typography>
                    <Typography variant="body2">You do not have the required permissions to view the request management workspace.</Typography>
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
            
            {/* Header Section */}
            <Card elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'secondary.main' }}>
                        {role === 'engineer' ? <FactCheckIcon color="primary" /> : <AssignmentIndIcon color="primary" />}
                        {role === 'engineer' ? 'Engineer Workspace - Pending Reviews' : 'Staff Workspace - Final Approvals'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {role === 'engineer' 
                            ? 'Review technical details, cross-check surface areas, and validate documents submitted by citizens.' 
                            : 'Finalize approved technical requests and commit the official changes to the Blockchain.'}
                    </Typography>
                </CardContent>
            </Card>

            {/* Global Notification */}
            {notification && (
                <Alert severity={notification.type} sx={{ mb: 4, borderRadius: 2 }}>
                    {notification.text}
                </Alert>
            )}

            {/* Requests List */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : requests.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 2, border: '1px dashed #ccc' }}>
                    <Typography variant="body1" color="text.secondary">No pending requests found in your queue at this time.</Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {requests.map((req) => (
                        <Card key={req.id} elevation={2} sx={{ borderRadius: 2, borderTop: req.requestType === 'MINT' ? '4px solid #2e7d32' : '4px solid #1976d2' }}>
                            <CardContent sx={{ p: 3 }}>
                                
                                {/* Request Header */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Chip 
                                            label={req.requestType} 
                                            color={req.requestType === 'MINT' ? 'success' : 'primary'} 
                                            size="small" 
                                            sx={{ fontWeight: 'bold' }} 
                                        />
                                        <Typography variant="h6" fontWeight="bold" color="secondary.main">
                                            Asset ID: {req.assetId}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ bgcolor: '#f0f0f0', px: 1, py: 0.5, borderRadius: 1 }}>
                                        Request #{req.id}
                                    </Typography>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                {/* Request Details Grid */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary">Owner Hash</Typography>
                                        <Typography variant="body2" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>{req.ownerHash}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary">Address</Typography>
                                        <Typography variant="body2">{req.fullAddress}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary">Surface Area</Typography>
                                        <Typography variant="body2">{req.surfaceArea} sqm</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary">Usage</Typography>
                                        <Typography variant="body2">{req.landUsage || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary">Objective Value</Typography>
                                        <Typography variant="body2">{req.objectiveValue ? `€${req.objectiveValue}` : 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary">Constructed</Typography>
                                        <Typography variant="body2">{req.constructionYear || 'N/A'}</Typography>
                                    </Grid>
                                </Grid>

                                {/* Document Link */}
                                <Box sx={{ mb: 3 }}>
                                    <Button 
                                        variant="outlined" 
                                        color="secondary" 
                                        component="a" 
                                        href={`https://gateway.pinata.cloud/ipfs/${req.documentHash}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        startIcon={<DescriptionIcon />}
                                    >
                                        View Uploaded Title Deed
                                    </Button>
                                </Box>

                                {/* Action Area */}
                                <Box sx={{ bgcolor: '#f4f6f8', p: 2, borderRadius: 2 }}>
                                    <TextField 
                                        fullWidth 
                                        multiline 
                                        rows={2} 
                                        variant="outlined" 
                                        label="Review Comments (Optional)" 
                                        placeholder="Add notes regarding approval or reasons for rejection..."
                                        value={comments[req.id] || ''}
                                        onChange={(e) => handleCommentChange(req.id, e.target.value)}
                                        sx={{ mb: 2, bgcolor: 'white' }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button 
                                            variant="contained" 
                                            color="success" 
                                            onClick={() => initiateReview(req.id, 'APPROVED')} 
                                            disabled={processingId === req.id}
                                            startIcon={processingId === req.id ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                                            sx={{ flex: 1 }}
                                        >
                                            {processingId === req.id ? 'Processing...' : 'Approve Request'}
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            color="error" 
                                            onClick={() => initiateReview(req.id, 'REJECTED')} 
                                            disabled={processingId === req.id}
                                            startIcon={processingId === req.id ? <CircularProgress size={20} color="inherit" /> : <CancelIcon />}
                                            sx={{ flex: 1 }}
                                        >
                                            {processingId === req.id ? 'Processing...' : 'Reject Request'}
                                        </Button>
                                    </Box>
                                </Box>

                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Confirmation Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 'bold' }}>
                    Confirm Action
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to mark Request #{actionData.id} as <strong>{actionData.status}</strong>? This action cannot be easily reversed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} color="secondary" variant="outlined">
                        Cancel
                    </Button>
                    <Button 
                        onClick={confirmReview} 
                        color={actionData.status === 'APPROVED' ? 'success' : 'error'} 
                        variant="contained" 
                        autoFocus
                    >
                        Confirm {actionData.status}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default RequestManager;