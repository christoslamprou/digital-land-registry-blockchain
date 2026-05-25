import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, Typography, TextField, 
  Button, Alert, CircularProgress, Avatar, Link 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const Auth = ({ setToken, setRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [afm, setAfm] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [authMessage, setAuthMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthMessage(null);
    setLoading(true);
    const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const payload = isLoginView ? { email, password } : { email, password, afm };
      
      const res = await axios.post(`http://localhost:3000${endpoint}`, payload);
      
      if (isLoginView) {
        setToken(res.data.token);
        if (setRole) setRole(res.data.role); 
        
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('role', res.data.role);
        
        if (res.data.afm) {
          sessionStorage.setItem('userHash', res.data.afm);
        } else {
          sessionStorage.removeItem('userHash');
        }
      } else {
        setIsLoginView(true);
        setAuthMessage({ type: 'success', text: 'Registration successful! You can now log in.' });
      }
      setEmail('');
      setPassword('');
      setAfm('');
    } catch (error) {
      setAuthMessage({ type: 'error', text: error.response?.data?.error || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setAuthMessage(null);
    setEmail('');
    setPassword('');
    setAfm('');
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        bgcolor: 'secondary.main' // Uses the dark slate gray from your theme
      }}
    >
      <Card elevation={6} sx={{ width: '100%', maxWidth: 400, borderRadius: 3, mx: 2 }}>
        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          
          <Typography component="h1" variant="h5" fontWeight="bold" sx={{ mt: 1, mb: 1, color: 'secondary.main' }}>
            Digital Land Registry
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isLoginView ? 'Sign in to access your dashboard' : 'Register to create your citizen identity'}
          </Typography>
          
          <Box component="form" onSubmit={handleAuth} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            {!isLoginView && (
              <TextField
                fullWidth
                label="AFM (Tax ID)"
                variant="outlined"
                margin="normal"
                value={afm}
                onChange={(e) => setAfm(e.target.value)}
                required
              />
            )}

            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, height: 48 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : (isLoginView ? 'Sign In' : 'Register')}
            </Button>
          </Box>

          {authMessage && (
            <Alert 
              severity={authMessage.type} 
              sx={{ width: '100%', mt: 2 }}
            >
              {authMessage.text}
            </Alert>
          )}

          <Link 
            component="button" 
            variant="body2" 
            onClick={toggleView} 
            sx={{ mt: 2, textDecoration: 'none', fontWeight: 'bold' }}
          >
            {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </Link>

        </CardContent>
      </Card>
    </Box>
  );
};

export default Auth;