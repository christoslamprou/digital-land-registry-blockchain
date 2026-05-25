import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  Grid, Alert, CircularProgress, Divider 
} from '@mui/material';
import DomainAddIcon from '@mui/icons-material/DomainAdd';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockIcon from '@mui/icons-material/Lock';

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

    // 1. SECURITY CHECK: Check if token exists in session
    if (!token) {
        setResult({ 
            success: false, 
            message: 'System Error: No valid session token found. Please hit Logout on the bottom left and Login again.' 
        });
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
    if (file) formData.append('document', file);

    try {
      const axiosConfig = {
          headers: {
              'user-role': 'Staff', 
              'Authorization': `Bearer ${token}` 
          }
      };

      const response = await axios.post('http://localhost:3000/api/property/mint', formData, axiosConfig);
      setResult({ success: true, data: response.data });
      
      // Clear form on success
      setAssetId(''); setOwnerHash(''); setFullAddress(''); setSurfaceArea('');
      setObjectiveValue(''); setLandUsage(''); setConstructionYear(''); setFile(null);
    } catch (error) {
      setResult({ 
          success: false, 
          message: error.response?.data?.error || 'Registration failed due to backend permissions or network error.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Stricter RBAC condition: Only staff allowed
  if (userRole !== 'staff') {
    return (
      <Box sx={{ maxWidth: 800, margin: '0 auto', mt: 4 }}>
        <Alert severity="error" variant="filled" icon={<LockIcon fontSize="inherit" />} sx={{ borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold">Access Denied</Typography>
          <Typography variant="body2">Only authorized Land Registry Staff can access the property registration panel.</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'secondary.main' }}>
              <DomainAddIcon color="primary" />
              Register New Property
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill in the technical and legal details to permanently register a new property on the Blockchain and internal database.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleMint}>
            <Grid container spacing={3}>
              
              {/* Row 1 */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Asset ID (KAEK)" variant="outlined" value={assetId} onChange={(e) => setAssetId(e.target.value)} required disabled={loading} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Owner Hash (AFM)" variant="outlined" value={ownerHash} onChange={(e) => setOwnerHash(e.target.value)} required disabled={loading} />
              </Grid>

              {/* Row 2 */}
              <Grid item xs={12}>
                <TextField fullWidth label="Full Address" variant="outlined" value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} required disabled={loading} />
              </Grid>

              {/* Row 3 */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" inputProps={{ step: "0.01" }} label="Surface Area (sq.m)" variant="outlined" value={surfaceArea} onChange={(e) => setSurfaceArea(e.target.value)} required disabled={loading} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" inputProps={{ step: "0.01" }} label="Objective Value (€)" variant="outlined" value={objectiveValue} onChange={(e) => setObjectiveValue(e.target.value)} disabled={loading} />
              </Grid>

              {/* Row 4 */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Land Usage (e.g., Residential, Commercial)" variant="outlined" value={landUsage} onChange={(e) => setLandUsage(e.target.value)} disabled={loading} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" label="Construction Year" variant="outlined" value={constructionYear} onChange={(e) => setConstructionYear(e.target.value)} disabled={loading} />
              </Grid>

              {/* Row 5: File Upload */}
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1, bgcolor: '#fafafa' }}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    disabled={loading}
                  >
                    Upload Title Deed (PDF)
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

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large" 
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ mt: 2, px: 4, height: 48 }}
                >
                  {loading ? 'Processing Transaction...' : 'Register Property'}
                </Button>
              </Grid>

            </Grid>
          </Box>

          {/* Results Alert */}
          {result && (
            <Box sx={{ mt: 4 }}>
              <Alert severity={result.success ? 'success' : 'error'} variant="filled" sx={{ borderRadius: 2 }}>
                {result.success ? (
                  <Box>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Success! Property Registered.</Typography>
                    <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>IPFS Hash: {result.data.ipfsHash}</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2">{result.message}</Typography>
                )}
              </Alert>
            </Box>
          )}

        </CardContent>
      </Card>
    </Box>
  );
};

export default MintProperty;