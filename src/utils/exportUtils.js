import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { formatBDT, toBanglaNumber } from './bangla';

const banglaToEnglishNumerals = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

function parseBanglaFormattedNumber(val) {
  if (val === null || val === undefined) return 0;
  const str = String(val);
  let englishStr = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    englishStr += banglaToEnglishNumerals[char] || char;
  }
  const cleanedStr = englishStr.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanedStr);
  return isNaN(parsed) ? 0 : parsed;
}

function isColumnSummable(col) {
  if (!col || !col.header) return false;
  const keywords = ['বিনিয়োগ', 'বিনিয়োগ', 'আদায়', 'আদায়', 'বকেয়া', 'বকেয়া', 'সঞ্চয়', 'সঞ্চয়', 'পরিমাণ', 'জমাকৃত', 'পাওনা', 'মুনাফা', 'লক্ষ্য', 'হার', 'টাকা', '৳', 'amount', 'paid', 'due', 'deposited', 'investment', 'return', 'profit', 'expense', 'fee', 'charge'];
  const headerLower = col.header.toLowerCase();
  
  const excludeKeywords = ['আইডি', 'তারিখ', 'মোবাইল', 'মেয়াদ', 'duration', 'date', 'mobile', 'id', 'status', 'অবস্থা'];
  if (excludeKeywords.some(ex => headerLower.includes(ex))) {
    return false;
  }
  
  return keywords.some(kw => headerLower.includes(kw));
}

/**
 * Export data to Excel (.xlsx)
 * @param {Array} data - Array of row objects
 * @param {Array} columns - Array of { header, key } objects
 * @param {string} filename - Output filename without extension
 * @param {string} sheetName - Sheet name
 */
export function exportToExcel(data, columns, filename = 'export', sheetName = 'Sheet1') {
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = c.key.split('.').reduce((o, k) => (o ? o[k] : ''), row);
      return val ?? '';
    })
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export data to PDF using html2pdf.js
 * Renders via local HTML canvas to secure perfect Bengali UTF-8 font support,
 * and triggers an automatic, hands-free file download.
 * @param {Array} data - Array of row objects
 * @param {Array} columns - Array of { header, key } objects
 * @param {string} title - Document title shown at top
 * @param {string} filename - Output filename without extension
 */
export function exportToPDF(data, columns, title = 'রিপোর্ট', filename = 'export') {
  // Create dynamic container
  const element = document.createElement('div');
  
  // Format current date in Bengali
  const currentDate = new Date().toLocaleString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  element.innerHTML = `
    <div style="font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #1e293b; background-color: #fff;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #0f766e; padding-bottom: 15px;">
        <h1 style="font-size: 20px; color: #115e59; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 0.5px;">তরুণ উদ্যোক্তা সমন্বয় সমিতি</h1>
        <p style="font-size: 13px; color: #0f766e; font-weight: 600; margin: 0; background-color: #f0fdfa; display: inline-block; padding: 3px 14px; border-radius: 12px;">${title}</p>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; margin-top: 12px; margin-bottom: 6px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px;">
        <div style="float: left;">সমিতি ব্যবস্থাপনা অ্যাপ্লিকেশন</div>
        <div style="float: right;">রিপোর্ট তৈরির সময়: ${currentDate}</div>
        <div style="clear: both;"></div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; text-align: left;">
        <thead>
          <tr>
            ${columns.map(c => `<th style="background-color: #0f766e; color: #ffffff; font-weight: 700; padding: 8px 10px; border: 1px solid #0f766e;">${c.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map((row, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              ${columns.map(c => {
                const val = c.key.split('.').reduce((o, k) => (o ? o[k] : ''), row);
                return `<td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #334155; white-space: nowrap;">${val ?? ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #f1f5f9; font-weight: 700; border-top: 2px solid #0f766e; border-bottom: 2px solid #0f766e;">
            ${columns.map((c, colIdx) => {
              if (isColumnSummable(c)) {
                const total = data.reduce((sum, row) => {
                  const val = c.key.split('.').reduce((o, k) => (o ? o[k] : ''), row);
                  return sum + parseBanglaFormattedNumber(val);
                }, 0);
                return `<td style="padding: 8px 10px; border: 1px solid #cbd5e1; color: #0f766e; white-space: nowrap;">${formatBDT(total)}</td>`;
              } else {
                return `<td style="padding: 8px 10px; border: 1px solid #cbd5e1; color: #334155; white-space: nowrap;">${colIdx === 0 ? 'সর্বমোট' : ''}</td>`;
              }
            }).join('')}
          </tr>
        </tfoot>
      </table>
      ${(() => {
        const summableCols = columns.filter(c => isColumnSummable(c));
        if (summableCols.length === 0) return '';
        return `
          <div style="margin-top: 24px; padding: 16px; background-color: #f0fdfa; border: 1px solid #ccfbf1; border-left: 5px solid #0f766e; border-radius: 8px;">
            <h3 style="font-size: 13px; color: #115e59; font-weight: 700; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">রিপোর্ট সারসংক্ষেপ (Report Summary)</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${summableCols.map(c => {
                const total = data.reduce((sum, row) => {
                  const val = c.key.split('.').reduce((o, k) => (o ? o[k] : ''), row);
                  return sum + parseBanglaFormattedNumber(val);
                }, 0);
                return `
                  <div style="flex: 1; min-width: 140px; background-color: #ffffff; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <span style="font-size: 10px; color: #64748b; display: block; margin-bottom: 4px; font-weight: 600;">মোট ${c.header}</span>
                    <span style="font-size: 14px; color: #0f766e; font-weight: 800;">${formatBDT(total)}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      })()}
      <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
        © ${new Date().getFullYear()} তরুণ উদ্যোক্তা সমন্বয় সমিতি | সর্বস্বত্ব সংরক্ষিত।
      </div>
    </div>
  `;

  // html2pdf config options
  const opt = {
    margin:       [10, 10, 10, 10],
    filename:     `${filename}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: columns.length > 5 ? 'landscape' : 'portrait' }
  };

  // Process PDF download
  html2pdf().set(opt).from(element).save();
}
