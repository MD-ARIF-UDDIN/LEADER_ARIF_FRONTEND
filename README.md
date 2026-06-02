# তরুণ উদ্যোক্তা সমন্বয় সমিতি (Frontend)

This is the mobile-first, premium styled React SPA frontend application for **Tarun Udyokta Samonbay Samiti** (Cooperative Management System).

## 🚀 Key Features

1. **Dashboard (ড্যাশবোর্ড)**:
   - Admin view displaying 8 KPI statistics (Total Members, Savings, split due amounts for Member Dues and Project Installment Dues, Investments, collections, profits, and active projects count).
   - High-contrast wallet/balance highlight card displaying current cash availability computed live as: `Savings Deposits + Installment Collections - Investments`.
   - Normal member view with detailed personal statistics.

2. **Members (সদস্যবৃন্দ)**:
   - Searchable listing of members.
   - Comprehensive detail modals including full checklist records of monthly payment status (PAID/DUE).
   - Immediate savings collection controls and detailed transaction history logs.

3. **Projects & Investments (প্রজেক্ট/বিনিয়োগ)**:
   - Real-time collection progress bars with precise percentage indicators.
   - Project detail modals with automated payment timelines and schedules.
   - Live profit/loss metrics with dynamic color-coded feedback during project creation/editing.

4. **Reports & Ledger (রিপোর্ট ও হিসাব)**:
   - Dynamic report generation filterable by Single Date, Month, or Year.
   - Interactive data tables for Savings Deposits, Member Dues, Project Collections, Project Dues, and Profit/Loss ledgers.

5. **Aesthetics & Navigation**:
   - Clean Hind Siliguri typography fully optimized for Bengali text.
   - Premium floating glassmorphism bottom navigation bar with fluid active-state animations and neon pulse indicators.
   - Seamless design optimized across mobile, tablet, and desktop viewports.

6. **Automated Exports**:
   - **Excel Export**: Powered by `xlsx` for comprehensive data extraction mapping to friendly Bangla headers.
   - **PDF Export**: Hands-free instant downloads powered by `html2pdf.js`, generating pixel-perfect PDFs with complete support for Bengali UTF-8 scripts and complex compound letters (যুক্তাক্ষর).

---

## 🛠️ Startup & Setup

### 1. Installation
Install the required packages in the directory:
```bash
npm install
```

### 2. Development Mode
Run the development server on `http://localhost:3000`:
```bash
npm run dev
```

### 3. Production Build
Create an optimized production bundle inside `/dist`:
```bash
npm run build
```
