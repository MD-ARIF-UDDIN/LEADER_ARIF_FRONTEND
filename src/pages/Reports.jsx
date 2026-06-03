import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { toBanglaNumber, formatBDT, formatBanglaDate, formatBanglaMonth } from '../utils/bangla';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Printer, Calendar, Search, Filter, Info, X, Download, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  // Filters
  const [filterType, setFilterType] = useState('month'); // 'date' | 'month' | 'year'
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Report tabs
  // 1: Member Deposits, 2: Member Dues, 3: Project Collections, 4: Project Dues, 5: Profits
  const [activeTab, setActiveTab] = useState(1);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detailed Modal states (when clicking Action column)
  const [activeMemberDetail, setActiveMemberDetail] = useState(null);
  const [activeProjectDetail, setActiveProjectDetail] = useState(null);

  // Fetch Report Data
  const fetchReport = async () => {
    setError('');
    setLoading(true);
    try {
      // Build query string
      let queryParams = '';
      if (filterType === 'date' && filterDate) {
        queryParams = `?date=${filterDate}`;
      } else if (filterType === 'month' && filterMonth) {
        queryParams = `?month=${filterMonth}`;
      } else if (filterType === 'year' && filterYear) {
        queryParams = `?year=${filterYear}`;
      }

      let endpoint = '';
      if (activeTab === 1) {
        endpoint = '/api/reports/member-deposits';
      } else if (activeTab === 2) {
        endpoint = '/api/reports/member-dues';
      } else if (activeTab === 3) {
        endpoint = '/api/reports/project-collections';
      } else if (activeTab === 4) {
        endpoint = '/api/reports/project-dues';
      } else if (activeTab === 5) {
        endpoint = '/api/reports/profits';
      }

      const data = await apiRequest(`${endpoint}${queryParams}`);
      
      // If role is member, filter reports to only show their own data
      if (user.role === 'member') {
        if (activeTab === 1) {
          // Member Deposits: Filter by member._id
          setReportData(data.filter(item => item.member && String(item.member._id) === String(user.memberId)));
        } else if (activeTab === 2) {
          // Member Dues: Filter by member _id
          setReportData(data.filter(item => String(item._id) === String(user.memberId)));
        } else {
          setReportData([]);
        }
      } else {
        setReportData(data);
      }
    } catch (err) {
      setError(err.message || 'রিপোর্ট ডাটা লোড করা সম্ভব হয়নি');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, filterType, filterDate, filterMonth, filterYear]);

  // Handler for Member Detail lookup in Action Column
  const handleViewMemberDetails = async (id) => {
    try {
      const details = await apiRequest(`/api/members/${id}`);
      setActiveMemberDetail(details);
    } catch (err) {
      toast.error('সদস্য তথ্য লোড করা যায়নি');
    }
  };

  // Handler for Project Detail lookup in Action Column
  const handleViewProjectDetails = async (id) => {
    try {
      const details = await apiRequest(`/api/projects/${id}`);
      setActiveProjectDetail(details);
    } catch (err) {
      toast.error('প্রজেক্ট তথ্য লোড করা যায়নি');
    }
  };

  // Calculate sum of amount column
  const calculateTotalAmount = () => {
    if (activeTab === 1 || activeTab === 3) {
      return reportData.reduce((sum, item) => sum + item.amount, 0);
    } else if (activeTab === 2) {
      return reportData.reduce((sum, item) => sum + item.totalDue, 0);
    } else if (activeTab === 4) {
      return reportData.reduce((sum, item) => sum + item.totalDue, 0);
    } else if (activeTab === 5) {
      return reportData.reduce((sum, item) => sum + item.profit, 0);
    }
    return 0;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    let cols = [];
    let dataToExport = [];
    let filename = '';
    let sheetName = '';

    if (activeTab === 1) {
      cols = [
        { header: 'সদস্য আইডি', key: 'memberId' },
        { header: 'সদস্য নাম', key: 'memberName' },
        { header: 'মোবাইল', key: 'memberMobile' },
        { header: 'মাস', key: 'monthFormatted' },
        { header: 'তারিখ', key: 'dateFormatted' },
        { header: 'পরিমাণ', key: 'amountFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        memberId: row.member?.memberId || '',
        memberName: row.member?.name || 'মুছে ফেলা সদস্য',
        memberMobile: row.member?.mobile || '',
        monthFormatted: formatBanglaMonth(row.month),
        dateFormatted: formatBanglaDate(row.date),
        amountFormatted: formatBDT(row.amount)
      }));
      filename = 'Savings_Deposits';
      sheetName = 'সঞ্চয় জমা';
    } else if (activeTab === 2) {
      cols = [
        { header: 'সদস্য আইডি', key: 'memberId' },
        { header: 'সদস্য নাম', key: 'name' },
        { header: 'মোবাইল', key: 'mobile' },
        { header: 'মাসিক সঞ্চয় কিস্তি', key: 'monthlyDepositAmountFormatted' },
        { header: 'মোট বকেয়া', key: 'totalDueFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        memberId: row.memberId,
        name: row.name,
        mobile: row.mobile,
        monthlyDepositAmountFormatted: formatBDT(row.monthlyDepositAmount),
        totalDueFormatted: formatBDT(row.totalDue)
      }));
      filename = 'Member_Dues';
      sheetName = 'সদস্য বকেয়া';
    } else if (activeTab === 3) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'চালক মোবাইল', key: 'driverMobile' },
        { header: 'মাস', key: 'monthFormatted' },
        { header: 'তারিখ', key: 'dateFormatted' },
        { header: 'পরিমাণ', key: 'amountFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.project?.projectName || 'মুছে ফেলা প্রজেক্ট',
        driverName: row.project?.driverName || '',
        driverMobile: row.project?.driverMobile || '',
        monthFormatted: formatBanglaMonth(row.month),
        dateFormatted: formatBanglaDate(row.date),
        amountFormatted: formatBDT(row.amount)
      }));
      filename = 'Project_Installment_Collections';
      sheetName = 'কিস্তি আদায়';
    } else if (activeTab === 4) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'চালক মোবাইল', key: 'driverMobile' },
        { header: 'বিনিয়োগ পরিমাণ', key: 'investmentAmountFormatted' },
        { header: 'মোট ফেরত লক্ষ্য', key: 'returnAmountFormatted' },
        { header: 'মোট আদায়কৃত', key: 'totalPaidFormatted' },
        { header: 'অবशिष्ट পাওনা', key: 'remainingBalanceFormatted' },
        { header: 'মোট বকেয়া', key: 'totalDueFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.projectName,
        driverName: row.driverName,
        driverMobile: row.driverMobile,
        investmentAmountFormatted: formatBDT(row.investmentAmount),
        returnAmountFormatted: formatBDT(row.returnAmount),
        totalPaidFormatted: formatBDT(row.totalPaid),
        remainingBalanceFormatted: formatBDT(row.remainingBalance),
        totalDueFormatted: formatBDT(row.totalDue)
      }));
      filename = 'Project_Dues';
      sheetName = 'বিনিয়োগ বকেয়া';
    } else if (activeTab === 5) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'প্রজেক্ট ধরন', key: 'projectType' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'বিনিয়োগ পরিমাণ', key: 'investmentAmountFormatted' },
        { header: 'ফেরত লক্ষ্য', key: 'returnAmountFormatted' },
        { header: 'মোট আদায়কৃত', key: 'totalPaidFormatted' },
        { header: 'প্রজেক্ট মুনাফা', key: 'profitFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.projectName,
        projectType: row.projectType,
        driverName: row.driverName,
        investmentAmountFormatted: formatBDT(row.investmentAmount),
        returnAmountFormatted: formatBDT(row.returnAmount),
        totalPaidFormatted: formatBDT(row.totalPaid),
        profitFormatted: formatBDT(row.profit)
      }));
      filename = 'Profit_Report';
      sheetName = 'মুনাফা রিপোর্ট';
    }

    exportToExcel(dataToExport, cols, filename, sheetName);
  };

  const handleExportPDF = () => {
    let cols = [];
    let dataToExport = [];
    let title = '';
    let filename = '';

    if (activeTab === 1) {
      cols = [
        { header: 'সদস্য আইডি', key: 'memberId' },
        { header: 'সদস্য নাম', key: 'memberName' },
        { header: 'মাস', key: 'monthFormatted' },
        { header: 'পরিমাণ', key: 'amountFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        memberId: row.member?.memberId || '',
        memberName: row.member?.name || 'মুছে ফেলা সদস্য',
        monthFormatted: formatBanglaMonth(row.month),
        amountFormatted: formatBDT(row.amount)
      }));
      title = 'সঞ্চয় জমা রিপোর্ট';
      filename = 'Savings_Deposits';
    } else if (activeTab === 2) {
      cols = [
        { header: 'সদস্য আইডি', key: 'memberId' },
        { header: 'সদস্য নাম', key: 'name' },
        { header: 'মোবাইল', key: 'mobile' },
        { header: 'মোট বকেয়া', key: 'totalDueFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        memberId: row.memberId,
        name: row.name,
        mobile: row.mobile,
        totalDueFormatted: formatBDT(row.totalDue)
      }));
      title = 'সদস্য বকেয়া রিপোর্ট';
      filename = 'Member_Dues';
    } else if (activeTab === 3) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'মাস', key: 'monthFormatted' },
        { header: 'পরিমাণ', key: 'amountFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.project?.projectName || 'মুছে ফেলা প্রজেক্ট',
        driverName: row.project?.driverName || '',
        monthFormatted: formatBanglaMonth(row.month),
        amountFormatted: formatBDT(row.amount)
      }));
      title = 'প্রজেক্ট কিস্তি আদায় রিপোর্ট';
      filename = 'Project_Installment_Collections';
    } else if (activeTab === 4) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'আদায়কৃত', key: 'totalPaidFormatted' },
        { header: 'মোট বকেয়া', key: 'totalDueFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.projectName,
        driverName: row.driverName,
        totalPaidFormatted: formatBDT(row.totalPaid),
        totalDueFormatted: formatBDT(row.totalDue)
      }));
      title = 'বিনিয়োগ বকেয়া রিপোর্ট';
      filename = 'Project_Dues';
    } else if (activeTab === 5) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'বিনিয়োগ', key: 'investmentAmountFormatted' },
        { header: 'মুনাফা', key: 'profitFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.projectName,
        driverName: row.driverName,
        investmentAmountFormatted: formatBDT(row.investmentAmount),
        profitFormatted: formatBDT(row.profit)
      }));
      title = 'মুনাফা রিপোর্ট';
      filename = 'Profit_Report';
    }

    exportToPDF(dataToExport, cols, title, filename);
  };

  return (
    <div className="app-container">
      <Header title="রিপোর্ট ও হিসাব" />

      <main className="content-wrapper">

        {/* Report Tabs (Filter out Project and Profit reports for normal members) */}
        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            সঞ্চয় জমা
          </button>
          <button 
            className={`tab-btn ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => setActiveTab(2)}
          >
            সদস্য বকেয়া
          </button>
          
          {isAdmin && (
            <>
              <button 
                className={`tab-btn ${activeTab === 3 ? 'active' : ''}`}
                onClick={() => setActiveTab(3)}
              >
                কিস্তি আদায়
              </button>
              <button 
                className={`tab-btn ${activeTab === 4 ? 'active' : ''}`}
                onClick={() => setActiveTab(4)}
              >
                বিনিয়োগ বকেয়া
              </button>
              <button 
                className={`tab-btn ${activeTab === 5 ? 'active' : ''}`}
                onClick={() => setActiveTab(5)}
              >
                মুনাফা
              </button>
            </>
          )}
        </div>

        {/* Filters Panel (Dues and Profit reports don't need Date/Month filters, they are cumulative) */}
        {activeTab !== 2 && activeTab !== 4 && activeTab !== 5 && (
          <div className="card" style={{ padding: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <button 
                className={`btn btn-sm ${filterType === 'date' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, minHeight: '36px' }}
                onClick={() => setFilterType('date')}
              >
                তারিখ ফিল্টার
              </button>
              <button 
                className={`btn btn-sm ${filterType === 'month' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, minHeight: '36px' }}
                onClick={() => setFilterType('month')}
              >
                মাস ফিল্টার
              </button>
              <button 
                className={`btn btn-sm ${filterType === 'year' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, minHeight: '36px' }}
                onClick={() => setFilterType('year')}
              >
                বছর ফিল্টার
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              {filterType === 'date' && (
                <input
                  type="date"
                  className="form-control"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              )}
              {filterType === 'month' && (
                <input
                  type="month"
                  className="form-control"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                />
              )}
              {filterType === 'year' && (
                <select
                  className="form-control"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="2025">২০২৫ সাল</option>
                  <option value="2026">২০২৬ সাল</option>
                  <option value="2027">২০২৭ সাল</option>
                  <option value="2028">২০২৮ সাল</option>
                </select>
              )}
            </div>
          </div>
        )}

        {/* Print / Action Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            মোট রেকর্ড: <strong>{toBanglaNumber(reportData.length)}</strong> টি
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              className="btn btn-outline btn-sm" 
              style={{ width: 'auto', minHeight: '36px', gap: '4px', padding: '6px 10px', fontSize: '0.8rem', background: 'white' }}
              onClick={handlePrint}
            >
              <Printer size={14} />
              <span>প্রিন্ট</span>
            </button>
            <button 
              className="btn btn-outline btn-sm" 
              style={{ width: 'auto', minHeight: '36px', gap: '4px', padding: '6px 10px', fontSize: '0.8rem', background: 'white', color: 'var(--success)' }}
              onClick={handleExportExcel}
            >
              <Download size={14} color="#16a34a" />
              <span>Excel</span>
            </button>
            <button 
              className="btn btn-outline btn-sm" 
              style={{ width: 'auto', minHeight: '36px', gap: '4px', padding: '6px 10px', fontSize: '0.8rem', background: 'white', color: 'var(--danger)' }}
              onClick={handleExportPDF}
            >
              <FileText size={14} color="#dc2626" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="card" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Report Tables */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>লোড হচ্ছে...</div>
        ) : reportData.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            কোনো ডাটা পাওয়া যায়নি
          </div>
        ) : (
          <div>
            <div className="table-container">
              {/* Tab 1: Member Savings Deposits */}
              {activeTab === 1 && (
                <table>
                  <thead>
                    <tr>
                      <th>সদস্য</th>
                      <th>মাস</th>
                      <th>পরিমাণ</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{row.member?.name || 'মুছে ফেলা সদস্য'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>আইডি: {toBanglaNumber(row.member?.memberId || '')}</div>
                        </td>
                        <td>{formatBanglaMonth(row.month)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{formatBDT(row.amount)}</td>
                        <td>
                          {row.member && (
                            <button 
                              className="btn btn-outline btn-sm" 
                              style={{ padding: '2px 6px', minHeight: '28px' }}
                              onClick={() => handleViewMemberDetails(row.member._id)}
                            >
                              <Info size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 2: Member Savings Dues */}
              {activeTab === 2 && (
                <table>
                  <thead>
                    <tr>
                      <th>সদস্য</th>
                      <th>মাসিক কিস্তি</th>
                      <th>মোট বকেয়া</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{row.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>আইডি: {toBanglaNumber(row.memberId)}</div>
                        </td>
                        <td>{formatBDT(row.monthlyDepositAmount)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{formatBDT(row.totalDue)}</td>
                        <td>
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ padding: '2px 6px', minHeight: '28px' }}
                            onClick={() => handleViewMemberDetails(row._id)}
                          >
                            <Info size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 3: Project Installment Collections */}
              {activeTab === 3 && (
                <table>
                  <thead>
                    <tr>
                      <th>প্রজেক্ট</th>
                      <th>মাস</th>
                      <th>আদায়</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{row.project?.projectName || 'মুছে ফেলা প্রজেক্ট'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>চালক: <strong style={{ fontWeight: 'bold', color: '#1e293b' }}>{row.project?.driverName}</strong></div>
                        </td>
                        <td>{formatBanglaMonth(row.month)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{formatBDT(row.amount)}</td>
                        <td>
                          {row.project && (
                            <button 
                              className="btn btn-outline btn-sm" 
                              style={{ padding: '2px 6px', minHeight: '28px' }}
                              onClick={() => handleViewProjectDetails(row.project._id)}
                            >
                              <Info size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 4: Project Dues */}
              {activeTab === 4 && (
                <table>
                  <thead>
                    <tr>
                      <th>প্রজেক্ট</th>
                      <th>অবশিষ্ট পাওনা</th>
                      <th>মোট বকেয়া</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{row.projectName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>চালক: <strong style={{ fontWeight: 'bold', color: '#1e293b' }}>{row.driverName}</strong></div>
                        </td>
                        <td>{formatBDT(row.remainingBalance)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{formatBDT(row.totalDue)}</td>
                        <td>
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ padding: '2px 6px', minHeight: '28px' }}
                            onClick={() => handleViewProjectDetails(row._id)}
                          >
                            <Info size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 5: Profit Report */}
              {activeTab === 5 && (
                <table>
                  <thead>
                    <tr>
                      <th>প্রজেক্ট</th>
                      <th>বিনিয়োগ/ফেরত</th>
                      <th>মোট মুনাফা</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{row.projectName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ধরন: {row.projectType}</div>
                        </td>
                        <td>
                          <div style={{ color: 'var(--text-muted)' }}>বিনিয়োগ: {toBanglaNumber(row.investmentAmount)}</div>
                          <div style={{ color: 'var(--success)' }}>ফেরত: {toBanglaNumber(row.returnAmount)}</div>
                        </td>
                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{formatBDT(row.profit)}</td>
                        <td>
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ padding: '2px 6px', minHeight: '28px' }}
                            onClick={() => handleViewProjectDetails(row._id)}
                          >
                            <Info size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Sum Aggregate Summary Panel */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '5px solid var(--accent)' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {activeTab === 1 && 'নির্বাচিত সময়ে মোট সঞ্চয় জমা'}
                  {activeTab === 2 && 'মোট বকেয়া সঞ্চয় পরিমাণ'}
                  {activeTab === 3 && 'নির্বাচিত সময়ে মোট কিস্তি আদায়'}
                  {activeTab === 4 && 'মোট বকেয়া কিস্তি পরিমাণ'}
                  {activeTab === 5 && 'মোট প্রাক্কলিত মুনাফা'}
                </h4>
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
                {formatBDT(calculateTotalAmount())}
              </h3>
            </div>
          </div>
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

              <div className="card" style={{ borderLeft: '5px solid var(--primary)', padding: '12px' }}>
                <h4 style={{ marginBottom: '8px' }}>{activeMemberDetail.member.name}</h4>
                <table style={{ width: '100%', fontSize: '0.85rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>সদস্য আইডি:</td>
                      <td style={{ fontWeight: 'bold' }}>{toBanglaNumber(activeMemberDetail.member.memberId)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>মোবাইল নম্বর:</td>
                      <td>{toBanglaNumber(activeMemberDetail.member.mobile)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>যোগদানের তারিখ:</td>
                      <td>{formatBanglaDate(activeMemberDetail.member.joiningDate)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>মাসিক সঞ্চয় হার:</td>
                      <td style={{ fontWeight: 'bold' }}>{formatBDT(activeMemberDetail.member.monthlyDepositAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid-2" style={{ marginBottom: 0 }}>
                <div className="kpi-card success" style={{ padding: '8px' }}>
                  <span className="kpi-title" style={{ fontSize: '0.75rem' }}>মোট সঞ্চয়</span>
                  <span className="kpi-value" style={{ fontSize: '1rem' }}>{formatBDT(activeMemberDetail.calculations.totalDeposited)}</span>
                </div>
                <div className="kpi-card danger" style={{ padding: '8px' }}>
                  <span className="kpi-title" style={{ fontSize: '0.75rem' }}>মোট বকেয়া</span>
                  <span className="kpi-value" style={{ fontSize: '1rem' }}>{formatBDT(activeMemberDetail.calculations.totalDue)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: PROJECT DETAILS ----------------- */}
        {activeProjectDetail && (
          <div className="modal-overlay" onClick={() => setActiveProjectDetail(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>বিনিয়োগ বিস্তারিত বিবরণী</h3>
                <button className="modal-close" onClick={() => setActiveProjectDetail(null)}>
                  <X size={24} />
                </button>
              </div>

              <div className="card" style={{ borderLeft: '5px solid var(--primary)', padding: '12px' }}>
                <h4 style={{ marginBottom: '8px' }}>{activeProjectDetail.project.projectName}</h4>
                <table style={{ width: '100%', fontSize: '0.85rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>চালকের নাম:</td>
                      <td style={{ fontWeight: 'bold' }}>{activeProjectDetail.project.driverName}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>যোগাযোগ:</td>
                      <td style={{ fontWeight: 'bold' }}>{toBanglaNumber(activeProjectDetail.project.driverMobile)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>মূলধন বিনিয়োগ:</td>
                      <td style={{ fontWeight: 'bold' }}>{formatBDT(activeProjectDetail.project.investmentAmount)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>ফেরত লক্ষ্যমাত্রা:</td>
                      <td style={{ fontWeight: 'bold' }}>{formatBDT(activeProjectDetail.project.returnAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="kpi-card success" style={{ padding: '8px' }}>
                  <span className="kpi-title" style={{ fontSize: '0.75rem' }}>আদায়কৃত</span>
                  <span className="kpi-value" style={{ fontSize: '1rem' }}>{formatBDT(activeProjectDetail.calculations.totalPaid)}</span>
                </div>
                <div className="kpi-card danger" style={{ padding: '8px' }}>
                  <span className="kpi-title" style={{ fontSize: '0.75rem' }}>বকেয়া</span>
                  <span className="kpi-value" style={{ fontSize: '1rem' }}>{formatBDT(activeProjectDetail.calculations.totalDue)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
