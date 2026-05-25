import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  Grid, Divider, Chip, CircularProgress, Link, Paper, Alert 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryIcon from '@mui/icons-material/History';

const SearchProperty = () => {
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const userRole = sessionStorage.getItem('role') || 'citizen';
  const userHash = sessionStorage.getItem('userHash') || '';

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchResult(null);
    setHistoryData(null);

    try {
      const res = await axios.get(`http://localhost:3000/api/property/${searchId}`);
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      
      // Security Check: Citizens cannot view details of properties they do not own
      if (userRole === 'citizen' && data.ownerHash !== userHash) {
          setSearchResult({ success: false, message: 'Access Denied: You do not own this property.' });
          setSearchLoading(false);
          return;
      }

      setSearchResult({ success: true, data: data });

      const histRes = await axios.get(`http://localhost:3000/api/property/history/${searchId}`, {
          headers: { 'user-role': userRole }
      });
      const hData = typeof histRes.data === 'string' ? JSON.parse(histRes.data) : histRes.data;
      setHistoryData(hData);
    } catch (error) {
      setSearchResult({ success: false, message: error.response?.data?.error || 'Property not found' });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Search Header Card */}
      <Card elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'secondary.main' }}>
            <AccountBalanceIcon color="primary" />
            Search Property by KAEK
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Enter the unique Asset ID to verify the current status and view the audit trail.
          </Typography>
          
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField 
              fullWidth 
              label="Enter Asset ID (KAEK)" 
              variant="outlined" 
              value={searchId} 
              onChange={(e) => setSearchId(e.target.value)} 
              required 
              disabled={searchLoading}
            />
            <Button 
              type="submit" 
              variant="contained" 
              size="large"
              disabled={searchLoading || !searchId.trim()}
              startIcon={searchLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              sx={{ height: 56, px: 4, whiteSpace: 'nowrap' }}
            >
              {searchLoading ? 'Searching...' : 'Search Ledger'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Search Results Area */}
      {searchResult && (
        <Box sx={{ mb: 4 }}>
          {searchResult.success ? (
            <Card elevation={2} sx={{ borderLeft: '6px solid #2e7d32', borderRadius: 2 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Typography variant="h6" color="primary" fontWeight="bold">Property Details</Typography>
                  <Chip label={searchResult.data.status || 'Active'} color="success" sx={{ fontWeight: 'bold' }} />
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Asset ID (KAEK)</Typography>
                    <Typography variant="body1" fontWeight="bold">{searchResult.data.assetId || searchResult.data.kaek}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Current Owner</Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>{searchResult.data.ownerHash}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Address</Typography>
                    <Typography variant="body1">{searchResult.data.fullAddress || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Surface Area</Typography>
                    <Typography variant="body1">{searchResult.data.surfaceArea ? `${searchResult.data.surfaceArea} sqm` : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Usage</Typography>
                    <Typography variant="body1">{searchResult.data.landUsage || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Constructed</Typography>
                    <Typography variant="body1">{searchResult.data.constructionYear || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Objective Value</Typography>
                    <Typography variant="body1">{searchResult.data.objectiveValue ? `${searchResult.data.objectiveValue} EUR` : 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Link 
                      href={`https://gateway.pinata.cloud/ipfs/${searchResult.data.documentRootHash}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mt: 1, fontWeight: 'bold', textDecoration: 'none' }}
                    >
                      <DescriptionIcon fontSize="small" /> View Official Title Deed
                    </Link>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
              {searchResult.message}
            </Alert>
          )}
        </Box>
      )}

      {/* Blockchain Audit Trail */}
      {historyData && historyData.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main', fontWeight: 'bold' }}>
            <HistoryIcon color="primary" /> Blockchain Audit Trail
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {historyData.map((historyItem, index) => {
              const rawTs = historyItem.timestamp || historyItem.Timestamp;
              const date = rawTs && rawTs.seconds ? new Date(rawTs.seconds * 1000).toLocaleString() : 'Unknown Date';
              const assetData = historyItem.record || historyItem.Record || historyItem.value || {};
              const txId = historyItem.txId || historyItem.TxId || 'UnknownTx';
              const finalOwner = assetData.ownerHash || assetData.OwnerHash || 'Unknown Owner';
              const finalDoc = assetData.documentRootHash || assetData.DocumentRootHash;

              return (
                <Paper key={index} elevation={2} sx={{ p: 3, borderLeft: '4px solid #1976d2', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    {date}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-all' }}>
                    TxID: <strong>{txId}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-all' }}>
                    Owner: {finalOwner}
                  </Typography>
                  {finalDoc && (
                    <Link 
                      href={`https://gateway.pinata.cloud/ipfs/${finalDoc}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      color="secondary"
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1, textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}
                    >
                      <DescriptionIcon fontSize="small" /> View Document at this state
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

export default SearchProperty;