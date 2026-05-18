import React, { useState } from 'react';
import axios from 'axios';

const Auth = ({ setToken, setRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [afm, setAfm] = useState(''); // New state for AFM
  const [isLoginView, setIsLoginView] = useState(true);
  const [authMessage, setAuthMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthMessage(null);
    setLoading(true);
    const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register';
    
    try {
      // Include afm in the request if we are registering
      const payload = isLoginView ? { email, password } : { email, password, afm };
      
      const res = await axios.post(`http://localhost:3000${endpoint}`, payload);
      
      if (isLoginView) {
        setToken(res.data.token);
        if (setRole) setRole(res.data.role); 
        
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('role', res.data.role);
        
        // Save the REAL AFM from the database to local storage
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

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#2c3e50' }}>
      <div className="card" style={{ width: '400px', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>Digital Land Registry</h2>
        <p style={{ marginBottom: '20px', color: '#7f8c8d' }}>
          {isLoginView ? 'Login to your account' : 'Register as a new Citizen'}
        </p>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
          
          {/* Show AFM field ONLY during Registration */}
          {!isLoginView && (
            <input type="text" placeholder="AFM (Tax ID)" value={afm} onChange={(e) => setAfm(e.target.value)} required style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
          )}

          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (isLoginView ? 'Login' : 'Register')}
          </button>
        </form>

        {authMessage && (
          <div style={{ marginTop: '15px', padding: '10px', borderRadius: '4px', backgroundColor: authMessage.type === 'success' ? '#d4edda' : '#f8d7da', color: authMessage.type === 'success' ? '#155724' : '#721c24' }}>
            {authMessage.text}
          </div>
        )}

        <p style={{ marginTop: '20px', fontSize: '0.9rem', cursor: 'pointer', color: '#3498db' }} onClick={() => { setIsLoginView(!isLoginView); setAuthMessage(null); }}>
          {isLoginView ? "Don't have an account? Sign up here" : "Already registered? Login here"}
        </p>
      </div>
    </div>
  );
};

export default Auth;