import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

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
      </table>
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
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Process PDF download
  html2pdf().set(opt).from(element).save();
}
