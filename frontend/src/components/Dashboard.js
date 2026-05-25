import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, Typography, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, 
  CircularProgress, Chip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';

const Dashboard = () => {
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userRole = sessionStorage.getItem('role') || 'citizen';
  const userHash = sessionStorage.getItem('userHash') || '';

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:3000/api/property/all');
      
      if (userRole === 'citizen') {
        // Security restriction: Citizens can only see their own properties
        const citizenOnlyData = res.data.filter(prop => prop.ownerHash === userHash);
        setAllProperties(citizenOnlyData);
      } else {
        // Staff and Notaries can see the global overview
        setAllProperties(res.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'secondary.main' }}>
              <DashboardIcon color="primary" />
              {userRole === 'citizen' ? 'My Registered Properties' : 'Latest Registered Properties'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userRole === 'citizen' 
                ? 'Overview of your personal assets verified in the registry.' 
                : 'System overview retrieved from the PostgreSQL database.'}
            </Typography>
          </Box>

          {error && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#ffebee', color: '#c62828', borderRadius: 1, border: '1px solid #ef9a9a' }}>
              <Typography variant="body2">{error}</Typography>
            </Box>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Table sx={{ minWidth: 650 }} aria-label="dashboard table">
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Asset ID (KAEK)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Address</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Area (sqm)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Year</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Usage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Loading properties...</Typography>
                    </TableCell>
                  </TableRow>
                ) : allProperties.length > 0 ? (
                  allProperties.map((prop) => (
                    <TableRow 
                      key={prop.kaek}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f5f7fa' } }}
                    >
                      <TableCell component="th" scope="row">
                        <Typography variant="body2" fontWeight="bold">
                          {prop.kaek}
                        </Typography>
                      </TableCell>
                      <TableCell>{prop.fullAddress || 'N/A'}</TableCell>
                      <TableCell align="right">{prop.surfaceArea || '-'}</TableCell>
                      <TableCell align="center">{prop.constructionYear || '-'}</TableCell>
                      <TableCell>
                        {prop.landUsage ? (
                          <Chip label={prop.landUsage} size="small" variant="outlined" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No properties found in the registry.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;