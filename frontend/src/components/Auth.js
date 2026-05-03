import React, { useState } from 'react';
import axios from 'axios';

const Auth = ({ setToken, setRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [authMessage, setAuthMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthMessage(null);
    const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await axios.post(`http://localhost:3000${endpoint}`, { email, password });
      
      if (isLoginView) {
        // Pass credentials to parent component
        setToken(res.data.token);
        setRole(res.data.role);
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('role', res.data.role);
      } else {
        // Switch to login screen after successful registration
        setIsLoginView(true);
        setAuthMessage({ type: 'success', text: 'Registration successful! You can now log in.' });
      }
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthMessage({ type: 'error', text: error.response?.data?.error || 'Authentication failed' });
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <h2>Digital Land Registry</h2>
        <p>{isLoginView ? 'Login to your account' : 'Register as a new Citizen'}</p>
        
        <form onSubmit={handleAuth} className="form-group">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary">
            {isLoginView ? 'Login' : 'Register'}
          </button>
        </form>

        {authMessage && (
          <div className={`result-box ${authMessage.type === 'success' ? 'success' : 'error'}`}>
            <p>{authMessage.text}</p>
          </div>
        )}

        <p className="toggle-auth">
          {isLoginView ? "Don't have an account? " : "Already registered? "}
          <span onClick={() => { setIsLoginView(!isLoginView); setAuthMessage(null); }}>
            {isLoginView ? 'Sign up here' : 'Login here'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;