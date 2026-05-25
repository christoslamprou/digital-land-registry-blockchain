import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, CircularProgress, Alert, Link, Divider 
} from '@mui/material';

// --- MUI Icons ---
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

const OwnerSearch = () => {
    const userRole = sessionStorage.getItem('role') || 'citizen';
    const citizenHash = sessionStorage.getItem('userHash') || '';
    const token = sessionStorage.getItem('token'); 

    const [ownerHash, setOwnerHash] = useState(userRole === 'citizen' ? citizenHash : '');
    const [properties, setProperties] = useState([]);
    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);

    // Auto load properties if citizen enters the tab
    useEffect(() => {
        const triggerAutoSearch = async () => {
            if (!token) return; 
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
        setErrorMessage(null);
        
        if (!token) {
            setErrorMessage("Session expired. Please login again.");
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
            if (res.data.length === 0) {
                setErrorMessage("No properties found for this owner.");
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.error || "Error searching for properties. Check backend logs.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditTrail = async (assetId) => {
        if (!token) return;
        setErrorMessage(null);
        setSelectedProperty(assetId);
        
        try {
            const res = await axios.get(`http://localhost:3000/api/property/history/${assetId}`, {
                headers: { 
                    'user-role': userRole,
                    'Authorization': `Bearer ${token}` 
                }
            });
            const hData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            setHistoryData(hData);
        } catch (error) {
            setErrorMessage(`Error fetching blockchain history for Asset: ${assetId}`);
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
            
            {/* Header & Search Card */}
            <Card elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'secondary.main' }}>
                        {userRole === 'citizen' ? <MapsHomeWorkIcon color="primary" /> : <PersonSearchIcon color="primary" />}
                        {userRole === 'citizen' ? 'My Asset Portfolio' : 'Ownership Lookup'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        {userRole === 'citizen' 
                            ? 'Verifiable assets connected to your identity hash.' 
                            : 'Find all properties assigned to a specific Owner Hash and view their history.'}
                    </Typography>
                    
                    <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <TextField 
                            fullWidth 
                            label="Enter Owner Hash" 
                            variant="outlined" 
                            value={ownerHash} 
                            onChange={(e) => setOwnerHash(e.target.value)} 
                            required 
                            disabled={userRole === 'citizen' || loading} 
                        />
                        <Button 
                            type="submit" 
                            variant="contained" 
                            size="large"
                            disabled={loading || !ownerHash.trim()}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : (userRole === 'citizen' ? <RefreshIcon /> : <SearchIcon />)}
                            sx={{ height: 56, px: 4, whiteSpace: 'nowrap' }}
                        >
                            {loading ? 'Loading...' : (userRole === 'citizen' ? 'Refresh Portfolio' : 'Search Owner')}
                        </Button>
                    </Box>

                    {errorMessage && (
                        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                            {errorMessage}
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Properties Table Card */}
            {properties.length > 0 && (
                <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
                    <CardContent sx={{ p: 0 }}> {/* p:0 to let the table span full width of the card */}
                        <Box sx={{ p: 3, pb: 2 }}>
                            <Typography variant="h6" color="primary" fontWeight="bold">
                                Registered Properties ({properties.length})
                            </Typography>
                        </Box>
                        
                        <TableContainer>
                            <Table sx={{ minWidth: 650 }} aria-label="properties table">
                                <TableHead sx={{ bgcolor: 'background.default' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Asset ID (KAEK)</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Address</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Area</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Usage</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Year</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Value (€)</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {properties.map((prop) => (
                                        <TableRow key={prop.kaek || prop.assetId} sx={{ '&:hover': { bgcolor: '#f5f7fa' } }}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {prop.kaek || prop.assetId}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{prop.fullAddress || 'N/A'}</TableCell>
                                            <TableCell>{prop.surfaceArea ? `${prop.surfaceArea} sqm` : 'N/A'}</TableCell>
                                            <TableCell>{prop.landUsage || 'N/A'}</TableCell>
                                            <TableCell>{prop.constructionYear || 'N/A'}</TableCell>
                                            <TableCell>{prop.objectiveValue || 'N/A'}</TableCell>
                                            <TableCell align="center">
                                                <Button 
                                                    variant="outlined" 
                                                    size="small" 
                                                    startIcon={<HistoryIcon />}
                                                    onClick={() => fetchAuditTrail(prop.kaek || prop.assetId)}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    Audit Trail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Audit Trail Section */}
            {historyData && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main', fontWeight: 'bold' }}>
                        <HistoryIcon color="primary" /> Audit Trail for: {selectedProperty}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {historyData.map((item, index) => {
                            const rawTs = item.timestamp || item.Timestamp;
                            const date = rawTs && rawTs.seconds ? new Date(rawTs.seconds * 1000).toLocaleString() : 'Unknown Date';
                            const assetData = item.record || item.value || {};
                            const txId = item.txId || item.TxId || 'UnknownTx';
                            const finalOwner = assetData.ownerHash || 'Unknown Owner';
                            const finalDoc = assetData.documentRootHash;

                            return (
                                <Paper key={index} elevation={2} sx={{ p: 3, borderLeft: '4px solid #ed6c02', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                        {date}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-all' }}>
                                        TxID: <Typography component="span" color="text.secondary">{txId}</Typography>
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-all' }}>
                                        Owner: <strong>{finalOwner}</strong>
                                    </Typography>
                                    {finalDoc && (
                                        <Link 
                                            href={`https://gateway.pinata.cloud/ipfs/${finalDoc}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            color="success.main"
                                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1, textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}
                                        >
                                            <DescriptionIcon fontSize="small" /> View IPFS Document
                                        </Link>
                                    )}
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default OwnerSearch;