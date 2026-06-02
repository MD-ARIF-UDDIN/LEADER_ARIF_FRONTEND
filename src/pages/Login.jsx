import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loadingState, setLoadingState] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('ইউজারনেম এবং পাসওয়ার্ড পূরণ করুন');
      return;
    }

    setLoadingState(true);

    const promise = login(username, password);

    toast.promise(promise, {
      loading: 'লগইন করা হচ্ছে...',
      success: 'সফলভাবে লগইন হয়েছে!',
      error: (err) => err.message || 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'
    });

    try {
      await promise;
      navigate('/');
    } catch (err) { } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="login-bg" style={{
      background: 'linear-gradient(135deg, #0f766e 0%, #064e3b 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background circles */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(20,184,166,0.3) 0%, rgba(20,184,166,0) 70%)',
        borderRadius: '50%', zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '250px', height: '250px',
        background: 'radial-gradient(circle, rgba(217,119,6,0.3) 0%, rgba(217,119,6,0) 70%)',
        borderRadius: '50%', zIndex: 0
      }}></div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src="/logo.jpeg" alt="Logo" style={{
            width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover',
            border: '3px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            backgroundColor: '#fff',
            padding: '2px'
          }} />
          <h1 style={{
            color: 'white', marginTop: '16px', fontSize: '1.6rem', lineHeight: '1.3',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontWeight: '800'
          }}>তরুণ উদ্যোক্তা সমন্বয় সমিতি</h1>
        </div>

        <div className="login-card" style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
        }}>
          <h2 style={{
            marginBottom: '24px', textAlign: 'center', fontSize: '1.4rem',
            color: 'var(--primary-dark)', fontWeight: '700'
          }}>লগইন করুন</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="username" style={{ fontWeight: '600', color: '#334155' }}>ইউজারনেম</label>
              <input
                type="text"
                id="username"
                className="form-control"
                placeholder="আপনার ইউজারনেম"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loadingState}
                autoCapitalize="none"
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label" htmlFor="password" style={{ fontWeight: '600', color: '#334155' }}>পাসওয়ার্ড</label>
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loadingState}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loadingState}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                gap: '8px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => { if (!loadingState) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 118, 110, 0.4)'; } }}
              onMouseLeave={(e) => { if (!loadingState) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 118, 110, 0.3)'; } }}
            >
              <LogIn size={20} />
              <span>{loadingState ? 'প্রবেশ করা হচ্ছে...' : 'লগইন করুন'}</span>
            </button>
          </form>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} তরুণ উদ্যোক্তা সমন্বয় সমিতি
        </div>
      </div>
    </div>
  );
}
