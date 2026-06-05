import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { toBanglaNumber, formatBDT, formatBanglaDate, formatBanglaMonth } from '../utils/bangla';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Printer, Calendar, Search, Filter, Info, X, Download, FileText, Award } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  const getCategoryLabel = (cat) => {
    const categories = {
      'function': 'অনুষ্ঠান',
      'document': 'কাগজপত্র ও দলিল',
      'tea_snacks': 'চা-নাস্তা',
      'office': 'অফিস খরচ',
      'other': 'অন্যান্য'
    };
    return categories[cat] || 'অন্যান্য';
  };

  // Filters
  const [filterType, setFilterType] = useState('month'); // 'date' | 'month' | 'year' | 'custom' | 'alltime'
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Report tabs
  // 1: Member Deposits, 2: Member Dues, 3: Project Collections, 4: Project Dues, 5: Profits
  const [activeTab, setActiveTab] = useState(1);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detailed Modal states (when clicking Action column)
  const [activeMemberDetail, setActiveMemberDetail] = useState(null);
  const [activeProjectDetail, setActiveProjectDetail] = useState(null);
  const [allProjects, setAllProjects] = useState([]);

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
      } else if (filterType === 'custom' && filterStartDate && filterEndDate) {
        queryParams = `?startDate=${filterStartDate}&endDate=${filterEndDate}`;
      }
      // filterType === 'alltime' sends no params → backend returns all records

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
      } else if (activeTab === 6) {
        endpoint = '/api/expenses';
      }

      const data = await apiRequest(`${endpoint}${queryParams}`);
      // All roles see all data — members can view but not manipulate
      setReportData(data);
    } catch (err) {
      setError(err.message || 'রিপোর্ট ডাটা লোড করা সম্ভব হয়নি');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 6) {
      setFilterType('alltime');
    }
  }, [activeTab]);

  useEffect(() => {
    fetchReport();
  }, [activeTab, filterType, filterDate, filterMonth, filterYear, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (isAdmin && (activeTab === 3 || activeTab === 4 || activeTab === 5)) {
      const fetchAllProjects = async () => {
        try {
          const data = await apiRequest('/api/projects');
          setAllProjects(data);
        } catch (err) {
          console.error('Failed to fetch projects for driver ranking', err);
        }
      };
      fetchAllProjects();
    }
  }, [activeTab, isAdmin]);

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
    if (activeTab === 1 || activeTab === 3 || activeTab === 6) {
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
        { header: 'তারিখ', key: 'dateFormatted' },
        { header: 'মাস', key: 'monthFormatted' },
        { header: 'পরিমাণ', key: 'amountFormatted' },
        { header: 'সংগ্রহকারী', key: 'recordedBy' }
      ];
      dataToExport = reportData.map(row => ({
        memberId: row.member?.memberId || '',
        memberName: row.member?.name || 'মুছে ফেলা সদস্য',
        memberMobile: row.member?.mobile || '',
        dateFormatted: formatBanglaDate(row.date),
        monthFormatted: formatBanglaMonth(row.month),
        amountFormatted: formatBDT(row.amount),
        recordedBy: row.recordedBy?.name || 'N/A'
      }));
      filename = 'Savings_Deposits';
      sheetName = 'সঞ্চয় জমা';
    } else if (activeTab === 2) {
      cols = [
        { header: 'সদস্য আইডি', key: 'memberId' },
        { header: 'সদস্য নাম', key: 'name' },
        { header: 'মোবাইল', key: 'mobile' },
        { header: 'মাসিক সঞ্চয় কিস্তি', key: 'monthlyDepositAmountFormatted' },
        { header: 'মোট জমাকৃত', key: 'totalDepositedFormatted' },
        { header: 'মোট বকেয়া', key: 'totalDueFormatted' },
        { header: 'অবস্থা', key: 'statusFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        memberId: row.memberId,
        name: row.name,
        mobile: row.mobile,
        monthlyDepositAmountFormatted: formatBDT(row.monthlyDepositAmount),
        totalDepositedFormatted: formatBDT(row.totalDeposited),
        totalDueFormatted: formatBDT(row.totalDue),
        statusFormatted: row.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'
      }));
      filename = 'Member_Dues';
      sheetName = 'সদস্য বকেয়া';
    } else if (activeTab === 3) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'প্রজেক্ট ধরন', key: 'projectType' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'চালক মোবাইল', key: 'driverMobile' },
        { header: 'তারিখ', key: 'dateFormatted' },
        { header: 'মাস', key: 'monthFormatted' },
        { header: 'আদায় পরিমাণ', key: 'amountFormatted' },
        { header: 'সংগ্রহকারী', key: 'recordedBy' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.project?.projectName || 'মুছে ফেলা প্রজেক্ট',
        projectType: row.project?.projectType || 'N/A',
        driverName: row.project?.driverName || '',
        driverMobile: row.project?.driverMobile || '',
        dateFormatted: formatBanglaDate(row.date),
        monthFormatted: formatBanglaMonth(row.month),
        amountFormatted: formatBDT(row.amount),
        recordedBy: row.recordedBy?.name || 'N/A'
      }));
      filename = 'Project_Installment_Collections';
      sheetName = 'কিস্তি আদায়';
    } else if (activeTab === 4) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'প্রজেক্ট ধরন', key: 'projectType' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'চালক মোবাইল', key: 'driverMobile' },
        { header: 'বিনিয়োগ পরিমাণ', key: 'investmentAmountFormatted' },
        { header: 'মোট ফেরত লক্ষ্য', key: 'returnAmountFormatted' },
        { header: 'মাসিক কিস্তি হার', key: 'monthlyInstallmentAmountFormatted' },
        { header: 'মোট আদায়কৃত', key: 'totalPaidFormatted' },
        { header: 'অবशिष्ट পাওনা', key: 'remainingBalanceFormatted' },
        { header: 'মোট বকেয়া', key: 'totalDueFormatted' },
        { header: 'অবস্থা', key: 'statusFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.projectName,
        projectType: row.projectType,
        driverName: row.driverName,
        driverMobile: row.driverMobile,
        investmentAmountFormatted: formatBDT(row.investmentAmount),
        returnAmountFormatted: formatBDT(row.returnAmount),
        monthlyInstallmentAmountFormatted: formatBDT(row.monthlyInstallmentAmount),
        totalPaidFormatted: formatBDT(row.totalPaid),
        remainingBalanceFormatted: formatBDT(row.remainingBalance),
        totalDueFormatted: formatBDT(row.totalDue),
        statusFormatted: row.status === 'completed' ? 'সম্পন্ন' : (row.status === 'due' ? 'বকেয়া' : 'চলতি')
      }));
      filename = 'Project_Dues';
      sheetName = 'বিনিয়োগ বকেয়া';
    } else if (activeTab === 5) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'প্রজেক্ট ধরন', key: 'projectType' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'চালক মোবাইল', key: 'driverMobile' },
        { header: 'বিনিয়োগ পরিমাণ', key: 'investmentAmountFormatted' },
        { header: 'ফেরত লক্ষ্য', key: 'returnAmountFormatted' },
        { header: 'মোট আদায়কৃত', key: 'totalPaidFormatted' },
        { header: 'প্রজেক্ট মুনাফা', key: 'profitFormatted' },
        { header: 'অবস্থা', key: 'statusFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.projectName,
        projectType: row.projectType,
        driverName: row.driverName || 'N/A',
        driverMobile: row.driverMobile || '',
        investmentAmountFormatted: formatBDT(row.investmentAmount),
        returnAmountFormatted: formatBDT(row.returnAmount),
        totalPaidFormatted: formatBDT(row.totalPaid),
        profitFormatted: formatBDT(row.profit),
        statusFormatted: row.status === 'completed' ? 'সম্পন্ন' : (row.status === 'due' ? 'বকেয়া' : 'চলতি')
      }));
      filename = 'Profit_Report';
      sheetName = 'মুনাফা রিপোর্ট';
    } else if (activeTab === 6) {
      const categories = {
        'function': 'অনুষ্ঠান',
        'document': 'কাগজপত্র ও দলিল',
        'tea_snacks': 'চা-নাস্তা',
        'office': 'অফিস খরচ',
        'other': 'অন্যান্য'
      };
      cols = [
        { header: 'শিরোনাম', key: 'title' },
        { header: 'ক্যাটাগরি', key: 'categoryLabel' },
        { header: 'পরিমাণ', key: 'amountFormatted' },
        { header: 'তারিখ', key: 'dateFormatted' },
        { header: 'রেকর্ডকারী', key: 'recordedBy' },
        { header: 'বিবরণ', key: 'description' }
      ];
      dataToExport = reportData.map(row => ({
        title: row.title,
        categoryLabel: categories[row.category] || 'অন্যান্য',
        amountFormatted: formatBDT(row.amount),
        dateFormatted: formatBanglaDate(row.date),
        recordedBy: row.recordedBy?.name || 'N/A',
        description: row.description || ''
      }));
      filename = 'Expense_Report';
      sheetName = 'খরচ রিপোর্ট';
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
        { header: 'মোবাইল', key: 'memberMobile' },
        { header: 'তারিখ', key: 'dateFormatted' },
        { header: 'মাস', key: 'monthFormatted' },
        { header: 'পরিমাণ', key: 'amountFormatted' },
        { header: 'সংগ্রহকারী', key: 'recordedBy' }
      ];
      dataToExport = reportData.map(row => ({
        memberId: row.member?.memberId || '',
        memberName: row.member?.name || 'মুছে ফেলা সদস্য',
        memberMobile: row.member?.mobile || '',
        dateFormatted: formatBanglaDate(row.date),
        monthFormatted: formatBanglaMonth(row.month),
        amountFormatted: formatBDT(row.amount),
        recordedBy: row.recordedBy?.name || 'N/A'
      }));
      title = 'সঞ্চয় জমা রিপোর্ট';
      filename = 'Savings_Deposits';
    } else if (activeTab === 2) {
      cols = [
        { header: 'সদস্য আইডি', key: 'memberId' },
        { header: 'সদস্য নাম', key: 'name' },
        { header: 'মোবাইল', key: 'mobile' },
        { header: 'মাসিক সঞ্চয় কিস্তি', key: 'monthlyDepositAmountFormatted' },
        { header: 'মোট জমাকৃত', key: 'totalDepositedFormatted' },
        { header: 'মোট বকেয়া', key: 'totalDueFormatted' },
        { header: 'অবস্থা', key: 'statusFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        memberId: row.memberId,
        name: row.name,
        mobile: row.mobile,
        monthlyDepositAmountFormatted: formatBDT(row.monthlyDepositAmount),
        totalDepositedFormatted: formatBDT(row.totalDeposited),
        totalDueFormatted: formatBDT(row.totalDue),
        statusFormatted: row.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'
      }));
      title = 'সদস্য বকেয়া রিপোর্ট';
      filename = 'Member_Dues';
    } else if (activeTab === 3) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'প্রজেক্ট ধরন', key: 'projectType' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'চালক মোবাইল', key: 'driverMobile' },
        { header: 'তারিখ', key: 'dateFormatted' },
        { header: 'মাস', key: 'monthFormatted' },
        { header: 'পরিমাণ', key: 'amountFormatted' },
        { header: 'সংগ্রহকারী', key: 'recordedBy' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.project?.projectName || 'মুছে ফেলা প্রজেক্ট',
        projectType: row.project?.projectType || 'N/A',
        driverName: row.project?.driverName || '',
        driverMobile: row.project?.driverMobile || '',
        dateFormatted: formatBanglaDate(row.date),
        monthFormatted: formatBanglaMonth(row.month),
        amountFormatted: formatBDT(row.amount),
        recordedBy: row.recordedBy?.name || 'N/A'
      }));
      title = 'প্রজেক্ট কিস্তি আদায় রিপোর্ট';
      filename = 'Project_Installment_Collections';
    } else if (activeTab === 4) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'প্রজেক্ট ধরন', key: 'projectType' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'চালক মোবাইল', key: 'driverMobile' },
        { header: 'বিনিয়োগ পরিমাণ', key: 'investmentAmountFormatted' },
        { header: 'মোট ফেরত লক্ষ্য', key: 'returnAmountFormatted' },
        { header: 'মাসিক কিস্তি হার', key: 'monthlyInstallmentAmountFormatted' },
        { header: 'মোট আদায়কৃত', key: 'totalPaidFormatted' },
        { header: 'অবशिष्ट পাওনা', key: 'remainingBalanceFormatted' },
        { header: 'মোট বকেয়া', key: 'totalDueFormatted' },
        { header: 'অবস্থা', key: 'statusFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.projectName,
        projectType: row.projectType,
        driverName: row.driverName,
        driverMobile: row.driverMobile,
        investmentAmountFormatted: formatBDT(row.investmentAmount),
        returnAmountFormatted: formatBDT(row.returnAmount),
        monthlyInstallmentAmountFormatted: formatBDT(row.monthlyInstallmentAmount),
        totalPaidFormatted: formatBDT(row.totalPaid),
        remainingBalanceFormatted: formatBDT(row.remainingBalance),
        totalDueFormatted: formatBDT(row.totalDue),
        statusFormatted: row.status === 'completed' ? 'সম্পন্ন' : (row.status === 'due' ? 'বকেয়া' : 'চলতি')
      }));
      title = 'বিনিয়োগ বকেয়া রিপোর্ট';
      filename = 'Project_Dues';
    } else if (activeTab === 5) {
      cols = [
        { header: 'প্রজেক্ট নাম', key: 'projectName' },
        { header: 'প্রজেক্ট ধরন', key: 'projectType' },
        { header: 'চালক নাম', key: 'driverName' },
        { header: 'চালক মোবাইল', key: 'driverMobile' },
        { header: 'বিনিয়োগ পরিমাণ', key: 'investmentAmountFormatted' },
        { header: 'ফেরত লক্ষ্য', key: 'returnAmountFormatted' },
        { header: 'মোট আদায়কৃত', key: 'totalPaidFormatted' },
        { header: 'প্রজেক্ট মুনাফা', key: 'profitFormatted' },
        { header: 'অবস্থা', key: 'statusFormatted' }
      ];
      dataToExport = reportData.map(row => ({
        projectName: row.projectName,
        projectType: row.projectType,
        driverName: row.driverName || 'N/A',
        driverMobile: row.driverMobile || '',
        investmentAmountFormatted: formatBDT(row.investmentAmount),
        returnAmountFormatted: formatBDT(row.returnAmount),
        totalPaidFormatted: formatBDT(row.totalPaid),
        profitFormatted: formatBDT(row.profit),
        statusFormatted: row.status === 'completed' ? 'সম্পন্ন' : (row.status === 'due' ? 'বকেয়া' : 'চলতি')
      }));
      title = 'মুনাফা রিপোর্ট';
      filename = 'Profit_Report';
    } else if (activeTab === 6) {
      const categories = {
        'function': 'অনুষ্ঠান',
        'document': 'কাগজপত্র ও দলিল',
        'tea_snacks': 'চা-নাস্তা',
        'office': 'অফিস খরচ',
        'other': 'অন্যান্য'
      };
      cols = [
        { header: 'শিরোনাম', key: 'title' },
        { header: 'ক্যাটাগরি', key: 'categoryLabel' },
        { header: 'পরিমাণ', key: 'amountFormatted' },
        { header: 'তারিখ', key: 'dateFormatted' },
        { header: 'রেকর্ডকারী', key: 'recordedBy' }
      ];
      dataToExport = reportData.map(row => ({
        title: row.title,
        categoryLabel: categories[row.category] || 'অন্যান্য',
        amountFormatted: formatBDT(row.amount),
        dateFormatted: formatBanglaDate(row.date),
        recordedBy: row.recordedBy?.name || 'N/A'
      }));
      title = 'খরচ হিসাব রিপোর্ট';
      filename = 'Expense_Report';
    }

    exportToPDF(dataToExport, cols, title, filename);
  };

  return (
    <div className="app-container">
      <Header title="রিপোর্ট ও হিসাব" />

      <main className="content-wrapper">

        {/* Report Tabs - all tabs visible to both admin and member */}
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
          
          {true && (
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
              <button 
                className={`tab-btn ${activeTab === 6 ? 'active' : ''}`}
                onClick={() => setActiveTab(6)}
              >
                খরচ
              </button>
            </>
          )}
        </div>

        {/* Filters Panel (Dues and Profit reports don't need Date/Month filters, they are cumulative) */}
        {activeTab !== 2 && activeTab !== 4 && activeTab !== 5 && (
          <div className="card" style={{ padding: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <button 
                className={`btn btn-sm ${filterType === 'date' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, minHeight: '36px', minWidth: '80px' }}
                onClick={() => setFilterType('date')}
              >
                তারিখ
              </button>
              <button 
                className={`btn btn-sm ${filterType === 'month' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, minHeight: '36px', minWidth: '80px' }}
                onClick={() => setFilterType('month')}
              >
                মাস
              </button>
              <button 
                className={`btn btn-sm ${filterType === 'year' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, minHeight: '36px', minWidth: '80px' }}
                onClick={() => setFilterType('year')}
              >
                বছর
              </button>
              <button 
                className={`btn btn-sm ${filterType === 'custom' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, minHeight: '36px', minWidth: '80px' }}
                onClick={() => setFilterType('custom')}
              >
                কাস্টম রেঞ্জ
              </button>
              <button 
                className={`btn btn-sm ${filterType === 'alltime' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, minHeight: '36px', minWidth: '80px' }}
                onClick={() => setFilterType('alltime')}
              >
                সব সময়
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
              {filterType === 'custom' && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>শুরুর তারিখ</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filterStartDate}
                      max={filterEndDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>শেষ তারিখ</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filterEndDate}
                      min={filterStartDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {filterType === 'alltime' && (
                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  📋 সকল সময়ের সমস্ত রেকর্ড দেখানো হচ্ছে
                </div>
              )}
            </div>
          </div>
        )}

        {/* Driver Performance Ranking section (Admin only, visible on project-related tabs) */}
        {isAdmin && (activeTab === 3 || activeTab === 4 || activeTab === 5) && allProjects.length > 0 && (
          <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary-dark)', marginBottom: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={18} />
              <span>কিস্তি পরিশোধের ভিত্তিতে চালকদের র্যাংকিং</span>
            </h3>

            <div className="grid-2" style={{ marginBottom: 0 }}>
              {/* Best Drivers (Top 3) */}
              <div style={{ backgroundColor: 'var(--success-light)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                  🏆 সেরা চালক (সঠিক পরিশোধকারী)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    const sorted = [...allProjects]
                      .map(p => {
                        const expected = Math.min(p.installmentDuration, p.monthsElapsed || 0) * p.monthlyInstallmentAmount;
                        const pct = expected > 0 ? Math.round((p.totalPaid / expected) * 100) : 100;
                        return { ...p, pct };
                      })
                      .sort((a, b) => b.pct - a.pct);

                    const topDrivers = sorted.slice(0, 3);
                    return topDrivers.map((p, idx) => (
                      <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '4px 0', borderBottom: idx < topDrivers.length - 1 ? '1px dashed rgba(22, 163, 74, 0.15)' : 'none' }}>
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>{p.driverName}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({p.projectName})</span>
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{toBanglaNumber(p.pct)}%</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Worst Drivers (Bottom 3) */}
              <div style={{ backgroundColor: 'var(--danger-light)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                  ⚠️ বকেয়া চালক (তাগিদ দিতে হবে)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    const sorted = [...allProjects]
                      .map(p => {
                        const expected = Math.min(p.installmentDuration, p.monthsElapsed || 0) * p.monthlyInstallmentAmount;
                        const pct = expected > 0 ? Math.round((p.totalPaid / expected) * 100) : 100;
                        return { ...p, pct };
                      })
                      .sort((a, b) => a.pct - b.pct);

                    const bottomDrivers = sorted.slice(0, 3);
                    return bottomDrivers.map((p, idx) => (
                      <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '4px 0', borderBottom: idx < bottomDrivers.length - 1 ? '1px dashed rgba(220, 38, 38, 0.15)' : 'none' }}>
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>{p.driverName}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({p.projectName})</span>
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'var(--danger)' }}>
                          {toBanglaNumber(p.pct)}% ({formatBDT(p.totalDue)})
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px' }}>
            <svg style={{
              animation: 'spin 1s linear infinite',
              width: '36px',
              height: '36px',
              color: 'var(--primary)'
            }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</span>
          </div>
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
                      <th>সদস্য আইডি</th>
                      <th>সদস্য নাম</th>
                      <th>মোবাইল</th>
                      <th>তারিখ</th>
                      <th>মাস</th>
                      <th>পরিমাণ</th>
                      <th>সংগ্রহকারী</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td>{toBanglaNumber(row.member?.memberId || '')}</td>
                        <td style={{ fontWeight: 'bold' }}>{row.member?.name || 'মুছে ফেলা সদস্য'}</td>
                        <td>{toBanglaNumber(row.member?.mobile || '')}</td>
                        <td>{formatBanglaDate(row.date)}</td>
                        <td>{formatBanglaMonth(row.month)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{formatBDT(row.amount)}</td>
                        <td>{row.recordedBy?.name || 'N/A'}</td>
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
                      <th>সদস্য আইডি</th>
                      <th>সদস্য নাম</th>
                      <th>মোবাইল</th>
                      <th>মাসিক কিস্তি</th>
                      <th>মোট জমাকৃত</th>
                      <th>মোট বকেয়া</th>
                      <th>অবস্থা</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td>{toBanglaNumber(row.memberId)}</td>
                        <td style={{ fontWeight: 'bold' }}>{row.name}</td>
                        <td>{toBanglaNumber(row.mobile)}</td>
                        <td>{formatBDT(row.monthlyDepositAmount)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{formatBDT(row.totalDeposited)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{formatBDT(row.totalDue)}</td>
                        <td>
                          <span className={`list-badge ${row.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                            {row.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </span>
                        </td>
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
                      <th>প্রজেক্ট নাম</th>
                      <th>ধরন</th>
                      <th>চালক নাম</th>
                      <th>মোবাইল</th>
                      <th>তারিখ</th>
                      <th>মাস</th>
                      <th>আদায়</th>
                      <th>সংগ্রহকারী</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td style={{ fontWeight: 'bold' }}>{row.project?.projectName || 'মুছে ফেলা প্রজেক্ট'}</td>
                        <td>{row.project?.projectType || 'N/A'}</td>
                        <td>{row.project?.driverName || 'N/A'}</td>
                        <td>{toBanglaNumber(row.project?.driverMobile || '')}</td>
                        <td>{formatBanglaDate(row.date)}</td>
                        <td>{formatBanglaMonth(row.month)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{formatBDT(row.amount)}</td>
                        <td>{row.recordedBy?.name || 'N/A'}</td>
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
                      <th>প্রজেক্ট নাম</th>
                      <th>ধরন</th>
                      <th>চালক নাম</th>
                      <th>মোবাইল</th>
                      <th>বিনিয়োগ</th>
                      <th>ফেরত লক্ষ্য</th>
                      <th>মাসিক কিস্তি</th>
                      <th>মোট আদায়কৃত</th>
                      <th>অবশিষ্ট পাওনা</th>
                      <th>মোট বকেয়া</th>
                      <th>অবস্থা</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td style={{ fontWeight: 'bold' }}>{row.projectName}</td>
                        <td>{row.projectType}</td>
                        <td>{row.driverName}</td>
                        <td>{toBanglaNumber(row.driverMobile)}</td>
                        <td>{formatBDT(row.investmentAmount)}</td>
                        <td>{formatBDT(row.returnAmount)}</td>
                        <td>{formatBDT(row.monthlyInstallmentAmount)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{formatBDT(row.totalPaid)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{formatBDT(row.remainingBalance)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{formatBDT(row.totalDue)}</td>
                        <td>
                          <span className={`list-badge ${
                            row.status === 'completed' 
                              ? 'badge-success' 
                              : (row.status === 'due' ? 'badge-danger' : 'badge-warning')
                          }`}>
                            {row.status === 'completed' ? 'সম্পন্ন' : (row.status === 'due' ? 'বকেয়া' : 'চলতি')}
                          </span>
                        </td>
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
                      <th>প্রজেক্ট নাম</th>
                      <th>ধরন</th>
                      <th>চালক নাম</th>
                      <th>মোবাইল</th>
                      <th>বিনিয়োগ</th>
                      <th>ফেরত লক্ষ্য</th>
                      <th>মোট আদায়কৃত</th>
                      <th>মোট মুনাফা</th>
                      <th>অবস্থা</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td style={{ fontWeight: 'bold' }}>{row.projectName}</td>
                        <td>{row.projectType}</td>
                        <td>{row.driverName || 'N/A'}</td>
                        <td>{toBanglaNumber(row.driverMobile || '')}</td>
                        <td>{formatBDT(row.investmentAmount)}</td>
                        <td>{formatBDT(row.returnAmount)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{formatBDT(row.totalPaid)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{formatBDT(row.profit)}</td>
                        <td>
                          <span className={`list-badge ${
                            row.status === 'completed' 
                              ? 'badge-success' 
                              : (row.status === 'due' ? 'badge-danger' : 'badge-warning')
                          }`}>
                            {row.status === 'completed' ? 'সম্পন্ন' : (row.status === 'due' ? 'বকেয়া' : 'চলতি')}
                          </span>
                        </td>
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

              {/* Tab 6: Expense Report */}
              {activeTab === 6 && (
                <table>
                  <thead>
                    <tr>
                      <th>শিরোনাম</th>
                      <th>ক্যাটাগরি</th>
                      <th>তারিখ</th>
                      <th>পরিমাণ</th>
                      <th>রেকর্ডকারী</th>
                      <th>বিবরণ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row._id}>
                        <td style={{ fontWeight: 'bold' }}>{row.title}</td>
                        <td>{getCategoryLabel(row.category)}</td>
                        <td>{formatBanglaDate(row.date)}</td>
                        <td style={{ fontWeight: 'bold', color: '#e11d48' }}>-{formatBDT(row.amount)}</td>
                        <td>{row.recordedBy?.name || 'N/A'}</td>
                        <td>{row.description || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Sum Aggregate Summary Panel */}
            <div className="card" style={{ borderLeft: '5px solid var(--accent)', padding: '16px' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--primary-dark)', marginBottom: '12px', fontWeight: 'bold' }}>
                মোট সারসংক্ষেপ (Summary Totals)
              </h4>
              
              {activeTab === 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>নির্বাচিত সময়ে মোট সঞ্চয় জমা:</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--success)' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.amount || 0), 0))}</strong>
                </div>
              )}

              {activeTab === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>মোট মাসিক কিস্তি</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.monthlyDepositAmount || 0), 0))}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>মোট জমাকৃত সঞ্চয়</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--success)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.totalDeposited || 0), 0))}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>মোট বকেয়া সঞ্চয়</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--danger)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.totalDue || 0), 0))}</strong>
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>নির্বাচিত সময়ে মোট কিস্তি আদায়:</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--success)' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.amount || 0), 0))}</strong>
                </div>
              )}

              {activeTab === 4 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট বিনিয়োগ</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.investmentAmount || 0), 0))}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট ফেরত লক্ষ্য</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.returnAmount || 0), 0))}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট আদায়কৃত</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--success)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.totalPaid || 0), 0))}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট অবশিষ্ট পাওনা</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--accent)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.remainingBalance || 0), 0))}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট কিস্তি বকেয়া</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--danger)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.totalDue || 0), 0))}</strong>
                  </div>
                </div>
              )}

              {activeTab === 5 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট বিনিয়োগ</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.investmentAmount || 0), 0))}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট ফেরত লক্ষ্য</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.returnAmount || 0), 0))}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট আদায়কৃত</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--success)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.totalPaid || 0), 0))}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', padding: '8px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>মোট মুনাফা</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--primary-dark)', marginTop: '2px' }}>{formatBDT(reportData.reduce((sum, item) => sum + (item.profit || 0), 0))}</strong>
                  </div>
                </div>
              )}

              {activeTab === 6 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>নির্বাচিত সময়ে মোট খরচ:</span>
                  <strong style={{ fontSize: '1.2rem', color: '#e11d48' }}>-{formatBDT(reportData.reduce((sum, item) => sum + (item.amount || 0), 0))}</strong>
                </div>
              )}
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
