import React from 'react';
import { Link } from 'react-router-dom';

const AdminTest = () => {
  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'red', fontSize: '48px' }}>🔧 ADMIN TEST PAGE</h1>
      <p style={{ fontSize: '24px', margin: '30px 0' }}>
        If you can see this page, routing is working!
      </p>
      <div style={{ backgroundColor: '#f0f0f0', padding: '20px', margin: '20px 0', borderRadius: '10px' }}>
        <h2>✅ Success! Admin routing works.</h2>
        <p>The /admin-test route is functional.</p>
      </div>
      <div style={{ margin: '30px 0' }}>
        <Link 
          to="/admin" 
          style={{ 
            backgroundColor: '#007bff', 
            color: 'white', 
            padding: '15px 30px', 
            textDecoration: 'none', 
            borderRadius: '5px',
            fontSize: '18px',
            margin: '10px'
          }}
        >
          🚀 Go to Full Admin Dashboard
        </Link>
        <br/><br/>
        <Link 
          to="/" 
          style={{ 
            backgroundColor: '#28a745', 
            color: 'white', 
            padding: '15px 30px', 
            textDecoration: 'none', 
            borderRadius: '5px',
            fontSize: '18px',
            margin: '10px'
          }}
        >
          🏠 Back to Home
        </Link>
      </div>
      <div style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
        <p>Current URL: {window.location.href}</p>
        <p>Timestamp: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default AdminTest;