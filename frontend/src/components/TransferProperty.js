import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  Grid, Alert, CircularProgress, Divider 
} from '@mui/material';

// --- MUI Icons ---
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockIcon from '@mui/icons-material/Lock';
import GavelIcon from '@mui/icons-material/Gavel';

const TransferProperty = () => {
  const [transAssetId, setTransAssetId] = useState('');
  const [currentOwner, setCurrentOwner] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [transFile, setTransFile] = useState(null);
  const [transLoading, setTransLoading] = useState(false);
  const [transResult, setTransResult] = useState(null);

  // Retrieve role and token from sessionStorage
  const userRole = sessionStorage.getItem('role') || 'citizen';
  const token = sessionStorage.getItem('token');

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransLoading(true);
    setTransResult(null);

    // 1. SECURITY CHECK: Check if token exists in session
    if (!token) {
        setTransResult({ 
            success: false, 
            message: 'System Error: No valid session token found. Please hit Logout on the bottom left and Login again.' 
        });
        setTransLoading(false);
        return;
    }
    
    const formData = new FormData();
    formData.append('assetId', transAssetId);
    formData.append('currentOwnerHash', currentOwner);
    formData.append('newOwnerHash', newOwner);
    if (transFile) formData.append('document', transFile);

    try {
      const axiosConfig = {
          headers: {
              'user-role': 'Notary', 
              'Authorization': `Bearer ${token}` 
          }
      };

      const response = await axios.post('http://localhost:3000/api/property/transfer', formData, axiosConfig);
      setTransResult({ success: true, data: response.data });
      
      // Clear form on success
      setTransAssetId(''); setCurrentOwner(''); setNewOwner(''); setTransFile(null);
    } catch (error) {
      setTransResult({ 
          success: false, 
          message: error.response?.data?.error || 'Transfer failed due to backend permissions or network error.' 
      });
    } finally {
      setTransLoading(false);
    }
  };

  // Stricter RBAC condition: Only notary allowed
  if (userRole !== 'notary') {
    return (
      <Box sx={{ maxWidth: 800, margin: '0 auto', mt: 4 }}>
        <Alert severity="error" variant="filled" icon={<LockIcon fontSize="inherit" />} sx={{ borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold">Access Denied</Typography>
          <Typography variant="body2">Only authorized Notaries can access the property transfer system.</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'secondary.main' }}>
              <GavelIcon color="primary" />
              Transfer Ownership (Notary Panel)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Legally transfer a property to a new owner and upload the notarized contract to the Blockchain.
            </Typography>
          </Box>

          {/* Form Area */}
          <Box component="form" onSubmit={handleTransfer}>
            <Grid container spacing={3}>
              
              {/* Row 1 */}
              <Grid item xs={12}>
                <TextField 
                    fullWidth 
                    label="Asset ID (KAEK)" 
                    variant="outlined" 
                    value={transAssetId} 
                    onChange={(e) => setTransAssetId(e.target.value)} 
                    required 
                    disabled={transLoading} 
                />
              </Grid>

              {/* Row 2 */}
              <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth 
                    label="Current Owner Hash" 
                    variant="outlined" 
                    value={currentOwner} 
                    onChange={(e) => setCurrentOwner(e.target.value)} 
                    required 
                    disabled={transLoading} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth 
                    label="New Owner Hash" 
                    variant="outlined" 
                    value={newOwner} 
                    onChange={(e) => setNewOwner(e.target.value)} 
                    required 
                    disabled={transLoading} 
                />
              </Grid>

              {/* Row 3: File Upload */}
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1, bgcolor: '#fafafa' }}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    disabled={transLoading}
                  >
                    Upload New Contract (PDF)
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.txt"
                      onChange={(e) => setTransFile(e.target.files[0])}
                      required
                    />
                  </Button>
                  <Typography variant="body2" color={transFile ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: transFile ? 'bold' : 'normal' }}>
                    {transFile ? transFile.name : 'No file selected *'}
                  </Typography>
                </Box>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large" 
                  disabled={transLoading}
                  startIcon={transLoading ? <CircularProgress size={20} color="inherit" /> : <SyncAltIcon />}
                  sx={{ mt: 2, px: 4, height: 48 }}
                >
                  {transLoading ? 'Processing on Blockchain...' : 'Execute Transfer'}
                </Button>
              </Grid>

            </Grid>
          </Box>

          {/* Results Alert */}
          {transResult && (
            <Box sx={{ mt: 4 }}>
              <Alert severity={transResult.success ? 'success' : 'error'} variant="filled" sx={{ borderRadius: 2 }}>
                {transResult.success ? (
                  <Box>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Success! Ownership Transferred.</Typography>
                    <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>New IPFS Hash: {transResult.data.newIpfsHash}</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2">{transResult.message}</Typography>
                )}
              </Alert>
            </Box>
          )}

        </CardContent>
      </Card>
    </Box>
  );
};

export default TransferProperty;