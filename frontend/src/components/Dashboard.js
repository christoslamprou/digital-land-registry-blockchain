import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [allProperties, setAllProperties] = useState([]);
  const userRole = sessionStorage.getItem('role') || 'citizen';
  const userHash = sessionStorage.getItem('userHash') || '';

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/property/all');
      
      if (userRole === 'citizen') {
        // Security restriction: Citizens can only see their own properties on the dashboard
        const citizenOnlyData = res.data.filter(prop => prop.ownerHash === userHash);
        setAllProperties(citizenOnlyData);
      } else {
        // Staff and Notaries can see the global overview
        setAllProperties(res.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>
        {userRole === 'citizen' ? 'My Registered Properties' : 'Latest Registered Properties'}
      </h2>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
        {userRole === 'citizen' ? 'Overview of your personal assets saved off-chain.' : 'System overview retrieved from the off-chain PostgreSQL database.'}
      </p>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset ID (KAEK)</th>
              <th>Address</th>
              <th>Area (sq.m)</th>
              <th>Year</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            {allProperties.length > 0 ? (
              allProperties.map((prop) => (
                <tr key={prop.kaek}>
                  <td><strong>{prop.kaek}</strong></td>
                  <td>{prop.fullAddress}</td>
                  <td>{prop.surfaceArea}</td>
                  <td>{prop.constructionYear || '-'}</td>
                  <td>{prop.landUsage || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#95a5a6' }}>
                  No properties found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;