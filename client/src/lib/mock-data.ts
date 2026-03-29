import type {
  Document, Folder, DocumentVersion, Workflow, WorkflowStep,
  AuditLogEntry, StaffMember, Notification, DashboardKPIs, Report,
  Department, DocumentType, DocumentStatus, SecurityClassification,
  AuditAction, WorkflowStatus, UserRole, StepAction,
} from '@shared/schema';

// ==================== STAFF ====================
export const mockStaff: StaffMember[] = [
  { id: 'u1', fullName: 'Adebayo Ogunlesi', email: 'adebayo.ogunlesi@gov.ng', role: 'admin', department: 'Office of the Governor', isActive: true },
  { id: 'u2', fullName: 'Ngozi Okafor', email: 'ngozi.okafor@gov.ng', role: 'director', department: 'Ministry of Finance', isActive: true },
  { id: 'u3', fullName: 'Emeka Nwankwo', email: 'emeka.nwankwo@gov.ng', role: 'manager', department: 'Ministry of Works & Infrastructure', isActive: true },
  { id: 'u4', fullName: 'Fatima Ibrahim', email: 'fatima.ibrahim@gov.ng', role: 'officer', department: 'Ministry of Health', isActive: true },
  { id: 'u5', fullName: 'Chidinma Eze', email: 'chidinma.eze@gov.ng', role: 'officer', department: 'Ministry of Education', isActive: true },
  { id: 'u6', fullName: 'Oluwaseun Adeyemi', email: 'oluwaseun.adeyemi@gov.ng', role: 'director', department: 'Ministry of Justice', isActive: true },
  { id: 'u7', fullName: 'Aisha Mohammed', email: 'aisha.mohammed@gov.ng', role: 'manager', department: 'Bureau of Public Procurement', isActive: true },
  { id: 'u8', fullName: 'Tunde Bakare', email: 'tunde.bakare@gov.ng', role: 'officer', department: 'Ministry of Agriculture', isActive: true },
  { id: 'u9', fullName: 'Blessing Okoro', email: 'blessing.okoro@gov.ng', role: 'viewer', department: 'Auditor General Office', isActive: true },
  { id: 'u10', fullName: 'Yakubu Danjuma', email: 'yakubu.danjuma@gov.ng', role: 'manager', department: 'Ministry of Commerce & Industry', isActive: true },
  { id: 'u11', fullName: 'Ifeoma Chukwu', email: 'ifeoma.chukwu@gov.ng', role: 'officer', department: 'Ministry of Environment', isActive: true },
  { id: 'u12', fullName: 'Abdullahi Suleiman', email: 'abdullahi.suleiman@gov.ng', role: 'director', department: 'Head of Service', isActive: true },
];

// ==================== FOLDERS ====================
export const mockFolders: Folder[] = [
  { id: 'f1', name: 'Executive Orders', department: 'Office of the Governor', parentId: null, documentCount: 12, createdAt: '2025-01-15' },
  { id: 'f2', name: 'Budget & Appropriation', department: 'Ministry of Finance', parentId: null, documentCount: 28, createdAt: '2025-01-10' },
  { id: 'f3', name: 'Infrastructure Projects', department: 'Ministry of Works & Infrastructure', parentId: null, documentCount: 35, createdAt: '2025-02-01' },
  { id: 'f4', name: 'Health Policies', department: 'Ministry of Health', parentId: null, documentCount: 18, createdAt: '2025-01-20' },
  { id: 'f5', name: 'Education Circulars', department: 'Ministry of Education', parentId: null, documentCount: 22, createdAt: '2025-03-01' },
  { id: 'f6', name: 'Legal Opinions', department: 'Ministry of Justice', parentId: null, documentCount: 15, createdAt: '2025-02-15' },
  { id: 'f7', name: 'Procurement Records', department: 'Bureau of Public Procurement', parentId: null, documentCount: 42, createdAt: '2025-01-05' },
  { id: 'f8', name: 'Audit Reports', department: 'Auditor General Office', parentId: null, documentCount: 20, createdAt: '2025-03-10' },
  { id: 'f9', name: 'Agricultural Programs', department: 'Ministry of Agriculture', parentId: null, documentCount: 14, createdAt: '2025-02-20' },
  { id: 'f10', name: 'Trade & Commerce', department: 'Ministry of Commerce & Industry', parentId: null, documentCount: 11, createdAt: '2025-03-05' },
];

// ==================== DOCUMENTS ====================
function makeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function makeDateTime(daysAgo: number, hoursAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

export const mockDocuments: Document[] = [
  {
    id: 'doc-001', title: '2026 Fiscal Year Budget Proposal', description: 'Comprehensive budget proposal for the 2026 fiscal year covering all ministries and agencies.',
    type: 'budget_document', department: 'Ministry of Finance', status: 'approved', securityClassification: 'confidential',
    referenceNumber: 'MOF/BUD/2026/001', version: 3, fileSize: 4500000, fileType: 'pdf', tags: ['budget', '2026', 'fiscal'],
    metadata: { 'fiscal_year': '2026', 'total_amount': '₦850B' }, createdBy: 'Ngozi Okafor', createdAt: makeDateTime(45),
    updatedAt: makeDateTime(5), retentionDate: '2036-12-31', parentFolderId: 'f2', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-002', title: 'Executive Order on Public Service Reform', description: 'Executive directive on restructuring public service delivery across all state agencies.',
    type: 'memo', department: 'Office of the Governor', status: 'approved', securityClassification: 'restricted',
    referenceNumber: 'GOV/EO/2026/015', version: 2, fileSize: 1200000, fileType: 'pdf', tags: ['executive order', 'reform', 'public service'],
    metadata: { 'effective_date': '2026-04-01' }, createdBy: 'Adebayo Ogunlesi', createdAt: makeDateTime(30),
    updatedAt: makeDateTime(10), retentionDate: '2036-12-31', parentFolderId: 'f1', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-003', title: 'Lagos-Calabar Coastal Highway Progress Report', description: 'Quarterly progress report on the Lagos-Calabar coastal highway construction project.',
    type: 'report', department: 'Ministry of Works & Infrastructure', status: 'pending_review', securityClassification: 'internal',
    referenceNumber: 'MWI/RPT/2026/Q1-003', version: 1, fileSize: 8200000, fileType: 'pdf', tags: ['highway', 'infrastructure', 'progress report'],
    metadata: { 'project_code': 'LCCH-2024', 'quarter': 'Q1 2026' }, createdBy: 'Emeka Nwankwo', createdAt: makeDateTime(7),
    updatedAt: makeDateTime(7), retentionDate: '2034-12-31', parentFolderId: 'f3', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-004', title: 'Primary Healthcare Expansion Policy', description: 'Policy document outlining the expansion of primary healthcare centres across rural LGAs.',
    type: 'policy', department: 'Ministry of Health', status: 'pending_review', securityClassification: 'internal',
    referenceNumber: 'MOH/POL/2026/008', version: 1, fileSize: 2300000, fileType: 'pdf', tags: ['healthcare', 'policy', 'PHC', 'rural'],
    metadata: { 'target_lgas': '45', 'budget': '₦12.5B' }, createdBy: 'Fatima Ibrahim', createdAt: makeDateTime(12),
    updatedAt: makeDateTime(12), retentionDate: '2036-12-31', parentFolderId: 'f4', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-005', title: 'UBEC Matching Grant Application 2026', description: 'Application for Universal Basic Education Commission matching grant for state education projects.',
    type: 'proposal', department: 'Ministry of Education', status: 'draft', securityClassification: 'internal',
    referenceNumber: 'MOE/GRT/2026/002', version: 1, fileSize: 3100000, fileType: 'docx', tags: ['UBEC', 'grant', 'education'],
    metadata: { 'grant_amount': '₦5.8B' }, createdBy: 'Chidinma Eze', createdAt: makeDateTime(3),
    updatedAt: makeDateTime(3), retentionDate: '2031-12-31', parentFolderId: 'f5', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-006', title: 'Legal Opinion on Land Use Charge', description: 'Legal advisory opinion on the proposed amendments to the Land Use Charge Law.',
    type: 'correspondence', department: 'Ministry of Justice', status: 'approved', securityClassification: 'confidential',
    referenceNumber: 'MOJ/LO/2026/041', version: 1, fileSize: 890000, fileType: 'pdf', tags: ['legal opinion', 'land use', 'charge'],
    metadata: { 'case_reference': 'LUC/AMD/2026' }, createdBy: 'Oluwaseun Adeyemi', createdAt: makeDateTime(20),
    updatedAt: makeDateTime(15), retentionDate: '2041-12-31', parentFolderId: 'f6', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-007', title: 'Road Construction Contract — Lekki-Epe Expressway Phase 2', description: 'Contract document for the Lekki-Epe Expressway Phase 2 expansion works.',
    type: 'contract', department: 'Bureau of Public Procurement', status: 'pending_review', securityClassification: 'restricted',
    referenceNumber: 'BPP/CON/2026/012', version: 2, fileSize: 12400000, fileType: 'pdf', tags: ['contract', 'road', 'Lekki-Epe'],
    metadata: { 'contractor': 'Julius Berger Nig. Plc', 'contract_value': '₦45.2B' }, createdBy: 'Aisha Mohammed', createdAt: makeDateTime(15),
    updatedAt: makeDateTime(8), retentionDate: '2041-12-31', parentFolderId: 'f7', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-008', title: 'Q4 2025 Financial Audit Report', description: 'Quarterly financial audit report covering all state ministries for Q4 2025.',
    type: 'report', department: 'Auditor General Office', status: 'approved', securityClassification: 'confidential',
    referenceNumber: 'AGO/AUD/2025/Q4', version: 1, fileSize: 6700000, fileType: 'pdf', tags: ['audit', 'financial', 'Q4 2025'],
    metadata: { 'period': 'Q4 2025', 'findings': '12 observations' }, createdBy: 'Blessing Okoro', createdAt: makeDateTime(35),
    updatedAt: makeDateTime(28), retentionDate: '2040-12-31', parentFolderId: 'f8', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-009', title: 'Agricultural Mechanization Programme Circular', description: 'Circular to all LGAs on the rollout of the agricultural mechanization support programme.',
    type: 'circular', department: 'Ministry of Agriculture', status: 'approved', securityClassification: 'unclassified',
    referenceNumber: 'MOA/CIR/2026/005', version: 1, fileSize: 560000, fileType: 'pdf', tags: ['agriculture', 'mechanization', 'LGA'],
    metadata: { 'target_beneficiaries': '15,000 farmers' }, createdBy: 'Tunde Bakare', createdAt: makeDateTime(10),
    updatedAt: makeDateTime(10), retentionDate: '2031-12-31', parentFolderId: 'f9', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-010', title: 'Trade Zone Development MOU', description: 'Memorandum of Understanding for the establishment of a new Special Economic Zone.',
    type: 'contract', department: 'Ministry of Commerce & Industry', status: 'pending_review', securityClassification: 'confidential',
    referenceNumber: 'MCI/MOU/2026/003', version: 1, fileSize: 3400000, fileType: 'pdf', tags: ['trade zone', 'MOU', 'SEZ'],
    metadata: { 'partner': 'Dangote Industries', 'zone_location': 'Ibeju-Lekki' }, createdBy: 'Yakubu Danjuma', createdAt: makeDateTime(5),
    updatedAt: makeDateTime(5), retentionDate: '2041-12-31', parentFolderId: 'f10', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-011', title: 'Staff Promotion Guidelines 2026', description: 'Updated guidelines for staff promotion across all public service cadres.',
    type: 'policy', department: 'Head of Service', status: 'approved', securityClassification: 'internal',
    referenceNumber: 'HOS/POL/2026/002', version: 2, fileSize: 1800000, fileType: 'pdf', tags: ['promotion', 'staff', 'guidelines'],
    metadata: { 'effective_date': '2026-01-01' }, createdBy: 'Abdullahi Suleiman', createdAt: makeDateTime(60),
    updatedAt: makeDateTime(40), retentionDate: '2031-12-31', parentFolderId: null, checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-012', title: 'Environmental Impact Assessment — New Industrial Estate', description: 'EIA report for the proposed industrial estate at Agbara corridor.',
    type: 'report', department: 'Ministry of Environment', status: 'draft', securityClassification: 'internal',
    referenceNumber: 'MOE/EIA/2026/007', version: 1, fileSize: 9500000, fileType: 'pdf', tags: ['EIA', 'environment', 'industrial estate'],
    metadata: { 'location': 'Agbara, Ogun State' }, createdBy: 'Ifeoma Chukwu', createdAt: makeDateTime(2),
    updatedAt: makeDateTime(2), retentionDate: '2036-12-31', parentFolderId: null, checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-013', title: 'Minute of Executive Council Meeting — March 2026', description: 'Official minutes of the State Executive Council meeting held in March 2026.',
    type: 'minute', department: 'Office of the Governor', status: 'approved', securityClassification: 'restricted',
    referenceNumber: 'GOV/MIN/2026/03', version: 1, fileSize: 2100000, fileType: 'pdf', tags: ['minute', 'EXCO', 'March 2026'],
    metadata: { 'meeting_date': '2026-03-15', 'attendees': '24' }, createdBy: 'Adebayo Ogunlesi', createdAt: makeDateTime(12),
    updatedAt: makeDateTime(12), retentionDate: '2046-12-31', parentFolderId: 'f1', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-014', title: 'Procurement of Medical Equipment — Batch 3', description: 'Procurement document for medical equipment supply to 15 general hospitals.',
    type: 'invoice', department: 'Ministry of Health', status: 'pending_review', securityClassification: 'internal',
    referenceNumber: 'MOH/PROC/2026/019', version: 1, fileSize: 1500000, fileType: 'pdf', tags: ['procurement', 'medical equipment', 'hospitals'],
    metadata: { 'supplier': 'MedTech Nigeria Ltd', 'value': '₦2.8B' }, createdBy: 'Fatima Ibrahim', createdAt: makeDateTime(4),
    updatedAt: makeDateTime(4), retentionDate: '2036-12-31', parentFolderId: 'f4', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
  {
    id: 'doc-015', title: 'State Gazette Vol. 48 No. 12', description: 'Official state gazette containing new regulations and public notices.',
    type: 'gazette', department: 'Ministry of Justice', status: 'approved', securityClassification: 'unclassified',
    referenceNumber: 'MOJ/GAZ/2026/012', version: 1, fileSize: 4200000, fileType: 'pdf', tags: ['gazette', 'regulations', 'public notice'],
    metadata: { 'volume': '48', 'number': '12' }, createdBy: 'Oluwaseun Adeyemi', createdAt: makeDateTime(8),
    updatedAt: makeDateTime(8), retentionDate: '2076-12-31', parentFolderId: 'f6', checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
  },
];

// ==================== DOCUMENT VERSIONS ====================
export const mockVersions: DocumentVersion[] = [
  { id: 'v1', documentId: 'doc-001', version: 1, changedBy: 'Ngozi Okafor', changeDescription: 'Initial draft uploaded', fileSize: 3200000, fileName: '2026_Budget_Proposal_v1.pdf', fileType: 'pdf', createdAt: makeDateTime(45) },
  { id: 'v2', documentId: 'doc-001', version: 2, changedBy: 'Ngozi Okafor', changeDescription: 'Updated revenue projections based on NBS data', fileSize: 4100000, fileName: '2026_Budget_Proposal_v2.pdf', fileType: 'pdf', createdAt: makeDateTime(30) },
  { id: 'v3', documentId: 'doc-001', version: 3, changedBy: 'Adebayo Ogunlesi', changeDescription: 'Final approval with Governor\'s annotations', fileSize: 4500000, fileName: '2026_Budget_Proposal_v3_FINAL.pdf', fileType: 'pdf', createdAt: makeDateTime(5) },
  { id: 'v4', documentId: 'doc-002', version: 1, changedBy: 'Adebayo Ogunlesi', changeDescription: 'Initial draft', fileSize: 1000000, fileName: 'Executive_Order_Public_Service_Reform_v1.pdf', fileType: 'pdf', createdAt: makeDateTime(35) },
  { id: 'v5', documentId: 'doc-002', version: 2, changedBy: 'Adebayo Ogunlesi', changeDescription: 'Incorporated legal review feedback', fileSize: 1200000, fileName: 'Executive_Order_Public_Service_Reform_v2.pdf', fileType: 'pdf', createdAt: makeDateTime(30) },
  { id: 'v6', documentId: 'doc-007', version: 1, changedBy: 'Aisha Mohammed', changeDescription: 'Initial contract document', fileSize: 11000000, fileName: 'Lekki_Epe_Expressway_Contract_v1.pdf', fileType: 'pdf', createdAt: makeDateTime(15) },
  { id: 'v7', documentId: 'doc-007', version: 2, changedBy: 'Aisha Mohammed', changeDescription: 'Updated payment schedule per BPP review', fileSize: 12400000, fileName: 'Lekki_Epe_Expressway_Contract_v2.pdf', fileType: 'pdf', createdAt: makeDateTime(8) },
  { id: 'v8', documentId: 'doc-003', version: 1, changedBy: 'Emeka Nwankwo', changeDescription: 'Q1 progress report submitted', fileSize: 8200000, fileName: 'Lagos_Calabar_Highway_Q1_Report.pdf', fileType: 'pdf', createdAt: makeDateTime(7) },
  { id: 'v9', documentId: 'doc-004', version: 1, changedBy: 'Fatima Ibrahim', changeDescription: 'Policy document first draft', fileSize: 2300000, fileName: 'PHC_Expansion_Policy_Draft.pdf', fileType: 'pdf', createdAt: makeDateTime(12) },
  { id: 'v10', documentId: 'doc-010', version: 1, changedBy: 'Yakubu Danjuma', changeDescription: 'MOU initial version', fileSize: 3400000, fileName: 'Trade_Zone_MOU_Dangote.pdf', fileType: 'pdf', createdAt: makeDateTime(5) },
];

// ==================== WORKFLOWS ====================
export const mockWorkflows: Workflow[] = [
  {
    id: 'wf-001', documentId: 'doc-003', documentTitle: 'Lagos-Calabar Coastal Highway Progress Report',
    type: 'review', status: 'in_progress', initiatedBy: 'Emeka Nwankwo', currentStep: 2, totalSteps: 3,
    slaDeadline: makeDate(-2), createdAt: makeDateTime(7), completedAt: null,
    steps: [
      { id: 'ws-1', stepNumber: 1, assignee: 'Emeka Nwankwo', role: 'Author', department: 'Ministry of Works & Infrastructure', action: 'comment', instruction: 'Submit report with executive summary', status: 'approved', comment: 'Submitted for review', attachmentName: null, completedAt: makeDateTime(7) },
      { id: 'ws-2', stepNumber: 2, assignee: 'Abdullahi Suleiman', role: 'Director Review', department: 'Head of Service', action: 'review', instruction: 'Review progress milestones and budget adherence', status: 'pending', comment: null, attachmentName: null, completedAt: null },
      { id: 'ws-3', stepNumber: 3, assignee: 'Adebayo Ogunlesi', role: 'Final Approval', department: 'Office of the Governor', action: 'approve', instruction: 'Grant final approval for public release', status: 'pending', comment: null, attachmentName: null, completedAt: null },
    ],
  },
  {
    id: 'wf-002', documentId: 'doc-004', documentTitle: 'Primary Healthcare Expansion Policy',
    type: 'approval', status: 'in_progress', initiatedBy: 'Fatima Ibrahim', currentStep: 1, totalSteps: 3,
    slaDeadline: makeDate(3), createdAt: makeDateTime(12), completedAt: null,
    steps: [
      { id: 'ws-4', stepNumber: 1, assignee: 'Fatima Ibrahim', role: 'Author', department: 'Ministry of Health', action: 'comment', instruction: 'Submit policy document for budget review', status: 'approved', comment: 'Ready for departmental review', attachmentName: null, completedAt: makeDateTime(12) },
      { id: 'ws-5', stepNumber: 2, assignee: 'Ngozi Okafor', role: 'Budget Clearance', department: 'Ministry of Finance', action: 'minute', instruction: 'Minute your observations on the ₦12.5B budget allocation', status: 'pending', comment: null, attachmentName: null, completedAt: null },
      { id: 'ws-6', stepNumber: 3, assignee: 'Adebayo Ogunlesi', role: 'Governor Approval', department: 'Office of the Governor', action: 'sign', instruction: 'Sign off on the healthcare expansion policy', status: 'pending', comment: null, attachmentName: null, completedAt: null },
    ],
  },
  {
    id: 'wf-003', documentId: 'doc-007', documentTitle: 'Road Construction Contract — Lekki-Epe Expressway Phase 2',
    type: 'sign_off', status: 'in_progress', initiatedBy: 'Aisha Mohammed', currentStep: 2, totalSteps: 4,
    slaDeadline: makeDate(5), createdAt: makeDateTime(8), completedAt: null,
    steps: [
      { id: 'ws-7', stepNumber: 1, assignee: 'Aisha Mohammed', role: 'Procurement Officer', department: 'Bureau of Public Procurement', action: 'append_document', instruction: 'Attach due diligence report and bid evaluation', status: 'approved', comment: 'Due diligence completed', attachmentName: 'BPP_Due_Diligence_Report.pdf', completedAt: makeDateTime(8) },
      { id: 'ws-8', stepNumber: 2, assignee: 'Oluwaseun Adeyemi', role: 'Legal Review', department: 'Ministry of Justice', action: 'annotate', instruction: 'Review and annotate contract terms, flag any legal risks', status: 'approved', comment: 'Legal terms verified, no material risks found', attachmentName: null, completedAt: makeDateTime(6) },
      { id: 'ws-9', stepNumber: 3, assignee: 'Ngozi Okafor', role: 'Financial Clearance', department: 'Ministry of Finance', action: 'endorse', instruction: 'Endorse that ₦45.2B is within approved capital budget', status: 'pending', comment: null, attachmentName: null, completedAt: null },
      { id: 'ws-10', stepNumber: 4, assignee: 'Adebayo Ogunlesi', role: 'Governor Sign-off', department: 'Office of the Governor', action: 'sign', instruction: 'Final signature to execute the contract', status: 'pending', comment: null, attachmentName: null, completedAt: null },
    ],
  },
  {
    id: 'wf-004', documentId: 'doc-010', documentTitle: 'Trade Zone Development MOU',
    type: 'approval', status: 'pending', initiatedBy: 'Yakubu Danjuma', currentStep: 1, totalSteps: 3,
    slaDeadline: makeDate(7), createdAt: makeDateTime(5), completedAt: null,
    steps: [
      { id: 'ws-11', stepNumber: 1, assignee: 'Yakubu Danjuma', role: 'Author', department: 'Ministry of Commerce & Industry', action: 'comment', instruction: 'Submit MOU for legal and executive review', status: 'approved', comment: 'Submitted for review', attachmentName: null, completedAt: makeDateTime(5) },
      { id: 'ws-12', stepNumber: 2, assignee: 'Oluwaseun Adeyemi', role: 'Legal Review', department: 'Ministry of Justice', action: 'review', instruction: 'Review MOU terms, confirm compliance with PPP framework', status: 'pending', comment: null, attachmentName: null, completedAt: null },
      { id: 'ws-13', stepNumber: 3, assignee: 'Adebayo Ogunlesi', role: 'Final Approval', department: 'Office of the Governor', action: 'approve', instruction: 'Approve the MOU for execution with Dangote Industries', status: 'pending', comment: null, attachmentName: null, completedAt: null },
    ],
  },
  {
    id: 'wf-005', documentId: 'doc-014', documentTitle: 'Procurement of Medical Equipment — Batch 3',
    type: 'approval', status: 'in_progress', initiatedBy: 'Fatima Ibrahim', currentStep: 1, totalSteps: 2,
    slaDeadline: makeDate(2), createdAt: makeDateTime(4), completedAt: null,
    steps: [
      { id: 'ws-14', stepNumber: 1, assignee: 'Aisha Mohammed', role: 'Procurement Verification', department: 'Bureau of Public Procurement', action: 'review', instruction: 'Verify procurement process compliance and vendor selection', status: 'pending', comment: null, attachmentName: null, completedAt: null },
      { id: 'ws-15', stepNumber: 2, assignee: 'Ngozi Okafor', role: 'Payment Authorization', department: 'Ministry of Finance', action: 'sign', instruction: 'Authorize payment release of ₦2.8B to MedTech Nigeria Ltd', status: 'pending', comment: null, attachmentName: null, completedAt: null },
    ],
  },
  {
    id: 'wf-006', documentId: 'doc-001', documentTitle: '2026 Fiscal Year Budget Proposal',
    type: 'approval', status: 'approved', initiatedBy: 'Ngozi Okafor', currentStep: 3, totalSteps: 3,
    slaDeadline: makeDate(40), createdAt: makeDateTime(45), completedAt: makeDateTime(5),
    steps: [
      { id: 'ws-16', stepNumber: 1, assignee: 'Ngozi Okafor', role: 'Author', department: 'Ministry of Finance', action: 'comment', instruction: 'Submit the budget proposal with supporting schedules', status: 'approved', comment: 'Submitted budget proposal with all 15 ministry schedules', attachmentName: null, completedAt: makeDateTime(45) },
      { id: 'ws-17', stepNumber: 2, assignee: 'Abdullahi Suleiman', role: 'HOS Review', department: 'Head of Service', action: 'minute', instruction: 'Minute your assessment of personnel cost projections', status: 'approved', comment: 'Personnel costs reviewed and endorsed. Recommend 8% increment cap.', attachmentName: null, completedAt: makeDateTime(20) },
      { id: 'ws-18', stepNumber: 3, assignee: 'Adebayo Ogunlesi', role: 'Governor Approval', department: 'Office of the Governor', action: 'sign', instruction: 'Sign to approve the 2026 fiscal year budget for implementation', status: 'approved', comment: 'Approved for implementation effective April 1, 2026', attachmentName: null, completedAt: makeDateTime(5) },
    ],
  },
];

// ==================== AUDIT LOG ====================
export const mockAuditLog: AuditLogEntry[] = [
  { id: 'al-001', documentId: 'doc-012', documentTitle: 'Environmental Impact Assessment — New Industrial Estate', action: 'upload', userId: 'u11', userName: 'Ifeoma Chukwu', department: 'Ministry of Environment', ipAddress: '10.0.12.45', details: 'New document uploaded (9.5 MB)', timestamp: makeDateTime(2) },
  { id: 'al-002', documentId: 'doc-005', documentTitle: 'UBEC Matching Grant Application 2026', action: 'upload', userId: 'u5', userName: 'Chidinma Eze', department: 'Ministry of Education', ipAddress: '10.0.8.22', details: 'Draft document uploaded', timestamp: makeDateTime(3) },
  { id: 'al-003', documentId: 'doc-014', documentTitle: 'Procurement of Medical Equipment — Batch 3', action: 'workflow_start', userId: 'u4', userName: 'Fatima Ibrahim', department: 'Ministry of Health', ipAddress: '10.0.6.18', details: 'Approval workflow initiated', timestamp: makeDateTime(4) },
  { id: 'al-004', documentId: 'doc-010', documentTitle: 'Trade Zone Development MOU', action: 'upload', userId: 'u10', userName: 'Yakubu Danjuma', department: 'Ministry of Commerce & Industry', ipAddress: '10.0.15.33', details: 'MOU document uploaded for review', timestamp: makeDateTime(5) },
  { id: 'al-005', documentId: 'doc-001', documentTitle: '2026 Fiscal Year Budget Proposal', action: 'approve', userId: 'u1', userName: 'Adebayo Ogunlesi', department: 'Office of the Governor', ipAddress: '10.0.1.5', details: 'Final approval granted by Governor', timestamp: makeDateTime(5, 2) },
  { id: 'al-006', documentId: 'doc-001', documentTitle: '2026 Fiscal Year Budget Proposal', action: 'workflow_complete', userId: 'u1', userName: 'Adebayo Ogunlesi', department: 'Office of the Governor', ipAddress: '10.0.1.5', details: 'Workflow completed — document approved', timestamp: makeDateTime(5, 1) },
  { id: 'al-007', documentId: 'doc-007', documentTitle: 'Road Construction Contract — Lekki-Epe Expressway Phase 2', action: 'approve', userId: 'u6', userName: 'Oluwaseun Adeyemi', department: 'Ministry of Justice', ipAddress: '10.0.9.12', details: 'Legal review approved', timestamp: makeDateTime(6) },
  { id: 'al-008', documentId: 'doc-003', documentTitle: 'Lagos-Calabar Coastal Highway Progress Report', action: 'upload', userId: 'u3', userName: 'Emeka Nwankwo', department: 'Ministry of Works & Infrastructure', ipAddress: '10.0.4.28', details: 'Progress report submitted', timestamp: makeDateTime(7) },
  { id: 'al-009', documentId: 'doc-015', documentTitle: 'State Gazette Vol. 48 No. 12', action: 'approve', userId: 'u6', userName: 'Oluwaseun Adeyemi', department: 'Ministry of Justice', ipAddress: '10.0.9.12', details: 'Gazette approved for publication', timestamp: makeDateTime(8) },
  { id: 'al-010', documentId: 'doc-007', documentTitle: 'Road Construction Contract — Lekki-Epe Expressway Phase 2', action: 'edit', userId: 'u7', userName: 'Aisha Mohammed', department: 'Bureau of Public Procurement', ipAddress: '10.0.11.7', details: 'Updated payment schedule', timestamp: makeDateTime(8, 3) },
  { id: 'al-011', documentId: 'doc-009', documentTitle: 'Agricultural Mechanization Programme Circular', action: 'approve', userId: 'u8', userName: 'Tunde Bakare', department: 'Ministry of Agriculture', ipAddress: '10.0.13.19', details: 'Circular approved for distribution', timestamp: makeDateTime(10) },
  { id: 'al-012', documentId: 'doc-013', documentTitle: 'Minute of Executive Council Meeting — March 2026', action: 'upload', userId: 'u1', userName: 'Adebayo Ogunlesi', department: 'Office of the Governor', ipAddress: '10.0.1.5', details: 'EXCO meeting minutes uploaded', timestamp: makeDateTime(12) },
  { id: 'al-013', documentId: 'doc-004', documentTitle: 'Primary Healthcare Expansion Policy', action: 'upload', userId: 'u4', userName: 'Fatima Ibrahim', department: 'Ministry of Health', ipAddress: '10.0.6.18', details: 'Policy document submitted', timestamp: makeDateTime(12, 5) },
  { id: 'al-014', documentId: 'doc-006', documentTitle: 'Legal Opinion on Land Use Charge', action: 'view', userId: 'u2', userName: 'Ngozi Okafor', department: 'Ministry of Finance', ipAddress: '10.0.3.41', details: 'Document viewed', timestamp: makeDateTime(14) },
  { id: 'al-015', documentId: 'doc-006', documentTitle: 'Legal Opinion on Land Use Charge', action: 'download', userId: 'u2', userName: 'Ngozi Okafor', department: 'Ministry of Finance', ipAddress: '10.0.3.41', details: 'Document downloaded (watermarked copy)', timestamp: makeDateTime(14, 1) },
  { id: 'al-016', documentId: 'doc-002', documentTitle: 'Executive Order on Public Service Reform', action: 'approve', userId: 'u1', userName: 'Adebayo Ogunlesi', department: 'Office of the Governor', ipAddress: '10.0.1.5', details: 'Executive order signed', timestamp: makeDateTime(10, 2) },
  { id: 'al-017', documentId: 'doc-008', documentTitle: 'Q4 2025 Financial Audit Report', action: 'share', userId: 'u9', userName: 'Blessing Okoro', department: 'Auditor General Office', ipAddress: '10.0.14.8', details: 'Shared with Ministry of Finance', timestamp: makeDateTime(28) },
  { id: 'al-018', documentId: 'doc-011', documentTitle: 'Staff Promotion Guidelines 2026', action: 'approve', userId: 'u12', userName: 'Abdullahi Suleiman', department: 'Head of Service', ipAddress: '10.0.2.15', details: 'Guidelines approved', timestamp: makeDateTime(40) },
  { id: 'al-019', documentId: 'doc-001', documentTitle: '2026 Fiscal Year Budget Proposal', action: 'view', userId: 'u3', userName: 'Emeka Nwankwo', department: 'Ministry of Works & Infrastructure', ipAddress: '10.0.4.28', details: 'Document viewed', timestamp: makeDateTime(1) },
  { id: 'al-020', documentId: 'doc-003', documentTitle: 'Lagos-Calabar Coastal Highway Progress Report', action: 'view', userId: 'u1', userName: 'Adebayo Ogunlesi', department: 'Office of the Governor', ipAddress: '10.0.1.5', details: 'Document viewed', timestamp: makeDateTime(1, 3) },
];

// ==================== NOTIFICATIONS ====================
export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Approval Required', message: 'Lagos-Calabar Highway Progress Report is awaiting your review', type: 'workflow', isRead: false, timestamp: makeDateTime(0, 2), linkTo: '/workflows' },
  { id: 'n2', title: 'Document Uploaded', message: 'New Environmental Impact Assessment uploaded by Ifeoma Chukwu', type: 'document', isRead: false, timestamp: makeDateTime(2), linkTo: '/documents' },
  { id: 'n3', title: 'Workflow Overdue', message: 'Highway Progress Report workflow has passed its SLA deadline', type: 'deadline', isRead: false, timestamp: makeDateTime(0, 5), linkTo: '/workflows' },
  { id: 'n4', title: 'Document Approved', message: '2026 Budget Proposal has been approved by the Governor', type: 'workflow', isRead: true, timestamp: makeDateTime(5), linkTo: '/documents' },
  { id: 'n5', title: 'New Contract for Review', message: 'Lekki-Epe Expressway contract needs financial clearance', type: 'workflow', isRead: false, timestamp: makeDateTime(1), linkTo: '/workflows' },
  { id: 'n6', title: 'Retention Notice', message: '3 documents approaching retention expiry date', type: 'system', isRead: true, timestamp: makeDateTime(3), linkTo: '/documents' },
];

// ==================== REPORTS ====================
export const mockReports: Report[] = [
  { id: 'r1', name: 'Monthly Document Volume Report', type: 'document_volume', schedule: 'monthly', lastRun: makeDate(2), status: 'ready', format: 'pdf' },
  { id: 'r2', name: 'Workflow Status Summary', type: 'workflow_status', schedule: 'weekly', lastRun: makeDate(1), status: 'ready', format: 'pdf' },
  { id: 'r3', name: 'Department Activity Report', type: 'department_activity', schedule: 'monthly', lastRun: makeDate(5), status: 'ready', format: 'excel' },
  { id: 'r4', name: 'Compliance & Retention Report', type: 'compliance', schedule: 'monthly', lastRun: makeDate(10), status: 'ready', format: 'pdf' },
  { id: 'r5', name: 'User Activity Audit', type: 'user_activity', schedule: 'weekly', lastRun: makeDate(0), status: 'generating', format: 'csv' },
  { id: 'r6', name: 'Document Retention Schedule', type: 'retention', schedule: 'monthly', lastRun: makeDate(15), status: 'ready', format: 'excel' },
];

// ==================== DASHBOARD KPIs ====================
export function generateDashboardKPIs(): DashboardKPIs {
  const totalDocuments = mockDocuments.length;
  const pendingApprovals = mockDocuments.filter(d => d.status === 'pending_review').length;
  const thisMonth = mockDocuments.filter(d => {
    const created = new Date(d.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const deptCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  mockDocuments.forEach(d => {
    deptCounts[d.department] = (deptCounts[d.department] || 0) + 1;
    typeCounts[d.type] = (typeCounts[d.type] || 0) + 1;
  });

  return {
    totalDocuments,
    pendingApprovals,
    documentsThisMonth: thisMonth,
    documentsLastMonth: 11,
    activeWorkflows: mockWorkflows.filter(w => w.status === 'in_progress' || w.status === 'pending').length,
    overdueWorkflows: mockWorkflows.filter(w => new Date(w.slaDeadline) < new Date() && w.status !== 'approved').length,
    departmentBreakdown: Object.entries(deptCounts).map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count),
    typeBreakdown: Object.entries(typeCounts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    recentActivity: mockAuditLog.slice(0, 8),
    monthlyTrend: [
      { month: 'Oct', uploads: 18, approvals: 14 },
      { month: 'Nov', uploads: 22, approvals: 19 },
      { month: 'Dec', uploads: 15, approvals: 12 },
      { month: 'Jan', uploads: 25, approvals: 20 },
      { month: 'Feb', uploads: 20, approvals: 17 },
      { month: 'Mar', uploads: thisMonth, approvals: pendingApprovals },
    ],
  };
}
