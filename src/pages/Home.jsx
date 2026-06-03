import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { toBanglaNumber, formatBDT } from '../utils/bangla';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Users, Landmark, AlertCircle, TrendingUp, HandCoins, LandmarkIcon, CheckCircle2, Wallet } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (user.role === 'admin') {
          const data = await apiRequest('/api/reports/dashboard');
          setStats(data);
        } else {
          // If member, fetch their personal member profile from /api/members
          // The route returns a list of members matching their permissions (which returns only their profile)
          const data = await apiRequest('/api/members');
          if (data && data.length > 0) {
            setMemberStats(data[0]);
          }
        }
      } catch (err) {
        setError('ডাটা লোড করতে সমস্যা হয়েছে');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="app-container">
      <Header title="ড্যাশবোর্ড" />

      <main className="content-wrapper">
        <div className="card" style={{
          marginBottom: '20px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          color: 'white',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="/logo.jpeg" alt="Logo" style={{
              width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              backgroundColor: '#fff',
              padding: '2px'
            }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                স্বাগতম, {user.name} 👋
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' }}>
                পদবী: {user.role === 'admin' ? 'এডমিন (পরিচালক)' : 'সমিতি সদস্য'}
              </p>
            </div>
          </div>
          {/* President Profile Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.12)', padding: '6px 12px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>আরিফুল রহমান</div>
              <div style={{ fontSize: '0.68rem', color: '#a5f3fc', fontWeight: 600 }}>সভাপতি</div>
            </div>
            <img src="/president.png" alt="Ariful Islam" style={{
              width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover',
              border: '2px solid #a5f3fc',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }} />
          </div>
        </div>

        {error && (
          <div className="card" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <span style={{ fontWeight: 600 }}>লোড হচ্ছে...</span>
          </div>
        ) : user.role === 'admin' && stats ? (
          <div>
            {/* Current Balance Highlight Card */}
            <div className="card" style={{
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.82rem', fontWeight: 500, display: 'block', marginBottom: '2px' }}>সমিতির চলতি তহবিল (বর্তমান ব্যালেন্স)</span>
                <h2 style={{ fontSize: '1.7rem', color: 'white', marginTop: '2px', fontWeight: 800 }}>
                  {formatBDT(stats.totalDeposits + stats.totalInstallmentsCollected - stats.totalInvestments)}
                </h2>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.18)', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={28} color="white" />
              </div>
            </div>

            {/* Admin Grid Cards */}
            <div className="grid-2">
              <div className="kpi-card">
                <div>
                  <div className="kpi-icon-wrapper">
                    <Users size={18} color="var(--primary)" />
                  </div>
                  <div className="kpi-title">মোট সদস্য</div>
                </div>
                <div className="kpi-value">{toBanglaNumber(stats.totalMembers)} জন</div>
              </div>

              <div className="kpi-card success">
                <div>
                  <div className="kpi-icon-wrapper">
                    <Landmark size={18} color="var(--success)" />
                  </div>
                  <div className="kpi-title">মোট সঞ্চয় জমা</div>
                </div>
                <div className="kpi-value">{formatBDT(stats.totalDeposits)}</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="kpi-card danger">
                <div>
                  <div className="kpi-icon-wrapper">
                    <AlertCircle size={18} color="var(--danger)" />
                  </div>
                  <div className="kpi-title">সদস্য সঞ্চয় বকেয়া</div>
                </div>
                <div className="kpi-value">{formatBDT(stats.memberDueAmount)}</div>
              </div>

              <div className="kpi-card danger">
                <div>
                  <div className="kpi-icon-wrapper">
                    <AlertCircle size={18} color="var(--danger)" />
                  </div>
                  <div className="kpi-title">প্রজেক্ট কিস্তি বকেয়া</div>
                </div>
                <div className="kpi-value">{formatBDT(stats.projectDueAmount)}</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="kpi-card accent">
                <div>
                  <div className="kpi-icon-wrapper">
                    <TrendingUp size={18} color="var(--accent)" />
                  </div>
                  <div className="kpi-title">মোট বিনিয়োগ</div>
                </div>
                <div className="kpi-value">{formatBDT(stats.totalInvestments)}</div>
              </div>

              <div className="kpi-card success">
                <div>
                  <div className="kpi-icon-wrapper">
                    <HandCoins size={18} color="var(--success)" />
                  </div>
                  <div className="kpi-title">কিস্তি আদায়</div>
                </div>
                <div className="kpi-value">{formatBDT(stats.totalInstallmentsCollected)}</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="kpi-card">
                <div>
                  <div className="kpi-icon-wrapper">
                    <LandmarkIcon size={18} color="var(--primary)" />
                  </div>
                  <div className="kpi-title">প্রজেক্ট মোট মুনাফা</div>
                </div>
                <div className="kpi-value">{formatBDT(stats.totalProfit)}</div>
              </div>

              <div className="kpi-card danger">
                <div>
                  <div className="kpi-icon-wrapper">
                    <AlertCircle size={18} color="var(--danger)" />
                  </div>
                  <div className="kpi-title">সর্বমোট বকেয়া</div>
                </div>
                <div className="kpi-value">{formatBDT(stats.totalDueAmount)}</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '5px solid var(--primary)' }}>
              <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                <h4 style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>চলতি সক্রিয় প্রজেক্ট সংখ্যা</h4>
                <h2 style={{ fontSize: 'var(--kpi-font)', marginTop: '4px' }}>{toBanglaNumber(stats.activeProjects)} টি</h2>
              </div>
              <CheckCircle2 size={36} color="var(--primary)" style={{ flexShrink: 0 }} />
            </div>
          </div>
        ) : memberStats ? (
          <div>
            {/* Member Custom View */}
            <div className="card" style={{ borderLeft: '5px solid var(--primary)', backgroundColor: 'white' }}>
              <div className="card-title">আমার অ্যাকাউন্ট বিবরণী</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>সদস্য আইডি:</span>
                  <span style={{ fontWeight: 'bold' }}>{toBanglaNumber(memberStats.memberId)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>মোবাইল নম্বর:</span>
                  <span>{toBanglaNumber(memberStats.mobile)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>সদস্যপদের স্থিতি:</span>
                  <span className={`list-badge ${memberStats.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {memberStats.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="kpi-card success">
                <div>
                  <div className="kpi-icon-wrapper">
                    <Landmark size={18} color="var(--success)" />
                  </div>
                  <div className="kpi-title">আমার মোট সঞ্চয় জমা</div>
                </div>
                <div className="kpi-value">{formatBDT(memberStats.totalDeposited)}</div>
              </div>

              <div className="kpi-card danger">
                <div>
                  <div className="kpi-icon-wrapper">
                    <AlertCircle size={18} color="var(--danger)" />
                  </div>
                  <div className="kpi-title">আমার মোট বকেয়া</div>
                </div>
                <div className="kpi-value">{formatBDT(memberStats.totalDue)}</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>নির্ধারিত মাসিক কিস্তির হার</span>
                <h3 style={{ fontSize: 'var(--kpi-font)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatBDT(memberStats.monthlyDepositAmount)}</h3>
              </div>
              <div style={{ textAlign: 'right', minWidth: 0, flex: 1 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>মোট জমাকৃত মাস</span>
                <h3 style={{ fontSize: 'var(--kpi-font)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toBanglaNumber(memberStats.monthsElapsed)} মাস</h3>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <p>আপনার কোনো সদস্য প্রোফাইল লিঙ্ক করা নেই। অনুগ্রহ করে পরিচালকের সাথে যোগাযোগ করুন।</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
