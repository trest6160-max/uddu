export const documentPricing = {
  // Certificates
  'net-worth-certificate': { name: 'Net Worth Certificate', price: 1500, category: 'Certificates' },
  'turnover-certificate': { name: 'Turnover Certificate', price: 1500, category: 'Certificates' },
  'valuation-certificate': { name: 'Valuation Certificate', price: 1500, category: 'Certificates' },
  'fund-utilization-certificate': { name: 'Fund Utilization Certificate', price: 1500, category: 'Certificates' },
  'working-capital-certificate': { name: 'Working Capital Certificate', price: 1500, category: 'Certificates' },
  'forecast-certificate': { name: 'Forecast Certificate', price: 1500, category: 'Certificates' },
  'assets-liabilities-statement': { name: 'Assets & Liabilities Statement', price: 1500, category: 'Certificates' },
  'capital-contribution-certificate': { name: 'Capital Contribution Certificate', price: 1500, category: 'Certificates' },
  'statutory-liabilities-certificate': { name: 'Statutory Liabilities Certificate', price: 1500, category: 'Certificates' },
  'bank-finance-certificate': { name: 'Certificate for Bank Finance', price: 1500, category: 'Certificates' },
  'stock-audit-certificate': { name: 'Stock Audit Report/Certificate', price: 2000, category: 'Certificates' },
  'ca-certificate-various-laws': { name: 'CA Certificate under various laws (Income Tax, GST, RBI)', price: 1500, category: 'Certificates' },
  'gross-receipts-certificate': { name: 'Gross Receipts Certificate', price: 1500, category: 'Certificates' },
  'profit-loss-certificate': { name: 'Profit and Loss Certificate', price: 1500, category: 'Certificates' },
  'deduction-certificate': { name: 'Certificate for claiming Deductions (80-IA/80-IB etc.)', price: 1500, category: 'Certificates' },
  'export-turnover-certificate': { name: 'Export Turnover Certificate', price: 1500, category: 'Certificates' },
  'other-certificates': { name: 'Other certificates (with description field)', price: 1000, category: 'Certificates' },

  // Audit Reports
  'statutory-audit-reports': { name: 'Statutory Audit Reports (Company, LLP, etc.)', price: 3000, category: 'Audit Reports' },
  'tax-audit-reports': { name: 'Tax Audit Reports (Form 3CA, 3CB, 3CD)', price: 3000, category: 'Audit Reports' },
  'gst-audit-reports': { name: 'GST Audit Reports', price: 5000, category: 'Audit Reports' },
  'trust-audit-reports': { name: 'Trust Audit Reports', price: 2000, category: 'Audit Reports' },
  'internal-audit-reports': { name: 'Internal Audit Reports', price: 2000, category: 'Audit Reports' },
  'forensic-audit-reports': { name: 'Forensic Audit Reports', price: 5000, category: 'Audit Reports' },
  'bank-audit-reports': { name: 'Bank Audit Reports', price: 3000, category: 'Audit Reports' },
  'cooperative-society-audit': { name: 'Cooperative Society Audit Reports', price: 2000, category: 'Audit Reports' },
  'psu-audit-reports': { name: 'PSU Audit Reports', price: 3000, category: 'Audit Reports' },
  'stock-concurrent-audit': { name: 'Stock/Concurrent/Internal Audit Reports', price: 2000, category: 'Audit Reports' },
  'revenue-audit-reports': { name: 'Revenue Audit Reports', price: 2000, category: 'Audit Reports' },
  'other-audit-reports': { name: 'Other audit reports (with description field)', price: 1000, category: 'Audit Reports' },

  // Assurance & Review Engagements
  'limited-review-reports': { name: 'Limited Review Reports (e.g. for listed companies)', price: 3000, category: 'Assurance & Review' },
  'due-diligence-reports': { name: 'Due Diligence Reports', price: 4000, category: 'Assurance & Review' },
  'special-purpose-audit': { name: 'Special Purpose Audit Reports', price: 3000, category: 'Assurance & Review' },
  'independent-review-reports': { name: 'Independent Review Reports', price: 2500, category: 'Assurance & Review' },
  'aup-reports': { name: 'Agreed Upon Procedures (AUP) Reports', price: 3000, category: 'Assurance & Review' },
  'other-assurance-reports': { name: 'Other assurance/review reports', price: 2000, category: 'Assurance & Review' },

  // Reports under Other Laws
  'income-tax-reports': { name: 'Income Tax Report (e.g. Form 10B, 10DA, etc.)', price: 1500, category: 'Reports under Other Laws' },
  'gst-related-reports': { name: 'GST-related CA Reports', price: 1500, category: 'Reports under Other Laws' },
  'fema-rbi-reports': { name: 'FEMA/RBI compliance reports', price: 2000, category: 'Reports under Other Laws' },
  'sebi-certifications': { name: 'SEBI-related certifications', price: 2500, category: 'Reports under Other Laws' },
  'llp-compliance-reports': { name: 'LLP compliance reports', price: 1000, category: 'Reports under Other Laws' },
  'companies-act-reports': { name: 'Companies Act reports', price: 1000, category: 'Reports under Other Laws' },
  'ibc-reports': { name: 'Reports under Insolvency & Bankruptcy Code (IBC)', price: 3000, category: 'Reports under Other Laws' },
  'other-law-reports': { name: 'Other law-related reports', price: 1500, category: 'Reports under Other Laws' },

  // Management Services / Consultancy
  'project-reports': { name: 'Project Reports', price: 2000, category: 'Management Services' },
  'business-valuation-reports': { name: 'Business Valuation Reports', price: 5000, category: 'Management Services' },
  'system-audit-reports': { name: 'System Audit Reports', price: 3000, category: 'Management Services' },
  'it-audit-reports': { name: 'Information System/IT Audit Reports', price: 4000, category: 'Management Services' },
  'financial-planning-projections': { name: 'Financial Planning & Projections', price: 3000, category: 'Management Services' },
  'other-consultancy-reports': { name: 'Other consultancy reports', price: 2000, category: 'Management Services' }
};

export const getDocumentCategories = () => {
  const categories = {};
  Object.entries(documentPricing).forEach(([key, value]) => {
    if (!categories[value.category]) {
      categories[value.category] = [];
    }
    categories[value.category].push({ key, ...value });
  });
  return categories;
};

export const calculateTotal = (selectedDocuments) => {
  const subtotal = selectedDocuments.reduce((total, doc) => {
    const pricing = documentPricing[doc.documentType];
    return total + (pricing ? pricing.price : 0);
  }, 0);
  
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  
  return {
    subtotal,
    gst,
    total,
    items: selectedDocuments.map(doc => ({
      name: documentPricing[doc.documentType]?.name || 'Unknown Document',
      price: documentPricing[doc.documentType]?.price || 0,
      quantity: 1
    }))
  };
};
