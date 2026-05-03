import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [allProperties, setAllProperties] = useState([]);

  // Fetch Dashboard Data
  const fetchDashboard = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/property/all');
      setAllProperties(res.data);
    } catch (err) {
      console.error("Error fetching dashboard", err);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <section className="card dashboard-section">
      <h2>Property Dashboard (Off-Chain Data)</h2>
      <div className="table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>KAEK</th>
              <th>Address</th>
              <th>Area (sq.m)</th>
              <th>Year</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            {allProperties.map((prop) => (
              <tr key={prop.propertyId}>
                <td><strong>{prop.kaek}</strong></td>
                <td>{prop.fullAddress}</td>
                <td>{prop.surfaceArea}</td>
                <td>{prop.constructionYear || '-'}</td>
                <td>{prop.landUsage || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Dashboard;