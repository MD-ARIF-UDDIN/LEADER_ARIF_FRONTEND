import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ title, showBack = false, onBack }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('আপনি কি নিশ্চিতভাবে লগআউট করতে চান?')) {
      logout();
    }
  };

  return (
    <header className="app-header">
      {showBack ? (
        <button className="back-btn" onClick={onBack || (() => navigate(-1))}>
          <ArrowLeft size={22} style={{ marginRight: '6px' }} />
          <span>ফেরত</span>
        </button>
      ) : (
        <div style={{ width: '48px' }}></div>
      )}
      
      <h1 style={{ flex: 1, textAlign: 'center', margin: 0 }}>{title}</h1>
      
      {user ? (
        <button 
          className="back-btn" 
          onClick={handleLogout} 
          style={{ justifyContent: 'center', padding: '6px', cursor: 'pointer' }}
          title="লগআউট"
        >
          <LogOut size={20} />
        </button>
      ) : (
        <div style={{ width: '48px' }}></div>
      )}
    </header>
  );
}
