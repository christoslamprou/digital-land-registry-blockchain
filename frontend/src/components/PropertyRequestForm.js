import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  Grid, Divider, Alert, CircularProgress, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper 
} from '@mui/material';

// --- MUI Icons ---
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';

const PropertyRequestForm = () => {
    // UI State: 'MINT', 'LIST' (shows properties), 'UPDATE' (shows form for selected property)
    const [view, setView] = useState('MINT'); 
    const [myProperties, setMyProperties] = useState([]);
    
    // Form State
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
    const ownerHash = sessionStorage.getItem('userHash');

    // Fetch properties when navigating to the LIST view
    useEffect(() => {
        if (view === 'LIST') {
            fetchMyProperties();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    const fetchMyProperties = async () => {
        setMessage('');
        try {
            const res = await axios.get('http://localhost:3000/api/requests/my-properties', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'owner-hash': ownerHash
                }
            });
            setMyProperties(res.data);
        } catch (error) {
            console.error("Error fetching properties:", error);
            setMessage("Error: Could not load your properties.");
        }
    };

    const handleModifyClick = (prop) => {
        setAssetId(prop.kaek); 
        setFullAddress(prop.fullAddress);
        setSurfaceArea(prop.surfaceArea);
        setObjectiveValue(prop.objectiveValue || '');
        setLandUsage(prop.landUsage || '');
        setConstructionYear(prop.constructionYear || '');
        setFile(null);
        setView('UPDATE');
        setMessage('');
    };

    const handleCancelUpdate = () => {
        clearForm();
        setView('LIST');
    };

    const clearForm = () => {
        setAssetId('');
        setFullAddress('');
        setSurfaceArea('');
        setObjectiveValue('');
        setLandUsage('');
        setConstructionYear('');
        setFile(null);
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const requestType = view === 'UPDATE' ? 'UPDATE' : 'MINT';

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
            
            if (view === 'UPDATE') {
                setTimeout(() => setView('LIST'), 2000); // Return to list after 2 seconds
            } else {
                clearForm();
            }
        } catch (error) {
            setMessage(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const isErrorMessage = message.toLowerCase().startsWith('error');

    return (
        <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                    
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'secondary.main' }}>
                            <AssignmentIcon color="primary" />
                            Property Requests Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Submit a request to register a new property or update the details of an existing one. All requests are subject to engineering and staff review.
                        </Typography>
                    </Box>

                    {/* Top Navigation / Toggle */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                        <Button 
                            variant={view === 'MINT' ? 'contained' : 'outlined'} 
                            startIcon={<AddIcon />}
                            onClick={() => { clearForm(); setView('MINT'); }}
                            sx={{ borderRadius: 2 }}
                        >
                            Register New Property
                        </Button>
                        <Button 
                            variant={(view === 'LIST' || view === 'UPDATE') ? 'contained' : 'outlined'} 
                            startIcon={<ListAltIcon />}
                            onClick={() => setView('LIST')}
                            sx={{ borderRadius: 2 }}
                        >
                            Update Existing Property
                        </Button>
                    </Box>

                    {message && (
                        <Alert severity={isErrorMessage ? 'error' : 'success'} sx={{ mb: 4, borderRadius: 2 }}>
                            {message}
                        </Alert>
                    )}

                    {/* VIEW: PROPERTY LIST */}
                    {view === 'LIST' && (
                        <Box>
                            <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
                                Select Property to Update
                            </Typography>
                            
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table sx={{ minWidth: 650 }} aria-label="user properties table">
                                    <TableHead sx={{ bgcolor: 'background.default' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Asset ID (KAEK)</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Address</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Surface Area</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {myProperties.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    No properties found in your account.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            myProperties.map((prop) => (
                                                <TableRow key={prop.kaek} sx={{ '&:hover': { bgcolor: '#f5f7fa' } }}>
                                                    <TableCell><Typography variant="body2" fontWeight="bold">{prop.kaek}</Typography></TableCell>
                                                    <TableCell>{prop.fullAddress}</TableCell>
                                                    <TableCell>{prop.surfaceArea} sqm</TableCell>
                                                    <TableCell align="center">
                                                        <Button 
                                                            variant="outlined" 
                                                            size="small" 
                                                            startIcon={<EditIcon />}
                                                            onClick={() => handleModifyClick(prop)}
                                                        >
                                                            Modify
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {/* VIEW: FORM (Used for both MINT and UPDATE) */}
                    {(view === 'MINT' || view === 'UPDATE') && (
                        <Box component="form" onSubmit={handleSubmit}>
                            
                            {view === 'UPDATE' && (
                                <Alert severity="info" icon={<EditIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Updating Property:</strong> You are modifying the details for Asset ID <strong>{assetId}</strong>. Core identifiers are locked.
                                    </Typography>
                                </Alert>
                            )}

                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField 
                                        fullWidth 
                                        label="Asset ID (KAEK)" 
                                        variant="outlined" 
                                        value={assetId} 
                                        onChange={(e) => setAssetId(e.target.value)} 
                                        required 
                                        disabled={view === 'UPDATE' || loading}
                                        helperText={view === 'UPDATE' ? "Asset ID cannot be changed during an update." : ""}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Full Address" variant="outlined" value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} required disabled={loading} />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="number" inputProps={{ step: "0.01" }} label="Surface Area (sqm)" variant="outlined" value={surfaceArea} onChange={(e) => setSurfaceArea(e.target.value)} required disabled={loading} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="number" inputProps={{ step: "0.01" }} label="Objective Value (EUR)" variant="outlined" value={objectiveValue} onChange={(e) => setObjectiveValue(e.target.value)} disabled={loading} />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Land Usage" variant="outlined" value={landUsage} onChange={(e) => setLandUsage(e.target.value)} disabled={loading} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField 
                                        fullWidth 
                                        type="number" 
                                        label="Construction Year" 
                                        variant="outlined" 
                                        value={constructionYear} 
                                        onChange={(e) => setConstructionYear(e.target.value)} 
                                        disabled={view === 'UPDATE' || loading} 
                                        helperText={view === 'UPDATE' ? "Construction year is locked." : ""}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1, bgcolor: '#fafafa' }}>
                                        <Button
                                            component="label"
                                            variant="outlined"
                                            startIcon={<CloudUploadIcon />}
                                            disabled={loading}
                                        >
                                            {view === 'UPDATE' ? 'Upload Updated Document' : 'Upload Title Deed (PDF)'}
                                            <input
                                                type="file"
                                                hidden
                                                accept=".pdf,.txt"
                                                onChange={(e) => setFile(e.target.files[0])}
                                                required
                                            />
                                        </Button>
                                        <Typography variant="body2" color={file ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: file ? 'bold' : 'normal' }}>
                                            {file ? file.name : 'No file selected *'}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                        <Button 
                                            type="submit" 
                                            variant="contained" 
                                            size="large" 
                                            disabled={loading}
                                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                                            sx={{ px: 4 }}
                                        >
                                            {loading ? 'Processing...' : 'Submit Request'}
                                        </Button>
                                        
                                        {view === 'UPDATE' && (
                                            <Button 
                                                variant="outlined" 
                                                color="secondary" 
                                                size="large"
                                                onClick={handleCancelUpdate} 
                                                disabled={loading}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                </CardContent>
            </Card>
        </Box>
    );
};

export default PropertyRequestForm;