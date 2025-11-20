/**
 * Export utilities for Excel and PDF generation
 */

// Excel Export (CSV format - works without external libraries)
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    csvHeaders.join(','), // Header row
    ...data.map(row =>
      csvHeaders.map(header => {
        const value = row[header];
        // Handle values with commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Add BOM for UTF-8 encoding (for Excel compatibility with Korean characters)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Excel Export with XLSX library (requires xlsx package)
export const exportToExcel = async (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  try {
    // Dynamic import to avoid errors if xlsx is not installed
    const XLSX = await import('xlsx');

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.warn('xlsx library not available, falling back to CSV export');
    exportToCSV(data, filename);
  }
};

// PDF Export using browser print
export const exportToPDF = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Element not found for PDF export');
    return;
  }

  // Store original title
  const originalTitle = document.title;
  document.title = filename;

  // Print using browser's print dialog
  window.print();

  // Restore title
  document.title = originalTitle;
};

// PDF Export with custom content
export const exportCustomPDF = async (content: {
  title: string;
  data: Array<{ label: string; value: string }>;
  table?: {
    headers: string[];
    rows: string[][];
  };
}, filename: string) => {
  try {
    // Dynamic import to avoid errors if jspdf is not installed
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF();
    let yPosition = 20;

    // Add title
    doc.setFontSize(18);
    doc.text(content.title, 20, yPosition);
    yPosition += 15;

    // Add data fields
    doc.setFontSize(12);
    content.data.forEach(item => {
      doc.text(`${item.label}: ${item.value}`, 20, yPosition);
      yPosition += 10;
    });

    // Add table if provided
    if (content.table) {
      yPosition += 10;
      doc.setFontSize(10);

      // Headers
      content.table.headers.forEach((header, index) => {
        doc.text(header, 20 + (index * 40), yPosition);
      });
      yPosition += 7;

      // Rows
      content.table.rows.forEach(row => {
        row.forEach((cell, index) => {
          doc.text(cell, 20 + (index * 40), yPosition);
        });
        yPosition += 7;
      });
    }

    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.warn('jsPDF library not available, using browser print instead');
    alert('PDF export requires jsPDF library. Please use browser print (Ctrl+P) instead.');
  }
};

// Format data for export
export const formatProjectDataForExport = (projects: any[]) => {
  return projects.map(project => ({
    'Project Code': project.code,
    'Project Name': project.name,
    'Total Budget': project.totalBudget,
    'Current Budget': project.currentBudget,
    'Executed Amount': project.executedAmount,
    'Execution Rate (%)': project.executionRate,
    'Risk Score': project.riskScore,
    'Status': project.status,
    'Start Date': project.startDate,
    'End Date': project.endDate,
  }));
};

export const formatBudgetDataForExport = (budgetItems: any[]) => {
  return budgetItems.map(item => ({
    'Category': item.category,
    'Main Item': item.mainItem,
    'Sub Item': item.subItem || '',
    'Budget': item.currentBudget,
    'Executed': item.executedAmount,
    'Remaining': item.remainingBudget,
    'Execution Rate (%)': item.executionRate,
    'Notes': item.notes || '',
  }));
};

export const formatExecutionDataForExport = (executions: any[]) => {
  return executions.map(exec => ({
    'Request #': exec.requestNumber,
    'Project': exec.project?.name || '',
    'Budget Item': exec.budgetItem?.mainItem || '',
    'Amount': exec.amount,
    'Purpose': exec.purpose,
    'Status': exec.status,
    'Requested By': exec.requestedBy?.name || '',
    'Created At': new Date(exec.createdAt).toLocaleDateString(),
  }));
};

export const formatTransferDataForExport = (transfers: any[]) => {
  return transfers.map(transfer => ({
    'Date': new Date(transfer.createdAt).toLocaleDateString(),
    'Source Item': transfer.sourceItem?.mainItem || '',
    'Target Item': transfer.targetItem?.mainItem || '',
    'Amount': transfer.amount,
    'Type': transfer.transferType,
    'Status': transfer.status,
    'Reason': transfer.reason || '',
    'Approved By': transfer.approvedBy?.name || '',
  }));
};
