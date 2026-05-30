import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  Grid, Alert, CircularProgress, Divider, Chip
} from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const TransferProperty = () => {
  const [transAssetId, setTransAssetId] = useState('');
  const [currentOwner, setCurrentOwner] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [transFile, setTransFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [transfers, setTransfers] = useState([]);

  const userRole = sessionStorage.getItem('role');
  const token = sessionStorage.getItem('token');

  const fetchTransfers = useCallback(async () => {
      try {
          const res = await axios.get('http://localhost:3000/api/property/transfers/list', {
              headers: { 'Authorization': `Bearer ${token}`, 'user-role': userRole }
          });
          setTransfers(res.data);
      } catch (err) {
          console.error(err);
      }
  }, [token, userRole]);

  useEffect(() => {
      if (userRole === 'notary') fetchTransfers();
  }, [userRole, fetchTransfers]);

  const handlePropose = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(null);
    
    const formData = new FormData();
    formData.append('assetId', transAssetId);
    formData.append('currentOwnerHash', currentOwner);
    formData.append('newOwnerHash', newOwner);
    if (transFile) formData.append('document', transFile);

    try {
      await axios.post('http://localhost:3000/api/property/transfer/propose', formData, {
          headers: { 'user-role': 'Notary', 'Authorization': `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Transfer proposed successfully! Waiting for citizens to approve.' });
      setTransAssetId(''); setCurrentOwner(''); setNewOwner(''); setTransFile(null);
      fetchTransfers();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Proposal failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (requestId) => {
      setLoading(true); setMessage(null);
      try {
          await axios.post('http://localhost:3000/api/property/transfer/execute', { requestId }, {
              headers: { 'user-role': 'Notary', 'Authorization': `Bearer ${token}` }
          });
          setMessage({ type: 'success', text: 'Transfer executed on Blockchain successfully!' });
          fetchTransfers();
      } catch (error) {
          setMessage({ type: 'error', text: error.response?.data?.error || 'Execution failed.' });
      } finally {
          setLoading(false);
      }
  };

  if (userRole !== 'notary') return <Alert severity="error">Access Denied</Alert>;

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* SECTION 1: PROPOSE TRANSFER */}
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
            <GavelIcon color="primary" /> Step 1: Propose Transfer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload the contract. Citizens must approve it before final execution.
          </Typography>
          
          <Box component="form" onSubmit={handlePropose}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField fullWidth label="Asset ID (KAEK)" value={transAssetId} onChange={(e) => setTransAssetId(e.target.value)} required disabled={loading} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Current Owner Hash" value={currentOwner} onChange={(e) => setCurrentOwner(e.target.value)} required disabled={loading} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="New Owner Hash" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} required disabled={loading} />
              </Grid>
              <Grid item xs={12}>
                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} disabled={loading}>
                  Upload Contract (PDF)
                  <input type="file" hidden accept=".pdf" onChange={(e) => setTransFile(e.target.files[0])} required />
                </Button>
                <Typography variant="caption" sx={{ ml: 2 }}>{transFile ? transFile.name : ''}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" disabled={loading} startIcon={<SyncAltIcon />}>
                  {loading ? 'Processing...' : 'Propose Transfer'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* SECTION 2: EXECUTE TRANSFERS */}
      <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom fontWeight="bold">Step 2: Ready for Execution</Typography>
              {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
              
              {transfers.length === 0 ? <Typography>No pending transfers found.</Typography> : (
                  <Grid container spacing={2}>
                      {transfers.map(t => (
                          <Grid item xs={12} key={t.id}>
                              <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                      <Typography variant="subtitle1" fontWeight="bold">KAEK: {t.assetId}</Typography>
                                      <Typography variant="body2">Current Owner: {t.currentOwnerApproved ? '✅ Approved' : '⏳ Pending'}</Typography>
                                      <Typography variant="body2">New Owner: {t.newOwnerApproved ? '✅ Approved' : '⏳ Pending'}</Typography>
                                  </Box>
                                  <Button 
                                      variant="contained" 
                                      color="success" 
                                      disabled={t.status !== 'READY' || loading}
                                      onClick={() => handleExecute(t.id)}
                                      startIcon={<CheckCircleIcon />}
                                  >
                                      Commit to Blockchain
                                  </Button>
                              </Box>
                          </Grid>
                      ))}
                  </Grid>
              )}
          </CardContent>
      </Card>

    </Box>
  );
};

export default TransferProperty;