import { create } from 'zustand';
import type { Document, DocumentVersion, Notification, StaffMember, Workflow, AuditLogEntry, Report } from '@shared/schema';
import type { DocumentStatus, SecurityClassification, DocumentType, Department, AuditAction } from '@shared/schema';
import { mockDocuments, mockNotifications, mockStaff, mockWorkflows, mockVersions, mockAuditLog, mockReports } from './mock-data';
import { toast } from '@/hooks/use-toast';

// Settings types
export interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  notifyWorkflows: boolean;
  notifyUploads: boolean;
  notifySLA: boolean;
  notifySystem: boolean;
}

export interface EdmsStore {
  // Auth
  isAuthenticated: boolean;
  currentUser: StaffMember | null;
  login: (email: string) => void;
  logout: () => void;

  // Documents
  documents: Document[];
  versions: DocumentVersion[];
  createDocument: (doc: Omit<Document, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'checkout'>) => void;
  editDocument: (id: string, updates: Partial<Pick<Document, 'title' | 'description' | 'type' | 'department' | 'securityClassification' | 'tags'>>) => void;
  deleteDocument: (id: string) => void;
  archiveDocument: (id: string) => void;
  disposeDocument: (id: string) => void;
  checkoutDocument: (docId: string) => void;
  checkinDocument: (docId: string, description: string, fileSize: number) => void;
  uploadNewVersion: (docId: string, description: string, fileName: string, fileType: string, fileSize: number) => void;

  // Workflows
  workflows: Workflow[];
  approveStep: (workflowId: string, stepId: string, comment: string, attachmentName?: string) => void;
  rejectStep: (workflowId: string, stepId: string, comment: string) => void;
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'completedAt'>) => void;

  // Audit
  auditLog: AuditLogEntry[];
  addAuditEntry: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;

  // Reports
  reports: Report[];
  runReport: (id: string) => void;
  downloadReport: (id: string) => void;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void;

  // Settings
  settings: UserSettings;
  saveSettings: (updates: Partial<UserSettings>) => void;

  // UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

function makeAuditEntry(store: EdmsStore, docId: string, docTitle: string, action: AuditAction, details: string): Omit<AuditLogEntry, 'id' | 'timestamp'> {
  const user = store.currentUser;
  return {
    documentId: docId,
    documentTitle: docTitle,
    action,
    userId: user?.id || 'u1',
    userName: user?.fullName || 'System',
    department: (user?.department || 'Office of the Governor') as Department,
    ipAddress: '10.0.1.' + Math.floor(Math.random() * 255),
    details,
  };
}

export const useDataStore = create<EdmsStore>((set, get) => ({
  // Auth
  isAuthenticated: localStorage.getItem('edms-auth') === 'true',
  currentUser: mockStaff[0],
  login: (email: string) => {
    localStorage.setItem('edms-auth', 'true');
    localStorage.setItem('edms-auth-email', email);
    const user = mockStaff.find(s => s.email === email) || mockStaff[0];
    set({ isAuthenticated: true, currentUser: user });
  },
  logout: () => {
    localStorage.removeItem('edms-auth');
    localStorage.removeItem('edms-auth-email');
    set({ isAuthenticated: false, currentUser: null });
  },

  // ─── Documents ──────────────────────────────────────
  documents: mockDocuments,
  versions: mockVersions,

  createDocument: (docData) => set((s) => {
    const id = `doc-${Date.now()}`;
    const now = new Date().toISOString();
    const doc: Document = {
      ...docData,
      id,
      version: 1,
      createdAt: now,
      updatedAt: now,
      checkout: { status: 'available', checkedOutBy: null, checkedOutAt: null },
    };
    const version: DocumentVersion = {
      id: `v-${Date.now()}`,
      documentId: id,
      version: 1,
      changedBy: s.currentUser?.fullName || 'Unknown',
      changeDescription: 'Initial upload',
      fileSize: doc.fileSize,
      fileName: `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}_v1.${doc.fileType}`,
      fileType: doc.fileType,
      createdAt: now,
    };
    const audit = makeAuditEntry(s, id, doc.title, 'upload', `Document uploaded (${(doc.fileSize / 1048576).toFixed(1)} MB)`);
    toast({ title: 'Document Created', description: `"${doc.title}" has been uploaded.` });
    return {
      documents: [doc, ...s.documents],
      versions: [version, ...s.versions],
      auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: now }, ...s.auditLog],
    };
  }),

  editDocument: (id, updates) => set((s) => {
    const doc = s.documents.find(d => d.id === id);
    if (!doc) return {};
    const documents = s.documents.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d);
    const audit = makeAuditEntry(s, id, doc.title, 'edit', `Document metadata updated`);
    toast({ title: 'Document Updated', description: 'Metadata saved successfully.' });
    return {
      documents,
      auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: new Date().toISOString() }, ...s.auditLog],
    };
  }),

  deleteDocument: (id) => set((s) => {
    const doc = s.documents.find(d => d.id === id);
    if (!doc) return {};
    const audit = makeAuditEntry(s, id, doc.title, 'dispose', `Document permanently deleted`);
    toast({ title: 'Document Deleted', description: `"${doc.title}" has been removed.`, variant: 'destructive' });
    return {
      documents: s.documents.filter(d => d.id !== id),
      auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: new Date().toISOString() }, ...s.auditLog],
    };
  }),

  archiveDocument: (id) => set((s) => {
    const doc = s.documents.find(d => d.id === id);
    if (!doc) return {};
    const documents = s.documents.map(d => d.id === id ? { ...d, status: 'archived' as DocumentStatus, updatedAt: new Date().toISOString() } : d);
    const audit = makeAuditEntry(s, id, doc.title, 'archive', `Document moved to archive`);
    toast({ title: 'Document Archived', description: `"${doc.title}" has been archived.` });
    return {
      documents,
      auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: new Date().toISOString() }, ...s.auditLog],
    };
  }),

  disposeDocument: (id) => set((s) => {
    const doc = s.documents.find(d => d.id === id);
    if (!doc) return {};
    const documents = s.documents.map(d => d.id === id ? { ...d, status: 'disposed' as DocumentStatus, updatedAt: new Date().toISOString() } : d);
    const audit = makeAuditEntry(s, id, doc.title, 'dispose', `Document flagged for disposal`);
    toast({ title: 'Document Disposed', description: `"${doc.title}" flagged for disposal.` });
    return {
      documents,
      auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: new Date().toISOString() }, ...s.auditLog],
    };
  }),

  checkoutDocument: (docId) => set((s) => {
    const user = s.currentUser;
    const doc = s.documents.find(d => d.id === docId);
    if (!doc) return {};
    const documents = s.documents.map(d =>
      d.id === docId ? { ...d, checkout: { status: 'checked_out' as const, checkedOutBy: user?.fullName || 'Unknown', checkedOutAt: new Date().toISOString() } } : d
    );
    const audit = makeAuditEntry(s, docId, doc.title, 'edit', `Document checked out for editing`);
    toast({ title: 'Checked Out', description: 'You now have exclusive editing access.' });
    return {
      documents,
      auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: new Date().toISOString() }, ...s.auditLog],
    };
  }),

  checkinDocument: (docId, description, fileSize) => set((s) => {
    const user = s.currentUser;
    const doc = s.documents.find(d => d.id === docId);
    if (!doc) return {};
    const newVersion = doc.version + 1;
    const now = new Date().toISOString();
    const documents = s.documents.map(d =>
      d.id === docId ? { ...d, version: newVersion, fileSize, updatedAt: now, checkout: { status: 'available' as const, checkedOutBy: null, checkedOutAt: null } } : d
    );
    const newVersionEntry: DocumentVersion = {
      id: `v-${Date.now()}`, documentId: docId, version: newVersion, changedBy: user?.fullName || 'Unknown',
      changeDescription: description, fileSize, fileName: `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${newVersion}.pdf`, fileType: doc.fileType, createdAt: now,
    };
    const audit = makeAuditEntry(s, docId, doc.title, 'edit', `Checked in as v${newVersion}: ${description}`);
    toast({ title: 'Checked In', description: `Version ${newVersion} saved.` });
    return {
      documents, versions: [newVersionEntry, ...s.versions],
      auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: now }, ...s.auditLog],
    };
  }),

  uploadNewVersion: (docId, description, fileName, fileType, fileSize) => set((s) => {
    const user = s.currentUser;
    const doc = s.documents.find(d => d.id === docId);
    if (!doc) return {};
    const newVersion = doc.version + 1;
    const now = new Date().toISOString();
    const documents = s.documents.map(d => d.id === docId ? { ...d, version: newVersion, fileSize, fileType, updatedAt: now } : d);
    const newVersionEntry: DocumentVersion = {
      id: `v-${Date.now()}`, documentId: docId, version: newVersion, changedBy: user?.fullName || 'Unknown',
      changeDescription: description, fileSize, fileName, fileType, createdAt: now,
    };
    const audit = makeAuditEntry(s, docId, doc.title, 'upload', `New version uploaded: v${newVersion} - ${fileName}`);
    toast({ title: 'Version Uploaded', description: `${fileName} saved as v${newVersion}.` });
    return {
      documents, versions: [newVersionEntry, ...s.versions],
      auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: now }, ...s.auditLog],
    };
  }),

  // ─── Workflows ──────────────────────────────────────
  workflows: mockWorkflows,

  approveStep: (workflowId, stepId, comment, attachmentName) => set((s) => {
    const now = new Date().toISOString();
    const workflows = s.workflows.map(wf => {
      if (wf.id !== workflowId) return wf;
      const steps = wf.steps.map(step => {
        if (step.id !== stepId) return step;
        return { ...step, status: 'approved' as const, comment, attachmentName: attachmentName || step.attachmentName, completedAt: now };
      });
      const completedSteps = steps.filter(st => st.status === 'approved').length;
      const allDone = completedSteps === steps.length;
      return { ...wf, steps, currentStep: allDone ? wf.totalSteps : completedSteps + 1, status: allDone ? 'approved' as const : 'in_progress' as const, completedAt: allDone ? now : null };
    });
    const wf = workflows.find(w => w.id === workflowId);
    const step = wf?.steps.find(st => st.id === stepId);
    const audit = makeAuditEntry(s, wf?.documentId || '', wf?.documentTitle || '', 'approve', `${step?.role || 'Step'} completed by ${step?.assignee || 'Unknown'}`);
    if (wf?.status === 'approved') {
      toast({ title: 'Workflow Complete', description: `"${wf.documentTitle}" fully approved.` });
    } else {
      toast({ title: 'Step Completed', description: 'Advanced to next step.' });
    }
    return { workflows, auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: now }, ...s.auditLog] };
  }),

  rejectStep: (workflowId, stepId, comment) => set((s) => {
    const now = new Date().toISOString();
    const workflows = s.workflows.map(wf => {
      if (wf.id !== workflowId) return wf;
      const steps = wf.steps.map(step => step.id === stepId ? { ...step, status: 'rejected' as const, comment, completedAt: now } : step);
      return { ...wf, steps, status: 'rejected' as const };
    });
    const wf = workflows.find(w => w.id === workflowId);
    const audit = makeAuditEntry(s, wf?.documentId || '', wf?.documentTitle || '', 'reject', `Workflow rejected: ${comment}`);
    toast({ title: 'Rejected', description: 'Workflow has been rejected.', variant: 'destructive' });
    return { workflows, auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: now }, ...s.auditLog] };
  }),

  createWorkflow: (wfData) => set((s) => {
    const id = `wf-${Date.now()}`;
    const now = new Date().toISOString();
    const workflow: Workflow = { ...wfData, id, createdAt: now, completedAt: null };
    const audit = makeAuditEntry(s, wfData.documentId, wfData.documentTitle, 'workflow_start', `${wfData.type} workflow initiated with ${wfData.totalSteps} steps`);
    toast({ title: 'Workflow Created', description: `"${workflow.documentTitle}" workflow initiated.` });
    return { workflows: [workflow, ...s.workflows], auditLog: [{ ...audit, id: `al-${Date.now()}`, timestamp: now }, ...s.auditLog] };
  }),

  // ─── Audit ──────────────────────────────────────────
  auditLog: mockAuditLog,
  addAuditEntry: (entry) => set((s) => ({
    auditLog: [{ ...entry, id: `al-${Date.now()}`, timestamp: new Date().toISOString() }, ...s.auditLog],
  })),

  // ─── Reports ────────────────────────────────────────
  reports: mockReports,
  runReport: (id) => set((s) => {
    const reports = s.reports.map(r => r.id === id ? { ...r, status: 'generating' as const, lastRun: new Date().toISOString().split('T')[0] } : r);
    toast({ title: 'Report Running', description: 'Generating report...' });
    // Simulate completion after 2s
    setTimeout(() => {
      useDataStore.setState((s2) => ({
        reports: s2.reports.map(r => r.id === id ? { ...r, status: 'ready' as const } : r),
      }));
      toast({ title: 'Report Ready', description: 'Your report is ready to download.' });
    }, 2000);
    return { reports };
  }),
  downloadReport: (id) => {
    const report = get().reports.find(r => r.id === id);
    if (!report) return;
    // Generate a real file download
    const content = `EDMS Report: ${report.name}\nGenerated: ${new Date().toLocaleString()}\nFormat: ${report.format.toUpperCase()}\nSchedule: ${report.schedule}\n\n--- This is a simulated report export ---\n\nTotal Documents: ${get().documents.length}\nActive Workflows: ${get().workflows.filter(w => w.status === 'in_progress').length}\nAudit Entries: ${get().auditLog.length}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, '_')}.${report.format === 'excel' ? 'csv' : report.format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Download Started', description: `${report.name} downloading.` });
  },

  // ─── Notifications ──────────────────────────────────
  notifications: mockNotifications,
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
  })),
  markAllNotificationsRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, isRead: true })),
  })),
  addNotification: (n) => set((s) => ({
    notifications: [{ ...n, id: `n-${Date.now()}`, timestamp: new Date().toISOString() }, ...s.notifications],
  })),

  // ─── Settings ───────────────────────────────────────
  settings: {
    firstName: mockStaff[0].fullName.split(' ')[0],
    lastName: mockStaff[0].fullName.split(' ').slice(1).join(' '),
    email: mockStaff[0].email,
    department: mockStaff[0].department,
    twoFactorEnabled: false,
    sessionTimeout: 30,
    notifyWorkflows: true,
    notifyUploads: true,
    notifySLA: true,
    notifySystem: true,
  },
  saveSettings: (updates) => set((s) => {
    toast({ title: 'Settings Saved', description: 'Your preferences have been updated.' });
    return { settings: { ...s.settings, ...updates } };
  }),

  // UI State
  sidebarCollapsed: typeof window !== 'undefined' && window.innerWidth < 1024 ? true : false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
