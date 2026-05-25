import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { 
  ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, 
  Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, 
  ListItemText, Divider, Button, Chip 
} from '@mui/material';

// --- MUI Icons ---
import DashboardIcon from '@mui/icons-material/Dashboard';
import SearchIcon from '@mui/icons-material/Search';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';
import AddIcon from '@mui/icons-material/Add'; // Replaced to avoid compilation error
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import LogoutIcon from '@mui/icons-material/Logout';

// --- Import Components ---
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import MintProperty from './components/MintProperty';
import TransferProperty from './components/TransferProperty';
import SearchProperty from './components/SearchProperty';
import OwnerSearch from './components/OwnerSearch';
import PropertyRequestForm from './components/PropertyRequestForm';
import RequestManager from './components/RequestManager';

const drawerWidth = 260; // Width of the sidebar

// Define the enterprise theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', 
    },
    secondary: {
      main: '#2c3e50', 
    },
    background: {
      default: '#f4f6f8', 
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const App = () => {
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const userRole = sessionStorage.getItem('role') || 'citizen';

  const handleLogout = () => {
    sessionStorage.clear();
    setToken(null);
    window.location.href = '/';
  };

  if (!token) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Auth setToken={setToken} />
        </ThemeProvider>
    );
  }

  // Helper component for Sidebar Links
  const NavItem = ({ to, icon, label }) => (
    <ListItem disablePadding>
      <ListItemButton component={Link} to={to} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
        <ListItemIcon sx={{ color: 'white' }}>{icon}</ListItemIcon>
        <ListItemText primary={label} />
      </ListItemButton>
    </ListItem>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          
          {/* Top App Bar */}
          <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, bgcolor: 'white', color: 'primary.main', borderBottom: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#2c3e50' }}>
                Digital Land Registry System
              </Typography>
            </Toolbar>
          </AppBar>

          {/* Fixed Sidebar (Drawer) */}
          <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                bgcolor: 'secondary.main',
                color: 'white'
              },
            }}
            variant="permanent"
            anchor="left"
          >
            {/* Sidebar Header */}
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#1a252f' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Land Registry
              </Typography>
              <Chip 
                label={userRole.toUpperCase()} 
                size="small" 
                sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} 
              />
            </Box>
            
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

            {/* Navigation Links */}
            <List sx={{ flexGrow: 1, pt: 2 }}>
              <NavItem to="/" icon={<DashboardIcon />} label="Dashboard" />
              <NavItem to="/search-kaek" icon={<SearchIcon />} label="Search by KAEK" />
              <NavItem 
                to="/search-owner" 
                icon={userRole === 'citizen' ? <MapsHomeWorkIcon /> : <PersonSearchIcon />} 
                label={userRole === 'citizen' ? 'My Properties' : 'Search by Owner'} 
              />
              
              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />

              {/* Role-Based Links */}
              {userRole === 'citizen' && (
                <NavItem to="/submit-request" icon={<AddIcon />} label="Submit Request" />
              )}

              {userRole === 'engineer' && (
                <NavItem to="/requests" icon={<FactCheckIcon />} label="Review Requests" />
              )}

              {userRole === 'staff' && (
                <>
                  <NavItem to="/mint" icon={<AddIcon />} label="Register Property" />
                  <NavItem to="/requests" icon={<FactCheckIcon />} label="Pending Approvals" />
                </>
              )}
              
              {userRole === 'notary' && (
                <NavItem to="/transfer" icon={<SyncAltIcon />} label="Transfer Property" />
              )}
            </List>

            {/* Logout Button */}
            <Box sx={{ p: 2 }}>
                <Button 
                    fullWidth 
                    variant="outlined" 
                    color="error" 
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{ color: '#ff5252', borderColor: '#ff5252', '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.1)' } }}
                >
                    Logout
                </Button>
            </Box>
          </Drawer>

          {/* Main Content Area */}
          <Box component="main" sx={{ flexGrow: 1, p: 4, mt: 8, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/search-kaek" element={<SearchProperty />} />
              <Route path="/search-owner" element={<OwnerSearch />} />
              <Route path="/mint" element={<MintProperty />} />
              <Route path="/transfer" element={<TransferProperty />} />
              <Route path="/submit-request" element={<PropertyRequestForm />} />
              <Route path="/requests" element={<RequestManager />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Box>
          
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;