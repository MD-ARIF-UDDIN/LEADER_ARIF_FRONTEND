import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { toBanglaNumber, formatBDT, formatBanglaDate, formatBanglaMonth } from '../utils/bangla';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Plus, Search, Info, PlusCircle, History, Edit, X, Save, Calendar, Download, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function Members() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  // Lists & Filtering
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Modals state
  const [activeMemberDetail, setActiveMemberDetail] = useState(null); // Detailed member object
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Selected Member for operations
  // Selected Member for operations
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Form submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forms state
  const [memberForm, setMemberForm] = useState({
    name: '',
    mobile: '',
    address: '',
    nid: '',
    joiningDate: '',
    monthlyDepositAmount: '',
    status: 'active'
  });

  const [depositForm, setDepositForm] = useState({
    amount: '',
    month: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [depositsList, setDepositsList] = useState([]);

  // Fetch Members List
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/members');
      setMembers(data);
    } catch (err) {
      setError(err.message || 'সদস্য তালিকা লোড করা সম্ভব হয়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filtered members list
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.memberId.toLowerCase().includes(search.toLowerCase()) ||
    member.mobile.includes(search)
  );

  const handleExportExcel = () => {
    const cols = [
      { header: 'সদস্য আইডি', key: 'memberId' },
      { header: 'নাম', key: 'name' },
      { header: 'মোবাইল', key: 'mobile' },
      { header: 'ঠিকানা', key: 'address' },
      { header: 'জাতীয় পরিচয়পত্র', key: 'nid' },
      { header: 'যোগদানের তারিখ', key: 'joiningDateFormatted' },
      { header: 'মাসিক সঞ্চয়', key: 'monthlyDepositFormatted' },
      { header: 'মোট সঞ্চয় জমা', key: 'totalDepositedFormatted' },
      { header: 'মোট সঞ্চয় বকেয়া', key: 'totalDueFormatted' },
      { header: 'অবস্থা', key: 'statusFormatted' }
    ];
    const dataToExport = filteredMembers.map(m => ({
      ...m,
      joiningDateFormatted: formatBanglaDate(m.joiningDate),
      monthlyDepositFormatted: formatBDT(m.monthlyDepositAmount),
      totalDepositedFormatted: formatBDT(m.totalDeposited),
      totalDueFormatted: formatBDT(m.totalDue),
      statusFormatted: m.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'
    }));
    exportToExcel(dataToExport, cols, 'Member_List', 'সদস্য তালিকা');
  };

  const handleExportPDF = () => {
    const cols = [
      { header: 'আইডি', key: 'memberId' },
      { header: 'নাম', key: 'name' },
      { header: 'মোবাইল', key: 'mobile' },
      { header: 'মোট সঞ্চয়', key: 'totalDepositedFormatted' },
      { header: 'বকেয়া সঞ্চয়', key: 'totalDueFormatted' },
      { header: 'অবস্থা', key: 'statusFormatted' }
    ];
    const dataToExport = filteredMembers.map(m => ({
      ...m,
      totalDepositedFormatted: formatBDT(m.totalDeposited),
      totalDueFormatted: formatBDT(m.totalDue),
      statusFormatted: m.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'
    }));
    exportToPDF(dataToExport, cols, 'সদস্য তালিকা', 'Member_List');
  };

  // Handle Add Member Submit
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const promise = apiRequest('/api/members', {
      method: 'POST',
      body: memberForm
    });

    toast.promise(promise, {
      loading: 'যোগ করা হচ্ছে...',
      success: 'সদস্য সফলভাবে যোগ করা হয়েছে!',
      error: (err) => err.message || 'সদস্য যোগ করতে ব্যর্থ হয়েছে'
    });

    try {
      await promise;
      setShowAddModal(false);
      resetMemberForm();
      fetchMembers();
    } catch (err) {} finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Member Submit
  const handleEditMember = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const promise = apiRequest(`/api/members/${selectedMember._id}`, {
      method: 'PUT',
      body: memberForm
    });

    toast.promise(promise, {
      loading: 'আপডেট করা হচ্ছে...',
      success: 'তথ্য সফলভাবে আপডেট করা হয়েছে!',
      error: (err) => err.message || 'তথ্য পরিবর্তন করতে ব্যর্থ হয়েছে'
    });

    try {
      await promise;
      setShowEditModal(false);
      resetMemberForm();
      fetchMembers();
    } catch (err) {} finally {
      setIsSubmitting(false);
    }
  };

  // Handle Deposit Entry Submit
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const promise = apiRequest(`/api/members/${selectedMember._id}/deposit`, {
      method: 'POST',
      body: depositForm
    });

    toast.promise(promise, {
      loading: 'জমা রেকর্ড করা হচ্ছে...',
      success: 'সঞ্চয় সফলভাবে জমা হয়েছে!',
      error: (err) => err.message || 'জমা রেকর্ড করতে ব্যর্থ হয়েছে'
    });

    try {
      await promise;
      setShowDepositModal(false);
      fetchMembers();
      // If detail modal is open, refresh detail data
      if (activeMemberDetail && activeMemberDetail.member._id === selectedMember._id) {
        handleViewDetails(selectedMember._id);
      }
    } catch (err) {} finally {
      setIsSubmitting(false);
    }
  };

  // Fetch and show details
  const handleViewDetails = async (id) => {
    try {
      const details = await apiRequest(`/api/members/${id}`);
      setActiveMemberDetail(details);
    } catch (err) {
      toast.error('সদস্য তথ্য বিস্তারিত লোড করা যাচ্ছে না');
    }
  };

  // Fetch and show deposit history
  const handleViewHistory = async (member) => {
    setSelectedMember(member);
    try {
      const data = await apiRequest(`/api/members/${member._id}/history`);
      setDepositsList(data);
      setShowHistoryModal(true);
    } catch (err) {
      toast.error('জমা ইতিহাস লোড করা যাচ্ছে না');
    }
  };

  // Trigger deposit collection modal setup
  const handleOpenDepositModal = (member) => {
    setSelectedMember(member);
    
    // Set default amount to member's monthly rate
    // Set default month to current month YYYY-MM
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    setDepositForm({
      amount: member.monthlyDepositAmount,
      month: currentMonthStr,
      date: today.toISOString().split('T')[0]
    });
    setShowDepositModal(true);
  };

  // Trigger edit modal setup
  const handleOpenEditModal = (member) => {
    setSelectedMember(member);
    setMemberForm({
      name: member.name,
      mobile: member.mobile,
      address: member.address,
      nid: member.nid,
      joiningDate: new Date(member.joiningDate).toISOString().split('T')[0],
      monthlyDepositAmount: member.monthlyDepositAmount,
      status: member.status
    });
    setShowEditModal(true);
  };

  const resetMemberForm = () => {
    setMemberForm({
      name: '',
      mobile: '',
      address: '',
      nid: '',
      joiningDate: '',
      monthlyDepositAmount: '',
      status: 'active'
    });
    setSelectedMember(null);
  };

  // Generate Month list for select input (e.g. current year and previous year months)
  const getMonthDropdownOptions = () => {
    const list = [];
    const today = new Date();
    // Build options list for last 12 months and next 2 months
    for (let i = -12; i <= 2; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push(val);
    }
    return list;
  };

  return (
    <div className="app-container">
      <Header title="সদস্যবৃন্দ" />

      <main className="content-wrapper">
        
        {/* Header Action & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '1.05rem' }}>সদস্য তালিকা ({toBanglaNumber(filteredMembers.length)} জন)</h3>
          {isAdmin && (
            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: 'auto', minHeight: '38px', gap: '4px', flexShrink: 0 }}
              onClick={() => {
                resetMemberForm();
                setMemberForm(prev => ({
                  ...prev,
                  joiningDate: new Date().toISOString().split('T')[0]
                }));
                setShowAddModal(true);
              }}
            >
              <Plus size={16} />
              <span>সদস্য যোগ করুন</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="নাম, মোবাইল বা আইডি দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={handleExportExcel}
            className="btn"
            style={{
              flex: 1,
              background: 'white',
              border: '1px solid #cbd5e1',
              color: 'var(--primary-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              minHeight: '40px'
            }}
          >
            <Download size={14} color="#16a34a" />
            <span>Excel এক্সপোর্ট</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="btn"
            style={{
              flex: 1,
              background: 'white',
              border: '1px solid #cbd5e1',
              color: 'var(--primary-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              minHeight: '40px'
            }}
          >
            <FileText size={14} color="#dc2626" />
            <span>PDF এক্সপোর্ট</span>
          </button>
        </div>

        {error && (
          <div className="card" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Member list rendering */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>লোড হচ্ছে...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            কোনো সদস্য পাওয়া যায়নি
          </div>
        ) : (
          filteredMembers.map(member => (
            <div className="action-card" key={member._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--primary-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.5 }}>
                    আইডি: <strong>{toBanglaNumber(member.memberId)}</strong> · {toBanglaNumber(member.mobile)}
                  </p>
                </div>
                <span className={`list-badge ${member.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ flexShrink: 0 }}>
                  {member.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.8rem', minWidth: 0 }}>
                  সঞ্চয়: <strong style={{ color: 'var(--success)' }}>{formatBDT(member.totalDeposited)}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', minWidth: 0 }}>
                  বকেয়া: <strong style={member.totalDue > 0 ? { color: 'var(--danger)' } : { color: 'var(--success)' }}>{formatBDT(member.totalDue)}</strong>
                </div>
              </div>

              {/* Table Action Column Rules mapped as buttons */}
              <div className="list-actions">
                <button 
                  className="btn btn-outline btn-sm" 
                  style={{ flex: 1, minHeight: '36px', gap: '2px' }}
                  onClick={() => handleViewDetails(member._id)}
                >
                  <Info size={14} />
                  <span>বিস্তারিত</span>
                </button>

                {isAdmin && (
                  <button 
                    className="btn btn-accent btn-sm" 
                    style={{ flex: 1, minHeight: '36px', gap: '2px' }}
                    onClick={() => handleOpenDepositModal(member)}
                  >
                    <PlusCircle size={14} />
                    <span>জমা</span>
                  </button>
                )}

                <button 
                  className="btn btn-outline btn-sm" 
                  style={{ flex: 1, minHeight: '36px', gap: '2px' }}
                  onClick={() => handleViewHistory(member)}
                >
                  <History size={14} />
                  <span>ইতিহাস</span>
                </button>

                {isAdmin && (
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ flex: 1, minHeight: '36px', gap: '2px' }}
                    onClick={() => handleOpenEditModal(member)}
                  >
                    <Edit size={14} />
                    <span>এডিট</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* ----------------- MODAL: MEMBER DETAILS ----------------- */}
        {activeMemberDetail && (
          <div className="modal-overlay" onClick={() => setActiveMemberDetail(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>সদস্য বিস্তারিত বিবরণী</h3>
                <button className="modal-close" onClick={() => setActiveMemberDetail(null)}>
                  <X size={24} />
                </button>
              </div>

              {/* Personal Info Card */}
              <div className="card" style={{ borderLeft: '5px solid var(--primary)', padding: '12px' }}>
                <h4 style={{ marginBottom: '8px' }}>{activeMemberDetail.member.name}</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>সদস্য আইডি:</td>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>{toBanglaNumber(activeMemberDetail.member.memberId)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>মোবাইল নম্বর:</td>
                      <td style={{ padding: '4px 0' }}>{toBanglaNumber(activeMemberDetail.member.mobile)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>জাতীয় পরিচয়পত্র:</td>
                      <td style={{ padding: '4px 0' }}>{toBanglaNumber(activeMemberDetail.member.nid)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>যোগদানের তারিখ:</td>
                      <td style={{ padding: '4px 0' }}>{formatBanglaDate(activeMemberDetail.member.joiningDate)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>বর্তমান ঠিকানা:</td>
                      <td style={{ padding: '4px 0' }}>{activeMemberDetail.member.address}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>সদস্যপদ স্থিতি:</td>
                      <td style={{ padding: '4px 0' }}>
                        <span className={`list-badge ${activeMemberDetail.member.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {activeMemberDetail.member.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Balance Summary */}
              <div className="grid-2">
                <div className="kpi-card success" style={{ padding: '10px' }}>
                  <span className="kpi-title">মোট সঞ্চয় জমা</span>
                  <span className="kpi-value" style={{ fontSize: '1.15rem' }}>{formatBDT(activeMemberDetail.calculations.totalDeposited)}</span>
                </div>
                <div className="kpi-card danger" style={{ padding: '10px' }}>
                  <span className="kpi-title">মোট বকেয়া পরিমাণ</span>
                  <span className="kpi-value" style={{ fontSize: '1.15rem' }}>{formatBDT(activeMemberDetail.calculations.totalDue)}</span>
                </div>
              </div>

              <div className="card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>মাসিক সঞ্চয়ের কিস্তি হার</span>
                  <h4 style={{ fontSize: '1.1rem' }}>{formatBDT(activeMemberDetail.member.monthlyDepositAmount)}</h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>মোট হিসাবকৃত মাস</span>
                  <h4 style={{ fontSize: '1.1rem' }}>{toBanglaNumber(activeMemberDetail.calculations.monthsElapsed)} মাস</h4>
                </div>
              </div>

              {/* Month-by-month Schedule Checklist */}
              <h4 style={{ fontSize: '1rem', marginBottom: '8px', paddingLeft: '4px' }}>মাসভিত্তিক জমার বিবরণী</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <th style={{ padding: '8px' }}>মাস</th>
                      <th style={{ padding: '8px' }}>আদায়</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>স্থিতি</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeMemberDetail.schedule.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px' }}>{formatBanglaMonth(item.month)}</td>
                        <td style={{ padding: '8px' }}>{formatBDT(item.paidAmount)}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <span className={`list-badge ${
                            item.status === 'PAID' ? 'badge-success' : (item.status === 'PARTIAL' ? 'badge-warning' : 'badge-danger')
                          }`}>
                            {item.status === 'PAID' ? 'পরিশোধিত' : (item.status === 'PARTIAL' ? 'আংশিক' : 'বকেয়া')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isAdmin && (
                <button 
                  className="btn btn-accent" 
                  style={{ marginTop: '16px' }}
                  onClick={() => {
                    handleOpenDepositModal(activeMemberDetail.member);
                  }}
                >
                  <PlusCircle size={18} style={{ marginRight: '6px' }} />
                  <span>নতুন জমা এন্ট্রি করুন</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ----------------- MODAL: CREATE MEMBER ----------------- */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>নতুন সদস্য নিবন্ধন</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label className="form-label">সদস্যের নাম</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="যেমন: মোঃ আরিফ হোসেন"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    required
                    maxLength="11"
                    className="form-control"
                    placeholder="যেমন: 01700000000"
                    value={memberForm.mobile}
                    onChange={(e) => setMemberForm({ ...memberForm, mobile: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">জাতীয় পরিচয়পত্র (NID) নম্বর</label>
                  <input
                    type="number"
                    required
                    className="form-control"
                    placeholder="জাতীয় পরিচয়পত্র নম্বর দিন"
                    value={memberForm.nid}
                    onChange={(e) => setMemberForm({ ...memberForm, nid: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ঠিকানা</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="গ্রাম, ডাকঘর, থানা, জেলা"
                    value={memberForm.address}
                    onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">যোগদানের তারিখ</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={memberForm.joiningDate}
                    onChange={(e) => setMemberForm({ ...memberForm, joiningDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">মাসিক সঞ্চয়ের কিস্তি পরিমাণ (৳)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-control"
                    placeholder="যেমন: 500"
                    value={memberForm.monthlyDepositAmount}
                    onChange={(e) => setMemberForm({ ...memberForm, monthlyDepositAmount: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">সদস্যপদের স্থিতি</label>
                  <select
                    className="form-control"
                    value={memberForm.status}
                    onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                  >
                    <option value="active">সক্রিয়</option>
                    <option value="inactive">নিষ্ক্রিয়</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ gap: '8px' }} disabled={isSubmitting}>
                  <Save size={18} />
                  <span>{isSubmitting ? 'অপেক্ষা করুন...' : 'নিবন্ধন সম্পন্ন করুন'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: EDIT MEMBER ----------------- */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>সদস্য তথ্য পরিবর্তন</h3>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEditMember}>
                <div className="form-group">
                  <label className="form-label">সদস্যের নাম</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    required
                    maxLength="11"
                    className="form-control"
                    value={memberForm.mobile}
                    onChange={(e) => setMemberForm({ ...memberForm, mobile: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">জাতীয় পরিচয়পত্র (NID) নম্বর</label>
                  <input
                    type="number"
                    required
                    className="form-control"
                    value={memberForm.nid}
                    onChange={(e) => setMemberForm({ ...memberForm, nid: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ঠিকানা</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={memberForm.address}
                    onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">যোগদানের তারিখ</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={memberForm.joiningDate}
                    onChange={(e) => setMemberForm({ ...memberForm, joiningDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">মাসিক সঞ্চয়ের পরিমাণ (৳)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-control"
                    value={memberForm.monthlyDepositAmount}
                    onChange={(e) => setMemberForm({ ...memberForm, monthlyDepositAmount: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">সদস্যপদের স্থিতি</label>
                  <select
                    className="form-control"
                    value={memberForm.status}
                    onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                  >
                    <option value="active">সক্রিয়</option>
                    <option value="inactive">নিষ্ক্রিয়</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ gap: '8px' }} disabled={isSubmitting}>
                  <Save size={18} />
                  <span>{isSubmitting ? 'অপেক্ষা করুন...' : 'আপডেট সংরক্ষণ করুন'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: DEPOSIT ENTRY ----------------- */}
        {showDepositModal && selectedMember && (
          <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>মাসিক সঞ্চয় জমা এন্ট্রি</h3>
                <button className="modal-close" onClick={() => setShowDepositModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                সদস্য: <strong>{selectedMember.name}</strong> (আইডি: {toBanglaNumber(selectedMember.memberId)})
              </div>

              <form onSubmit={handleDepositSubmit}>
                <div className="form-group">
                  <label className="form-label">কোন মাসের সঞ্চয়?</label>
                  <select
                    required
                    className="form-control"
                    value={depositForm.month}
                    onChange={(e) => setDepositForm({ ...depositForm, month: e.target.value })}
                  >
                    <option value="">মাস নির্বাচন করুন...</option>
                    {getMonthDropdownOptions().map((mOption) => (
                      <option key={mOption} value={mOption}>
                        {formatBanglaMonth(mOption)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">জমার পরিমাণ (৳)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="form-control"
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">জমার তারিখ</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={depositForm.date}
                    onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-accent" style={{ gap: '8px' }} disabled={isSubmitting}>
                  <PlusCircle size={18} />
                  <span>{isSubmitting ? 'অপেক্ষা করুন...' : 'জমা নিশ্চিত করুন'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: DEPOSIT HISTORY ----------------- */}
        {showHistoryModal && selectedMember && (
          <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>সঞ্চয় জমা ইতিহাস</h3>
                <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                সদস্য: <strong>{selectedMember.name}</strong> (আইডি: {toBanglaNumber(selectedMember.memberId)})
              </div>

              {depositsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  কোনো জমার রেকর্ড পাওয়া যায়নি
                </div>
              ) : (
                <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <th style={{ padding: '8px' }}>মাস</th>
                        <th style={{ padding: '8px' }}>তারিখ</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {depositsList.map((dep) => (
                        <tr key={dep._id}>
                          <td style={{ padding: '8px' }}>{formatBanglaMonth(dep.month)}</td>
                          <td style={{ padding: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatBanglaDate(dep.date)}
                            {dep.recordedBy && <div style={{ fontSize: '0.65rem' }}>সংগ্রাহক: {dep.recordedBy.name}</div>}
                          </td>
                          <td style={{ padding: '8px', fontWeight: 'bold', textAlign: 'right', color: 'var(--success)' }}>
                            {formatBDT(dep.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
